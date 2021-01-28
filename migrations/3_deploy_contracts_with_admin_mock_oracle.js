const CrowdclickEscrow = artifacts.require('CrowdclickEscrow')
const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle')

const minimumUsdWithdrawal = 4
const feePercentage = 10
const mockEthPrice = 2000

const deployCrowdclickMockOracle = async (deployer, accounts) => {
  const crowdclickMockOracle = await deployer.deploy(CrowdclickMockOracle, mockEthPrice, accounts[0])
  return crowdclickMockOracle
}

module.exports = function(deployer, network, accounts) {
  deployer.then(async() => {
    const crowdclickMockOracle = await deployCrowdclickMockOracle(deployer, accounts)
    const crowdclickEscrow = await deployer.deploy(CrowdclickEscrow, crowdclickMockOracle.address, minimumUsdWithdrawal, feePercentage, accounts[0])
    console.log(`CrowdclickMockOracle address: ${crowdclickMockOracle.address}`)
    console.log(`crowdclickEscrow address: ${crowdclickEscrow.address}`)
  }).catch(e => {
    console.error(e)
  })
};
