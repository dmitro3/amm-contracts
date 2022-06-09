// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

// Imports

import "../../libraries/BalancerSafeMath.sol";

// Contracts

/*
 * @author Balancer Labs
 * @title Wrap BalancerSafeMath for testing
 */
contract BalancerSafeMathMock {
    function bmul(uint256 a, uint256 b) external pure returns (uint256) {
        return BalancerSafeMath.bmul(a, b);
    }

    function bdiv(uint256 a, uint256 b) external pure returns (uint256) {
        return BalancerSafeMath.bdiv(a, b);
    }

    function bsub(uint256 a, uint256 b) external pure returns (uint256) {
        return BalancerSafeMath.bsub(a, b);
    }

    function badd(uint256 a, uint256 b) external pure returns (uint256) {
        return BalancerSafeMath.badd(a, b);
    }

    function bmod(uint256 a, uint256 b) external pure returns (uint256) {
        return BalancerSafeMath.bmod(a, b);
    }

    function bmax(uint256 a, uint256 b) external pure returns (uint256) {
        return BalancerSafeMath.bmax(a, b);
    }

    function bmin(uint256 a, uint256 b) external pure returns (uint256) {
        return BalancerSafeMath.bmin(a, b);
    }

    function baverage(uint256 a, uint256 b) external pure returns (uint256) {
        return BalancerSafeMath.baverage(a, b);
    }
}
