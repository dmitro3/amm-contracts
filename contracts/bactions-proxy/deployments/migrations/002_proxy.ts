import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const proxyTx = await deploy('DSProxyFactory', {
    from: deployer,
    args: [],
    log: true,
  });

  await deploy('ProxyRegistry', {
    from: deployer,
    args: [proxyTx.address],
    log: true,
  });
}
