const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const CrowdclickEscrow = artifacts.require('CrowdclickEscrow');
const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle');

const currencyApi = require('../dao/api');
const config = require('../dao/environment');
const { toE18 } = require('../dao/helpers');

const { minimumUsdWithdrawal, feePercentage } = config.contractDeployment.crowdclickEscrow;

const deployCrowdclickMockOracle = async (owner) => {
  const currentUnderlying = await currencyApi.fetchMaticToUSD();
  const currentUnderlyingToWei = toE18(currentUnderlying.toString());
  console.log(`current matic/polygon price: ${currentUnderlying}`);
  const crowdclickMockOracle = await deployProxy(CrowdclickMockOracle, [currentUnderlyingToWei, owner], { owner });
  return crowdclickMockOracle;
};

module.exports = function (deployer, network, accounts) {
  deployer.then(async () => {
    if (config.networkEnvironment === config.NETWORK_ENVIRONMENT.MUMBAI && config.isProduction) {
      const owner = accounts[0];
      const crowdclickMockOracle = await deployCrowdclickMockOracle(owner);
      const crowdclickEscrow = await deployProxy(CrowdclickEscrow, [crowdclickMockOracle.address, minimumUsdWithdrawal, feePercentage, owner], { owner });
      console.log(`CrowdclickMockOracle address: ${crowdclickMockOracle.address}`);
      console.log(`crowdclickEscrow address: ${crowdclickEscrow.address}`);
    }
  }).catch((e) => {
    console.error(e);
  });
};
