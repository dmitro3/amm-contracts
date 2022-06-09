import { BigNumber, constants, ethers, utils } from 'ethers';
import { task } from 'hardhat/config';

  const ADDRESSES_FOR_NETWORK: {
    [key: string]: { tokens: String[]; proxy: String };
  } = {
    '15': {
      tokens: [
        '0xD509468B7c7Ca682640AE712EC82Bda7bD0B7091', // usdt
        '0x1cD44deA31f43aC8b448bd6C860f3434eC9c2f37', // dai
        '0xc7729d922197e1685fE1354d99dDd6FbD0eaACE6', // weth
      ],
      proxy: '0x1964275E3dDcd4e9304a6e5a15680380e90C0895',
    },
    '4': {
      tokens: [
        '0xc778417e063141139fce010982780140aa0cd5ab',
        '0xc7ad46e0b8a400bb3c915120d284aafba8fc4735',
        '0x8080c7e4b81ecf23aa6f877cfbfd9b0c228c6ffa',
      ],
      proxy: '0x3B8D68Dc3A3806E19Bd69a0cbAC47eb6aEA53ae2',
    },
    '42': {
      tokens: [
        '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa', // DAI
        '0x07de306ff27a2b630b1141956844eb1552b956b5', // USDT
      ],
      proxy: '0x4840F93912F6b6de2449d59cAa7A18F953C5fB50',
    },
    '97': {
      tokens: [
        '0xE2d4098010F4FcD04C11C70D8b322b711FfbDCcA', // USDT
        '0x5108c124A162221a11181D82889cb4B85251B99e', // vUSD
        '0x7950D937BE6ad204d73345609a3C91259236b139', // vTHB
        '0x927098c1F03f4f624c2b30F5Cc956f0edC175e61', // vEUR
        '0x4149c3B3807cDc4Cb2249F9C4579391A77A93043', // vSGD
        '0xF313cA0e69Ebd1c5230BF939c46B0E097463Fe49', // cCHF
      ],
      proxy: '0x9e31937eaaD0e6b5b8426cc2503fB5176B9bcf2d',
    },
    '51': {
      tokens: [
        '0x3B401542Fcb33927Faf55CAAf135Ca891ac9a675', //RW1
        '0x12614D7f8212184d71525e0aC5f99dd5a66a6eCb', //RW2
        '0x2A9186A7F4553aE10dCD75de397C91cc39F4f139', //RW3
        '0x1Ae74f3Ad660F561B62e4dC2C4210506FE0bC4d8', //RW4
      ],
      proxy: '',
    }
  };

task('token:info', 'token info')
  .addParam('address', 'address')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { address } = taskArgs;
    const { deployer } = await getNamedAccounts();

    const ERC20Mock = await artifacts.readArtifact('ERC20Mock');
    const tTokenInstance = new web3.eth.Contract(ERC20Mock.abi, address);
    console.log(`Using Token @ ${tTokenInstance.options.address}`);

    await tTokenInstance.methods.mint(deployer, utils.parseEther('1000000000')).send({ from: deployer });

    console.log(await tTokenInstance.methods.symbol().call());
    console.log(await tTokenInstance.methods.balanceOf(deployer).call());
  });

task('token:new', 'token new')
  .addParam('symbol', 'symbol')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const { symbol } = taskArgs;

    const token = await deploy('ERC20Mock', {
      from: deployer,
      args: [symbol, symbol, 18],
      log: true,
    });

    const ERC20Mock = await artifacts.readArtifact('ERC20Mock');
    const tTokenInstance = new web3.eth.Contract(ERC20Mock.abi, token.address);
    console.log(`Using Token @ ${tTokenInstance.options.address}`);

    await tTokenInstance.methods
      .mint(deployer, ethers.utils.parseEther('1000000000').toString())
      .send({ from: deployer });

    console.log({ symbol: await tTokenInstance.methods.symbol().call() });
  });

task('token:approve-pool', 'btoken info')
  .addOptionalParam('tokens', 'token list')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { user1 } = await getNamedAccounts();
    const { user2 } = await getNamedAccounts();
    const chainId = await getChainId();

    const tokens = taskArgs.tokens?.splits(',') || ADDRESSES_FOR_NETWORK[chainId]?.tokens || [];

    for (let tokenAddress of tokens) {
      const BToken = await artifacts.readArtifact('BToken');
      const bTokenInstance = new web3.eth.Contract(BToken.abi, tokenAddress);
      console.log(`Using BToken @ ${bTokenInstance.options.address}`);
      const txn = await bTokenInstance.methods
        .approve('0xeee249083674a1a8227a0b79bfe52c7eb940aed1', constants.MaxUint256.toString())
        .send({ from: user2 });
      console.log(`Approved, tx: ${txn.transactionHash}`);
    }
  });

task('token:balance', 'balancer of user')
  .addOptionalParam('tokens', 'token list')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { user1 } = await getNamedAccounts();
    const chainId = await getChainId();

    const tokens = taskArgs.tokens?.splits(',') || ADDRESSES_FOR_NETWORK[chainId]?.tokens || [];

    for (let tokenAddress of tokens) {
      const BToken = await artifacts.readArtifact('BToken');
      const bTokenInstance = new web3.eth.Contract(BToken.abi, tokenAddress);
      console.log(`Using BToken @ ${bTokenInstance.options.address}`);
      const balance = await bTokenInstance.methods.balanceOf(user1).call();
      const totalSupply = await bTokenInstance.methods.totalSupply().call();
      console.log(`total supply: ${totalSupply}`);
      console.log(`balance of ${deployer} : ${balance}`);
    }
  });

task('token:allowance', 'balancer of user')
  .addOptionalParam('tokens', 'token list')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { user1 } = await getNamedAccounts();
    const { user2 } = await getNamedAccounts();
    const chainId = await getChainId();

    const tokens = taskArgs.tokens?.splits(',') || ADDRESSES_FOR_NETWORK[chainId]?.tokens || [];

    for (let tokenAddress of tokens) {
      const BToken = await artifacts.readArtifact('BToken');
      const bTokenInstance = new web3.eth.Contract(BToken.abi, tokenAddress);
      console.log(`Using BToken @ ${bTokenInstance.options.address}`);
      const allowance = await bTokenInstance.methods
        .allowance(user2, '0xeee249083674a1a8227a0b79bfe52c7eb940aed1')
        .call();
      console.log(`allowance : ${allowance}`);
    }
  });

task('token:transfer', 'balancer of user')
  .addOptionalParam('tokens', 'token list')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const { user1 } = await getNamedAccounts();
    const chainId = await getChainId();

    const tokens = taskArgs.tokens?.splits(',') || ADDRESSES_FOR_NETWORK[chainId]?.tokens || [];

    for (let tokenAddress of tokens) {
      const BToken = await artifacts.readArtifact('BToken');
      const bTokenInstance = new web3.eth.Contract(BToken.abi, tokenAddress);
      console.log(`Using BToken @ ${bTokenInstance.options.address}`);
      const tx = await bTokenInstance.methods
        .transfer('0x1168271DF29afa411Ab84f3086eD24389A5Bb4A8', ethers.utils.parseEther('100000000').toString())
        .send({ from: deployer });
      console.log(`transfered: ${tx.transactionHash}`);
    }
  });

task('token:verify', 'verify contract')
  .addOptionalParam('address', 'address')
  .addOptionalParam('symbol', 'symbol')
  .setAction(async (taskArgs, hre) => {
    const symbol = taskArgs.symbol || 'vUSD';
    const address = taskArgs.address || '0x6dEeeebCf2b03a1078D1FC624bdC57a667BF31d0';
    console.log({ symbol, address });
    await hre.run('verify:verify', {
      address,
      constructorArguments: [symbol, symbol, 18],
    });
  });
