import { task } from 'hardhat/config';
import { ADDRESSES_FOR_NETWORK } from '@fcx/common';

task('share-pool:new', 'deploy pool')
  .addOptionalParam('proxyAddress', 'proxy address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei, toBN } = web3.utils;
    const chainId = await getChainId();
    const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
    const MAX = web3.utils.toTwosComplement(-1);

    const BActions = await deployments.get('BActions');
    const DSProxy = await artifacts.readArtifact('DSProxy');
    const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
    console.log(`Using DSProxy @ ${userProxy.options.address}`);
    const bFactoryAddress = ADDRESSES_FOR_NETWORK[chainId].factory || '';
    console.log(`Using BFactory @ ${bFactoryAddress}`);

    const createTokens =
      [
        ADDRESSES_FOR_NETWORK[chainId].vUSD,
        ADDRESSES_FOR_NETWORK[chainId].vGBP,
        ADDRESSES_FOR_NETWORK[chainId].vEUR,
        ADDRESSES_FOR_NETWORK[chainId].usdt,
      ] || [];
    const createBalances = [toWei('0.1'), toWei('0.1'), toWei('0.1'), toWei('0.1')];
    const createWeights = [toWei('1'), toWei('1'), toWei('1'), toWei('1')];
    const swapFee = toWei('0.03');
    const protocolFee = toWei('0.001');
    const finalize = true;

    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, toWei('0.1')).send({ from: deployer });
      const allowance = await token.methods.allowance(deployer, userProxy.options.address).call();
      if (allowance === '0') {
        await token.methods.approve(userProxy.options.address, MAX).send({ from: deployer });
      }
    }

    const createInterface = BActions.abi.find((iface) => iface.name === 'create');
    const params: any = [bFactoryAddress, createTokens, createBalances, createWeights, swapFee, protocolFee, finalize];

    const functionCall = web3.eth.abi.encodeFunctionCall(createInterface, params);
    const poolAddress = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).call({
      from: deployer,
    });
    const POOL = `0x${poolAddress.slice(-40)}`;

    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log({ POOL });
    console.log(`txn is ${txn.transactionHash}`);
  });

task('share-pool:join', 'deploy pool')
  .addOptionalParam('proxyAddress', 'proxy address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();

    const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
    const poolAddress = taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].sharePool || '';

    const BActions = await deployments.get('BActions');
    const DSProxy = await artifacts.readArtifact('DSProxy');
    const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
    console.log(`Using DSProxy @ ${userProxy.options.address}`);

    const createTokens =
      [
        ADDRESSES_FOR_NETWORK[chainId].vUSD,
        ADDRESSES_FOR_NETWORK[chainId].vGBP,
        ADDRESSES_FOR_NETWORK[chainId].vEUR,
        ADDRESSES_FOR_NETWORK[chainId].usdt,
      ] || [];
    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, toWei('1')).send({ from: deployer });
    }

    const joinPoolInterface = BActions.abi.find((iface) => iface.name === 'joinPool');
    const params = [poolAddress, toWei('0.01'), [toWei('1'), toWei('1'), toWei('1'), toWei('1')]];
    const functionCall = web3.eth.abi.encodeFunctionCall(joinPoolInterface, params);

    web3.eth.handleRevert = true;
    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log(`JOINED, tx = ${txn.transactionHash}`);
  });

task('share-pool:exit', 'exit pool')
  .addOptionalParam('poolAddress', 'pool address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();

    const poolAddress = taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].sharePool || '';

    const BPool = await artifacts.readArtifact('contracts/test/BPool.sol:BPool');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, poolAddress);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);

    const txn = await bPoolInstance.methods
      .exitPool(toWei('0.01'), [toWei('0.000001'), toWei('0.000001'), toWei('0.000001'), toWei('0.000001')])
      .send({ from: deployer });
    console.log(`EXITED, tx = ${txn.transactionHash}`);
  });

task('share-pool:swap', 'swap pool')
  .addOptionalParam('poolAddress', 'pool address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();

    const poolAddress = taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].sharePool || '';

    const BPool = await artifacts.readArtifact('contracts/test/BPool.sol:BPool');
    const bPoolInstance = new web3.eth.Contract(BPool.abi, poolAddress);
    console.log(`Using BPool @ ${bPoolInstance.options.address}`);
    const usdt = ADDRESSES_FOR_NETWORK[chainId].usdt;
    const dai = ADDRESSES_FOR_NETWORK[chainId].dai;

    const createTokens = [usdt, dai] || [];
    const MAX = web3.utils.toTwosComplement(-1);
    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, toWei('1')).send({ from: deployer });
      const allowance = await token.methods.allowance(deployer, poolAddress).call();
      if (allowance === '0') {
        await token.methods.approve(poolAddress, MAX).send({ from: deployer });
      }
    }

    // web3.eth.handleRevert = true;
    await bPoolInstance.methods
      .swapExactAmountIn(usdt, toWei('0.001'), dai, toWei('0.000001'), toWei('10'))
      .call({ from: deployer });

    const txn = await bPoolInstance.methods
      .swapExactAmountIn(usdt, toWei('0.001'), dai, toWei('0.000001'), toWei('10'))
      .send({ from: deployer });
    console.log(`SWAP, tx = ${txn.transactionHash}`);
  });

task('share-pool:seed', 'seed pool')
  .addOptionalParam('proxyAddress', 'proxy address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();
    const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
    const MAX = web3.utils.toTwosComplement(-1);

    const BActions = await deployments.get('BActions');
    const DSProxy = await artifacts.readArtifact('DSProxy');
    const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
    console.log(`Using DSProxy @ ${userProxy.options.address}`);
    const bFactoryAddress = ADDRESSES_FOR_NETWORK[chainId].factory || '';
    console.log(`Using BFactory @ ${bFactoryAddress}`);

    const createTokens = [
      ADDRESSES_FOR_NETWORK[chainId].vUSD,
      ADDRESSES_FOR_NETWORK[chainId].usdt,
      ADDRESSES_FOR_NETWORK[chainId].vTHB,
      ADDRESSES_FOR_NETWORK[chainId].vEUR,
      ADDRESSES_FOR_NETWORK[chainId].vCHF,
      ADDRESSES_FOR_NETWORK[chainId].vSGD,
    ];
    const createBalances = [
      toWei('10000'),
      toWei('10000'),
      toWei('324400'),
      toWei('7229'),
      toWei('9200'),
      toWei('13700'),
    ];
    const createWeights = [
      toWei('1'),
      toWei('1'),
      toWei('1'),
      toWei('1'),
      toWei('1'),
      toWei('1'),
    ];
    const swapFee = toWei('0.03');
    const protocolFee = toWei('0.001');
    const finalize = true;

    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let i = 0; i < createTokens.length; i++) {
      const tokenAddress = createTokens[i];
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, createBalances[i]).send({ from: deployer });
      console.log(`MINTED ${tokenAddress}`);
      const allowance = await token.methods.allowance(deployer, userProxy.options.address).call();
      if (allowance === '0') {
        await token.methods.approve(userProxy.options.address, MAX).send({ from: deployer });
      }
    }

    const createInterface = BActions.abi.find((iface) => iface.name === 'create');
    const params: any = [bFactoryAddress, createTokens, createBalances, createWeights, swapFee, protocolFee, finalize];

    const functionCall = web3.eth.abi.encodeFunctionCall(createInterface, params);
    const poolAddress = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).call({
      from: deployer,
    });
    const POOL = `0x${poolAddress.slice(-40)}`;

    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log({ POOL });
    console.log(`txn is ${txn.transactionHash}`);
  });
