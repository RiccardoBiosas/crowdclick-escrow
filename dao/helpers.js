const web3 = require('web3')
const { CAMPAIGN_OPERATION } = require('./constants')
const config = require('./environment')

const fromE18 = amount => parseFloat(web3.utils.fromWei(amount), 10)
const toE18 = amount =>  web3.utils.toWei(amount)

/* dirty way to take into account the gas fee */
const approximateEquality = (x, y, epsilon = 0.001) => {
  return Math.abs(x - y) < epsilon
}

const calculateFee = (amount, feePercentage) => {
  return amount / 100 * feePercentage
}

const bigNumbersAddition = (bigX, bigY) => {
  return fromE18(bigX) + fromE18(bigY)
}

const updateCampaign = (campaign, campaignFee, campaignOperation) => {
  let updatedCampaign = {
      ...campaign,
      taskBudget: campaign.taskBudget,
      taskReward: campaign.taskReward,
      currentBudget: campaign.currentBudget
  }
  switch(campaignOperation) {
    case CAMPAIGN_OPERATION.CAMPAIGN_CREATION:
      updatedCampaign = {
        ...updatedCampaign,
        currentBudget: +(updatedCampaign.taskBudget - campaignFee).toFixed(6)
      }
      break
    case CAMPAIGN_OPERATION.FORWARD_REWARD:
      updatedCampaign = {
        ...updatedCampaign,
        currentBudget: +(updatedCampaign.currentBudget - updatedCampaign.taskReward).toFixed(6)
      }
      break
    case CAMPAIGN_OPERATION.CAMPAIGN_WITHDRAWAL:
      updatedCampaign = {
        ...updatedCampaign,
        currentBudget: 0,
        isActive: false
      }
      break
    default:
      return updatedCampaign
  }
  return updatedCampaign
}

const toE18Campaign = (campaign) => {
  return {
    ...campaign,
    taskBudget: toE18(campaign.taskBudget.toString()),
    taskReward: toE18(campaign.taskReward.toString()),
    currentBudget: toE18(campaign.currentBudget.toString())
  }
}

const getCrowdclickChainlinkOracleEnv = (selectedNetwork) => {
  return Object.freeze({
    chainlink: config.networkContracts[selectedNetwork].chainlink,
    startTracking: ~~(Date.now() / 1000),
    trackingInterval: config.contractDeployment.crowdclickOracle.trackingInterval
  })
}

module.exports = {
  fromE18,
  toE18,
  approximateEquality,
  calculateFee,
  bigNumbersAddition,
  updateCampaign,
  toE18Campaign,
  getCrowdclickChainlinkOracleEnv
}
