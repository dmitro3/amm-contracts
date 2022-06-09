/* eslint-env es6 */

const BFactory = artifacts.require('BFactory');
const IConfigurableRightsPool = artifacts.require('IConfigurableRightsPool');
const IBPool = artifacts.require('IBPool');
const CRPFactory = artifacts.require('CRPFactory');
const TToken = artifacts.require('TToken');
const BalancerSafeMathMock = artifacts.require('BalancerSafeMathMock');
const truffleAssert = require('truffle-assertions');
const { calcInGivenOut, calcRelativeDiff } = require('../calc_comparisons');

/*
Tests initial CRP Pool set-up including:
BPool deployment, token binding, balance checks, BPT checks.
*/
contract('crpPoolSwapOuts', async (accounts) => {
    const admin = accounts[0];
    const user1 = accounts[1];
    const nonWhitelistUser = accounts[4];

    const { toWei, fromWei } = web3.utils;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const MAX = web3.utils.toTwosComplement(-1);
    const errorDelta = 10 ** -8;
    // These are the intial settings for newCrp:
    const swapFee = toWei('0.0015');
    const protocolFee = toWei('0.00015');
    const startWeights = [toWei('12'), toWei('1.5'), toWei('1.5')];
    const startBalances = [toWei('80000'), toWei('40'), toWei('10000')];
    const SYMBOL = 'BSP';
    const NAME = 'Balancer Pool Token';

    const permissions = {
        canPauseSwapping: true,
        canChangeSwapFee: true,
        canChangeWeights: true,
        canAddRemoveTokens: true,
        canWhitelistLPs: false,
        canChangeCap: false,
        canChangeProtocolFee: true,
    };

    let crpFactory;
    let bFactory;
    let bPoolAddr;
    let bPool;
    let bPool2;
    let bPool3;
    let crpPool;
    let crpPool2;
    let crpPool3;
    let CRPPOOL;
    let CRPPOOL2;
    let CRPPOOL3;
    let CRPPOOL_ADDRESS;
    let WETH;
    let DAI;
    let XYZ;
    let weth;
    let dai;
    let xyz;
    let adminXYZBalance;
    let bPoolXYZBalance;
    let adminWethBalance;
    let bPoolWethBalance;
    let adminDaiBalance;
    let bPoolDaiBalance;
    let xyzWeight;
    let daiWeight;
    let wethWeight;
    let adminBPTBalance;
    let bMath;

    before(async () => {
        bFactory = await BFactory.deployed();
        crpFactory = await CRPFactory.deployed();
        bMath = await BalancerSafeMathMock.deployed();
        xyz = await TToken.new('XYZ', 'XYZ', 18);
        weth = await TToken.new('Wrapped Ether', 'WETH', 18);
        dai = await TToken.new('Dai Stablecoin', 'DAI', 18);

        WETH = weth.address;
        DAI = dai.address;
        XYZ = xyz.address;

        // admin/user balances
        await weth.mint(admin, toWei('300'));
        await dai.mint(admin, toWei('45000'));
        await xyz.mint(admin, toWei('300000'));

        await weth.mint(user1, toWei('25'));
        await dai.mint(user1, toWei('10000'));
        await xyz.mint(user1, toWei('20'));

        const poolParams = {
            poolTokenSymbol: SYMBOL,
            poolTokenName: NAME,
            constituentTokens: [XYZ, WETH, DAI],
            tokenBalances: startBalances,
            tokenWeights: startWeights,
            swapFee: swapFee,
            protocolFee: protocolFee,
        };

        CRPPOOL = await crpFactory.newCrp.call(bFactory.address, poolParams, permissions);

        await crpFactory.newCrp(bFactory.address, poolParams, permissions);

        crpPool = await IConfigurableRightsPool.at(CRPPOOL);

        CRPPOOL_ADDRESS = crpPool.address;

        await weth.approve(CRPPOOL_ADDRESS, MAX);
        await dai.approve(CRPPOOL_ADDRESS, MAX);
        await xyz.approve(CRPPOOL_ADDRESS, MAX);

        CRPPOOL2 = await crpFactory.newCrp.call(bFactory.address, poolParams, permissions);

        await crpFactory.newCrp(bFactory.address, poolParams, permissions);

        crpPool2 = await IConfigurableRightsPool.at(CRPPOOL2);

        await weth.approve(crpPool2.address, MAX);
        await dai.approve(crpPool2.address, MAX);
        await xyz.approve(crpPool2.address, MAX);

        CRPPOOL3 = await crpFactory.newCrp.call(bFactory.address, poolParams, permissions);

        await crpFactory.newCrp(bFactory.address, poolParams, permissions);

        crpPool3 = await IConfigurableRightsPool.at(CRPPOOL3);

        await weth.approve(crpPool3.address, MAX);
        await dai.approve(crpPool3.address, MAX);
        await xyz.approve(crpPool3.address, MAX);
    });

    it('crpPools should have BPools after creation', async () => {
        await crpPool.createPool(toWei('100'));
        bPoolAddr = await crpPool.bPool();
        assert.notEqual(bPoolAddr, ZERO_ADDRESS);
        bPool = await IBPool.at(bPoolAddr);

        await crpPool2.createPool(toWei('100'));
        bPoolAddr = await crpPool2.bPool();
        assert.notEqual(bPoolAddr, ZERO_ADDRESS);
        bPool2 = await IBPool.at(bPoolAddr);

        await crpPool3.createPool(toWei('100'));
        bPoolAddr = await crpPool3.bPool();
        assert.notEqual(bPoolAddr, ZERO_ADDRESS);
        bPool3 = await IBPool.at(bPoolAddr);
    });

    it('BPools should have initial token balances', async () => {
        bPoolAddr = await crpPool.bPool();

        adminXYZBalance = await xyz.balanceOf.call(admin);
        bPoolXYZBalance = await xyz.balanceOf.call(bPoolAddr);
        adminWethBalance = await weth.balanceOf.call(admin);
        bPoolWethBalance = await weth.balanceOf.call(bPoolAddr);
        adminDaiBalance = await dai.balanceOf.call(admin);
        bPoolDaiBalance = await dai.balanceOf.call(bPoolAddr);

        assert.equal(adminXYZBalance, toWei('60000')); // 20000x3
        assert.equal(bPoolXYZBalance, toWei('80000'));
        assert.equal(adminWethBalance, toWei('180')); // 60x3
        assert.equal(bPoolWethBalance, toWei('40'));
        assert.equal(adminDaiBalance, toWei('15000')); // 5000x3
        assert.equal(bPoolDaiBalance, toWei('10000'));

        bPoolAddr = await crpPool2.bPool();

        bPoolXYZBalance = await xyz.balanceOf.call(bPoolAddr);
        bPoolWethBalance = await weth.balanceOf.call(bPoolAddr);
        bPoolDaiBalance = await dai.balanceOf.call(bPoolAddr);

        assert.equal(bPoolXYZBalance, toWei('80000'));
        assert.equal(bPoolWethBalance, toWei('40'));
        assert.equal(bPoolDaiBalance, toWei('10000'));

        bPoolAddr = await crpPool3.bPool();

        bPoolXYZBalance = await xyz.balanceOf.call(bPoolAddr);
        bPoolWethBalance = await weth.balanceOf.call(bPoolAddr);
        bPoolDaiBalance = await dai.balanceOf.call(bPoolAddr);

        assert.equal(bPoolXYZBalance, toWei('80000'));
        assert.equal(bPoolWethBalance, toWei('40'));
        assert.equal(bPoolDaiBalance, toWei('10000'));
    });

    it('BPool should have initial token weights', async () => {
        xyzWeight = await bPool.getDenormalizedWeight.call(xyz.address);
        wethWeight = await bPool.getDenormalizedWeight.call(weth.address);
        daiWeight = await bPool.getDenormalizedWeight.call(dai.address);

        assert.equal(xyzWeight, toWei('12'));
        assert.equal(wethWeight, toWei('1.5'));
        assert.equal(daiWeight, toWei('1.5'));

        xyzWeight = await bPool2.getDenormalizedWeight.call(xyz.address);
        wethWeight = await bPool2.getDenormalizedWeight.call(weth.address);
        daiWeight = await bPool2.getDenormalizedWeight.call(dai.address);

        assert.equal(xyzWeight, toWei('12'));
        assert.equal(wethWeight, toWei('1.5'));
        assert.equal(daiWeight, toWei('1.5'));

        xyzWeight = await bPool3.getDenormalizedWeight.call(xyz.address);
        wethWeight = await bPool3.getDenormalizedWeight.call(weth.address);
        daiWeight = await bPool3.getDenormalizedWeight.call(dai.address);

        assert.equal(xyzWeight, toWei('12'));
        assert.equal(wethWeight, toWei('1.5'));
        assert.equal(daiWeight, toWei('1.5'));
    });

    it('Admin should have initial BPT', async () => {
        adminBPTBalance = await crpPool.balanceOf.call(admin);
        assert.equal(adminBPTBalance, toWei('100'));

        adminBPTBalance = await crpPool2.balanceOf.call(admin);
        assert.equal(adminBPTBalance, toWei('100'));

        adminBPTBalance = await crpPool3.balanceOf.call(admin);
        assert.equal(adminBPTBalance, toWei('100'));
    });

    it('Only whitelist user can swap', async () => {
        let tokenIn = WETH;
        let tokenOut = DAI;
        // Actually returns an array of tokenAmountOut, spotPriceAfter
        await truffleAssert.reverts(
            bPool.swapExactAmountOut.call(
                tokenIn,
                MAX, // tokenAmountIn
                tokenOut,
                toWei('500'), // minAmountOut
                MAX,
                { from: nonWhitelistUser }
            ),
            "FCXAccessControl: sender doesn't have same roles as pool"
        );
    });

    it('Should perform swaps', async () => {
        let tokenIn = WETH;
        let tokenOut = DAI;
        let tokenAmountIn;
        const totalFee = swapFee; // 0.0015

        // 1st Swap - WETH for DAI
        await weth.approve(bPool.address, MAX, { from: user1 });

        let tokenInBalance = await weth.balanceOf.call(bPool.address); // 40
        let tokenInWeight = await bPool.getDenormalizedWeight(WETH); // 1.5
        let tokenOutBalance = await dai.balanceOf.call(bPool.address); // 10000
        let tokenOutWeight = await bPool.getDenormalizedWeight(DAI); // 1.5

        let expectedTotalIn = calcInGivenOut(
            fromWei(tokenInBalance),
            fromWei(tokenInWeight),
            fromWei(tokenOutBalance),
            fromWei(tokenOutWeight),
            '500',
            fromWei(totalFee)
        );

        // Actually returns an array of tokenAmountIn, spotPriceAfter
        tokenAmountIn = await bPool.swapExactAmountOut.call(
            tokenIn,
            MAX, // maxAmountIn
            tokenOut,
            toWei('500'), // tokenAmountOut
            MAX, // maxPrice
            { from: user1 }
        );
        let relDif = calcRelativeDiff(expectedTotalIn, fromWei(tokenAmountIn[0]));
        assert.isAtMost(relDif.toNumber(), errorDelta);

        // 2nd Swap - DAI for WETH
        await dai.approve(bPool2.address, MAX, { from: user1 });

        tokenIn = DAI;
        tokenOut = WETH;

        tokenInBalance = await dai.balanceOf.call(bPool2.address);
        tokenInWeight = await bPool2.getDenormalizedWeight(DAI);
        tokenOutBalance = await weth.balanceOf.call(bPool2.address);
        tokenOutWeight = await bPool2.getDenormalizedWeight(WETH);

        expectedTotalIn = calcInGivenOut(
            fromWei(tokenInBalance),
            fromWei(tokenInWeight),
            fromWei(tokenOutBalance),
            fromWei(tokenOutWeight),
            '5',
            fromWei(totalFee)
        );

        tokenAmountIn = await bPool2.swapExactAmountOut.call(
            tokenIn,
            MAX, // maxAmountIn
            tokenOut,
            toWei('5'), // tokenAmountOut
            MAX,
            { from: user1 }
        );
        relDif = calcRelativeDiff(expectedTotalIn, fromWei(tokenAmountIn[0]));
        assert.isAtMost(relDif.toNumber(), errorDelta);

        // 3rd Swap XYZ for WETH
        await xyz.approve(bPool3.address, MAX, { from: user1 });

        tokenIn = XYZ;
        tokenOut = WETH;

        tokenInBalance = await xyz.balanceOf.call(bPool3.address);
        tokenInWeight = await bPool3.getDenormalizedWeight(XYZ);
        tokenOutBalance = await weth.balanceOf.call(bPool3.address);
        tokenOutWeight = await bPool3.getDenormalizedWeight(WETH);

        expectedTotalIn = calcInGivenOut(
            fromWei(tokenInBalance),
            fromWei(tokenInWeight),
            fromWei(tokenOutBalance),
            fromWei(tokenOutWeight),
            '0.025',
            fromWei(totalFee)
        );

        tokenAmountIn = await bPool3.swapExactAmountOut.call(
            tokenIn,
            MAX, // maxAmountIn
            tokenOut,
            toWei('0.025'), // tokenAmountOut
            MAX,
            { from: user1 }
        );

        relDif = calcRelativeDiff(expectedTotalIn, fromWei(tokenAmountIn[0]));
        assert.isAtMost(relDif.toNumber(), errorDelta);
    });

    it('Admin claim an amount from protocolFee', async () => {
        // 1st Swap - WETH for DAI
        await weth.approve(bPool.address, MAX, { from: user1 });

        let tokenInBalance = await weth.balanceOf.call(bPool.address); // 40
        let tokenInWeight = await bPool.getDenormalizedWeight(WETH); // 1.5
        let tokenOutBalance = await dai.balanceOf.call(bPool.address); // 10000
        let tokenOutWeight = await bPool.getDenormalizedWeight(DAI); // 1.5

        let expectedTotalIn = calcInGivenOut(
            fromWei(tokenInBalance),
            fromWei(tokenInWeight),
            fromWei(tokenOutBalance),
            fromWei(tokenOutWeight),
            '500',
            '0.0015'
        ); //2.1115979517499868044

        tokenAmountIn = await bPool.swapExactAmountOut(
            WETH,
            MAX, // maxAmountIn
            DAI,
            toWei('500'), // tokenAmountOut
            MAX, // maxPrice
            { from: user1 }
        );

        const newAdminWethBalance = await weth.balanceOf(admin);
        const wethDiff = await bMath.bsub(newAdminWethBalance, adminWethBalance);
        const realWethIn = await bMath.bdiv(wethDiff, protocolFee);
        relDif = calcRelativeDiff(expectedTotalIn, fromWei(realWethIn));
        assert.isAtMost(relDif.toNumber(), errorDelta);

        // 2nd Swap - DAI for WETH
        await dai.approve(bPool2.address, MAX, { from: user1 });

        tokenInBalance = await dai.balanceOf.call(bPool2.address);
        tokenInWeight = await bPool2.getDenormalizedWeight(DAI);
        tokenOutBalance = await weth.balanceOf.call(bPool2.address);
        tokenOutWeight = await bPool2.getDenormalizedWeight(WETH);

        expectedTotalIn = calcInGivenOut(
            fromWei(tokenInBalance),
            fromWei(tokenInWeight),
            fromWei(tokenOutBalance),
            fromWei(tokenOutWeight),
            '5',
            '0.0015'
        );

        tokenAmountIn = await bPool2.swapExactAmountOut(
            DAI,
            MAX, // maxAmountIn
            WETH,
            toWei('5'), // tokenAmountOut
            MAX,
            { from: user1 }
        );

        const newAdminDaiBalance = await dai.balanceOf(admin);
        const daiDiff = await bMath.bsub(newAdminDaiBalance, adminDaiBalance);
        const realDaiIn = await bMath.bdiv(daiDiff, protocolFee);
        relDif = calcRelativeDiff(expectedTotalIn, fromWei(realDaiIn));
        assert.isAtMost(relDif.toNumber(), errorDelta);

        // 3rd Swap XYZ for WETH
        await xyz.approve(bPool3.address, MAX, { from: user1 });

        tokenInBalance = await xyz.balanceOf.call(bPool3.address);
        tokenInWeight = await bPool3.getDenormalizedWeight(XYZ);
        tokenOutBalance = await weth.balanceOf.call(bPool3.address);
        tokenOutWeight = await bPool3.getDenormalizedWeight(WETH);

        expectedTotalIn = calcInGivenOut(
            fromWei(tokenInBalance),
            fromWei(tokenInWeight),
            fromWei(tokenOutBalance),
            fromWei(tokenOutWeight),
            '0.025',
            '0.0015'
        );

        tokenAmountIn = await bPool3.swapExactAmountOut(
            XYZ,
            MAX, // maxAmountIn
            WETH,
            toWei('0.025'), // tokenAmountOut
            MAX,
            { from: user1 }
        );

        const newAdminXYZBalance = await xyz.balanceOf(admin);
        const xyzDiff = await bMath.bsub(newAdminXYZBalance, adminXYZBalance);
        const realXYZIn = await bMath.bdiv(xyzDiff, protocolFee);
        relDif = calcRelativeDiff(expectedTotalIn, fromWei(realXYZIn));
        assert.isAtMost(relDif.toNumber(), errorDelta);
    });
});
