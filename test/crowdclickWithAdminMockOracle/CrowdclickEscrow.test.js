const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { time } = require('@openzeppelin/test-helpers')
const CrowdclickEscrow = artifacts.require('CrowdclickEscrow')
const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle')
const { assert } = require('chai')
const { fromE18, approximateEquality, updateCampaign, calculateFee, toE18Campaign } = require('../../dao/helpers')
const { crowdclickEscrowData, crowdclickMockOracleData, CAMPAIGN_OPERATION } = require('../../dao/constants')
const currencyApi = require('../../dao/api')

const { 
  mockCampaigns,
  minimumUsdWithdrawal,
  campaignFee
} = crowdclickEscrowData

contract('CrowdclickEscrow contract with CrowdclickMockOracle as a data source', accounts => {
  const [ owner, publisher, user, feeCollector, secondUser ] = accounts

  /** contracts */
  let crowdclickEscrow, crowdclickMockOracle
  /** contracts' values */
  let crowdclickMockOracleAddress, currentEthPrice
  /** balances */
  let publisherWalletBalance, userWalletBalance, feeCollectorWalletBalance, publisherContractBalance, userContractbalance, secondUserContractBalance, secondUserWalletBalance
  let collectedFee = 0
  let currentCampaignsStatus = mockCampaigns

  before(async () => {
    currentEthPrice = await currencyApi.fetchEthToUSD()
    crowdclickMockOracle = await deployProxy(CrowdclickMockOracle, [currentEthPrice, owner], { owner })
    crowdclickMockOracleAddress = crowdclickMockOracle.address
    console.log('crowdclickMockOracleAddress',crowdclickMockOracleAddress)
    crowdclickEscrow = await deployProxy(CrowdclickEscrow,[crowdclickMockOracleAddress, minimumUsdWithdrawal, campaignFee,feeCollector], { owner })
 
  })

  
  context("Check deployment's data", () => {
      it('should show the mockEthPrice value as the currentEthUsdPrice', async() => {
          assert.equal(fromE18((await crowdclickMockOracle.getUnderlyingUsdPriceFeed())), currentEthPrice, 'wrong pricefeed')
        })

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
          campaign.uuid,
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
          campaign.uuid,
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
        userWalletBalance = fromE18(await web3.eth.getBalance(user)) + userContractbalance
        await crowdclickEscrow.withdrawUserBalance({ from: user })
        assert.isTrue(
          approximateEquality(fromE18(await web3.eth.getBalance(user)), userWalletBalance, 0.003)
        )
      })
    
      it('should show the correct campaign stats given the url associated to the campaign', async () => {
        const { uuid, ...campaign } = currentCampaignsStatus[0]
        const fetchedCampaign = await crowdclickEscrow.lookupTask(
            uuid,
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
        await crowdclickEscrow.withdrawFromCampaign(campaign.uuid, {
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

      it('publisher creates a second campaign successfully', async() => {
        const campaign = currentCampaignsStatus[1]
        const e18Campaign = toE18Campaign(campaign)
        await crowdclickEscrow.openTask(
          campaign.uuid,
          e18Campaign.taskBudget,
          e18Campaign.taskReward,
          e18Campaign.url,
          {
            from: publisher,
            value: e18Campaign.taskBudget
          }
        )

        const updatedCampaign = updateCampaign(campaign, calculateFee(campaign.taskBudget, campaignFee), CAMPAIGN_OPERATION.CAMPAIGN_CREATION)
        currentCampaignsStatus[1] = updatedCampaign
        publisherContractBalance = updatedCampaign.currentBudget
  
        assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisher balance')   
      })

      it(`it should forward the reward for the newly created task and update the user's balance accordingly`, async() => {
        const campaign =  currentCampaignsStatus[1]
        await crowdclickEscrow.forwardRewards(
          secondUser,
          publisher,
          campaign.uuid,
          {
            from: owner
          }
        )
        secondUserContractBalance = campaign.taskReward
        publisherContractBalance -= campaign.taskReward
        currentCampaignsStatus[1] = updateCampaign(campaign, calculateFee(campaign.taskBudget, campaignFee), CAMPAIGN_OPERATION.FORWARD_REWARD)
        assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), secondUserContractBalance, 'wrong user balance')
      })

      it(`admin should be able to to close a campaign and forward to the publisher the remaining campaign's balance on publisher's behalf`, async () => {
        publisherWalletBalance = 
        fromE18(await web3.eth.getBalance(publisher)) +
        publisherContractBalance

        const campaign =  currentCampaignsStatus[1]
        await crowdclickEscrow.adminPublisherWithdrawal(
          campaign.uuid,
          publisher,
          {
            from: owner
          }
        )

        assert.equal(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), 0, `wrong publisher contract's balance`)
        assert.isTrue(
          approximateEquality(
              fromE18(await web3.eth.getBalance(publisher)),
              publisherWalletBalance,
            0.003
          ),
          `wrong publisher wallet's balance`
        )
      })

      it(`admin should be able to forward all the user's earned rewards on user's behalf`, async () => {
        secondUserWalletBalance = fromE18(await web3.eth.getBalance(secondUser)) + secondUserContractBalance
        secondUserContractBalance = 0
        await crowdclickEscrow.adminUserWithdrawal(
          secondUser,
          { from: owner }
        )
        assert.isTrue(
          approximateEquality(fromE18(await web3.eth.getBalance(secondUser)),secondUserWalletBalance, 0.003)
        )
      })

      it('publisher creates a third campaign with the same url as the first campaign', async() => {
        const campaign = currentCampaignsStatus[2]
        const e18Campaign = toE18Campaign(campaign)
        await crowdclickEscrow.openTask(
          campaign.uuid,
          e18Campaign.taskBudget,
          e18Campaign.taskReward,
          e18Campaign.url,
          {
            from: publisher,
            value: e18Campaign.taskBudget
          }
        )

        const updatedCampaign = updateCampaign(campaign, calculateFee(campaign.taskBudget, campaignFee), CAMPAIGN_OPERATION.CAMPAIGN_CREATION)
        currentCampaignsStatus[2] = updatedCampaign
        publisherContractBalance = updatedCampaign.currentBudget
  
        assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisher balance')   
      })

      it(`it should forward the third campaign's reward to secondUser, update secondUser's contract balance accordingly and allow secondUser to withdraw to their wallet`, async() => {
        const campaign =  currentCampaignsStatus[2]
        await crowdclickEscrow.forwardRewards(
          secondUser,
          publisher,
          campaign.uuid,
          {
            from: owner
          }
        )
        secondUserContractBalance += campaign.taskReward
        publisherContractBalance -= campaign.taskReward
        currentCampaignsStatus[2] = updateCampaign(campaign, calculateFee(campaign.taskBudget, campaignFee), CAMPAIGN_OPERATION.FORWARD_REWARD)
        assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), secondUserContractBalance, 'wrong user balance')

        secondUserWalletBalance = fromE18(await web3.eth.getBalance(secondUser)) + secondUserContractBalance
        await crowdclickEscrow.withdrawUserBalance({ from: secondUser })
        secondUserContractBalance = 0
        assert.isTrue(
          approximateEquality(fromE18(await web3.eth.getBalance(secondUser)), secondUserWalletBalance, 0.003)
        )
      })

      it(`should fail: user tries to withdraw twice in the same day`, async() => {
        try {
          const campaign =  currentCampaignsStatus[2]
          await crowdclickEscrow.forwardRewards(
            secondUser,
            publisher,
            campaign.uuid,
            {
              from: owner
            }
          )
          secondUserContractBalance += campaign.taskReward
          publisherContractBalance -= campaign.taskReward
          currentCampaignsStatus[2] = updateCampaign(campaign, calculateFee(campaign.taskBudget, campaignFee), CAMPAIGN_OPERATION.FORWARD_REWARD)
          assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), secondUserContractBalance, 'wrong user balance')
          secondUserWalletBalance = fromE18(await web3.eth.getBalance(secondUser)) + secondUserContractBalance
          await crowdclickEscrow.withdrawUserBalance({ from: secondUser })
          assert.isTrue(
            approximateEquality(fromE18(await web3.eth.getBalance(secondUser)), secondUserWalletBalance, 0.003)
          )
        } catch(error) {
          assert.equal(error.reason, 'DAILY_WITHDRAWALS_EXCEEDED')
        }
      })

      it(`secondUser can withdraw again after one day since the last withdrawal`, async() => {
        const aBitMoreThanAday = (60 * 60 * 26)
        const target = +(await time.latest()).toString() + aBitMoreThanAday
        await time.increase(target)
        secondUserWalletBalance = fromE18(await web3.eth.getBalance(secondUser)) + secondUserContractBalance
        await crowdclickEscrow.withdrawUserBalance({ from: secondUser })
        secondUserContractBalance = 0
        assert.isTrue(
          approximateEquality(fromE18(await web3.eth.getBalance(secondUser)), secondUserWalletBalance, 0.003)
        )
      })
  })
})
