import { task } from 'hardhat/config';
import { utils } from 'ethers';

task('acl:grant-admin', 'grant role for user')
  .addParam('address', 'address of user')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, web3, deployments } = hre;
    const { deployer } = await getNamedAccounts();
    const { address } = taskArgs;
    const ADMIN_ROLE = web3.utils.keccak256('ADMIN_ROLE');

    const FCXAccessControl = await deployments.get('FCXAccessControl');
    console.log(`Using FCXAccessControl @ ${FCXAccessControl.address}`);
    const fcxAclInstance = new web3.eth.Contract(FCXAccessControl.abi, FCXAccessControl.address);

    const tx = await fcxAclInstance.methods.grantRole(ADMIN_ROLE, address).send({ from: deployer });
    console.log(`granted: ${tx.transactionHash}`);
  });

task('acl:revoke-admin', 'revoke role for user')
  .addParam('address', 'address of user')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, web3, deployments } = hre;
    const { deployer } = await getNamedAccounts();
    const { address } = taskArgs;
    const ADMIN_ROLE = web3.utils.keccak256('ADMIN_ROLE');

    const FCXAccessControl = await deployments.get('FCXAccessControl');
    console.log(`Using FCXAccessControl @ ${FCXAccessControl.address}`);
    const fcxAclInstance = new web3.eth.Contract(FCXAccessControl.abi, FCXAccessControl.address);

    const tx = await fcxAclInstance.methods.revokeRole(ADMIN_ROLE, address).send({ from: deployer });
    console.log(`revoked: ${tx.transactionHash}`);
  });

task('acl:info', 'fcx info')
  .addOptionalParam('address', 'address')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, deployments, web3 } = hre;
    const { deployer } = await getNamedAccounts();
    let { address } = taskArgs;

    const FCXAccessControl = await deployments.get('FCXAccessControl');
    address = address || FCXAccessControl.address;
    console.log(`FCXAccessControl at ${address}`);

    const acl = new web3.eth.Contract(FCXAccessControl.abi, FCXAccessControl.address);
    const roles = ['ADMIN_ROLE', 'RESTRICTED_ROLE', 'UNRESTRICTED_ROLE'];

    for (let role of roles) {
      const roleBytes = utils.keccak256(utils.toUtf8Bytes(role));
      console.log(role);
      let index = 0;
      while (true) {
        try {
          console.log(await acl.methods.getRoleMember(roleBytes, index++).call());
        } catch (err) {
          break;
        }
      }
    }
  });

task('acl:grant-roles', 'grant role for user')
  .addOptionalParam('role', 'role')
  .addParam('address', 'address of user')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, artifacts, web3, deployments } = hre;
    const { deployer } = await getNamedAccounts();
    let { address, role } = taskArgs;

    role = role || 'RESTRICTED_ROLE';
    const FCXAccessControl = await deployments.get('FCXAccessControl');
    const fcxAclInstance = new web3.eth.Contract(FCXAccessControl.abi, FCXAccessControl.address);

    const tx = await fcxAclInstance.methods.grantRole(web3.utils.keccak256(role), address).send({ from: deployer });
    console.log(`granted: ${tx.transactionHash}`);
  });

task('acl:verify', 'fcx verify')
  .addOptionalParam('address', 'address')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, deployments } = hre;
    const { deployer } = await getNamedAccounts();
    let { address } = taskArgs;

    const FCXAccessControl = await deployments.get('FCXAccessControl');
    address = address || FCXAccessControl.address;
    console.log(`Verify at ${address}`);

    await hre.run('verify:verify', {
      address,
      constructorArguments: [deployer, [], []],
    });
  });

task('acl:isWhitelist', 'fcx check whitelist of user').setAction(async (taskArgs, hre) => {
  const { getNamedAccounts, deployments, web3 } = hre;
  const { deployer } = await getNamedAccounts();
  let { address } = taskArgs;

  const FCXAccessControl = await deployments.get('FCXAccessControl');
  const fcxAclInstance = new web3.eth.Contract(FCXAccessControl.abi, FCXAccessControl.address);

  const whitelisted = await fcxAclInstance.methods.whitelisted('0x72BFaE7F1D2763de5cb1aa6c1FB2d1787c29fFE6').call();
  console.log(`whitelisted: ${whitelisted}`);
});

task('acl:grant-multiple', 'grant role for user').setAction(async (taskArgs, hre) => {
  const { getNamedAccounts, web3, deployments } = hre;
  const { deployer } = await getNamedAccounts();
  const ADMIN_ROLE = web3.utils.keccak256('ADMIN_ROLE');
  const R_ROLE = web3.utils.keccak256('RESTRICTED_ROLE');
  const U_ROLE = web3.utils.keccak256('UNRESTRICTED_ROLE');

  const grantParams = [
    { account: '0x2D4159A016fD5318da2057a2173d48Dc11af314e', role: ADMIN_ROLE },
    { account: '0x7ED3Ed81af7e2622762EcE82F1ee2240079299ec', role: ADMIN_ROLE },
    { account: '0xEB1fb1Aa35FcA89be1E1Ac04fdCF1d7E18EDb5f1', role: ADMIN_ROLE },
    { account: '0x50dB09B7Dfa65778b56a72A292F31B5a1Abb4821', role: ADMIN_ROLE },
    { account: '0x1F17BA620C4f9745428a9224acF9d0Fafc0D3d38', role: ADMIN_ROLE },
    { account: '0x3C192Efa7862170faE28c8d06E002612542497F3', role: ADMIN_ROLE },
    { account: '0xDd3A74D4486f52c4897196F53c77633d94690F6F', role: ADMIN_ROLE },
    { account: '0xE5d65808222FbC35DC57BD9BEDb38Ac77Fc06475', role: ADMIN_ROLE },
    { account: '0xcc66CBD7F4Ce051D3f6063452a1A336f3efe018f', role: ADMIN_ROLE },
    { account: '0xFbE1A76AD4Cdc4c6cF8a358B3D12F3f4817C88c9', role: ADMIN_ROLE },
    //
    { account: '0x8665A1904b771FBFa94ee8c04e578b558F7Fd319', role: R_ROLE },
    { account: '0x734a968964b5d18b4b649a7b444614accc8836dd', role: R_ROLE },
    { account: '0xfb4a8bd20fb6aeb7ea9829992caaa4a22fee483a', role: R_ROLE },
    { account: '0xb1b11e04348f4271b163db51138704f3dec0c128', role: R_ROLE },
    { account: '0x1bd853b690981b1933f395b9c8906e37df1ff72e', role: R_ROLE },
    { account: '0x6a340cf198c1980c6bc136c890c397a1c51957d8', role: R_ROLE },
    { account: '0xd22395ab402ecf4efd355ac01f0fd18d759a99be', role: R_ROLE },
    { account: '0x1c751b57301794bd6b314ca999ff7b382443b25d', role: R_ROLE },
    { account: '0x520ffc07b39665f38a08638e7b41b49ecbb1003b', role: R_ROLE },
    { account: '0xd96295802aa7f6ba00ab48c56f4199776cdcb4e9', role: R_ROLE },
    { account: '0x7ed3ed81af7e2622762ece82f1ee2240079299ec', role: R_ROLE },
    { account: '0x72bfae7f1d2763de5cb1aa6c1fb2d1787c29ffe6', role: R_ROLE },
    { account: '0xbb12536a71fcc47c8a0f9046648192cd61a14daf', role: R_ROLE },
    { account: '0x860149bc757686b25f9592a98d26487d2b188400', role: R_ROLE },
    { account: '0xB6497943bb49943a6c0e6FA403143668B9f60Da3', role: R_ROLE },
    { account: '0x870bc36f4c250Cc512005B89c14a05D1f4b3dB5C', role: R_ROLE },
    { account: '0xf29162ed5Ed4Da23656C5190aae71e61Bb074AeC', role: R_ROLE },
    { account: '0xdC2311820Bf9e68926a64101624fB6AaCF50e466', role: R_ROLE },
    { account: '0x942Ad2Aa5636571A05315d8e68c7cEa29f6A4B2d', role: R_ROLE },
    { account: '0xf2716D18ec77a62be032636aC96d9978e06ACe14', role: R_ROLE },
    { account: '0xF0781D164d3fF0E5e2DDd3d11d708f8cb171C283', role: R_ROLE },
    { account: '0x2aE02cDef05A507546224235aba49d7B9467ca3E', role: R_ROLE },
    { account: '0xf2df7faF5e17AE73f66c6de5C6Aa082596b6d4AF', role: R_ROLE },
    { account: '0xA853531E6bd0129c9389738E8F00603619e15fE2', role: R_ROLE },
    { account: '0x1002271d02E8a72aA642855A56394791fb3cb46D', role: R_ROLE },
    { account: '0x7f019865C53c2380982aa6f839E716368D9fE8bD', role: R_ROLE },
    { account: '0xa2a24cBFc771AE5D1EC5f4d4494A39cF8e51D065', role: R_ROLE },
    { account: '0xb3EA64BeA4a40bef27D17BcBbEC3d7d10c134022', role: R_ROLE },
    { account: '0xAB8818c53E9Ac444b7F2BEb06D83761232ed2bc0', role: R_ROLE },
    //
    { account: '0xBdD34ca459A9Ff4B673aC398F856c0A24F408963', role: U_ROLE },
    { account: '0xF54b3294616d39749732Ac74F234F46C9ABf29C4', role: U_ROLE },
    { account: '0x940340934EB52ef374F78865B1B0F220BD3bA3f3', role: U_ROLE },
    { account: '0x6Ab47EB8357c101e5dAC93474d8298bd5010e892', role: U_ROLE },
    { account: '0xBfbB7A462aB02043c72cf1fAB4E87bD5Bf27FC7D', role: U_ROLE },
    { account: '0x7eB69CE1A996d40c40917D336943038E3c9b7158', role: U_ROLE },
    { account: '0xBe751A99e159dc2bDE307bD22f7507e8618107EF', role: U_ROLE },
    { account: '0x2038B217427FB0b72d40379055130255ebBa8D44', role: U_ROLE },
    { account: '0x31BaE380bF2aD5654233F33f3a725D93d462a78E', role: U_ROLE },
    { account: '0xE5d65808222FbC35DC57BD9BEDb38Ac77Fc06475', role: U_ROLE },
    { account: '0x6EebaAD492bc5Dfa5D41dA69c484E73797Ed97cb', role: U_ROLE },
    { account: '0x2a98f128092aBBadef25d17910EbE15B8495D0c1', role: U_ROLE },
    { account: '0x08C6D3e9FcfA43a96288E84cC1b1079aF6E97097', role: U_ROLE },
    { account: '0x5edA1839a1f103246619b65A7615cA7535dEA02F', role: U_ROLE },
    { account: '0x678256158FbDb983B20464831F834789Df298F1f', role: U_ROLE },
    { account: '0xA6e4342528C3cbbED46Ddf2b7df1681D8F68668F', role: U_ROLE },
    { account: '0x3779a7F01d61521636F48d439946362970f7B072', role: U_ROLE },
    { account: '0xe9ed0A46f06b8Bfb08a28a860e998c69Cf822559', role: U_ROLE },
    { account: '0xD7488dAD70946a1A8f5d5726ab10D258AbEE93Cd', role: U_ROLE },
    { account: '0xAA7740DB30dcE972a5F1eFD8970e2D37ADD75034', role: U_ROLE },
    { account: '0xEB1fb1Aa35FcA89be1E1Ac04fdCF1d7E18EDb5f1', role: U_ROLE },
    { account: '0xFFc880fC789275260f9c387B4bF87E854CEb7365', role: U_ROLE },
    { account: '0x69729E3d1B396Accb7d62b0Afa85234B365360d0', role: U_ROLE },
    { account: '0x1F17BA620C4f9745428a9224acF9d0Fafc0D3d38', role: U_ROLE },
    { account: '0x234A8bC0143E4AFe6a63469e2e3ED0b85f438c86', role: U_ROLE },
    { account: '0x3C192Efa7862170faE28c8d06E002612542497F3', role: U_ROLE },
    { account: '0xDd3A74D4486f52c4897196F53c77633d94690F6F', role: U_ROLE },
    { account: '0xe43C3F0380A9C4Accbf968b6d63ca92043f257fe', role: U_ROLE },
    { account: '0x118E7D2E9A13698C16b5FF36D8B5ff797e7aCC00', role: U_ROLE },
    { account: '0x2146602452589ccA2D42F6917ce85cc1315B85Cf', role: U_ROLE },
    { account: '0x15025357251b7C20AA1e2f9F0Bf01b545d461865', role: U_ROLE },
    { account: '0x9Cdb412Dd6EE58186baf4d114DC8a44D811dD5a4', role: U_ROLE },
    { account: '0xcc66CBD7F4Ce051D3f6063452a1A336f3efe018f', role: U_ROLE },
    { account: '0xFbE1A76AD4Cdc4c6cF8a358B3D12F3f4817C88c9', role: U_ROLE },
    { account: '0x789375E18b5537AebDc0fF908930057f20EACa6F', role: U_ROLE },
    { account: '0xFD88F1DFE8C320ae700E6fd2b7474ae92366586c', role: U_ROLE },
    { account: '0xC84989e8DE9bFdDf466f3560F1Ea6217732F63d0', role: U_ROLE },
    { account: '0x8f82dC13505a0a2BC89B4F5730f22789E5f6fB44', role: U_ROLE },
  ];

  const FCXAccessControl = await deployments.get('FCXAccessControl');
  const fcxAclInstance = new web3.eth.Contract(FCXAccessControl.abi, FCXAccessControl.address);

  const tx = await fcxAclInstance.methods.grantRoles(grantParams).send({ from: deployer });
  console.log(`granted: ${tx.transactionHash}`);
});
