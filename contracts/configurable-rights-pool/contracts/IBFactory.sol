// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.12;

interface IBPool {
    function rebind(
        address token,
        uint256 balance,
        uint256 denorm
    ) external;

    function setSwapFee(uint256 swapFee) external;

    function setProtocolFee(uint256 protocolFee) external;

    function setRoles(bytes32[] memory roles) external;

    function setAccessControlAddress(address accessAddress) external;

    function setPublicSwap(bool publicSwap) external;

    function bind(
        address token,
        uint256 balance,
        uint256 denorm
    ) external;

    function unbind(address token) external;

    function gulp(address token) external;

    function isBound(address token) external view returns (bool);

    function getBalance(address token) external view returns (uint256);

    function getSwapFee() external view returns (uint256);

    function getProtocolFee() external view returns (uint256);

    function isPublicSwap() external view returns (bool);

    function getDenormalizedWeight(address token) external view returns (uint256);

    function getTotalDenormalizedWeight() external view returns (uint256);

    // solhint-disable-next-line func-name-mixedcase
    function EXIT_FEE() external view returns (uint256);

    function calcPoolOutGivenSingleIn(
        uint256 tokenBalanceIn,
        uint256 tokenWeightIn,
        uint256 poolSupply,
        uint256 totalWeight,
        uint256 tokenAmountIn,
        uint256 swapFee
    ) external pure returns (uint256 poolAmountOut);

    function calcSingleInGivenPoolOut(
        uint256 tokenBalanceIn,
        uint256 tokenWeightIn,
        uint256 poolSupply,
        uint256 totalWeight,
        uint256 poolAmountOut,
        uint256 swapFee
    ) external pure returns (uint256 tokenAmountIn);

    function calcSingleOutGivenPoolIn(
        uint256 tokenBalanceOut,
        uint256 tokenWeightOut,
        uint256 poolSupply,
        uint256 totalWeight,
        uint256 poolAmountIn,
        uint256 swapFee
    ) external pure returns (uint256 tokenAmountOut);

    function calcPoolInGivenSingleOut(
        uint256 tokenBalanceOut,
        uint256 tokenWeightOut,
        uint256 poolSupply,
        uint256 totalWeight,
        uint256 tokenAmountOut,
        uint256 swapFee
    ) external pure returns (uint256 poolAmountIn);

    function isFinalized() external view returns (bool);

    function getNumTokens() external view returns (uint256);

    function getCurrentTokens() external view returns (address[] memory);

    function getFinalTokens() external view returns (address[] memory);

    function getNormalizedWeight(address) external view returns (uint256);

    function getController() external view returns (address);

    function getAccessControlAddress() external view returns (address);

    function getRoles() external view returns (bytes32[] memory);

    function setController(address) external;

    function getSpotPrice(address, address) external view returns (uint256);

    function getSpotPriceSansFee(address, address) external view returns (uint256);

    function finalize() external;

    // BPool function
    event LOG_SWAP(
        address indexed caller,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 tokenAmountIn,
        uint256 tokenAmountOut
    );

    function joinPool(uint256, uint256[] calldata) external;

    function swapExactAmountIn(
        address,
        uint256,
        address,
        uint256,
        uint256
    ) external returns (uint256 tokenAmountOut, uint256 spotPriceAfter);

    function swapExactAmountOut(
        address,
        uint256,
        address,
        uint256,
        uint256
    ) external returns (uint256 tokenAmountIn, uint256 spotPriceAfter);

    function exitPool(uint256, uint256[] calldata) external;

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

    // ERC20
    event Approval(address indexed src, address indexed dst, uint256 amt);
    event Transfer(address indexed src, address indexed dst, uint256 amt);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address whom) external view returns (uint256);

    function allowance(address src, address dst) external view returns (uint256);

    function approve(address dst, uint256 amt) external returns (bool);

    function transfer(address dst, uint256 amt) external returns (bool);

    function transferFrom(
        address src,
        address dst,
        uint256 amt
    ) external returns (bool);

    function increaseApproval(address, uint256) external returns (bool);

    function decreaseApproval(address, uint256) external returns (bool);
}

interface IBFactory {
    function newBPool() external returns (IBPool);

    function setBLabs(address b) external;

    function collect(IBPool pool) external;

    function isBPool(address b) external view returns (bool);

    function getBLabs() external view returns (address);

    function getAccessControlAddress() external view returns (address);
}
