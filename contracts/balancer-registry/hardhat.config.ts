import 'dotenv/config';
import 'solidity-coverage';
import 'hardhat-deploy';
import 'hardhat-local-networks-config-plugin';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-truffle5';
import 'hardhat-contract-sizer';

import './hardhat/tasks';

const CHAIN_IDS = {
  hardhat: 31337,
  kovan: 42,
  goerli: 5,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
  dockerParity: 17,
  bsctest: 97,
};

const INFURA_KEY = process.env.INFURA_KEY || '';
const DEPLOYER_PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000000';

const CONTROLLER_PRIVATE_KEY =
  process.env.CONTROLLER_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000000';

const USER1_PRIVATE_KEY =
  process.env.USER1_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000000';

const USER2_PRIVATE_KEY =
  process.env.USER2_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000000';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const OPTIMIZATION_ENABLE = (process.env.OPTIMIZATION_ENABLE || 'true') === 'true';

let optimizer = OPTIMIZATION_ENABLE
  ? {
      enabled: true,
      runs: 200,
      details: {
        yul: true,
        deduplicate: true,
        cse: true,
        constantOptimizer: true,
      },
    }
  : {};

export default {
  networks: {
    hardhat: {
      chainId: CHAIN_IDS.hardhat,
      // saveDeployments: true,
      allowUnlimitedContractSize: true,
    },
    dockerParity: {
      gas: 10000000,
      live: false,
      chainId: CHAIN_IDS.dockerParity,
      url: 'http://localhost:8545',
      saveDeployments: true,
    },
    localhost: {
      saveDeployments: true,
    },
    mainnet: {
      chainId: CHAIN_IDS.mainnet,
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: [
        `0x${DEPLOYER_PRIVATE_KEY}`,
        `0x${CONTROLLER_PRIVATE_KEY}`,
        `0x${USER1_PRIVATE_KEY}`,
        `0x${USER1_PRIVATE_KEY}`,
      ], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
    },
    ropsten: {
      chainId: CHAIN_IDS.ropsten,
      url: `https://ropsten.infura.io/v3/${INFURA_KEY}`,
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`, `0x${CONTROLLER_PRIVATE_KEY}`, `0x${USER1_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
    },
    kovan: {
      chainId: CHAIN_IDS.kovan,
      url: `https://kovan.infura.io/v3/${INFURA_KEY}`,
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`, `0x${CONTROLLER_PRIVATE_KEY}`, `0x${USER1_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
    },
    rinkeby: {
      chainId: CHAIN_IDS.rinkeby,
      url: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`, `0x${CONTROLLER_PRIVATE_KEY}`, `0x${USER1_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
    },
    goerli: {
      chainId: CHAIN_IDS.goerli,
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`, `0x${CONTROLLER_PRIVATE_KEY}`, `0x${USER1_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
    },
    evrydev: {
      chainId: 15,
      url: 'http://192.168.1.208:22002',
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`, `0x${CONTROLLER_PRIVATE_KEY}`, `0x${USER1_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
    },
    bsctest: {
      chainId: 97,
      url: 'https://data-seed-prebsc-1-s2.binance.org:8545',
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`, `0x${USER1_PRIVATE_KEY}`, `0x${USER2_PRIVATE_KEY}`], // Using private key instead of mnemonic for vanity deploy
      saveDeployments: true,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      [CHAIN_IDS.mainnet]: 0,
      [CHAIN_IDS.kovan]: 0,
      [CHAIN_IDS.ropsten]: 0,
      [CHAIN_IDS.goerli]: 0,
      [CHAIN_IDS.rinkeby]: 0,
      [CHAIN_IDS.dockerParity]: 0,
    },
    user1: {
      default: 1, // here this will by default take the first account as deployer
      // We use explicit chain IDs so that export-all works correctly: https://github.com/wighawag/hardhat-deploy#options-2
      // [CHAIN_IDS.mainnet]: '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f',
      [CHAIN_IDS.mainnet]: 1,
      [CHAIN_IDS.kovan]: 1,
      [CHAIN_IDS.ropsten]: 1,
      [CHAIN_IDS.goerli]: 1,
      // [CHAIN_IDS.rinkeby]: '0x44DDF1D6292F36B25230a72aBdc7159D37d317Cf',
      [CHAIN_IDS.rinkeby]: 1,
      [CHAIN_IDS.dockerParity]: 1,
      [CHAIN_IDS.bsctest]: '0x8665A1904b771FBFa94ee8c04e578b558F7Fd319',
    },
    user2: {
      default: 1, // here this will by default take the first account as deployer
      // We use explicit chain IDs so that export-all works correctly: https://github.com/wighawag/hardhat-deploy#options-2
      // [CHAIN_IDS.mainnet]: '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f',
      [CHAIN_IDS.mainnet]: 1,
      [CHAIN_IDS.kovan]: 1,
      [CHAIN_IDS.ropsten]: 1,
      [CHAIN_IDS.goerli]: 1,
      // [CHAIN_IDS.rinkeby]: '0x44DDF1D6292F36B25230a72aBdc7159D37d317Cf',
      [CHAIN_IDS.rinkeby]: 1,
      [CHAIN_IDS.dockerParity]: 1,
      [CHAIN_IDS.bsctest]: '0x734a968964B5D18b4B649A7b444614accc8836Dd',
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.5.12',
        settings: {
          optimizer,
        },
      },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  paths: {
    deploy: 'deployments/migrations',
    deployments: 'deployments/artifacts',
  },
};
