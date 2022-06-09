// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.12;

// Imports

import "./IBFactory.sol";
import "./PCToken.sol";
import "./utils/BalancerReentrancyGuard.sol";
import "./utils/BalancerOwnable.sol";

// Libraries
import {RightsManager} from "../libraries/RightsManager.sol";
import "../libraries/SmartPoolManager.sol";
import "../libraries/SafeApprove.sol";

contract ConfigurableRightsPoolExtension is PCToken, BalancerOwnable, BalancerReentrancyGuard {
    using BalancerSafeMath for uint256;
    using SafeApprove for IERC20;

    // Type declarations

    struct PoolParams {
        // Balancer Pool Token (representing shares of the pool)
        string poolTokenSymbol;
        string poolTokenName;
        // Tokens inside the Pool
        address[] constituentTokens;
        uint256[] tokenBalances;
        uint256[] tokenWeights;
        uint256 swapFee;
        uint256 protocolFee;
    }

    // State variables

    IBFactory public bFactory;
    IBPool public bPool;

    // Struct holding the rights configuration
    RightsManager.Rights public rights;

    // Hold the parameters used in updateWeightsGradually
    SmartPoolManager.GradualUpdateParams public gradualUpdate;

    // This is for adding a new (currently unbound) token to the pool
    // It's a two-step process: commitAddToken(), then applyAddToken()
    SmartPoolManager.NewTokenParams public newToken;

    // Fee is initialized on creation, and can be changed if permission is set
    // Only needed for temporary storage between construction and createPool
    // Thereafter, the swap fee should always be read from the underlying pool
    uint256 private _initialSwapFee;

    uint256 private _initialProtocolFee;

    address private _initialAccessAddress;

    // Store the list of tokens in the pool, and balances
    // NOTE that the token list is *only* used to store the pool tokens between
    //   construction and createPool - thereafter, use the underlying BPool's list
    //   (avoids synchronization issues)
    address[] private _initialTokens;
    uint256[] private _initialBalances;

    // Enforce a minimum time between the start and end blocks
    uint256 public minimumWeightChangeBlockPeriod;
    // Enforce a mandatory wait time between updates
    // This is also the wait time between committing and applying a new token
    uint256 public addTokenTimeLockInBlocks;

    // Whitelist of LPs (if configured)
    mapping(address => bool) private _liquidityProviderWhitelist;

    // Cap on the pool size (i.e., # of tokens minted when joining)
    // Limits the risk of experimental pools; failsafe/backup for fixed-size pools
    uint256 public bspCap;

    // Event declarations

    // Anonymous logger event - can only be filtered by contract address

    event LogCall(bytes4 indexed sig, address indexed caller, bytes data) anonymous;

    event LogJoin(address indexed caller, address indexed tokenIn, uint256 tokenAmountIn);

    event LogExit(address indexed caller, address indexed tokenOut, uint256 tokenAmountOut);

    event CapChanged(address indexed caller, uint256 oldCap, uint256 newCap);

    event NewTokenCommitted(address indexed token, address indexed pool, address indexed caller);

    // Modifiers

    modifier logs() {
        emit LogCall(msg.sig, msg.sender, msg.data);
        _;
    }

    // Mark functions that require delegation to the underlying Pool
    modifier needsBPool() {
        require(address(bPool) != address(0), "ERR_NOT_CREATED");
        _;
    }

    modifier lockUnderlyingPool() {
        // Turn off swapping on the underlying pool during joins
        // Otherwise tokens with callbacks would enable attacks involving simultaneous swaps and joins
        bool origSwapState = bPool.isPublicSwap();
        bPool.setPublicSwap(false);
        _;
        bPool.setPublicSwap(origSwapState);
    }

    // Default values for these variables (used only in updateWeightsGradually), set in the constructor
    // Pools without permission to update weights cannot use them anyway, and should call
    //   the default createPool() function.
    // To override these defaults, pass them into the overloaded createPool()
    // Period is in blocks; 500 blocks ~ 2 hours; 90,000 blocks ~ 2 weeks
    uint256 public constant DEFAULT_MIN_WEIGHT_CHANGE_BLOCK_PERIOD = 90000;
    uint256 public constant DEFAULT_ADD_TOKEN_TIME_LOCK_IN_BLOCKS = 500;
    bytes32 private constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    constructor() public PCToken("FCX", "FCX") {}

    // External functions

    /**
     * @notice Set the swap fee on the underlying pool
     * @dev Keep the local version and core in sync (see below)
     *      bPool is a contract interface; function calls on it are external
     * @param swapFee in Wei
     */
    function setSwapFee(uint256 swapFee) external virtual logs lock onlyOwner needsBPool {
        require(rights.canChangeSwapFee, "ERR_NOT_CONFIGURABLE_SWAP_FEE");

        // Underlying pool will check against min/max fee
        bPool.setSwapFee(swapFee);
    }

    function setProtocolFee(uint256 protocolFee) external virtual logs lock onlyOwner needsBPool {
        require(rights.canChangeProtocolFee, "ERR_NOT_CONFIGURABLE_PROTOCOL_FEE");

        // Underlying pool will check against min/max fee
        bPool.setProtocolFee(protocolFee);
    }

    function setRoles(bytes32[] memory roles) external virtual logs lock onlyOwner needsBPool {
        bPool.setRoles(roles);
    }

    function setAccessControlAddress(address accessAddress) external logs lock onlyOwner needsBPool {
        bPool.setAccessControlAddress(accessAddress);
        _initialAccessAddress = accessAddress;
    }

    /**
     * @notice Set the public swap flag on the underlying pool
     * @dev If this smart pool has canPauseSwapping enabled, we can turn publicSwap off if it's already on
     *      Note that if they turn swapping off - but then finalize the pool - finalizing will turn the
     *      swapping back on. They're not supposed to finalize the underlying pool... would defeat the
     *      smart pool functions. (Only the owner can finalize the pool - which is this contract -
     *      so there is no risk from outside.)
     *
     *      bPool is a contract interface; function calls on it are external
     * @param publicSwap new value of the swap
     */
    function setPublicSwap(bool publicSwap) external virtual logs lock onlyOwner needsBPool {
        require(rights.canPauseSwapping, "ERR_NOT_PAUSABLE_SWAP");

        bPool.setPublicSwap(publicSwap);
    }

    /**
     * @notice Getter for the publicSwap field on the underlying pool
     * @dev viewLock, because setPublicSwap is lock
     *      bPool is a contract interface; function calls on it are external
     * @return Current value of isPublicSwap
     */
    function isPublicSwap() external view virtual viewlock needsBPool returns (bool) {
        return bPool.isPublicSwap();
    }

    function setCanWhitelistLPs(bool _canChangeSwapFee) external virtual logs lock onlyOwner needsBPool {
        require(rights.canWhitelistLPs == !_canChangeSwapFee, "ALREADY_SET");
        rights.canWhitelistLPs = _canChangeSwapFee;
    }

    /**
     * @notice Add to the whitelist of liquidity providers (if enabled)
     * @param providers - addresses of the liquidity provider
     */
    function whitelistLiquidityProvider(address[] calldata providers) external onlyOwner lock logs {
        require(rights.canWhitelistLPs, "ERR_CANNOT_WHITELIST_LPS");
        for (uint256 i = 0; i < providers.length; i++) {
            address provider = providers[i];
            require(provider != address(0), "ERR_INVALID_ADDRESS");

            _liquidityProviderWhitelist[provider] = true;
        }
    }

    /**
     * @notice Remove from the whitelist of liquidity providers (if enabled)
     * @param providers - addresses of the liquidity provider
     */
    function removeWhitelistedLiquidityProvider(address[] calldata providers) external onlyOwner lock logs {
        require(rights.canWhitelistLPs, "ERR_CANNOT_WHITELIST_LPS");
        for (uint256 i = 0; i < providers.length; i++) {
            address provider = providers[i];
            require(_liquidityProviderWhitelist[provider], "ERR_LP_NOT_WHITELISTED");
            require(provider != address(0), "ERR_INVALID_ADDRESS");

            _liquidityProviderWhitelist[provider] = false;
        }
    }

    /**
     * @notice Check if an address is a liquidity provider
     * @dev If the whitelist feature is not enabled, anyone can provide liquidity (assuming finalized)
     * @return boolean value indicating whether the address can join a pool
     */
    function canProvideLiquidity(address provider) external view returns (bool) {
        if (rights.canWhitelistLPs) {
            return _liquidityProviderWhitelist[provider];
        } else {
            // Probably don't strictly need this (could just return true)
            // But the null address can't provide funds
            return provider != address(0);
        }
    }

    /**
     * @notice Get the denormalized weight of a token
     * @dev viewlock to prevent calling if it's being updated
     * @return token weight
     */
    function getDenormalizedWeight(address token) external view viewlock needsBPool returns (uint256) {
        return bPool.getDenormalizedWeight(token);
    }
}
