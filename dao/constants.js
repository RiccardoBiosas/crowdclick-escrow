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
    minimumUsdWithdrawal: 4,
    campaignFee: 10
}
  
const crowdclickMockOracleData = {
    mockEthPrice: 2000
}

const crowdclickChainlinkOracleData = {
    chainlinkAggregatorRinkebyAddress: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    startTracking: ~~(Date.now() / 1000),
    trackingInterval: 60 * 60 * 24 // time interval = 1 day
}

const CAMPAIGN_OPERATION = {
    CAMPAIGN_CREATION: 'CAMPAIGN_CREATION',
    FORWARD_REWARD: 'FORWARD_REWARD',
    CAMPAIGN_WITHDRAWAL: 'CAMPAIGN_WITHDRAWAL'  
}

module.exports = {
    crowdclickEscrowData,
    crowdclickMockOracleData,
    crowdclickChainlinkOracleData,
    CAMPAIGN_OPERATION
}