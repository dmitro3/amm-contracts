// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.12;

// Builds new BPools, logging their addresses and providing `isBPool(address) -> (bool)`

import "./BPool.sol";
import "../IBFactory.sol";
import "../IFCXAccessControl.sol";

// Core contract; can't be changed. So disable solhint (reminder for v2)

/* solhint-disable func-order */
/* solhint-disable event-name-camelcase */

contract BFactory is BBronze {
    event LOG_NEW_POOL(address indexed caller, address indexed pool);

    event LOG_BLABS(address indexed caller, address indexed blabs);

    mapping(address => bool) private _isBPool;

    address private _accessAddress;
    address private _logic;

    constructor(address accessAddress, address logic) public {
        _accessAddress = accessAddress;
        _logic = logic;
        _blabs = msg.sender;
    }

    function isBPool(address b) external view returns (bool) {
        return _isBPool[b];
    }

    function newBPool() external returns (BPool) {
        require(
            IFCXAccessControl(_accessAddress).hasRole(keccak256("ADMIN_ROLE"), tx.origin),
            "AccessControl: sender must be admin to have permission"
        );

        BPool bpool = new BPool(_logic);
        _isBPool[address(bpool)] = true;
        emit LOG_NEW_POOL(msg.sender, address(bpool));
        IBPool(address(bpool)).setAccessControlAddress(_accessAddress);
        IBPool(address(bpool)).setController(msg.sender);
        return bpool;
    }

    address private _blabs;

    function getBLabs() external view returns (address) {
        return _blabs;
    }

    function getAccessControlAddress() external view returns (address) {
        return _accessAddress;
    }

    function setBLabs(address b) external {
        require(msg.sender == _blabs, "ERR_NOT_BLABS");
        emit LOG_BLABS(msg.sender, b);
        _blabs = b;
    }

    function setAccessControlAddress(address accessAddress) external {
        require(
            IFCXAccessControl(_accessAddress).hasRole(keccak256("ADMIN_ROLE"), tx.origin),
            "AccessControl: sender must be admin to have permission"
        );
        require(accessAddress != address(0), "ERR_INVALID_ADDRESS");

        require(
            IFCXAccessControl(accessAddress).hasRole(keccak256("ADMIN_ROLE"), tx.origin),
            "AccessControl: sender must be admin of new access control"
        );
        _accessAddress = accessAddress;
    }

    function collect(BPool pool) external {
        require(msg.sender == _blabs, "ERR_NOT_BLABS");
        uint256 collected = IERC20(pool).balanceOf(address(this));
        bool xfer = pool.transfer(_blabs, collected);
        require(xfer, "ERR_ERC20_FAILED");
    }
}
