import { task } from 'hardhat/config';
import { utils } from 'ethers';
import { ADDRESSES_FOR_NETWORK } from '@fcx/common';

task('acl:update', 'fcx update').setAction(async (taskArgs, hre) => {
  const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const aclAddress = ADDRESSES_FOR_NETWORK[chainId].fcxAcl;
  const proxyAddress = ADDRESSES_FOR_NETWORK[chainId].proxy;

  const BActions = await deployments.get('BActions');
  const DSProxy = await artifacts.readArtifact('DSProxy');
  const userProxy = new web3.eth.Contract(DSProxy.abi, proxyAddress);
  console.log(`Using DSProxy @ ${userProxy.options.address}`);
  const bFactoryAddress = ADDRESSES_FOR_NETWORK[chainId].factory || '';
  console.log(`Using BFactory @ ${bFactoryAddress}`);

  const setInterface = BActions.abi.find((iface) => iface.name === 'setAccessControlAddress');
  const params: any = ['0xcd47e306192f8e671d61a238cffaf7a6b9a436f6', aclAddress];
  const functionCall = web3.eth.abi.encodeFunctionCall(setInterface, params);
  console.log({ params });

  const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
    from: deployer,
  });
  console.log(`Done txn = ${txn.transactionHash}`);
});
