import { task } from 'hardhat/config';

task('proxy:build', 'proxy build your own').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();

  const ProxyRegistry = await deployments.get('ProxyRegistry');
  const proxy = new web3.eth.Contract(ProxyRegistry.abi, ProxyRegistry.address);
  console.log(`Using ProxyRegistry @ ${proxy.options.address}`);

  const currentProxy = await proxy.methods.proxies(deployer).call();
  console.log({ deployer, currentProxy });

  const txn = await proxy.methods.build().send({ from: deployer });
  console.log(`Created, tx = ${txn.transactionHash}`);
  console.log(txn);
});

task('proxy:check', 'Check if user had proxy').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();
  const ProxyRegistry = await deployments.get('ProxyRegistry');
  const proxy = new web3.eth.Contract(ProxyRegistry.abi, ProxyRegistry.address);
  console.log(`Using ProxyRegistry @ ${proxy.options.address}`);

  const currentProxy = await proxy.methods.proxies(deployer).call();
  console.log(currentProxy);
  if(currentProxy === '0x0000000000000000000000000000000000000000')
    console.log(false);
  else  
    console.log(true);
});
