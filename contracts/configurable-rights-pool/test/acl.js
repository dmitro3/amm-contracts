const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { waffle } = require('hardhat');
const FCXAccessControl = artifacts.require('FCXAccessControl');

contract('FCXAccessControl', async (accounts) => {
    const admin = accounts[0];
    const user1 = accounts[1];
    let fcxAclInstance;
    let superAdminRole;
    let adminRole;
    let restrictedRole;
    let unRestrictedRole;

    const fixture = async () => {
        const fcxAclInstance = await FCXAccessControl.new(admin, [], []);
        const superAdminRole = await fcxAclInstance.SUPER_ADMIN_ROLE();
        const adminRole = await fcxAclInstance.ADMIN_ROLE();
        const restrictedRole = await fcxAclInstance.RESTRICTED_ROLE();
        const unRestrictedRole = await fcxAclInstance.UNRESTRICTED_ROLE();
        return { fcxAclInstance, superAdminRole, adminRole, restrictedRole, unRestrictedRole };
    };

    beforeEach(async () => {
        ({ fcxAclInstance, superAdminRole, adminRole, restrictedRole, unRestrictedRole } = await waffle.loadFixture(
            fixture
        ));
    });

    it('hasRole', async () => {
        const hasSuperAdminRole = await fcxAclInstance.hasRole(superAdminRole, admin);
        const hasRole = await fcxAclInstance.hasRole(adminRole, admin);
        assert.equal(hasSuperAdminRole, true);
        assert.equal(hasRole, true);
    });

    it('whitelisted', async () => {
        const whitelisted = await fcxAclInstance.whitelisted(admin);
        assert.equal(whitelisted, true);

        const userWhitelisted = await fcxAclInstance.whitelisted(user1);
        assert.equal(userWhitelisted, false);
    });

    it('getRoles', async () => {
        const roles = await fcxAclInstance.getRoles(admin);
        assert.equal(roles[0], adminRole);
    });

    it('Grant Roles', async () => {
        await fcxAclInstance.grantRoles([{ account: user1, role: unRestrictedRole }], { from: admin });
        const roles = await fcxAclInstance.getRoles(user1);
        assert.equal(roles[1], 0x0000000000000000000000000000000000000000000000000000000000000000);
        assert.equal(roles[2], unRestrictedRole);

        // toggle
        await fcxAclInstance.grantRoles([{ account: user1, role: restrictedRole }], { from: admin });
        assert.equal(await fcxAclInstance.hasRole(restrictedRole, user1), true);
        assert.equal(await fcxAclInstance.hasRole(unRestrictedRole, user1), false);

        await fcxAclInstance.grantRoles([{ account: user1, role: unRestrictedRole }], { from: admin });
        assert.equal(await fcxAclInstance.hasRole(restrictedRole, user1), false);
        assert.equal(await fcxAclInstance.hasRole(unRestrictedRole, user1), true);
    });

    it('Grant Roles (benchmark)', async () => {
        const grantArrays = [];
        for (let i = 0; i < 150; i++) {
            const account = web3.eth.accounts.create();
            grantArrays.push({ role: unRestrictedRole, account: account.address });
        }

        await fcxAclInstance.grantRoles(grantArrays, { from: admin });
    });

    it('Only admin can grant roles', async () => {
        await truffleAssert.reverts(
            fcxAclInstance.grantRoles([{ account: user1, role: unRestrictedRole }], { from: user1 }),
            'AccessControl: sender must be an admin to grant'
        );
    });

    it('blacklist', async () => {
        await fcxAclInstance.grantRoles(
            [
                { account: user1, role: unRestrictedRole },
                { account: accounts[2], role: restrictedRole },
                { account: accounts[3], role: adminRole },
                { account: accounts[4], role: superAdminRole },
            ],
            { from: admin }
        );
        assert.equal(await fcxAclInstance.hasRole(unRestrictedRole, user1), true);
        assert.equal(await fcxAclInstance.hasRole(restrictedRole, accounts[2]), true);
        assert.equal(await fcxAclInstance.hasRole(adminRole, accounts[3]), true);
        assert.equal(await fcxAclInstance.hasRole(superAdminRole, accounts[4]), true);

        await fcxAclInstance.blacklist([user1, accounts[2], accounts[3], accounts[4]], { from: admin });
        assert.equal(await fcxAclInstance.hasRole(unRestrictedRole, user1), false);
        assert.equal(await fcxAclInstance.hasRole(restrictedRole, accounts[2]), false);
        assert.equal(await fcxAclInstance.hasRole(adminRole, accounts[3]), false);
        assert.equal(await fcxAclInstance.hasRole(superAdminRole, accounts[4]), false);
    });

    it('Get Role member', async () => {
        const member = await fcxAclInstance.getRoleMember(adminRole, 0);
        assert.equal(member, admin);
    });

    it('Get Role member count', async () => {
        const count = await fcxAclInstance.getRoleMemberCount(adminRole);
        assert.equal(count, 1);
    });

    it('Grant Role', async () => {
        await fcxAclInstance.grantRole(restrictedRole, admin, { from: admin });
        const roles = await fcxAclInstance.getRoles(admin);
        assert.equal(roles[0], adminRole);
        assert.equal(roles[1], restrictedRole);
    });

    it('Only Admin can grant role', async () => {
        await truffleAssert.reverts(
            fcxAclInstance.grantRole(restrictedRole, admin, { from: user1 }),
            'AccessControl: sender must be an admin to grant'
        );
    });

    it('Renounce role', async () => {
        await fcxAclInstance.renounceRole(restrictedRole, user1, { from: user1 });
        const roles = await fcxAclInstance.getRoles(user1);
        assert.equal(roles[1], 0x0000000000000000000000000000000000000000000000000000000000000000);
    });

    it('Can only renounce roles for self', async () => {
        await truffleAssert.reverts(
            fcxAclInstance.renounceRole(restrictedRole, user1, { from: admin }),
            'AccessControl: can only renounce roles for self'
        );
    });

    it('Revoke role', async () => {
        await fcxAclInstance.revokeRole(restrictedRole, user1, { from: admin });
        const roles = await fcxAclInstance.getRoles(user1);
        assert.equal(roles[1], 0x0000000000000000000000000000000000000000000000000000000000000000);
    });

    it("Only admin can revoke user's role", async () => {
        await truffleAssert.reverts(
            fcxAclInstance.revokeRole(adminRole, admin, { from: user1 }),
            'AccessControl: sender must be an admin to revoke'
        );
    });
});
