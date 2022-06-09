import { ADDRESSES_FOR_NETWORK } from '@fcx/common';
import { task } from 'hardhat/config';

/// check production info
task('amm:info', 'token info').setAction(async (taskArgs, hre) => {
  const accessControlAddress = '0xf5C0E883222EE169C81564Bbf0977A83B43c468F';
  const bpoolExtAddress = '0x9D3898804Eac7aa41d330cE954F0c21F85664524';
  const bfactoryAddress = '0xBa0f3ED9A93582627fD700C1CB6cd1db9e8BD372';
  const { web3, artifacts } = hre;

  const FCXAccessControl = await artifacts.readArtifact('FCXAccessControl');
  const accessControl = new web3.eth.Contract(FCXAccessControl.abi, accessControlAddress);
  const SUPER_ADMIN_ROLE = await accessControl.methods.SUPER_ADMIN_ROLE().call();
  const ADMIN_ROLE = await accessControl.methods.ADMIN_ROLE().call();
  const superAdmin = await accessControl.methods.getRoleMember(SUPER_ADMIN_ROLE, 0).call();
  console.log({ superAdmin }); // 0xB18b05b0DC36978Cd15699fA5CcF770D1aB94684
  const admin = await accessControl.methods.getRoleMember(ADMIN_ROLE, 0).call();
  console.log({ admin });

  const BPoolExtension = await artifacts.readArtifact('BPoolExtension');
  const bpoolExtension = new web3.eth.Contract(BPoolExtension.abi, bpoolExtAddress);
  const MIN_BALANCE = await bpoolExtension.methods.MIN_BALANCE().call();
  console.log({ MIN_BALANCE });

  const BFactory = await artifacts.readArtifact('BFactory');
  const bFactory = new web3.eth.Contract(BFactory.abi, bfactoryAddress);
  const bAccessControlAddress = await bFactory.methods.getAccessControlAddress().call();
  console.log({ bAccessControlAddress });
  console.assert(accessControlAddress === bAccessControlAddress);
});
