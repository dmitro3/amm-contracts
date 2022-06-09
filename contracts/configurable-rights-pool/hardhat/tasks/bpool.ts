import { constants } from 'ethers';
import { task } from 'hardhat/config';

task('bpool:info', 'bfactory info')
  .addOptionalParam('address', 'address', '0xd4544cd188dd3daac508df2f2a2ac18d7bb44b89')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts } = hre;
    const { address } = taskArgs;
    const { deployer } = await getNamedAccounts();

    const BPool = await artifacts.readArtifact('IBPool');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, address);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);

    const [
      isPublicSwap,
      isFinalized,
      numTokens,
      currentTokens,
      finalTokens,
      totalDenormalizedWeight,
      swapFee,
      controller,
      totalSupply,
    ] = await Promise.all([
      bPoolInstance.methods.isPublicSwap().call(),
      bPoolInstance.methods.isFinalized().call(),
      bPoolInstance.methods.getNumTokens().call(),
      bPoolInstance.methods.getCurrentTokens().call(),
      '0', // bPoolInstance.methods.getFinalTokens().call(),
      bPoolInstance.methods.getTotalDenormalizedWeight().call(),
      bPoolInstance.methods.getSwapFee().call(),
      bPoolInstance.methods.getController().call(),
      bPoolInstance.methods.totalSupply().call(),
    ]);
    console.log({
      isPublicSwap,
      isFinalized,
      numTokens,
      currentTokens,
      finalTokens,
      totalDenormalizedWeight,
      swapFee,
      controller,
      totalSupply,
    });

    for (let tokenAddress of currentTokens) {
      console.log(`Using Token @ ${tokenAddress}`);
      const [isBound, denormalizedWeight, normalizedWeight, balance] = await Promise.all([
        bPoolInstance.methods.isBound(tokenAddress).call(),
        bPoolInstance.methods.getDenormalizedWeight(tokenAddress).call(),
        bPoolInstance.methods.getNormalizedWeight(tokenAddress).call(),
        bPoolInstance.methods.getBalance(tokenAddress).call(),
      ]);
      console.log({ isBound, denormalizedWeight, normalizedWeight, balance });
    }
  });

task('bpool:set-fee', 'bpool set swap fee and protocol fee')
  .addOptionalParam('pool', 'pool', '0xeee249083674a1a8227a0b79bfe52c7eb940aed1')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { pool } = taskArgs;

    const BPool = await artifacts.readArtifact('IBPool');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, pool);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);

    let swapTx = await bPoolInstance.methods.setSwapFee(toWei('0.003')).send({ from: deployer });
    console.log(`Swap fee setted, tx: ${swapTx.transactionHash}`);

    let protocolTx = await bPoolInstance.methods.setProtocolFee(toWei('0.0001')).send({ from: deployer });
    console.log(`Protocol fee setted, tx: ${protocolTx.transactionHash}`);
  });

task('bpool:finalize', 'bpool finalize')
  .addOptionalParam('pool', 'pool', '0xeee249083674a1a8227a0b79bfe52c7eb940aed1')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { pool } = taskArgs;

    const BPool = await artifacts.readArtifact('BPool');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, pool);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);

    let txn = await bPoolInstance.methods
      .bind(
        '0x1900D4e4418E98F307b51E8f2C4749a13a93F272', // WETH
        toWei('50').toString(),
        toWei('5').toString()
      )
      .send({ from: deployer });
    console.log(`Created, tx: ${txn.transactionHash}`);

    txn = await bPoolInstance.methods
      .bind(
        '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38', // DAI
        toWei('20').toString(),
        toWei('5').toString()
      )
      .send({ from: deployer });
    console.log(`Created, tx: ${txn.transactionHash}`);

    txn = await bPoolInstance.methods
      .bind(
        '0x84544B0815279361676Fd147dAd60a912D8CaAc0', // DAI
        toWei('20').toString(),
        toWei('5').toString()
      )
      .send({ from: deployer });
    console.log(`Created, tx: ${txn.transactionHash}`);

    txn = await bPoolInstance.methods.finalize().send({ from: deployer });
    console.log(`Finalized, tx: ${txn.transactionHash}`);
  });

task('bpool:join', 'bpool join')
  .addOptionalParam('pool', 'pool', '0xeee249083674a1a8227a0b79bfe52c7eb940aed1')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts } = hre;
    const { deployer } = await getNamedAccounts();
    const { user1 } = await getNamedAccounts();
    const { user2 } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { pool } = taskArgs;

    const BPool = await artifacts.readArtifact('BPool');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, pool);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);

    const MAX = constants.MaxUint256.toString();
    let txn = await bPoolInstance.methods.joinPool(toWei('50').toString(), [MAX, MAX, MAX]).send({ from: user2 });
    console.log(`Joined, tx: ${txn.transactionHash}`);
  });

task('bpool:swap', 'bpool swap in and out')
  .addOptionalParam('pool', 'pool', '0xeee249083674a1a8227a0b79bfe52c7eb940aed1')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts } = hre;
    const { deployer } = await getNamedAccounts();
    const { user1 } = await getNamedAccounts();
    const { user2 } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { pool } = taskArgs;

    const WETH = '0x1900D4e4418E98F307b51E8f2C4749a13a93F272';
    const DAI = '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38';
    const USDT = '0x84544B0815279361676Fd147dAd60a912D8CaAc0';

    const BPool = await artifacts.readArtifact('BPool');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, pool);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);

    const MAX = constants.MaxUint256.toString();
    let inAmount = 0;
    let outAmount = 0;
    while (inAmount < 5) {
      inAmount += 0.05;
      outAmount += 0.05;

      let txnIn = await bPoolInstance.methods
        .swapExactAmountIn(
          WETH,
          toWei(inAmount.toString()).toString(),
          DAI,
          toWei('0').toString(),
          toWei('200').toString()
        )
        .send({ from: user2 });
      console.log(`Swapped, tx: ${txnIn.transactionHash}`);

      let txnOut = await bPoolInstance.methods
        .swapExactAmountOut(
          DAI,
          toWei('3').toString(),
          WETH,
          toWei(outAmount.toString()).toString(),
          toWei('500').toString()
        )
        .send({ from: user2 });
      console.log(`Swapped, tx: ${txnOut.transactionHash}`);
    }

    let txnIn = await bPoolInstance.methods
      .swapExactAmountIn(WETH, toWei('0.35').toString(), DAI, toWei('0').toString(), toWei('200').toString())
      .send({ from: user1 });
    console.log(`Swapped, tx: ${txnIn.transactionHash}`);

    let txnOut = await bPoolInstance.methods
      .swapExactAmountOut(DAI, toWei('3').toString(), WETH, toWei('2.56').toString(), toWei('500').toString())
      .send({ from: user1 });
    console.log(`Swapped, tx: ${txnOut.transactionHash}`);
  });

task('bpool:exit', 'exit pool join')
  .addOptionalParam('pool', 'pool', '0xeee249083674a1a8227a0b79bfe52c7eb940aed1')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts } = hre;
    const { deployer } = await getNamedAccounts();
    const { user1 } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const { pool } = taskArgs;

    const BPool = await artifacts.readArtifact('BPool');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, pool);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);

    let txn = await bPoolInstance.methods
      .exitPool(toWei('5').toString(), [toWei('0').toString(), toWei('0').toString(), toWei('0').toString()])
      .send({ from: user1 });
    console.log(`Exited, tx: ${txn.transactionHash}`);
  });

task('bpool:verify', 'verify contract')
  .addOptionalParam('address', 'address')
  .setAction(async (taskArgs, hre) => {
    const { deployments } = hre;
    const address = taskArgs.address || '0xbb1fcffac4358059bd5698811daa55d1d3e69186';
    const extension = await deployments.get('BPoolExtension');

    console.log({ extension: extension.address, address });
    await hre.run('verify:verify', {
      address,
      constructorArguments: [extension.address],
    });
  });

task('bpool:gulp', 'exit pool join')
  .addOptionalParam('pool', 'pool')
  .addOptionalParam('token', 'token')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, web3, artifacts } = hre;
    const { deployer } = await getNamedAccounts();

    const pool = taskArgs.pool || '0xb43c370e6d53b85e1bafc468f8afb4eb83e0c8aa';
    const token = taskArgs.token || '0x6deeeebcf2b03a1078d1fc624bdc57a667bf31d0';

    const BPool = await artifacts.readArtifact('BPoolExtension');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, pool);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);

    let txn = await bPoolInstance.methods.gulp(token).send({ from: deployer });
    console.log(`Gulp, tx: ${txn.transactionHash}`);
  });
