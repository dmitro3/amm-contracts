import { constants } from 'ethers';
import { task } from 'hardhat/config';

task('bfactory:set-access', 'bfactory info').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3 } = hre;
  const { deployer } = await getNamedAccounts();

  const BFactory = await deployments.get('BFactory');
  const bfactoryInstance = new web3.eth.Contract(BFactory.abi, BFactory.address);
  const FCXAccessControl = await deployments.get('FCXAccessControl');
  console.log(`Using BFactory @ ${bfactoryInstance.options.address}`);
  console.log(`Using FCXAccessControl @ ${FCXAccessControl.address}`);

  const txn = await bfactoryInstance.methods.setAccessControlAddress(FCXAccessControl.address).send({ from: deployer });
  console.log(`Done ${txn.transactionHash}`);
});

task('bfactory:info', 'bfactory info').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3 } = hre;
  const { deployer } = await getNamedAccounts();

  const BFactory = await deployments.get('BFactory');
  const bfactoryInstance = new web3.eth.Contract(BFactory.abi, BFactory.address);
  console.log(`Using BFactory @ ${bfactoryInstance.options.address}`);

  const [bLabs] = await Promise.all([bfactoryInstance.methods.getBLabs().call()]);
  console.log({ bLabs });
});

task('bfactory:new', 'bfactory new bPool').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3 } = hre;
  const { deployer } = await getNamedAccounts();

  const BFactory = await deployments.get('BFactory');
  const bfactoryInstance = new web3.eth.Contract(BFactory.abi, BFactory.address);
  console.log(`Using BFactory @ ${bfactoryInstance.options.address}`);

  const txn = await bfactoryInstance.methods.newBPool().send({ from: deployer });
  console.log(`Created, tx: ${txn.transactionHash}`);
});
