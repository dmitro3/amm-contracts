import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const FCXAccessControl = await deployments.get('FCXAccessControl');
  console.log(`using FCXAccessControl at ${FCXAccessControl.address}`);

  await deploy('ConfigurableRightsPoolExtension', {
    from: deployer,
    args: [],
    log: true,
  });

  const balancerSafeMath = await deploy('BalancerSafeMath', {
    from: deployer,
    args: [],
    log: true,
  });
  const rightsManager = await deploy('RightsManager', {
    from: deployer,
    args: [],
    log: true,
  });
  const smartPoolManager = await deploy('SmartPoolManager', {
    from: deployer,
    args: [],
    log: true,
  });
  const ConfigurableRightsPoolExtension = await deployments.get('ConfigurableRightsPoolExtension');

  await deploy('CRPFactory', {
    from: deployer,
    args: [FCXAccessControl.address, ConfigurableRightsPoolExtension.address],
    log: true,
    libraries: {
      BalancerSafeMath: balancerSafeMath.address,
      RightsManager: rightsManager.address,
      SmartPoolManager: smartPoolManager.address,
    },
  });
};

func.tags = ['CRPFactory'];
export default func;
