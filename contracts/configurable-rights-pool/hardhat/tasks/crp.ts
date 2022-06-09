import { constants } from 'ethers';
import { task } from 'hardhat/config';

task('crp:create-pool', 'crp create pool')
  .addOptionalParam('crp', 'crp', '0x1CcF060c3Bf119b6c70bcdF5B22E61Fec556b33B')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, getChainId, artifacts } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { crp } = taskArgs;

    const CRP = await artifacts.readArtifact('ConfigurableRightsPool');
    const crpInstance = new web3.eth.Contract(CRP.abi, crp);
    console.log(`Using CRP @ ${crpInstance.options.address}`);

    const txn = await crpInstance.methods.createPool(toWei('100'), 10, 10).send({ from: deployer });
    console.log(`Create pool crp, tx = ${txn.transactionHash}`);
  });

task('crp:verify', 'etherscan verify')
  .addOptionalParam('crp', 'crp', '0x1CcF060c3Bf119b6c70bcdF5B22E61Fec556b33B')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, getChainId, artifacts } = hre;
    const { toWei } = web3.utils;
    const { crp } = taskArgs;

    const CRP = await artifacts.readArtifact('ConfigurableRightsPool');
    const crpInstance = new web3.eth.Contract(CRP.abi, crp);
    console.log(`Using CRP @ ${crpInstance.options.address}`);

    let bFactoryAddress = '';
    const chainId = await getChainId();
    if (chainId === '4') {
      bFactoryAddress = '0xFD12d8d82fcDAf270079ACAc123890B16A05e5b7';
    }
    console.log(`Using BFactory @ ${bFactoryAddress}`);

    const tokenAddresses = ['0x8080c7e4b81ecf23aa6f877cfbfd9b0c228c6ffa', '0xc7ad46e0b8a400bb3c915120d284aafba8fc4735'];
    const swapFee = 10 ** 15;
    const startWeights = [toWei('1'), toWei('1')];
    const startBalances = [toWei('1'), toWei('1')];
    const SYMBOL = 'BSP';
    const NAME = 'Balancer Pool Token';
    const poolParams = {
      poolTokenSymbol: SYMBOL,
      poolTokenName: NAME,
      constituentTokens: tokenAddresses,
      tokenBalances: startBalances,
      tokenWeights: startWeights,
      swapFee: swapFee,
    };
    // All on
    const permissions = {
      canPauseSwapping: true,
      canChangeSwapFee: true,
      canChangeWeights: true,
      canAddRemoveTokens: true,
      canWhitelistLPs: true,
      canChangeCap: false,
    };

    await hre.run('verify:verify', {
      address: crp,
      constructorArguments: [bFactoryAddress, poolParams, permissions],
    });
  });

task('crp:whitelist', 'crp provide liquidity')
  .addOptionalParam('crp', 'crp', '0x1CcF060c3Bf119b6c70bcdF5B22E61Fec556b33B')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, getChainId, artifacts } = hre;
    const { deployer, user1 } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { crp } = taskArgs;

    const CRP = await artifacts.readArtifact('IConfigurableRightsPool');
    const crpInstance = new web3.eth.Contract(CRP.abi, crp);
    console.log(`Using CRP @ ${crpInstance.options.address}`);

    const txn1 = await crpInstance.methods.whitelistLiquidityProvider([deployer]).send({ from: deployer });
    console.log(`Provided liquidity for @ ${deployer}, tx = ${txn1.transactionHash}`);

    const txn2 = await crpInstance.methods.whitelistLiquidityProvider([user1]).send({ from: deployer });
    console.log(`Provided liquidity for @ ${user1}, tx = ${txn2.transactionHash}`);
  });

task('crp:join', 'crp join pool')
  .addOptionalParam('crp', 'crp', '0x1CcF060c3Bf119b6c70bcdF5B22E61Fec556b33B')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, getChainId, artifacts } = hre;
    const { deployer, user1 } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { crp } = taskArgs;
    const MAX = constants.MaxUint256.toString();

    const WETH = '0x1900D4e4418E98F307b51E8f2C4749a13a93F272';
    const DAI = '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38';
    const USDT = '0x84544B0815279361676Fd147dAd60a912D8CaAc0';
    const CRP = await artifacts.readArtifact('IConfigurableRightsPool');
    const crpInstance = new web3.eth.Contract(CRP.abi, crp);
    console.log(`Using CRP @ ${crpInstance.options.address}`);

    const txn = await crpInstance.methods.joinPool(toWei('15').toString(), [MAX, MAX, MAX]).send({ from: user1 });
    console.log(`Joined, tx = ${txn.transactionHash}`);

    // const txnUSDT = await crpInstance.methods
    //   .joinswapExternAmountIn(USDT, toWei('10'), toWei('0'))
    //   .send({ from: user1 });

    // const txnDAI = await crpInstance.methods
    //   .joinswapExternAmountIn(WETH, toWei('10'), toWei('0'))
    //   .send({ from: user1 });

    // // tx = await crpInstance.methods
    // //   .joinswapExternAmountOut
  });

task('crp:swap', 'crp swap in and out')
  .addOptionalParam('crp', 'crp', '0x1CcF060c3Bf119b6c70bcdF5B22E61Fec556b33B')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, getChainId, artifacts } = hre;
    const { deployer, user1 } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { crp } = taskArgs;
    const MAX = constants.MaxUint256.toString();

    const WETH = '0x1900D4e4418E98F307b51E8f2C4749a13a93F272';
    const DAI = '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38';
    const USDT = '0x84544B0815279361676Fd147dAd60a912D8CaAc0';

    const CRP = await artifacts.readArtifact('IConfigurableRightsPool');
    const crpInstance = new web3.eth.Contract(CRP.abi, crp);
    console.log(`Using CRP @ ${crpInstance.options.address}`);

    const BPool = await artifacts.readArtifact('IBPool');
    const poolAddress = await crpInstance.methods.bPool().call();
    const poolInstance = new web3.eth.Contract(BPool.abi, poolAddress);

    const txnIn = await poolInstance.methods
      .swapExactAmountIn(WETH, toWei('0.5').toString(), USDT, toWei('0').toString(), toWei('200').toString())
      .send({ from: user1 });
    console.log(`Swapped, tx = ${txnIn.transactionHash}`);

    // const txnOut = await poolInstance.methods
    //     .swapExactAmountOut(
    //       USDT,
    //       toWei('1').toString(),
    //       DAI,
    //       toWei('0.15').toString(),
    //       toWei('500').toString()
    //     )
    //     .send({ from: user1 }) // maxPrice
    // console.log(`Swapped, tx = ${txnOut.transactionHash}`);
  });

task('crp:exit', 'crp exit of pool')
  .addOptionalParam('crp', 'crp', '0x1CcF060c3Bf119b6c70bcdF5B22E61Fec556b33B')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, getChainId, artifacts } = hre;
    const { deployer, user1 } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { crp } = taskArgs;
    const MAX = constants.MaxUint256.toString();

    const WETH = '0x1900D4e4418E98F307b51E8f2C4749a13a93F272';
    const DAI = '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38';
    const USDT = '0x84544B0815279361676Fd147dAd60a912D8CaAc0';

    const CRP = await artifacts.readArtifact('IBPool');
    const crpInstance = new web3.eth.Contract(CRP.abi, crp);
    console.log(`Using CRP @ ${crpInstance.options.address}`);

    const txnIn = await crpInstance.methods.exitswapExternAmountOut(DAI, toWei('0.1'), MAX).send({ from: user1 });
    console.log(`Exited, tx = ${txnIn.transactionHash}`);
  });

task('crp:event', 'track event')
  .addOptionalParam('crp', 'crp', '0xd0b656496a534461a8a949e1dab9744340518dc7')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, getChainId, artifacts } = hre;
    const { deployer, user1 } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { crp } = taskArgs;
    const MAX = constants.MaxUint256.toString();

    const CRP = await artifacts.readArtifact('BPool');
    const crpInstance = new web3.eth.Contract(CRP.abi, crp);
    console.log(`Using CRP @ ${crpInstance.options.address}`);

    console.log(CRP.abi);
  });
