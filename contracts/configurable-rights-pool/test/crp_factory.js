const { artifacts } = require('hardhat');
const truffleAssert = require('truffle-assertions');

const ConfigurableRightsPool = artifacts.require('ConfigurableRightsPool');
const CRPFactory = artifacts.require('CRPFactory');
const BFactory = artifacts.require('BFactory');
const TToken = artifacts.require('TToken');
const FCXAccessControl = artifacts.require('FCXAccessControl');

contract('CRPFactory', async (accounts) => {
    const admin = accounts[0];
    const nonAdmin = accounts[1];
    const user2 = accounts[2];
    const { toWei } = web3.utils;
    const { fromWei } = web3.utils;
    const { hexToUtf8 } = web3.utils;

    let crpFactory;
    let bFactory;
    let crpPool;
    let CRPPOOL; //pool address
    let WETH; // weth address
    let DAI; //dai address
    let weth;
    let dai;
    let fcxAclInstance;

    let poolParams;
    let rights;

    const MAX = web3.utils.toTwosComplement(-1);

    before(async () => {
        fcxAclInstance = await FCXAccessControl.deployed();
        crpFactory = await CRPFactory.deployed();
        bFactory = await BFactory.deployed();

        adminRole = await fcxAclInstance.ADMIN_ROLE();
        retrictedRole = await fcxAclInstance.RESTRICTED_ROLE();
        unRetrictedRole = await fcxAclInstance.UNRESTRICTED_ROLE();

        xyz = await TToken.new('XYZ', 'XYZ', 18);
        weth = await TToken.new('Wrapped Ether', 'WETH', 18);
        dai = await TToken.new('Dai Stablecoin', 'DAI', 18);

        WETH = weth.address;
        DAI = dai.address;
        XYZ = xyz.address;

        // admin balances
        await weth.mint(admin, toWei('100'));
        await dai.mint(admin, toWei('15000'));
        await xyz.mint(admin, toWei('100000'));

        poolParams = {
            poolTokenSymbol: 'CRP',
            poolTokenName: 'Configurable Right Pool',
            constituentTokens: [WETH, DAI, XYZ],
            tokenBalances: [toWei('12'), toWei('1.5'), toWei('1.5')],
            tokenWeights: [toWei('80000'), toWei('40'), toWei('10000')],
            swapFee: 10 ** 15,
            protocolFee: 10 ** 15,
        };
        rights = {
            canPauseSwapping: false,
            canChangeSwapFee: true,
            canChangeWeights: true,
            canAddRemoveTokens: false,
            canWhitelistLPs: false,
            canChangeCap: false,
            canChangeProtocolFee: true,
        };

        CRPPOOL = await crpFactory.newCrp.call(bFactory.address, poolParams, rights, { from: admin });

        await crpFactory.newCrp(bFactory.address, poolParams, rights);

        crpPool = await ConfigurableRightsPool.at(CRPPOOL);
    });

    describe('Access control', () => {
        it('Only admin can set access address', async () => {
            newAccessControl = await FCXAccessControl.new(admin, [], [nonAdmin]);
            await truffleAssert.reverts(
                crpFactory.setAccessControlAddress(newAccessControl.address, { from: nonAdmin }),
                'AccessControl: sender must be admin to have permission'
            );

            await crpFactory.setAccessControlAddress(newAccessControl.address, { from: admin });
            newAddress = await crpFactory.getAccessControlAddress();
            assert.equal(newAddress, newAccessControl.address);
        });

        it('New and old access control have to same admin', async () => {
            const newAccessControl = await FCXAccessControl.new(nonAdmin, [], []);
            await truffleAssert.reverts(
                crpFactory.setAccessControlAddress(newAccessControl.address, { from: admin }),
                'AccessControl: sender must be admin of new access control'
            );
        });
    });

    describe('Create configurable pool', () => {
        it('True if configurable pool', async () => {
            const check = await crpFactory.isCrp(crpPool.address);
            assert.isTrue(check);
        });

        it('Only admin can create new configurable pool', async () => {
            await truffleAssert.reverts(
                crpFactory.newCrp(bFactory.address, poolParams, rights, { from: nonAdmin }),
                'AccessControl: sender must be admin to have permission'
            );
        });
    });
});
