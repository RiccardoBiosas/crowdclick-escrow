const { networkAddresses } = require("./environment")
const config = require("./environment")

const crowdclickEscrowData = {
    mockCampaigns: [
        {
          taskBudget: 0.080000,
          taskReward: 0.030000,
          currentBudget: 0.080000,
          url: 'https://ethereum.org/en/',
          isActive: true
        }
    ],
    minimumUsdWithdrawal: config.contractDeployment.crowdclickEscrow.minimumUsdWithdrawal,
    campaignFee: config.contractDeployment.crowdclickEscrow.feePercentage
}
  
const crowdclickChainlinkOracleData = Object.freeze({
    chainlinkAggregatorRinkebyAddress: networkAddresses.chainlinkAggregatorAddress,
    startTracking: ~~(Date.now() / 1000),
    trackingInterval: config.contractDeployment.crowdclickOracle.trackingInterval
})

const CAMPAIGN_OPERATION = Object.freeze({
    CAMPAIGN_CREATION: 'CAMPAIGN_CREATION',
    FORWARD_REWARD: 'FORWARD_REWARD',
    CAMPAIGN_WITHDRAWAL: 'CAMPAIGN_WITHDRAWAL'  
})

module.exports = {
    crowdclickEscrowData,
    crowdclickChainlinkOracleData,
    CAMPAIGN_OPERATION
}