import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const chainId = await getChainId();

  const { deployer } = await getNamedAccounts();
  let superAdminAddress = deployer;
  if (chainId === '56') {
    superAdminAddress = '0x778aa3CFFeBfe436bBfB4f1A25E16d4De9e8a2e7';
  }

  // await deploy('FCXAccessControl', {
  //   from: deployer,
  //   args: [deployer, [], []],
  //   log: true,
  // });
};

func.tags = ['FCXAccessControl'];
export default func;
