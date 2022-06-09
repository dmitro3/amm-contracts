const { artifacts } = require('hardhat');
const truffleAssert = require('truffle-assertions');
const BPool = artifacts.require('BPool');
const BFactory = artifacts.require('BFactory');
const TToken = artifacts.require('TToken');
const FCXAccessControl = artifacts.require('FCXAccessControl');

contract('BFactory', async (accounts) => {
    const admin = accounts[0];
    const nonAdmin = accounts[1];
    const user2 = accounts[2];
    const { toWei } = web3.utils;
    const { fromWei } = web3.utils;
    const { hexToUtf8 } = web3.utils;

    const MAX = web3.utils.toTwosComplement(-1);

    describe('Factory', () => {
        let factory;
        let pool;
        let POOL;
        let WETH;
        let DAI;
        let weth;
        let dai;

        before(async () => {
            fcxAclInstance = await FCXAccessControl.deployed();
            factory = await BFactory.deployed();

            adminRole = await fcxAclInstance.ADMIN_ROLE();
            retrictedRole = await fcxAclInstance.RESTRICTED_ROLE();
            unRetrictedRole = await fcxAclInstance.UNRESTRICTED_ROLE();

            weth = await TToken.new('Wrapped Ether', 'WETH', 18);
            dai = await TToken.new('Dai Stablecoin', 'DAI', 18);

            WETH = weth.address;
            DAI = dai.address;

            // admin balances
            await weth.mint(admin, toWei('5'));
            await dai.mint(admin, toWei('200'));

            // nonAdmin balances
            await weth.mint(nonAdmin, toWei('1'), { from: admin });
            await dai.mint(nonAdmin, toWei('50'), { from: admin });

            POOL = await factory.newBPool.call({ from: admin }); // this works fine in clean room
            await factory.newBPool();
            pool = await BPool.at(POOL);

            await weth.approve(POOL, MAX);
            await dai.approve(POOL, MAX);

            await weth.approve(POOL, MAX, { from: nonAdmin });
            await dai.approve(POOL, MAX, { from: nonAdmin });
        });

        it('BFactory is bronze release', async () => {
            const color = await factory.getColor();
            assert.equal(hexToUtf8(color), 'BRONZE');
        });

        it('isBPool on non pool returns false', async () => {
            const isBPool = await factory.isBPool(admin);
            assert.isFalse(isBPool);
        });

        it('isBPool on pool returns true', async () => {
            const isBPool = await factory.isBPool(POOL);
            assert.isTrue(isBPool);
        });

        it('fails nonAdmin calls collect', async () => {
            await truffleAssert.reverts(factory.collect(nonAdmin, { from: nonAdmin }), 'ERR_NOT_BLABS');
        });

        it('admin collects fees', async () => {
            await pool.bind(WETH, toWei('5'), toWei('5'));
            await pool.bind(DAI, toWei('200'), toWei('5'));

            await pool.finalize();

            await pool.joinPool(toWei('10'), [MAX, MAX], { from: nonAdmin });
            await pool.exitPool(toWei('10'), [toWei('0'), toWei('0')], { from: nonAdmin });

            // Exit fee = 0 so this wont do anything
            await factory.collect(POOL);

            const adminBalance = await pool.balanceOf(admin);
            assert.equal(fromWei(adminBalance), '100');
        });

        it('nonadmin cant set blabs address', async () => {
            await truffleAssert.reverts(factory.setBLabs(nonAdmin, { from: nonAdmin }), 'ERR_NOT_BLABS');
        });

        it('admin changes blabs address', async () => {
            await factory.setBLabs(user2);
            const blab = await factory.getBLabs();
            assert.equal(blab, user2);
        });

        it('Only admin can create pool', async () => {
            await truffleAssert.reverts(
                factory.newBPool({ from: nonAdmin }),
                'AccessControl: sender must be admin to have permission'
            );
        });

        it('Get access control address', async () => {
            const aclAddress = await factory.getAccessControlAddress();
            assert.equal(aclAddress, fcxAclInstance.address);
        });

        it('Set access control address', async () => {
            const oldAccessControl = await factory.getAccessControlAddress();

            const newAccessControl = await FCXAccessControl.new(admin, [], []);
            await factory.setAccessControlAddress(newAccessControl.address, { from: admin });
            const newAccessAddress = await factory.getAccessControlAddress();
            assert.equal(newAccessAddress, newAccessControl.address);

            await factory.setAccessControlAddress(oldAccessControl, { from: admin });
        });

        it('Only admin can set access control address', async () => {
            const newAccessControl = await FCXAccessControl.new(admin, [], []);
            await truffleAssert.reverts(
                factory.setAccessControlAddress(newAccessControl.address, { from: nonAdmin }),
                'AccessControl: sender must be admin to have permission'
            );
        });

        it('Cant set access control address to zero', async () => {
            await truffleAssert.reverts(
                factory.setAccessControlAddress('0x0000000000000000000000000000000000000000', { from: admin }),
                'ERR_INVALID_ADDRESS'
            );
        });

        it('New and old access control have to same admin', async () => {
            const newAccessControl = await FCXAccessControl.new(nonAdmin, [], []);
            await truffleAssert.reverts(
                factory.setAccessControlAddress(newAccessControl.address, { from: admin }),
                'AccessControl: sender must be admin of new access control'
            );
        });
    });
});
