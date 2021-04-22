const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const CrowdclickEscrow = artifacts.require('CrowdclickEscrow');
const CrowdclickOracle = artifacts.require('CrowdclickOracle');
const config = require('../dao/environment');

const { minimumUsdWithdrawal, feePercentage } = config.contractDeployment.crowdclickEscrow;
const { trackingInterval } = config.contractDeployment.crowdclickOracle;
const { chainlink } = config.networkContracts[config.networkEnvironment];
const startTracking = ~~(Date.now() / 1000);

const deployCrowdclickOracle = async (owner) => deployProxy(CrowdclickOracle, [chainlink, startTracking, trackingInterval], { owner });

module.exports = function (deployer, network, accounts) {
  if (config.networkEnvironment === config.NETWORK_ENVIRONMENT.RINKEBY && config.isProduction) {
    deployer.then(async () => {
      const owner = accounts[0];
      const crowdclickOracle = await deployCrowdclickOracle(owner);
      const crowdclickEscrow = await deployProxy(CrowdclickEscrow, [crowdclickOracle.address, minimumUsdWithdrawal, feePercentage, owner], { owner });
      console.log(`CrowdclickOracle address: ${crowdclickOracle.address}`);
      console.log(`CrowdclickEscrow address: ${crowdclickEscrow.address}`);
    }).catch((e) => {
      console.error(e);
    });
  }
};
