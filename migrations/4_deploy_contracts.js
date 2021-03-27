const CrowdclickEscrow = artifacts.require('CrowdclickEscrow')
const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle')

const currencyApi  = require("../dao/api")
const config = require("../dao/environment")
const { minimumUsdWithdrawal, feePercentage } = config.contractDeployment.crowdclickEscrow

const deployCrowdclickMockOracle = async (deployer, accounts) => {
  const currentBNBPrice = await currencyApi.fetchBNBToUSD()
  console.log(`current bnb price: ${currentBNBPrice}`)
  const crowdclickMockOracle = await deployer.deploy(CrowdclickMockOracle, currentBNBPrice, accounts[0])
  return crowdclickMockOracle
}

module.exports = function(deployer, network, accounts) {
  deployer.then(async() => {
    if(config.networkEnvironment === config.NETWORK_ENVIRONMENT.BSC_TESTNET && config.isProduction) {
        const crowdclickMockOracle = await deployCrowdclickMockOracle(deployer, accounts)
        const crowdclickEscrow = await deployer.deploy(CrowdclickEscrow, crowdclickMockOracle.address, minimumUsdWithdrawal, feePercentage, accounts[0])
        console.log(`CrowdclickMockOracle address: ${crowdclickMockOracle.address}`)
        console.log(`crowdclickEscrow address: ${crowdclickEscrow.address}`)
    }
  }).catch(e => {
    console.error(e)
  })
};
