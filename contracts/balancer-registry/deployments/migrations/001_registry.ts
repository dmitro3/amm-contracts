import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ADDRESSES_FOR_NETWORK } from '@fcx/common';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = await getChainId();
  const WETH = ADDRESSES_FOR_NETWORK[chainId].weth;
  const FACTORY = ADDRESSES_FOR_NETWORK[chainId].factory;

  await deploy('BRegistry', {
    from: deployer,
    args: [FACTORY],
    log: true,
  });
  const registry = await deployments.get('BRegistry');
  console.log(`Registry deployed to: ${registry.address}`);

  await deploy('ExchangeProxy', {
    from: deployer,
    args: [WETH],
    log: true,
  });
  const proxy = await deployments.get('ExchangeProxy');
  console.log(`Proxy deployed to: ${proxy.address}`);

  await execute('ExchangeProxy', { from: deployer, log: true }, 'setRegistry', registry.address);
  console.log('Registry set.');
}
