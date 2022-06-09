import { ADDRESSES_FOR_NETWORK } from '@fcx/common';
import { task } from 'hardhat/config';

task('token:mint', 'token info')
  .addOptionalParam('address', 'address')
  .addOptionalParam('account', 'account')
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts, web3, artifacts, getChainId } = hre;
    let { address, account } = taskArgs;
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();
    const { toWei } = web3.utils;
    address = address || ADDRESSES_FOR_NETWORK[chainId].weth;
    account = account || deployer;

    const ERC20Mock = await artifacts.readArtifact('ERC20Mock');
    const token = new web3.eth.Contract(ERC20Mock.abi, address);
    console.log(`Using Token @ ${token.options.address}`);

    console.log(await token.methods.symbol().call());
    const txn = await token.methods.mint(account, toWei('1')).send({ from: deployer });
    console.log(`Done txn = ${txn.transactionHash}`);
  });
