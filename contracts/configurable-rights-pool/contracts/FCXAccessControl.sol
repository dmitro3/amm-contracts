// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.12;

// Needed to handle structures externally
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract FCXAccessControl is AccessControl {
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RESTRICTED_ROLE = keccak256("RESTRICTED_ROLE");
    bytes32 public constant UNRESTRICTED_ROLE = keccak256("UNRESTRICTED_ROLE");

    struct GrantParams {
        address account;
        bytes32 role;
    }

    /**
     * @dev FCX user manager.
     */
    constructor(
        address adminAddress,
        address[] memory restrictedAddresses,
        address[] memory unrestrictedAddresses
    ) public {
        _setRoleAdmin(SUPER_ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(ADMIN_ROLE, SUPER_ADMIN_ROLE);
        _setRoleAdmin(RESTRICTED_ROLE, ADMIN_ROLE);
        _setRoleAdmin(UNRESTRICTED_ROLE, ADMIN_ROLE);

        // deployer + self administration
        _setupRole(SUPER_ADMIN_ROLE, adminAddress);
        _setupRole(ADMIN_ROLE, adminAddress);
        _setupRole(UNRESTRICTED_ROLE, adminAddress);

        // register proposers
        for (uint256 i = 0; i < restrictedAddresses.length; ++i) {
            _setupRole(RESTRICTED_ROLE, restrictedAddresses[i]);
        }

        // register executors
        for (uint256 i = 0; i < unrestrictedAddresses.length; ++i) {
            _setupRole(UNRESTRICTED_ROLE, unrestrictedAddresses[i]);
        }
    }

    /**
     * @dev Grants `roles` to `accounts`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRoles(GrantParams[] calldata params) public virtual {
        for (uint256 i = 0; i < params.length; i++) {
            GrantParams calldata entity = params[i];
            if (entity.role == ADMIN_ROLE && !hasRole(UNRESTRICTED_ROLE, entity.account)) {
                grantRole(UNRESTRICTED_ROLE, entity.account);
            }
            if (entity.role == RESTRICTED_ROLE && hasRole(UNRESTRICTED_ROLE, entity.account)) {
                revokeRole(UNRESTRICTED_ROLE, entity.account);
            }
            if (entity.role == UNRESTRICTED_ROLE && hasRole(RESTRICTED_ROLE, entity.account)) {
                revokeRole(RESTRICTED_ROLE, entity.account);
            }

            grantRole(entity.role, entity.account);
        }
    }

    function blacklist(address[] calldata accounts) public virtual {
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            if (hasRole(UNRESTRICTED_ROLE, account)) {
                revokeRole(UNRESTRICTED_ROLE, account);
            }
            if (hasRole(RESTRICTED_ROLE, account)) {
                revokeRole(RESTRICTED_ROLE, account);
            }
            if (hasRole(ADMIN_ROLE, account)) {
                revokeRole(ADMIN_ROLE, account);
            }
            if (hasRole(SUPER_ADMIN_ROLE, account)) {
                revokeRole(SUPER_ADMIN_ROLE, account);
            }
        }
    }

    /**
     * @dev get all roles of account
     */
    function getRoles(address account) public view returns (bytes32[] memory) {
        bytes32[4] memory roles = [ADMIN_ROLE, RESTRICTED_ROLE, UNRESTRICTED_ROLE, SUPER_ADMIN_ROLE];
        bytes32[] memory result = new bytes32[](4);

        for (uint256 i = 0; i < roles.length; i++) {
            if (hasRole(roles[i], account)) {
                result[i] = roles[i];
            }
        }
        return result;
    }

    /**
     * @dev check account in whitelist
     */
    function whitelisted(address account) public view returns (bool) {
        bytes32[4] memory roles = [ADMIN_ROLE, RESTRICTED_ROLE, UNRESTRICTED_ROLE, SUPER_ADMIN_ROLE];
        for (uint256 i = 0; i < roles.length; i++) {
            if (hasRole(roles[i], account)) {
                return true;
            }
        }
        return false;
    }
}
