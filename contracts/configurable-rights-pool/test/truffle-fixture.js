const RightsManager = artifacts.require('RightsManager');
const SmartPoolManager = artifacts.require('SmartPoolManager');
const CRPFactory = artifacts.require('CRPFactory');
const ESPFactory = artifacts.require('ESPFactory');
const BFactory = artifacts.require('BFactory');
const BalancerSafeMath = artifacts.require('BalancerSafeMath');
const BalancerSafeMathMock = artifacts.require('BalancerSafeMathMock');
const FCXAccessControl = artifacts.require('FCXAccessControl');
const BPoolExtension = artifacts.require('BPoolExtension');
const ConfigurableRightsPoolExtension = artifacts.require('ConfigurableRightsPoolExtension');

let isMigrated = false;

module.exports = async function ({ network, web3 }) {
    if (isMigrated) {
        return;
    }
    const accounts = await web3.eth.getAccounts();

    fcxAccessControl = await FCXAccessControl.new(accounts[0], [accounts[1]], [accounts[2], accounts[3]]);
    FCXAccessControl.setAsDeployed(fcxAccessControl);

    bPoolExtension = await BPoolExtension.new();
    BPoolExtension.setAsDeployed(bPoolExtension);

    crpPoolExtension = await ConfigurableRightsPoolExtension.new();
    ConfigurableRightsPoolExtension.setAsDeployed(crpPoolExtension);

    if (network.name === 'hardhat') {
        const bFactory = await BFactory.new(fcxAccessControl.address, bPoolExtension.address);
        const bsmm = await BalancerSafeMathMock.new();
        BFactory.setAsDeployed(bFactory);
        BalancerSafeMathMock.setAsDeployed(bsmm);
    }

    const balancerSafeMath = await BalancerSafeMath.new();
    const rightsManager = await RightsManager.new();
    const smartPoolManage = await SmartPoolManager.new();

    CRPFactory.link(balancerSafeMath);
    CRPFactory.link(rightsManager);
    CRPFactory.link(smartPoolManage);

    const crpFactory = await CRPFactory.new(fcxAccessControl.address, crpPoolExtension.address);
    CRPFactory.setAsDeployed(crpFactory);

    if (network.name === 'hardhat') {
        ESPFactory.link(balancerSafeMath);
        ESPFactory.link(rightsManager);
        ESPFactory.link(smartPoolManage);

        const espFactory = await ESPFactory.new();
        ESPFactory.setAsDeployed(espFactory);
    }

    isMigrated = true;
};
