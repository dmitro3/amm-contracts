// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.12;

interface IFCXAccessControl {
    function hasRole(bytes32 role, address account) external view returns (bool);

    function getRoleMember(bytes32 role, uint256 index) external view returns (address);

    function whitelisted(address account) external view returns (bool);
}
