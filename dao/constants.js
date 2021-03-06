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
        },
        {
            uuid: uuidv4(),
            taskBudget: 1.80000,
            taskReward: 0.30000,
            currentBudget: 1.80000,
            url: 'https://ethereum.org/en/',
            isActive: true
        },
        {
            uuid: uuidv4(),
            taskBudget: 8.80000,
            taskReward: 0.30000,
            currentBudget: 8.80000,
            url: 'https://ethereum.org/en/',
            isActive: true
        },
        {
            uuid: uuidv4(),
            taskBudget: 10.80000,
            taskReward: 1.30000,
            currentBudget: 10.80000,
            url: 'https://stackoverflow.com/',
            isActive: true
        },
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