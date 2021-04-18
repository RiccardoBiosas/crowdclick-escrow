const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const CrowdclickEscrow = artifacts.require('CrowdclickEscrow')
const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle')

const currencyApi  = require("../dao/api")
const config = require("../dao/environment")
const { minimumUsdWithdrawal, feePercentage } = config.contractDeployment.crowdclickEscrow

const deployCrowdclickMockOracle = async (owner) => {
  const currentBNBPrice = await currencyApi.fetchBNBToUSD()
  console.log(`current bnb price: ${currentBNBPrice}`)
  crowdclickMockOracle = await deployProxy(CrowdclickMockOracle, [currentEthPrice, deployer], { owner })
  return crowdclickMockOracle
}

module.exports = function(deployer, network, accounts) {
  deployer.then(async() => {
    if(config.networkEnvironment === config.NETWORK_ENVIRONMENT.BSC_TESTNET && config.isProduction) {
        const owner = accounts[0]
        const crowdclickMockOracle = await deployCrowdclickMockOracle(owner)
        crowdclickEscrow = await deployProxy(CrowdclickEscrow,[crowdclickMockOracleAddress, minimumUsdWithdrawal, feePercentage, owner], { owner }) 
        console.log(`CrowdclickMockOracle address: ${crowdclickMockOracle.address}`)
        console.log(`crowdclickEscrow address: ${crowdclickEscrow.address}`)
    }
  }).catch(e => {
    console.error(e)
  })
};
