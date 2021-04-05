const { v4: uuidv4 } = require('uuid');
const config = require("./environment")

const crowdclickEscrowData = {
    mockCampaigns: [
        {
          uuid: uuidv4(),
          taskBudget: 0.080000,
          taskReward: 0.030000,
          currentBudget: 0.080000,
          url: 'https://ethereum.org/en/',
          isActive: true
        },
        {
            uuid: uuidv4(),
            taskBudget: 0.060000,
            taskReward: 0.010000,
            currentBudget: 0.060000,
            url: 'https://cardano.org/',
            isActive: true
          }
    ],
    minimumUsdWithdrawal: config.contractDeployment.crowdclickEscrow.minimumUsdWithdrawal,
    campaignFee: config.contractDeployment.crowdclickEscrow.feePercentage
}
  
const CAMPAIGN_OPERATION = Object.freeze({
    CAMPAIGN_CREATION: 'CAMPAIGN_CREATION',
    FORWARD_REWARD: 'FORWARD_REWARD',
    CAMPAIGN_WITHDRAWAL: 'CAMPAIGN_WITHDRAWAL'  
})

module.exports = {
    crowdclickEscrowData,
    CAMPAIGN_OPERATION
}