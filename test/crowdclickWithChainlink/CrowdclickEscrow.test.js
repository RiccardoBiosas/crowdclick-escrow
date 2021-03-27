const CrowdclickEscrow = artifacts.require('CrowdclickEscrow')
const CrowdclickOracle = artifacts.require('CrowdclickOracle')
const { assert } = require('chai')
const { fromE18, approximateEquality, updateCampaign, calculateFee, toE18Campaign } = require('../../dao/helpers')
const { crowdclickEscrowData, CAMPAIGN_OPERATION } = require('../../dao/constants')
const { getCrowdclickChainlinkOracleEnv } = require('../../dao/helpers')
const config = require('../../dao/environment')

const {
  chainlink, 
  startTracking, 
  trackingInterval 
} = getCrowdclickChainlinkOracleEnv(config.networkEnvironment)

const { 
  mockCampaigns,
  minimumUsdWithdrawal,
  campaignFee
} = crowdclickEscrowData

contract('CrowdclickEscrow contract with CrowdclickOracle (with chainlink) as a data source', accounts => {
  const [ owner, publisher, user, feeCollector ] = accounts

  /** contracts */
  let crowdclickEscrow, crowdclickOracle, crowdclickOracleAddress
  /** balances */
  let publisherWalletBalance, userWalletBalance, feeCollectorWalletBalance, publisherContractBalance, userContractbalance
  let collectedFee = 0
  let currentCampaignsStatus = mockCampaigns


  before(async () => {
      crowdclickOracle = await CrowdclickOracle.new(chainlink, startTracking, trackingInterval, { from: owner })
      crowdclickOracleAddress = crowdclickOracle.address
      crowdclickEscrow = await CrowdclickEscrow.new(crowdclickOracleAddress, minimumUsdWithdrawal, campaignFee, feeCollector, { from: owner })
  })

  context("Check deployment's data", () => {
    it('should show 0 as the initial contract balance of the publisher', async () => {
      assert.equal(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), 0, 'wrong publisher balance')
    })
  
    it('should show 0 as the initial contract balance of the user', async () => {
      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(user)), 0, 'wrong user balance')
    })
  
    it('should show 100 as the initial wallet balance of the feeCollector', async () => {
      feeCollectorWalletBalance = fromE18(await web3.eth.getBalance(feeCollector))
      assert.equal(feeCollectorWalletBalance, 100,  'wrong feeCollector balance')
    })

    it('should show 0 as the initial collectedFee value', async () => {
      assert.equal(await crowdclickEscrow.collectedFee.call(), collectedFee, 'wrong collectedFee')
    })
})

context("CrowdclickEscrow's lifecycle", () => {
    it("should show the publisher's contract balance as equal to the budget of the first publisher's task being created", async () => {
      const campaign = currentCampaignsStatus[0]
      const e18Campaign = toE18Campaign(campaign)
      await crowdclickEscrow.openTask(
        e18Campaign.taskBudget,
        e18Campaign.taskReward,
        e18Campaign.url,
        {
          from: publisher,
          value: e18Campaign.taskBudget
        }
      )
      const updatedCampaign = updateCampaign(campaign, calculateFee(campaign.taskBudget, campaignFee), CAMPAIGN_OPERATION.CAMPAIGN_CREATION)
      currentCampaignsStatus[0] = updatedCampaign
      publisherContractBalance = updatedCampaign.currentBudget

      assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisher balance')        
    })
  
    it("should show the updated collectedFee value", async() => {
      const campaign = currentCampaignsStatus[0]
      collectedFee = collectedFee + calculateFee(campaign.taskBudget, campaignFee)

      assert.equal(fromE18(await crowdclickEscrow.collectedFee.call()), collectedFee, 'wrong collectedFee')
    })
  
    it("should forward the reward for the previously created task and increase the user's contract balance by an amount equal to the campaign's reward", async () => {
      const campaign =  currentCampaignsStatus[0]
      await crowdclickEscrow.forwardRewards(
        user,
        publisher,
        campaign.url,
        {
          from: owner
        }
      )
      userContractbalance = campaign.taskReward
      currentCampaignsStatus[0] = updateCampaign(campaign, calculateFee(campaign.taskBudget, campaignFee), CAMPAIGN_OPERATION.FORWARD_REWARD)
      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(user)), userContractbalance, 'wrong user balance')
    })
  
    it("should show the publisher's contract balance as the initially allocated campaign budget minus the previously forwarded reward", async () => {
      publisherContractBalance = publisherContractBalance - userContractbalance
      assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisher balance')
    })
  
    it("should allow the user to withdraw their earned balance", async () => {
      const campaign = toE18Campaign(currentCampaignsStatus[0])
      userWalletBalance = fromE18(await web3.eth.getBalance(user)) +userContractbalance
      await crowdclickEscrow.withdrawUserBalance(
        campaign.taskReward,
        { from: user }
      )
      assert.isTrue(
        approximateEquality(fromE18(await web3.eth.getBalance(user)),userWalletBalance, 0.003)
      )
    })
  
    it('should show the correct campaign stats given the url associated to the campaign', async () => {
      const campaign = currentCampaignsStatus[0]
      const fetchedCampaign = await crowdclickEscrow.lookupTask(
          campaign.url,
        {
          from: publisher
        }
      )
      const fetchedCampaignToEthereum = {
        taskBudget: +fromE18(fetchedCampaign.taskBudget).toFixed(6),
        taskReward: +fromE18(fetchedCampaign.taskReward).toFixed(6),
        currentBudget: +fromE18(fetchedCampaign.currentBudget).toFixed(6),
        url: fetchedCampaign.url,
        isActive: fetchedCampaign.isActive
      }
      assert.deepEqual(fetchedCampaignToEthereum, campaign)
    })
  
    it("should allow the publisher to withdraw the remaining allocated budget from the campaign", async () => {
      const campaign = currentCampaignsStatus[0]  
      publisherWalletBalance = 
        fromE18(await web3.eth.getBalance(publisher)) +
        publisherContractBalance
      await crowdclickEscrow.withdrawFromCampaign(campaign.url, {
        from: publisher
      })
      assert.isTrue(
        approximateEquality(
            fromE18(await web3.eth.getBalance(publisher)),
            publisherWalletBalance,
          0.003
        )
      )
    })

    it('should fail: non-feeCollector tries to collect accrued fees', async() => {
      try {
          await crowdclickEscrow.collectFee({ from: user })
      } catch(e) {
          assert.equal(e.reason, 'NOT_FEE_COLLECTOR')  
      }
    })

    it('should allow feeCollector to collect accrued fees and subsequently set the collectedFee to zero', async() => {
      feeCollectorWalletBalance = feeCollectorWalletBalance + collectedFee
      collectedFee = 0
      await crowdclickEscrow.collectFee({ from: feeCollector })
      assert.equal(fromE18(await crowdclickEscrow.collectedFee.call()), collectedFee, 'wrong collectedFee')
    })

    it("should show the updated feeCollector's wallet balance after successful withdrawal of the accrued fees", async() => {
      assert.isTrue(
          approximateEquality(
              fromE18(await web3.eth.getBalance(feeCollector)), 
              feeCollectorWalletBalance, 
              0.003
            ),
            'wrong feeCollector balance'
        )
    })
  })
})
