const CrowdclickEscrow = artifacts.require('CrowdclickEscrow')
const CrowdclickOracle = artifacts.require('CrowdclickOracle')
const config = require("../dao/environment")

const { minimumUsdWithdrawal, feePercentage } = config.contractDeployment.crowdclickEscrow
const { trackingInterval } = config.contractDeployment.crowdclickOracle
const { chainlink } = config.networkContracts[config.networkEnvironment]
const startTracking = ~~(Date.now() / 1000)

const deployCrowdclickOracle = async deployer => {
  const crowdclickOracle = await deployer.deploy(CrowdclickOracle, chainlink, startTracking, trackingInterval)
  return crowdclickOracle
}

module.exports = function(deployer, network, accounts) {
  if(config.isProduction) {
    deployer.then(async() => {
      const crowdclickOracle = await deployCrowdclickOracle(deployer)
      const crowdclickEscrow = await deployer.deploy(CrowdclickEscrow, crowdclickOracle.address, minimumUsdWithdrawal, feePercentage, accounts[0])
      console.log(`CrowdclickOracle address: ${crowdclickOracle.address}`)
      console.log(`CrowdclickEscrow address: ${crowdclickEscrow.address}`)
    }).catch(e => {
      console.error(e)
    })
  }
};
