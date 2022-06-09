import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const FCXAccessControl = await deployments.get('FCXAccessControl');
  console.log(`using FCXAccessControl at ${FCXAccessControl.address}`);

  await deploy('BPoolExtension', {
    from: deployer,
    args: [],
    log: true,
  });
  const BPoolExtension = await deployments.get('BPoolExtension');

  await deploy('BFactory', {
    from: deployer,
    args: [FCXAccessControl.address, BPoolExtension.address],
    log: true,
  });
};

func.tags = ['BFactory'];
export default func;
