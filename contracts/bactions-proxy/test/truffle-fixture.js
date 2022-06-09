const RightsManager = artifacts.require('contracts/test/RightsManager.sol:RightsManager');
const SmartPoolManager = artifacts.require('SmartPoolManager');
const CRPFactory = artifacts.require('contracts/test/CRPFactory.sol:CRPFactory');
const BFactory = artifacts.require('contracts/test/BFactory.sol:BFactory');
const BalancerSafeMath = artifacts.require('BalancerSafeMath');
const BActions = artifacts.require('BActions');
const TTokenFactory = artifacts.require('TTokenFactory');
const DSProxyFactory = artifacts.require('DSProxyFactory');

let isMigrated = false;
module.exports = async function ({ network, web3 }) {
    if (isMigrated) {
        return;
    }
    const bFactory = await BFactory.new();
    BFactory.setAsDeployed(bFactory);

    const balancerSafeMath = await BalancerSafeMath.new();
    const rightsManager = await RightsManager.new();
    const smartPoolManage = await SmartPoolManager.new();

    CRPFactory.link(balancerSafeMath);
    CRPFactory.link(rightsManager);
    CRPFactory.link(smartPoolManage);
    const crpFactory = await CRPFactory.new();
    CRPFactory.setAsDeployed(crpFactory);

    const bactions = await BActions.new();
    BActions.setAsDeployed(bactions);

    const ttoken = await TTokenFactory.new();
    TTokenFactory.setAsDeployed(ttoken);

    const proxy = await DSProxyFactory.new();
    DSProxyFactory.setAsDeployed(proxy);

    isMigrated = true;
};
