import { BigNumber, constants } from 'ethers';
import { task } from 'hardhat/config';
import { ADDRESSES_FOR_NETWORK } from '@fcx/common';

task('private-pool:new', 'new private pool')
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
    console.log(`Using DSProxy @ ${userProxy.options.address}`);
    const bFactoryAddress = ADDRESSES_FOR_NETWORK[chainId].factory || '';
    console.log(`Using BFactory @ ${bFactoryAddress}`);

    const createTokens = [ADDRESSES_FOR_NETWORK[chainId].usdt, ADDRESSES_FOR_NETWORK[chainId].dai] || [];
    const createBalances = [toWei('0.1'), toWei('0.1')];
    const createWeights = [toWei('1'), toWei('1')];
    const swapFee = toWei('0.03');
    const protocolFee = toWei('0.003');
    const finalize = false;

    const IERC20 = await artifacts.readArtifact('IERC20Mintable');
    for (let tokenAddress of createTokens) {
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);
      await token.methods.mint(deployer, toWei('0.1')).send({ from: deployer });
      await token.methods.approve(userProxy.options.address, MAX).send({ from: deployer });
    }

    const createInterface = BActions.abi.find((iface) => iface.name === 'create');
    const params: any = [bFactoryAddress, createTokens, createBalances, createWeights, swapFee, protocolFee, finalize];
    const functionCall = web3.eth.abi.encodeFunctionCall(createInterface, params);

    // web3.eth.handleRevert = true;
    const poolAddress = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).call({
      from: deployer,
    });
    const POOL = `0x${poolAddress.slice(-40)}`;
    console.log(POOL);

    const txn = await userProxy.methods['execute(address,bytes)'](BActions.address, functionCall).send({
      from: deployer,
    });
    console.log({ POOL });
    console.log(`Txn is ${txn.transactionHash}`);
  });
