# fcxv2-amm-contract

fcxv2 fixed pool and flexible pool contracts

## Environments

- node >= 12

## Deployments

- Prepare an account as deployer

```bash
# install dependencies
yarn

# deploy core
cd contracts/configurable-rights-pool
cp .env.example .env # edit .env
yarn hardhat compile
yarn hardhat deploy --network <network name> # choose bsc or bsctest
yarn hardhat --help # commands

# deploy proxy
cd contracts/bactions-proxy
cp .env.example .env # edit .env
yarn hardhat compile
yarn hardhat deploy --network <network name> # choose bsc or bsctest
yarn hardhat --help # commands
```

## Verify contracts

```bash
cd contracts/configurable-rights-pool

yarn hardhat --network bsc etherscan-verify --api-key <BSC_SCAN_API_KEY> --force-license --license GPL-3.0 --solc-input
```

## Tasks

### FCXAccessControl Grant and revoke admin role

- Source code: `contracts/configurable-rights-pool/hardhat/tasks/fcx-acl.ts`
- Make sure you are superadmin (check .env)

```bash
cd contracts/configurable-rights-pool

# grant
yarn hardhat --network bsc acl:grant-admin --address <USER_ADDRESS>

# revoke
yarn hardhat --network bsc acl:revoke-admin --address <USER_ADDRESS>
```

You can also use `grantRole` and `revokeRole` on [BSCSCAN](https://bscscan.com/address/0xf5C0E883222EE169C81564Bbf0977A83B43c468F#writeContract) with role is `0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775` (keccak256('ADMIN_ROLE'))

## Deployment fee

- gas price: 0.00000001 BNB (10 Gwei)

### core

| contract                        | gas       | BNB        |
| ------------------------------- | --------- | ---------- |
| BPoolExtension                  | 2 853 633 | 0.02853633 |
| BFactory                        | 5 056 914 | 0.05056914 |
| ConfigurableRightsPoolExtension | 2 067 599 | 0.02067599 |
| BalancerSafeMath                | 71 933    | 0.00071933 |
| RightsManager                   | 454 388   | 0.00454388 |
| SmartPoolManager                | 3 558 212 | 0.03558212 |
| CRPFactory                      | 5 337 534 | 0.05337534 |
| FCXAccessControl                | 1 090 649 | 0.01090649 |

- total: 0.20490861 BNB

### proxy

| contract       | gas       | BNB        |
| -------------- | --------- | ---------- |
| BActions       | 2 849 817 | 0.02849817 |
| DSProxyFactory | 1 610 762 | 0.01610762 |
| ProxyRegistry  | 375 983   | 0.00375983 |

- total: 0.04836562 BNB

## Redeploy on production (MIN_BALANCE problem)

### Reason

- For adding liquidity feature, Balancer's source code requires the minimum amount of token is greater than or equal 10^12. It's ok with 18 decimals, but not ok with 5 decimals. For example, when adding vUSD (5 decimal ERC20), you have to add 10000000 (10^7) vUSD at minimum.

```js
uint256 public constant BONE = 10**18;
uint256 public constant MIN_BALANCE = BONE / 10**6;
/// ...
require(newBalance >= BalancerConstants.MIN_BALANCE, "ERR_MIN_BALANCE");
```

- During testing phase, we used 18 decimal ERC20, so we didn't discover it sooner. Sorry for that.

### Solution

**NOTE: This solution is for token with decimal >= 5. The new minimum amount of token is 0.1**

- Update the MIN_BALANCE to 10^4
- Commit: [FIX](https://github.com/sotatek-dev/fcxv2-amm-contract/commit/f849e00fad9d7ceb9d6801c618de756a28c3c711#diff-0cd4535cacceb1602bcbdb17c2f0673012dcb84c5439158d4c5c194aa6c21b21)

```js
uint256 public constant MIN_BALANCE = BONE / 10**14;
```

### How to redeploy

- Redeploy will cost about 0.2 BNB
- After redeploy, please resend us the new `FCXAccessControl`, `BFactory` and `CRPFactory` address (at `contracts/configurable-rights-pool/deployments/artifacts/bsc`)

#### Steps

- Make sure you keep json files at `contracts/configurable-rights-pool/deployments/artifacts/bsc`
- Check the `superAdminAddress` at `contracts/configurable-rights-pool/deployments/migrations/001_fcxacl.ts`. On bsc, it is `0x778aa3CFFeBfe436bBfB4f1A25E16d4De9e8a2e7`
- Make sure you are in project root
- Make sure to use the new `FCXAccessControl` address when redeploy `fcxv2-contracts-hardhat`

```bash
cd contracts/configurable-rights-pool

yarn hardhat deploy --network bsc
```

- output of the script (do not care about the address)

```bash
...
Compilation finished successfully
using FCXAccessControl at 0xFB2b87255Aac30a0B66f75330B428a62351C8A75
deploying "BPoolExtension" (tx: 0x4cee5601ffaf648a9d9038b8bd3d995844d7759139987b1744fee0c0a4907ecb)...: deployed at 0x4EE7536C39ff123C30b00147b35B0ae1eC9D2982 with 2707639 gas
deploying "BFactory" (tx: 0xba79a1c7e2e579d47c8da4d2ebe5641f958b0525ca50308c106ede9fed74a555)...: deployed at 0xB201710D05BCe7917FD31a46317996dD8153C76f with 5056926 gas
using FCXAccessControl at 0xFB2b87255Aac30a0B66f75330B428a62351C8A75
deploying "ConfigurableRightsPoolExtension" (tx: 0x628fd94030e57b4214d85a1ec71397623810b710ca4a91c2057fcecca042f295)...: deployed at 0x39F661c40fEa5c2a2B25DCec5c519BDC68d1b883 with 2067599 gas
deploying "BalancerSafeMath" (tx: 0x76334b884680d6f535a5ea01a960fe0e772abc22dd902e882f74e3dbc29e5cc7)...: deployed at 0xC392440F7c555AdC4d6acf614B342F55F89DaC11 with 71933 gas
reusing "RightsManager" at 0x9Fd5e70828D2157990A7ccB8E7AAe625fAB84de2
deploying "SmartPoolManager" (tx: 0xdc1a6f0899279e6773fd551b73c7a930dc5a4360118ee98bd86fabcefde29bd5)...: deployed at 0xfAc8A9b4989CBe1681F544f142028F97BC6B39b7 with 3557372 gas
deploying "CRPFactory" (tx: 0x45ea7d757bb3606df2ea800aa99b96a2195e2bfcc420dd0ec8517de00f41f995)...: deployed at 0x97975771093b5Ae8a83c2483A53C26F2e2BcAB28 with 5356113 gas
✨  Done in 96.73s.
```
