const CrowdclickEscrow = artifacts.require('CrowdclickEscrow')
const CrowdclickOracle = artifacts.require('CrowdclickOracle')

const chainlinkAggregatorRinkebyAddress = '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e'
const startTracking = ~~(Date.now() / 1000)
const trackingInterval = 60 * 60 * 24 // time interval = 1 day

const minimumUsdWithdrawal = 4
const feePercentage = 10

const deployCrowdclickOracle = async deployer => {
  const crowdclickOracle = await deployer.deploy(CrowdclickOracle, chainlinkAggregatorRinkebyAddress, startTracking, trackingInterval)
  return crowdclickOracle
}

module.exports = function(deployer, network, accounts) {
  if(network.id === 1000000) {
    deployer.then(async() => {
      const crowdclickOracle = await deployCrowdclickOracle(deployer)
      const crowdclickEscrow = await deployer.deploy(CrowdclickEscrow, crowdclickOracle.address, minimumUsdWithdrawal, feePercentage, accounts[0])
      console.log(`crowdclickOracle address: ${crowdclickOracle.address}`)
      console.log(`crowdclickEscrow address: ${crowdclickEscrow.address}`)
    }).catch(e => {
      console.error(e)
    })
  }
};
