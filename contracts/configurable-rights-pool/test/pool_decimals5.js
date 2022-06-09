const { RLP } = require('ethers/lib/utils');
const { artifacts } = require('hardhat');
const truffleAssert = require('truffle-assertions');
const { calcOutGivenIn, calcInGivenOut, calcRelativeDiff } = require('./calc_comparisons');

const BPool = artifacts.require('BPool');
const IBPool = artifacts.require('IBPool');
const BFactory = artifacts.require('BFactory');
const TToken = artifacts.require('TToken');
const FCXAccessControl = artifacts.require('FCXAccessControl');
const ReEntryToken = artifacts.require('ReEntryToken');
const verbose = process.env.VERBOSE;


contract('BPool', async (accounts) => {
    const admin = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const { toWei } = web3.utils;
    const { fromWei } = web3.utils;
    const errorDelta = 10 ** -8;
    const MAX = web3.utils.toTwosComplement(-1);

    let WETH;
    let MKR;
    let DAI;
    let XXX; // addresses
    let weth;
    let mkr;
    let dai;
    let xxx; // TTokens
    let factory; // BPool factory
    let pool; // first pool w/ defaults
    let POOL; //   pool address
    let fcxAclInstance;

    before(async () => {
        fcxAclInstance = await FCXAccessControl.deployed();
        adminRole = await fcxAclInstance.ADMIN_ROLE();
        retrictedRole = await fcxAclInstance.RESTRICTED_ROLE();
        unRetrictedRole = await fcxAclInstance.UNRESTRICTED_ROLE();

        factory = await BFactory.deployed();

        POOL = await factory.newBPool.call();
        await factory.newBPool();
        pool = await IBPool.at(POOL);

        weth = await TToken.new('Wrapped Ether', 'WETH', 18);
        mkr = await TToken.new('Maker', 'MKR', 5);
        dai = await TToken.new('Dai Stablecoin', 'DAI', 5);
        xxx = await TToken.new('XXX', 'XXX', 5);

        WETH = weth.address;
        MKR = mkr.address;
        DAI = dai.address;
        XXX = xxx.address;

        /*
            Tests assume token prices
            WETH - $200
            MKR  - $500
            DAI  - $1
            XXX  - $0
        */

        // Admin balances
        await weth.mint(admin, toWei('50'));
        await mkr.mint(admin, '2000000');
        await dai.mint(admin, '100000000');
        await xxx.mint(admin, '1000000');

        // User1 balances
        await weth.mint(user1, toWei('25'), { from: admin });
        await mkr.mint(user1, '40000', { from: admin });
        await dai.mint(user1, '4000000000', { from: admin });
        await xxx.mint(user1, '1000000', { from: admin });
    });

    describe('Binding Tokens', () => {
        it('Controller is msg.sender', async () => {
            const controller = await pool.getController();
            assert.equal(controller, admin);
        });

        it('Pool starts with no bound tokens', async () => {
            const numTokens = await pool.getNumTokens();
            assert.equal(0, numTokens);
            const isBound = await pool.isBound.call(WETH);
            assert(!isBound);
        });

        it('Fails binding tokens that are not approved', async () => {
            await truffleAssert.reverts(pool.bind(MKR, toWei('10'), toWei('2.5')), 'ERR_BTOKEN_BAD_CALLER');
        });

        it('Admin approves tokens', async () => {
            await weth.approve(POOL, MAX);
            await mkr.approve(POOL, MAX);
            await dai.approve(POOL, MAX);
            await xxx.approve(POOL, MAX);
        });

        it('Fails finalizing pool without 2 tokens', async () => {
            await truffleAssert.reverts(pool.finalize(), 'ERR_MIN_TOKENS');
        });

        it('Admin binds tokens', async () => {
            // Equal weights WETH, MKR, DAI
            await pool.bind(WETH, toWei('50'), toWei('5'));
            await pool.bind(MKR, '2000000', toWei('5'));
            await pool.bind(DAI, '100000000', toWei('5'));
            const numTokens = await pool.getNumTokens();
            assert.equal(3, numTokens);
            const totalDernomWeight = await pool.getTotalDenormalizedWeight();
            assert.equal(15, fromWei(totalDernomWeight));
            const wethDenormWeight = await pool.getDenormalizedWeight(WETH);
            assert.equal(5, fromWei(wethDenormWeight));
            const wethNormWeight = await pool.getNormalizedWeight(WETH);
            assert.equal(0.333333333333333333, fromWei(wethNormWeight));
            const mkrBalance = await pool.getBalance(MKR);
            assert.equal(2000000, mkrBalance);
        });
    });

    describe('Finalizing pool', () => {
        it('Fails when other users interact before finalizing', async () => {
            await truffleAssert.reverts(pool.bind(WETH, toWei('5'), toWei('5'), { from: user1 }), 'ERR_NOT_CONTROLLER');
            await truffleAssert.reverts(
                pool.rebind(WETH, toWei('5'), toWei('5'), { from: user1 }),
                'ERR_NOT_CONTROLLER'
            );
            await truffleAssert.reverts(pool.joinPool(toWei('1'), [MAX, MAX], { from: user1 }), 'ERR_NOT_FINALIZED');
            await truffleAssert.reverts(
                pool.exitPool(toWei('1'), [toWei('0'), toWei('0')], { from: user1 }),
                'ERR_NOT_FINALIZED'
            );
            await truffleAssert.reverts(pool.unbind(DAI, { from: user1 }), 'ERR_NOT_CONTROLLER');
        });

        it('Fails calling any swap before finalizing', async () => {
            await truffleAssert.reverts(
                pool.swapExactAmountIn(WETH, toWei('2.5'), DAI, toWei('475'), toWei('200')),
                'ERR_SWAP_NOT_PUBLIC'
            );
            await truffleAssert.reverts(
                pool.swapExactAmountIn(DAI, toWei('2.5'), WETH, toWei('475'), toWei('200')),
                'ERR_SWAP_NOT_PUBLIC'
            );
            await truffleAssert.reverts(
                pool.swapExactAmountOut(WETH, toWei('2.5'), DAI, toWei('475'), toWei('200')),
                'ERR_SWAP_NOT_PUBLIC'
            );
            await truffleAssert.reverts(
                pool.swapExactAmountOut(DAI, toWei('2.5'), WETH, toWei('475'), toWei('200')),
                'ERR_SWAP_NOT_PUBLIC'
            );
        });

        it('Fails calling any join exit swap before finalizing', async () => {
            finalize = await pool.isFinalized();
            roles = await pool.getRoles();

            await truffleAssert.reverts(
                pool.joinswapExternAmountIn(WETH, toWei('2.5'), toWei('0')),
                'ERR_NOT_FINALIZED'
            );
            await truffleAssert.reverts(pool.joinswapPoolAmountOut(WETH, toWei('2.5'), MAX), 'ERR_NOT_FINALIZED');
            await truffleAssert.reverts(pool.exitswapPoolAmountIn(WETH, toWei('2.5'), toWei('0')), 'ERR_NOT_FINALIZED');
            await truffleAssert.reverts(pool.exitswapExternAmountOut(WETH, toWei('2.5'), MAX), 'ERR_NOT_FINALIZED');
        });

        it('Only controller can setPublicSwap', async () => {
            await pool.setPublicSwap(true);
            const publicSwap = pool.isPublicSwap();
            assert(publicSwap);
            await truffleAssert.reverts(pool.setPublicSwap(true, { from: user1 }), 'ERR_NOT_CONTROLLER');
        });

        it('Fails setting low swap fees', async () => {
            await truffleAssert.reverts(pool.setSwapFee(toWei('0.0000001')), 'ERR_MIN_FEE');
        });

        it('Fails setting high swap fees', async () => {
            // await truffleAssert.reverts(pool.setSwapFee(toWei('0.11')), 'ERR_MAX_FEE');
            await truffleAssert.reverts(pool.setSwapFee(toWei('1.01')), 'ERR_MAX_FEE');
        });

        it('Fails setting high protocol fees', async () => {
            // await truffleAssert.reverts(pool.setSwapFee(toWei('0.11')), 'ERR_MAX_FEE');
            await truffleAssert.reverts(pool.setProtocolFee(toWei('1.01')), 'ERR_MAX_FEE');
        });

        it('Fails nonadmin sets fees or controller', async () => {
            await truffleAssert.reverts(pool.setSwapFee(toWei('0.003'), { from: user1 }), 'ERR_NOT_CONTROLLER');
            await truffleAssert.reverts(pool.setProtocolFee(toWei('0.003'), { from: user1 }), 'ERR_NOT_CONTROLLER');
            await truffleAssert.reverts(pool.setController(user1, { from: user1 }), 'ERR_NOT_CONTROLLER');
        });

        it('Admin sets swap fees', async () => {
            await pool.setSwapFee(toWei('0.003'));
            const swapFee = await pool.getSwapFee();
            assert.equal(0.003, fromWei(swapFee));
        });

        it('Fails sets protocol fees higher than swap fees', async () => {
            const swapFee = '0.003';
            const protocolFee = '0.004';
            await pool.setSwapFee(toWei(swapFee));
            await truffleAssert.reverts(pool.setProtocolFee(toWei(protocolFee)), 'ERR_INVALID_FEE');
        });

        it('Fails nonadmin finalizes pool', async () => {
            await truffleAssert.reverts(pool.finalize({ from: user1 }), 'ERR_NOT_CONTROLLER');
        });

        it('Admin finalizes pool', async () => {
            const tx = await pool.finalize();
            const adminBal = await pool.balanceOf(admin);
            assert.equal(100, fromWei(adminBal));
            truffleAssert.eventEmitted(tx, 'Transfer', (event) => event.dst === admin);
            const finalized = pool.isFinalized();
            assert(finalized);
        });

        it('Fails finalizing pool after finalized', async () => {
            await truffleAssert.reverts(pool.finalize(), 'ERR_IS_FINALIZED');
        });

        it('Cant setPublicSwap, setSwapFee when finalized', async () => {
            await truffleAssert.reverts(pool.setPublicSwap(false), 'ERR_IS_FINALIZED');
            await truffleAssert.reverts(pool.setSwapFee(toWei('0.01')), 'ERR_IS_FINALIZED');
        });

        it('Fails binding new token after finalized', async () => {
            await truffleAssert.reverts(pool.bind(XXX, toWei('10'), toWei('5')), 'ERR_IS_FINALIZED');
            await truffleAssert.reverts(pool.rebind(DAI, toWei('10'), toWei('5')), 'ERR_IS_FINALIZED');
        });

        it('Fails unbinding after finalized', async () => {
            await truffleAssert.reverts(pool.unbind(WETH), 'ERR_IS_FINALIZED');
        });

        it('Get final tokens', async () => {
            const finalTokens = await pool.getFinalTokens();
            assert.sameMembers(finalTokens, [WETH, MKR, DAI]);
        });
    });

    describe('User interactions', () => {
        it('Other users approve tokens', async () => {
            await weth.approve(POOL, MAX, { from: user1 });
            await mkr.approve(POOL, MAX, { from: user1 });
            await dai.approve(POOL, MAX, { from: user1 });
            await xxx.approve(POOL, MAX, { from: user1 });

            await weth.approve(POOL, MAX, { from: user2 });
            await mkr.approve(POOL, MAX, { from: user2 });
            await dai.approve(POOL, MAX, { from: user2 });
            await xxx.approve(POOL, MAX, { from: user2 });
        });

        it('Only whitelisted user can join pool', async () => {
            await truffleAssert.reverts(pool.joinPool(toWei('5'), [MAX, MAX, MAX], { from: accounts[4] }), 'FCXAccessControl: sender is not in whitelist');
        });

        it('User1 joins pool', async () => {
            await pool.joinPool(toWei('1'), [MAX, MAX, MAX], { from: user1 });
            const daiBalance = await pool.getBalance(DAI);
            assert.equal(101000000, daiBalance);
            const userWethBalance = await weth.balanceOf(user1);
            assert.equal(24.5, fromWei(userWethBalance));
            console.log((await pool.getBalance(WETH)).toString(), (await pool.getBalance(MKR)).toString(), (await pool.getBalance(DAI)).toString());
        });

        /*
          Current pool balances
          WETH - 50.5
          MKR - 20.2
          DAI - 10.1
          XXX - 0
        */

        

        it('Fails admin unbinding token after finalized and others joined', async () => {
            await truffleAssert.reverts(pool.unbind(DAI), 'ERR_IS_FINALIZED');
        });

        it('Fail swapExactAmountIn unbound or over min max ratios', async () => {
            await truffleAssert.reverts(
                pool.swapExactAmountIn(WETH, toWei('2.5'), XXX, toWei('100'), toWei('200'), { from: user2 }),
                'ERR_NOT_BOUND'
            );
            await truffleAssert.reverts(
                pool.swapExactAmountIn(WETH, toWei('26.5'), DAI, toWei('5000'), toWei('200'), { from: user2 }),
                'ERR_MAX_IN_RATIO'
            );
        });

        it('User1 exit pool', async () => {
            await pool.exitPool(toWei('1'), [0, 0, 0], { from: user1 });
            const daiBalance = await pool.getBalance(DAI);
            assert.equal(100000000, daiBalance);
            const userWethBalance = await weth.balanceOf(user1);
            assert.equal(25, fromWei(userWethBalance));
        });

        /*
          Current pool balances
          WETH - 50
          MKR - 20
          DAI - 10
          XXX - 0
          Same with bind balance
        */


    });

});
