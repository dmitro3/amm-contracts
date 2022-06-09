/* eslint-env es6 */

const BFactory = artifacts.require('BFactory');
const IConfigurableRightsPool = artifacts.require('IConfigurableRightsPool');
const IBPool = artifacts.require('IBPool');
const CRPFactory = artifacts.require('CRPFactory');
const TToken = artifacts.require('TToken');
const FCXAccessControl = artifacts.require('FCXAccessControl');
const truffleAssert = require('truffle-assertions');
const { assert } = require('chai');

contract('configurableSwapFee', async (accounts) => {
    const admin = accounts[0];
    const { toWei } = web3.utils;

    const MAX = web3.utils.toTwosComplement(-1);

    let crpFactory;
    let bFactory;
    let crpPool;
    let CRPPOOL;
    let WETH;
    let DAI;
    let XYZ;
    let ABC;
    let weth;
    let dai;
    let abc;
    let xyz;

    // These are the intial settings for newCrp:
    const swapFee = 10 ** 15;
    const protocolFee = 0;
    const startWeights = [toWei('12'), toWei('1.5'), toWei('1.5')];
    const startBalances = [toWei('80000'), toWei('40'), toWei('10000')];
    const SYMBOL = 'BSP';
    const NAME = 'Balancer Pool Token';

    // const permissions = [false, true, false, false];
    const permissions = {
        canPauseSwapping: false,
        canChangeSwapFee: true,
        canChangeWeights: false,
        canAddRemoveTokens: false,
        canWhitelistLPs: false,
        canChangeCap: false,
        canChangeProtocolFee: true,
    };

    before(async () => {
        fcxAclInstance = await FCXAccessControl.deployed();
        adminRole = await fcxAclInstance.ADMIN_ROLE();
        retrictedRole = await fcxAclInstance.RESTRICTED_ROLE();
        unRetrictedRole = await fcxAclInstance.UNRESTRICTED_ROLE();

        const roles = [adminRole, retrictedRole, unRetrictedRole];

        bFactory = await BFactory.deployed();
        crpFactory = await CRPFactory.deployed();
        xyz = await TToken.new('XYZ', 'XYZ', 18);
        weth = await TToken.new('Wrapped Ether', 'WETH', 18);
        dai = await TToken.new('Dai Stablecoin', 'DAI', 18);
        abc = await TToken.new('ABC', 'ABC', 18);

        WETH = weth.address;
        DAI = dai.address;
        XYZ = xyz.address;
        ABC = abc.address;

        // admin balances
        await weth.mint(admin, toWei('100'));
        await dai.mint(admin, toWei('15000'));
        await xyz.mint(admin, toWei('100000'));
        await abc.mint(admin, toWei('100000'));

        const tokenAddresses = [XYZ, WETH, DAI];

        const poolParams = {
            poolTokenSymbol: SYMBOL,
            poolTokenName: NAME,
            constituentTokens: tokenAddresses,
            tokenBalances: startBalances,
            tokenWeights: startWeights,
            swapFee: swapFee,
            protocolFee: protocolFee,
        };

        CRPPOOL = await crpFactory.newCrp.call(bFactory.address, poolParams, permissions);

        await crpFactory.newCrp(bFactory.address, poolParams, permissions);

        crpPool = await IConfigurableRightsPool.at(CRPPOOL);

        const CRPPOOL_ADDRESS = crpPool.address;

        await weth.approve(CRPPOOL_ADDRESS, MAX);
        await dai.approve(CRPPOOL_ADDRESS, MAX);
        await xyz.approve(CRPPOOL_ADDRESS, MAX);

        await crpPool.createPool(toWei('100'), 10, 10);
    });

    it('crpPool should have correct rights set', async () => {
        const swapRight = await crpPool.hasPermission(1);
        assert.isTrue(swapRight);

        let x;
        for (x = 0; x < permissions.length; x++) {
            if (x !== 1) {
                const otherPerm = await crpPool.hasPermission(x);
                assert.isFalse(otherPerm);
            }
        }
    });

    it('Non Controller account should not be able to change swapFee', async () => {
        await truffleAssert.reverts(crpPool.setSwapFee(toWei('0.001'), { from: accounts[1] }), 'ERR_NOT_CONTROLLER');
    });

    it('Non Controller account should not be able to change protocolFee', async () => {
        await truffleAssert.reverts(
            crpPool.setProtocolFee(toWei('0.001'), { from: accounts[1] }),
            'ERR_NOT_CONTROLLER'
        );
    });

    it('Controller should be able to change swapFee', async () => {
        const bPoolAddr = await crpPool.bPool();
        const bPool = await IBPool.at(bPoolAddr);

        const deployedSwapFee = await bPool.getSwapFee();
        assert.equal(swapFee, deployedSwapFee);

        const newSwapFee = toWei('0.001');
        await crpPool.setSwapFee(newSwapFee);

        // Setting it to the same as the old value, so if it fails silently we wouldn't know
        // To guard against that, set it to something actually different in the next test, to
        // make sure it really changes it
        const newSwapFeeCheck = await bPool.getSwapFee();
        assert.equal(newSwapFee, newSwapFeeCheck);

        const differentSwapFee = toWei('0.003');
        await crpPool.setSwapFee(differentSwapFee);

        const secondSwapFeeCheck = await bPool.getSwapFee();
        assert.equal(differentSwapFee, secondSwapFeeCheck);
    });

    it('Controller should be able to change protocolFee', async () => {
        const bPoolAddr = await crpPool.bPool();
        const bPool = await IBPool.at(bPoolAddr);

        const deployedProtocolFee = await bPool.getProtocolFee();
        assert.equal(protocolFee, deployedProtocolFee);

        const newProtocolFee = toWei('0.0001');
        await crpPool.setProtocolFee(newProtocolFee);

        // Setting it to the same as the old value, so if it fails silently we wouldn't know
        // To guard against that, set it to something actually different in the next test, to
        // make sure it really changes it
        const newProtocolFeeCheck = await bPool.getProtocolFee();
        assert.equal(newProtocolFee, newProtocolFeeCheck);

        const differentProtocolFee = toWei('0.0003');
        await crpPool.setProtocolFee(differentProtocolFee);

        const secondProtocolFeeCheck = await bPool.getProtocolFee();
        assert.equal(differentProtocolFee, secondProtocolFeeCheck);
    });

    it('Configurable tokens should revert because non-permissioned', async () => {
        truffleAssert.reverts(crpPool.commitAddToken(ABC, toWei('1'), toWei('1')), 'ERR_CANNOT_ADD_REMOVE_TOKENS');

        truffleAssert.reverts(crpPool.applyAddToken(), 'ERR_CANNOT_ADD_REMOVE_TOKENS');

        truffleAssert.reverts(crpPool.removeToken(WETH), 'ERR_CANNOT_ADD_REMOVE_TOKENS');
    });

    it('Set public swap should revert because non-permissioned', async () => {
        await truffleAssert.reverts(crpPool.setPublicSwap(false), 'ERR_NOT_PAUSABLE_SWAP');
    });

    it('Should not be able to bypass crpPool', async () => {
        const bPoolAddr = await crpPool.bPool();
        const bPool = await IBPool.at(bPoolAddr);

        let oldSwapFee = await bPool.getSwapFee();
        await truffleAssert.reverts(bPool.setSwapFee(toWei('0.007')), 'ERR_NOT_CONTROLLER');
        let newSwapFee = await bPool.getSwapFee();

        assert.equal(newSwapFee - oldSwapFee, 0);
    });

    it('Configurable weight should revert because non-permissioned', async () => {
        await truffleAssert.reverts(crpPool.updateWeight(xyz.address, toWei('13')), 'ERR_NOT_CONFIGURABLE_WEIGHTS');

        const block = await web3.eth.getBlock('latest');

        await truffleAssert.reverts(
            crpPool.updateWeightsGradually([toWei('2'), toWei('5'), toWei('5')], block.number, block.number + 10),
            'ERR_NOT_CONFIGURABLE_WEIGHTS'
        );

        await truffleAssert.reverts(crpPool.pokeWeights(), 'ERR_NOT_CONFIGURABLE_WEIGHTS');
    });

    it('Non Controller account should not be able to set roles', async () => {
        const roles = [adminRole, retrictedRole, unRetrictedRole];
        await truffleAssert.reverts(crpPool.setRoles(roles, { from: accounts[1] }), 'ERR_NOT_CONTROLLER');
    });

    it('Controller should be able to set roles', async () => {
        const roles = [adminRole, retrictedRole, unRetrictedRole];
        const bPoolAddr = await crpPool.bPool();
        const bPool = await IBPool.at(bPoolAddr);

        const deployedRoles = await bPool.getRoles();
        assert.deepEqual(roles, deployedRoles);

        const newRoles = [retrictedRole, unRetrictedRole];
        await crpPool.setRoles(newRoles);

        // Setting it to the same as the old value, so if it fails silently we wouldn't know
        // To guard against that, set it to something actually different in the next test, to
        // make sure it really changes it
        const newRolesCheck = await bPool.getRoles();
        assert.deepEqual(newRoles, newRolesCheck);

        const differentRoles = [unRetrictedRole];
        await crpPool.setRoles(differentRoles);

        const secondRolesCheck = await bPool.getRoles();
        assert.deepEqual(differentRoles, secondRolesCheck);
    });

    it('Non Controller account should not be able to set access control address', async () => {
        await truffleAssert.reverts(
            crpPool.setAccessControlAddress(fcxAclInstance.address, { from: accounts[1] }),
            'ERR_NOT_CONTROLLER'
        );
    });

    it('Controller should be able to set access control address', async () => {
        const bPoolAddr = await crpPool.bPool();
        const bPool = await IBPool.at(bPoolAddr);

        const deployedAclAddress = await bPool.getAccessControlAddress();
        assert.deepEqual(fcxAclInstance.address, deployedAclAddress);

        const newAcl = await FCXAccessControl.new(accounts[0], [], [accounts[1]]);
        await crpPool.setAccessControlAddress(newAcl.address);

        // Setting it to the same as the old value, so if it fails silently we wouldn't know
        // To guard against that, set it to something actually different in the next test, to
        // make sure it really changes it
        const newAclCheck = await bPool.getAccessControlAddress();
        assert.equal(newAcl.address, newAclCheck);

        const differentAcl = await FCXAccessControl.new(accounts[0], [accounts[2]], [accounts[1]]);
        await crpPool.setAccessControlAddress(differentAcl.address);

        const secondAclCheck = await bPool.getAccessControlAddress();
        assert.equal(differentAcl.address, secondAclCheck);
    });
});
