import { task } from 'hardhat/config';
import { ADDRESSES_FOR_NETWORK } from '@fcx/common';

task('smart-pool:new', 'new smart pool')
  .addOptionalParam('proxyAddress', 'proxyAddress')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();
    const MAX = web3.utils.toTwosComplement(-1);
    const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';

    const BActions = await deployments.get('BActions');
    const DSProxy = await artifacts.readArtifact('DSProxy');
    const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
    const bFactoryAddress = ADDRESSES_FOR_NETWORK[chainId].factory || '';
    const crpFactoryAddress = ADDRESSES_FOR_NETWORK[chainId].crpFactory || '';
    console.log(`Using DSProxy @ ${userProxy.options.address}`);
    console.log(`Using BFactory @ ${bFactoryAddress}`);
    console.log(`Using CRPFactory @ ${crpFactoryAddress}`);

    const createTokens = [ADDRESSES_FOR_NETWORK[chainId].vEUR, ADDRESSES_FOR_NETWORK[chainId].vUSD] || [];
    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, toWei('100')).send({ from: deployer });
      const allowance = await token.methods.allowance(deployer, userProxy.options.address).call();
      if (allowance === '0') {
        await token.methods.approve(userProxy.options.address, MAX).send({ from: deployer });
      }
    }

    // pool params
    const poolParams = {
      poolTokenSymbol: 'FPT',
      poolTokenName: 'FCX Smart Pool',
      constituentTokens: createTokens,
      tokenBalances: [toWei('100'), toWei('100')],
      tokenWeights: [toWei('1'), toWei('1')],
      swapFee: toWei('0.0015'),
      protocolFee: toWei('0'),
    };
    const crpParams = {
      initialSupply: toWei('100'),
      minimumWeightChangeBlockPeriod: 10,
      addTokenTimeLockInBlocks: 10,
    };
    const rights = {
      canPauseSwapping: true,
      canChangeSwapFee: true,
      canChangeProtocolFee: true,
      canChangeWeights: true,
      canAddRemoveTokens: true,
      canWhitelistLPs: false,
      canChangeCap: false,
    };

    const createSmartPoolInterface = BActions.abi.find((iface) => iface.name === 'createSmartPool');
    const params: any = [crpFactoryAddress, bFactoryAddress, poolParams, crpParams, rights];

    const functionCall = web3.eth.abi.encodeFunctionCall(createSmartPoolInterface, params);

    const poolAddress = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).call({
      from: deployer,
    });
    const POOL = `0x${poolAddress.slice(-40)}`;

    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log({ POOL });
    console.log(txn.transactionHash);
  });

// task('smart-pool:set-swap-fee', 'set swap fee')
//   .addOptionalParam('proxyAddress', 'proxy address')
//   .addOptionalParam('poolAddress', 'pool address')
//   .setAction(async (taskArgs, hre) => {
//     const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
//     const { deployer } = await getNamedAccounts();
//     const { toWei } = web3.utils;
//     const chainId = await getChainId();

//     const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
//     const poolAddress = taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].crp || '';

//     const BActions = await deployments.get('BActions');
//     const DSProxy = await artifacts.readArtifact('DSProxy');
//     const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
//     console.log(`Using DSProxy @ ${userProxy.options.address}`);

//     const setSwapFeeInterface = BActions.abi.find((iface) => iface.name === 'setSwapFee');
//     const params = [poolAddress, toWei('0.001')];
//     const functionCall = web3.eth.abi.encodeFunctionCall(setSwapFeeInterface, params);

//     const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
//       from: deployer,
//     });
//     console.log(`SET, tx = ${txn.transactionHash}`);
//   });

task('smart-pool:join', 'join pool')
  .addOptionalParam('proxyAddress', 'proxy address')
  .addOptionalParam('poolAddress', 'pool address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();

    const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
    const poolAddress = taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].smartPool || '';

    const BActions = await deployments.get('BActions');
    const DSProxy = await artifacts.readArtifact('DSProxy');
    const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
    console.log(`Using DSProxy @ ${userProxy.options.address}`);

    const createTokens = [ADDRESSES_FOR_NETWORK[chainId].usdt, ADDRESSES_FOR_NETWORK[chainId].dai] || [];
    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, toWei('1')).send({ from: deployer });
    }

    const joinPoolInterface = BActions.abi.find((iface) => iface.name === 'joinSmartPool');
    const params = [poolAddress, toWei('0.01'), [toWei('1'), toWei('1')]];
    const functionCall = web3.eth.abi.encodeFunctionCall(joinPoolInterface, params);

    web3.eth.handleRevert = true;
    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log(`JOINED, tx = ${txn.transactionHash}`);
  });

task('smart-pool:commit-add-token', 'commit add token')
  .addOptionalParam('proxyAddress', 'proxy address')
  .addOptionalParam('poolAddress', 'pool address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();
    const MAX = web3.utils.toTwosComplement(-1);

    const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
    const poolAddress = taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].smartPool || '';

    const BActions = await deployments.get('BActions');
    const DSProxy = await artifacts.readArtifact('DSProxy');
    const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
    console.log(`Using DSProxy @ ${userProxy.options.address}`);

    const createTokens = [ADDRESSES_FOR_NETWORK[chainId].vTHB] || [];
    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, toWei('100')).send({ from: deployer });
      const allowance = await token.methods.allowance(deployer, userProxy.options.address).call();
      if (allowance === '0') {
        await token.methods.approve(userProxy.options.address, MAX).send({ from: deployer });
      }
    }

    console.log({ poolAddress });
    const joinPoolInterface = BActions.abi.find((iface) => iface.name === 'commitAddToken');
    const params = [poolAddress, ADDRESSES_FOR_NETWORK[chainId].vTHB, toWei('100'), toWei('1')];
    const functionCall = web3.eth.abi.encodeFunctionCall(joinPoolInterface, params);

    web3.eth.handleRevert = true;
    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log(`COMMITTED, tx = ${txn.transactionHash}`);
  });

task('smart-pool:apply-add-token', 'apply add token')
  .addOptionalParam('proxyAddress', 'proxy address')
  .addOptionalParam('poolAddress', 'pool address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();
    const MAX = web3.utils.toTwosComplement(-1);

    const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
    const poolAddress = taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].smartPool || '';

    const BActions = await deployments.get('BActions');
    const DSProxy = await artifacts.readArtifact('DSProxy');
    const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
    console.log(`Using DSProxy @ ${userProxy.options.address}`);

    const createTokens = [ADDRESSES_FOR_NETWORK[chainId].vTHB] || [];
    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, toWei('100')).send({ from: deployer });
      const allowance = await token.methods.allowance(deployer, userProxy.options.address).call();
      if (allowance === '0') {
        await token.methods.approve(userProxy.options.address, MAX).send({ from: deployer });
      }
    }

    const joinPoolInterface = BActions.abi.find((iface) => iface.name === 'applyAddToken');
    const params = [poolAddress, ADDRESSES_FOR_NETWORK[chainId].vTHB, toWei('100')];
    const functionCall = web3.eth.abi.encodeFunctionCall(joinPoolInterface, params);

    web3.eth.handleRevert = true;
    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log(`APPLIED, tx = ${txn.transactionHash}`);
  });

task('smart-pool:remove-token', 'remove token')
  .addOptionalParam('proxyAddress', 'proxy address')
  .addOptionalParam('poolAddress', 'pool address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { toWei } = web3.utils;
    const chainId = await getChainId();
    const MAX = web3.utils.toTwosComplement(-1);

    const proxyAddress = taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
    const poolAddress = taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].smartPool || '';

    const BActions = await deployments.get('BActions');
    const DSProxy = await artifacts.readArtifact('DSProxy');
    const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
    console.log(`Using DSProxy @ ${userProxy.options.address}`);

    const createTokens = [poolAddress] || [];
    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      const allowance = await token.methods.allowance(deployer, userProxy.options.address).call();
      if (allowance === '0') {
        await token.methods.approve(userProxy.options.address, MAX).send({ from: deployer });
      }
    }

    const joinPoolInterface = BActions.abi.find((iface) => iface.name === 'removeToken');
    const params = [poolAddress, ADDRESSES_FOR_NETWORK[chainId].vTHB, toWei('50')];
    const functionCall = web3.eth.abi.encodeFunctionCall(joinPoolInterface, params);

    web3.eth.handleRevert = true;
    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log(`REMOVED, tx = ${txn.transactionHash}`);
  });

// estimate gas when using smart pool
// task('smart-pool:estimate', 'estimate gas fee')
//   .addOptionalParam('proxyAddress', 'proxy address')
//   .addOptionalParam('poolAddress', 'pool address')
//   .setAction(async (taskArgs, hre) => {
//     const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
//     const { deployer } = await getNamedAccounts();
//     const { toWei } = web3.utils;
//     const chainId = await getChainId();

//     const proxyAddress =
//       taskArgs.proxyAddress || ADDRESSES_FOR_NETWORK[chainId].proxy || '';
//     const poolAddress =
//       taskArgs.poolAddress || ADDRESSES_FOR_NETWORK[chainId].crp || '';

//     const BActions = await deployments.get('BActions');
//     const DSProxy = await artifacts.readArtifact('DSProxy');
//     const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
//     console.log(`Using DSProxy @ ${userProxy.options.address}`);

//     const setSwapFeeInterface = BActions.abi.find(
//       (iface) => iface.name === 'setSwapFee'
//     );
//     let params = [poolAddress, toWei('0.001')];
//     const setSwapFeeCall = web3.eth.abi.encodeFunctionCall(
//       setSwapFeeInterface,
//       params
//     );

//     const setPublicSwapInterface = BActions.abi.find(
//       (iface) => iface.name === 'setPublicSwap'
//     );
//     params = [poolAddress, false];
//     const setPublicSwapCall = web3.eth.abi.encodeFunctionCall(
//       setPublicSwapInterface,
//       params
//     );

//     const setControllerInterface = BActions.abi.find(
//       (iface) => iface.name === 'setController'
//     );
//     params = [poolAddress, proxyAddress];
//     const setControllerCall = web3.eth.abi.encodeFunctionCall(
//       setControllerInterface,
//       params
//     );

//     const setCapInterface = BActions.abi.find(
//       (iface) => iface.name === 'setCap'
//     );
//     params = [poolAddress, toWei('5000')];
//     const setCapCall = web3.eth.abi.encodeFunctionCall(setCapInterface, params);

//     const increaseWeightInterface = BActions.abi.find(
//       (iface) => iface.name === 'increaseWeight'
//     );
//     params = [
//       poolAddress,
//       ADDRESSES_FOR_NETWORK[chainId].tokens[0],
//       toWei('2'),
//       toWei('1'),
//     ];
//     const increaseWeightCall = web3.eth.abi.encodeFunctionCall(
//       increaseWeightInterface,
//       params
//     );

//     // const commitAddTokenInterface = BActions.abi.find(
//     //   (iface) => iface.name === 'commitAddToken'
//     // );
//     // params = [
//     //   poolAddress,
//     //   '0xc778417e063141139fce010982780140aa0cd5ab',
//     //   toWei('0.5'),
//     //   toWei('1'),
//     // ];
//     // const commitAddTokenCall = web3.eth.abi.encodeFunctionCall(
//     //   commitAddTokenInterface,
//     //   params
//     // );
//     // await userProxy.methods['execute(address,bytes)'](
//     //   BActions.address,
//     //   commitAddTokenCall
//     // ).send({ from: deployer });

//     // const applyAddTokenInterface = BActions.abi.find(
//     //   (iface) => iface.name === 'applyAddToken'
//     // );
//     // params = [
//     //   poolAddress,
//     //   '0xc778417e063141139fce010982780140aa0cd5ab',
//     //   toWei('0.5'),
//     // ];
//     // const applyAddTokenCall = web3.eth.abi.encodeFunctionCall(
//     //   applyAddTokenInterface,
//     //   params
//     // );
//     // await userProxy.methods['execute(address,bytes)'](
//     //   BActions.address,
//     //   applyAddTokenCall
//     // ).send({ from: deployer });

//     const [
//       setSwapFeeGas,
//       setPublicSwapGas,
//       setControllerGas,
//       setCapGas,
//       increaseWeightGas,
//     ] = await Promise.all(
//       [
//         setSwapFeeCall,
//         setPublicSwapCall,
//         setControllerCall,
//         setCapCall,
//         increaseWeightCall,
//       ].map((functionCall) => {
//         return userProxy.methods['execute(address,bytes)'](
//           BActions.address,
//           functionCall
//         ).estimateGas({ from: deployer });
//       })
//     );
//     console.log({
//       setSwapFeeGas,
//       setPublicSwapGas,
//       setControllerGas,
//       setCapGas,
//       increaseWeightGas,
//       commitAddTokenGas: 176904,
//       applyAddTokenGas: 428141,
//     });
//   });
