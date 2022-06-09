import { constants } from 'ethers';
import { task } from 'hardhat/config';

task('crpf:set-access', 'crp factory set-access').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3 } = hre;
  const { deployer } = await getNamedAccounts();

  const CRPFactory = await deployments.get('CRPFactory');
  const crpFactoryInstance = new web3.eth.Contract(CRPFactory.abi, CRPFactory.address);
  const FCXAccessControl = await deployments.get('FCXAccessControl');
  console.log(`Using CRPFactory @ ${crpFactoryInstance.options.address}`);
  console.log(`Using FCXAccessControl @ ${FCXAccessControl.address}`);

  const txn = await crpFactoryInstance.methods
    .setAccessControlAddress(FCXAccessControl.address)
    .send({ from: deployer });
  console.log(`Done ${txn.transactionHash}`);
});

task('crpf:new', 'crp factory new crp').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3, getChainId } = hre;
  const { deployer } = await getNamedAccounts();
  const { toWei } = web3.utils;

  const CRPFactory = await deployments.get('CRPFactory');
  const crpFactoryInstance = new web3.eth.Contract(CRPFactory.abi, CRPFactory.address);

  const BFactory = await deployments.get('BFactory');

  console.log(`Using CRPFactory @ ${crpFactoryInstance.options.address}`);

  const tokenAddresses = [
    '0x1900D4e4418E98F307b51E8f2C4749a13a93F272', // WETH
    '0x3972aebCEC8FaE45E2bdc06FD30167EAFA5Bce38', // DAI
    '0x84544B0815279361676Fd147dAd60a912D8CaAc0', // USDT
  ];
  const swapFee = 10 ** 15;
  const protocolFee = 10 ** 14;
  const startWeights = [toWei('1'), toWei('1'), toWei('1')];
  const startBalances = [toWei('1'), toWei('1'), toWei('1')];
  const SYMBOL = 'BSP';
  const NAME = 'Balancer Pool Token';

  const poolParams = {
    poolTokenSymbol: SYMBOL,
    poolTokenName: NAME,
    constituentTokens: tokenAddresses,
    tokenBalances: startBalances,
    tokenWeights: startWeights,
    swapFee: swapFee,
    protocolFee: protocolFee,
  };

  // All on
  const permissions = {
    canPauseSwapping: true,
    canChangeSwapFee: true,
    canChangeWeights: true,
    canAddRemoveTokens: true,
    canWhitelistLPs: true,
    canChangeCap: false,
    canChangeProtocolFee: true,
  };

  let bFactoryAddress = BFactory.address;
  const chainId = await getChainId();
  if (chainId === '4') {
    bFactoryAddress = '0x12Dd3A6C957A0929608eE76f9B1f205c26cf4fB0';
  }
  console.log(`Using BFactory @ ${bFactoryAddress}`);

  crpFactoryInstance.methods.newCrp(bFactoryAddress, poolParams, permissions).call().then(console.log);

  const txn = await crpFactoryInstance.methods
    .newCrp(bFactoryAddress, poolParams, permissions)
    .send({ from: deployer });
  console.log(`Created, tx = ${txn.transactionHash}`);
});

task('crpf:is', 'crp factory new crp').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3, getChainId } = hre;
  const { deployer } = await getNamedAccounts();
  const { toWei } = web3.utils;

  const CRPFactory = await deployments.get('CRPFactory');
  const crpFactoryInstance = new web3.eth.Contract(CRPFactory.abi, CRPFactory.address);
  console.log(`Using CRPFactory @ ${crpFactoryInstance.options.address}`);

  const result = await crpFactoryInstance.methods
    .isCrp('0x1CcF060c3Bf119b6c70bcdF5B22E61Fec556b33B')
    .call({ from: deployer });
  console.log({ result });
});

task('crpf:verify', 'verify contract').setAction(async (taskArgs, hre) => {
  const { deployments } = hre;
  const BalancerSafeMath = await deployments.get('BalancerSafeMath');
  const RightsManager = await deployments.get('RightsManager');
  const SmartPoolManager = await deployments.get('SmartPoolManager');
  const ConfigurableRightsPoolExtension = await deployments.get('ConfigurableRightsPoolExtension');
  const CRPFactory = await deployments.get('CRPFactory');
  const FCXAccessControl = await deployments.get('FCXAccessControl');

  console.log(CRPFactory.address);

  await hre.run('verify:verify', {
    address: CRPFactory.address,
    constructorArguments: [FCXAccessControl.address, ConfigurableRightsPoolExtension.address],
    libraries: {
      BalancerSafeMath: BalancerSafeMath.address,
      RightsManager: RightsManager.address,
      SmartPoolManager: SmartPoolManager.address,
    },
  });
});
