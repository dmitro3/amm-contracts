// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.12;

pragma experimental ABIEncoderV2;

// Interface declarations

// Introduce to avoid circularity (otherwise, the CRP and SmartPoolManager include each other)
// Removing circularity allows flattener tools to work, which enables Etherscan verification
interface IConfigurableRightsPool {
    enum Permissions {
        PAUSE_SWAPPING,
        CHANGE_SWAP_FEE,
        CHANGE_WEIGHTS,
        ADD_REMOVE_TOKENS,
        WHITELIST_LPS,
        CHANGE_CAP,
        CHANGE_PROTOCOL_FEE
    }

    struct Rights {
        bool canPauseSwapping;
        bool canChangeSwapFee;
        bool canChangeWeights;
        bool canAddRemoveTokens;
        bool canWhitelistLPs;
        bool canChangeCap;
        bool canChangeProtocolFee;
    }

    function mintPoolShareFromLib(uint256 amount) external;

    function pushPoolShareFromLib(address to, uint256 amount) external;

    function pullPoolShareFromLib(address from, uint256 amount) external;

    function burnPoolShareFromLib(uint256 amount) external;

    function totalSupply() external view returns (uint256);

    function getController() external view returns (address);

    function setSwapFee(uint256 swapFee) external;

    function setProtocolFee(uint256 protocolFee) external;

    function setRoles(bytes32[] memory roles) external;

    function setAccessControlAddress(address accessAddress) external;

    function setPublicSwap(bool publicSwap) external;

    function setCap(uint256 newCap) external;

    function isPublicSwap() external view returns (bool);

    function createPool(
        uint256,
        uint256,
        uint256
    ) external;

    function createPool(uint256) external;

    function updateWeight(address, uint256) external;

    function updateWeightsGradually(
        uint256[] calldata,
        uint256,
        uint256
    ) external;

    function pokeWeights() external;

    function commitAddToken(
        address,
        uint256,
        uint256
    ) external;

    function applyAddToken() external;

    function removeToken(address) external;

    function joinPool(uint256, uint256[] calldata) external;

    function exitPool(uint256 poolAmountIn, uint256[] calldata minAmountsOut) external;

    function joinswapExternAmountIn(
        address,
        uint256,
        uint256
    ) external returns (uint256 poolAmountOut);

    function joinswapPoolAmountOut(
        address,
        uint256,
        uint256
    ) external returns (uint256 tokenAmountIn);

    function exitswapPoolAmountIn(
        address,
        uint256,
        uint256
    ) external returns (uint256 tokenAmountOut);

    function exitswapExternAmountOut(
        address,
        uint256,
        uint256
    ) external returns (uint256 poolAmountIn);

    function whitelistLiquidityProvider(address[] calldata) external;

    function removeWhitelistedLiquidityProvider(address[] calldata) external;

    function canProvideLiquidity(address) external view returns (bool);

    function hasPermission(Permissions) external view returns (bool);

    function getDenormalizedWeight(address) external view returns (uint256);

    function getRightsManagerVersion() external pure returns (address);

    function getBalancerSafeMathVersion() external pure returns (address);

    function getSmartPoolManagerVersion() external pure returns (address);

    function createPoolInternal(uint256) external;

    function approve(address, uint256) external;

    function bspCap() external view returns (uint256);

    function bPool() external view returns (address);

    function rights() external view returns (Rights memory);

    // erc20
    function balanceOf(address) external view returns (uint256);

    function name() external view returns (string memory);

    function allowance(address, address) external view returns (uint256);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function increaseApproval(address, uint256) external returns (bool);

    function decreaseApproval(address, uint256) external returns (bool);

    function transfer(address, uint256) external returns (bool);

    function setCanWhitelistLPs(bool) external;
}
