const truffleAssert = require('truffle-assertions');
const { time } = require('@openzeppelin/test-helpers');

const CrowdclickEscrow = artifacts.require('CrowdclickEscrow');
const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle');
const { assert } = require('chai');
const {
  fromE18, approximateEquality, updateCampaign, calculateFee, toE18Campaign, toE18,
} = require('../../dao/helpers');
const { crowdclickEscrowData, CAMPAIGN_OPERATION } = require('../../dao/constants');
const currencyApi = require('../../dao/api');

const {
  mockCampaigns,
  minimumUsdWithdrawal,
  campaignFee,
} = crowdclickEscrowData;

contract('CrowdclickEscrow contract with CrowdclickMockOracle as a data source', (accounts) => {
  const [owner, publisher, user, feeCollector, secondUser, secondPublisher] = accounts;

  /** contracts */
  let crowdclickEscrow; let
    crowdclickMockOracle;
  /** contracts' values */
  let crowdclickMockOracleAddress; let
    currentUnderlying;
  /** balances */
  let publisherWalletBalance;
  let userWalletBalance;
  let feeCollectorWalletBalance;
  let publisherContractBalance;
  let secondPublisherContractBalance;
  let userContractbalance;
  let secondUserContractBalance;
  let secondUserWalletBalance;
  let collectedFee = 0;
  const currentCampaignsStatus = mockCampaigns;

  before(async () => {
    currentUnderlying = await currencyApi.fetchMaticToUSD();
    console.log(`current underlying value: ${currentUnderlying}`)
    const currentUnderlyingToWei = toE18(currentUnderlying.toString());
    crowdclickMockOracle = await CrowdclickMockOracle.new(currentUnderlyingToWei, owner, { from: owner });
    crowdclickMockOracleAddress = crowdclickMockOracle.address;
    crowdclickEscrow = await CrowdclickEscrow.new(crowdclickMockOracleAddress, minimumUsdWithdrawal, campaignFee, feeCollector, { from: owner });
  });

  context("Check deployment's data", () => {
    it('should show the mockEthPrice value as the currentEthUsdPrice', async () => {
      assert.equal(fromE18((await crowdclickMockOracle.getUnderlyingUsdPriceFeed())), currentUnderlying, 'wrong pricefeed');
    });

    it('should show 0 as the initial contract balance of the publisher', async () => {
      assert.equal(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), 0, 'wrong publisher balance');
    });

    it('should show 0 as the initial contract balance of the user', async () => {
      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(user)), 0, 'wrong user balance');
    });

    it('should show 100 as the initial wallet balance of the feeCollector', async () => {
      feeCollectorWalletBalance = fromE18(await web3.eth.getBalance(feeCollector));
      assert.equal(feeCollectorWalletBalance, 100, 'wrong feeCollector balance');
    });

    it('should show 0 as the initial collectedFee value', async () => {
      assert.equal(await crowdclickEscrow.collectedFee.call(), collectedFee, 'wrong collectedFee');
    });
  });

  context("CrowdclickEscrow's lifecycle", () => {
    it(`should show the publisher's contract balance as equal to the budget of the first publisher's task being created and should show the correct campaign stats`, async () => {
      const campaign = currentCampaignsStatus[0];
      const e18Campaign = toE18Campaign(campaign);
      await crowdclickEscrow.openTask(
        campaign.uuid,
        e18Campaign.taskBudget,
        e18Campaign.taskReward,
        e18Campaign.url,
        {
          from: publisher,
          value: e18Campaign.taskBudget,
        },
      );
      const updatedCampaign = updateCampaign(campaign, 0, CAMPAIGN_OPERATION.CAMPAIGN_CREATION);
      currentCampaignsStatus[0] = updatedCampaign;
      publisherContractBalance = updatedCampaign.currentBudget;
      
      const createdCampaign = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );
      const parsedCeatedCampaign = {
        taskBudget: +fromE18(createdCampaign.taskBudget).toFixed(6),
        taskReward: +fromE18(createdCampaign.taskReward).toFixed(6),
        currentBudget: +fromE18(createdCampaign.currentBudget).toFixed(6),
        url: createdCampaign.url,
        isActive: createdCampaign.isActive,
      };

      const { uuid, ...updatedCampaigncampaignComparison } = currentCampaignsStatus[0];

      assert.deepEqual(parsedCeatedCampaign, updatedCampaigncampaignComparison);
      assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisherbalance');
    });

    it("should forward the reward for the previously created task and increase the user's contract balance by an amount equal to the campaign's reward", async () => {
      const campaign = currentCampaignsStatus[0];
      const tx = await crowdclickEscrow.forwardRewards(
        user,
        publisher,
        campaign.uuid,
        {
          from: owner,
        },
      );
      await truffleAssert.eventEmitted(tx, 'RewardForwarded', (ev) => {
        console.log(`###RewardForwarded### recipient: ${ev.recipient}, reward: ${ev.reward.toString()}, campaignUrl: ${ev.campaignUrl}`);
        return ev.recipient === user && +ev.reward.toString() === +toE18(campaign.taskReward.toString()) && ev.campaignUrl === campaign.url;
      });
      userContractbalance = campaign.taskReward;
      currentCampaignsStatus[0] = updateCampaign(campaign, campaign.currentBudget, CAMPAIGN_OPERATION.FORWARD_REWARD);
      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(user)), userContractbalance, 'wrong user balance');
    });

    it("should show the publisher's contract balance as the initially allocated campaign budget minus the previously forwarded reward", async () => {
      publisherContractBalance -= userContractbalance;
      assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisher balance');
    });

    it('should allow the user to withdraw their earned balance', async () => {
      const fee = calculateFee(+fromE18(await crowdclickEscrow.balanceOfUser(user)), campaignFee);
      userWalletBalance = fromE18(await web3.eth.getBalance(user)) + userContractbalance - fee;
      collectedFee += fee
      assert.notEqual(fromE18(await crowdclickEscrow.balanceOfUser(user)), 0);

      const tx = await crowdclickEscrow.withdrawUserBalance({ from: user });

      await truffleAssert.eventEmitted(tx, 'UserWithdrawalEmitted', (ev) => {
        return ev.recipient === user && +ev.amount.toString() === +toE18((userContractbalance - fee).toString());
      });
      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(user)), 0, 'wrong user contract balance');
      assert.isTrue(
        approximateEquality(fromE18(await web3.eth.getBalance(user)), userWalletBalance, 0.001), 'wrong user wallet balance',
      );
    });

    it(`should show the updated collectedFee value after the user's withdrawal`, async () => {
      assert.isTrue(
        approximateEquality(fromE18(await crowdclickEscrow.collectedFee.call()), collectedFee, 0.0003), 'wrong collected fee');
    });

    it('should show the correct campaign stats given the url associated to the campaign', async () => {
      const { uuid, ...campaign } = currentCampaignsStatus[0];
      const fetchedCampaign = await crowdclickEscrow.lookupTask(
        uuid,
        publisher
      );
      const fetchedCampaignToEthereum = {
        taskBudget: +fromE18(fetchedCampaign.taskBudget).toFixed(6),
        taskReward: +fromE18(fetchedCampaign.taskReward).toFixed(6),
        currentBudget: +fromE18(fetchedCampaign.currentBudget).toFixed(6),
        url: fetchedCampaign.url,
        isActive: fetchedCampaign.isActive,
      };
      assert.deepEqual(fetchedCampaignToEthereum, campaign);
    });

    it('should allow the publisher to withdraw the remaining allocated budget from the campaign', async () => {
      const campaign = currentCampaignsStatus[0];

      const campaignBeforeWithdrawal = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );
      assert.isTrue(campaignBeforeWithdrawal.isActive);
      assert.notEqual(campaignBeforeWithdrawal.currentBudget, 0, 'wrong campaign.currentBudget before publisher\'s withdrawal');

      publisherWalletBalance = fromE18(await web3.eth.getBalance(publisher))
            + publisherContractBalance;
      await crowdclickEscrow.withdrawFromCampaign(campaign.uuid, {
        from: publisher,
      });
      const campaignAfterWithdrawal = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );
      assert.isFalse(campaignAfterWithdrawal.isActive, 'wrong campaign.isActive value after publisher\'s withdrawal');
      assert.equal(campaignAfterWithdrawal.currentBudget, 0, 'wrong campaign.currentBudget after publisher\'s withdrawal');
      assert.isTrue(
        approximateEquality(
          fromE18(await web3.eth.getBalance(publisher)),
          publisherWalletBalance,
          0.003,
        ),
      );
    });

    it('should fail: non-feeCollector tries to collect accrued fees', async () => {
      try {
        await crowdclickEscrow.collectFee({ from: user });
      } catch (e) {
        assert.equal(e.reason, 'NOT_FEE_COLLECTOR');
      }
    });

    it('should allow feeCollector to collect accrued fees and subsequently set the collectedFee to zero', async () => {
      feeCollectorWalletBalance += collectedFee;
      collectedFee = 0;
      await crowdclickEscrow.collectFee({ from: feeCollector });
      assert.equal(fromE18(await crowdclickEscrow.collectedFee.call()), collectedFee, 'wrong collectedFee');
    });

    it("should show the updated feeCollector's wallet balance after successful withdrawal of the accrued fees", async () => {
      assert.isTrue(
        approximateEquality(
          fromE18(await web3.eth.getBalance(feeCollector)),
          feeCollectorWalletBalance,
          0.003,
        ),
        'wrong feeCollector balance',
      );
    });

    it('publisher creates a second campaign successfully', async () => {
      const campaign = currentCampaignsStatus[1];
      const e18Campaign = toE18Campaign(campaign);
      await crowdclickEscrow.openTask(
        campaign.uuid,
        e18Campaign.taskBudget,
        e18Campaign.taskReward,
        e18Campaign.url,
        {
          from: publisher,
          value: e18Campaign.taskBudget,
        },
      );

      const updatedCampaign = updateCampaign(campaign, 0, CAMPAIGN_OPERATION.CAMPAIGN_CREATION);
      currentCampaignsStatus[1] = updatedCampaign;
      publisherContractBalance = updatedCampaign.currentBudget;

      const createdCampaign = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );
      const parsedCeatedCampaign = {
        taskBudget: +fromE18(createdCampaign.taskBudget).toFixed(6),
        taskReward: +fromE18(createdCampaign.taskReward).toFixed(6),
        currentBudget: +fromE18(createdCampaign.currentBudget).toFixed(6),
        url: createdCampaign.url,
        isActive: createdCampaign.isActive,
      };

      const { uuid, ...updatedCampaigncampaignComparison } = currentCampaignsStatus[1];

      assert.deepEqual(parsedCeatedCampaign, updatedCampaigncampaignComparison);
      assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisher balance');
    });

    it('it should forward the reward for the newly created task and update the user\'s balance accordingly', async () => {
      const campaign = currentCampaignsStatus[1];

      const campaignBeforeForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );

      const tx = await crowdclickEscrow.forwardRewards(
        secondUser,
        publisher,
        campaign.uuid,
        {
          from: owner,
        },
      );
      await truffleAssert.eventEmitted(tx, 'RewardForwarded', (ev) => {
        console.log(`###RewardForwarded### recipient: ${ev.recipient}, reward: ${ev.reward.toString()}, campaignUrl: ${ev.campaignUrl.toString()}`);
        return ev.recipient === secondUser && +ev.reward.toString() === +toE18(campaign.taskReward.toString()) && ev.campaignUrl === campaign.url;
      });
      const campaignAfterForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );

      assert.equal(+campaignAfterForward.currentBudget, +campaignBeforeForward.currentBudget - +campaignAfterForward.taskReward, 'wrong campaign.currentBudget after forwardRewards');
      assert.isTrue(+campaignAfterForward.currentBudget > +campaignAfterForward.taskReward)
      assert.isTrue(campaignAfterForward.isActive)
      secondUserContractBalance = campaign.taskReward;
      publisherContractBalance -= campaign.taskReward;
      currentCampaignsStatus[1] = updateCampaign(campaign, campaign.currentBudget, CAMPAIGN_OPERATION.FORWARD_REWARD);
      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), secondUserContractBalance, 'wrong user balance');
    });

    it('admin should be able to to close a campaign and forward to the publisher the remaining campaign\'s balance on publisher\'s behalf', async () => {
      publisherWalletBalance = fromE18(await web3.eth.getBalance(publisher))
          + publisherContractBalance;

      const campaign = currentCampaignsStatus[1];

      const campaignBeforeWithdrawal = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );

      assert.isTrue(campaignBeforeWithdrawal.isActive);
      assert.notEqual(campaignBeforeWithdrawal.currentBudget, 0, 'wrong campaign.currentBudget before adminPublisherWithdrawal');

      await crowdclickEscrow.adminPublisherWithdrawal(
        campaign.uuid,
        publisher,
        {
          from: owner,
        },
      );
      const campaignAfterWithdrawal = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );

      assert.isFalse(campaignAfterWithdrawal.isActive, 'wrong campaign.isActive value after adminPublisherWithdrawal');
      assert.equal(campaignAfterWithdrawal.currentBudget, 0, 'wrong campaign.currentBudget after adminPublisherWithdrawal');
      assert.equal(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), 0, 'wrong publisher contract\'s balance');
      assert.isTrue(
        approximateEquality(
          fromE18(await web3.eth.getBalance(publisher)),
          publisherWalletBalance,
          0.003,
        ),
        `wrong publisher wallet's balance`,
      );
    });

    it('admin should be able to forward all the user\'s earned rewards on user\'s behalf', async () => {
      assert.notEqual(fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), 0, 'wrong user\'s balance before adminUserWithdrawal');

      secondUserWalletBalance = fromE18(await web3.eth.getBalance(secondUser)) + secondUserContractBalance;
      secondUserContractBalance = 0;
      await crowdclickEscrow.adminUserWithdrawal(
        secondUser,
        { from: owner },
      );

      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), 0, 'wrong user\'s balance after adminUserWithdrawal');
      assert.isTrue(
        approximateEquality(fromE18(await web3.eth.getBalance(secondUser)), secondUserWalletBalance, 0.003),
      );
    });

    it('publisher creates a third campaign with the same url as the first campaign', async () => {
      const campaign = currentCampaignsStatus[2];
      const e18Campaign = toE18Campaign(campaign);
      await crowdclickEscrow.openTask(
        campaign.uuid,
        e18Campaign.taskBudget,
        e18Campaign.taskReward,
        e18Campaign.url,
        {
          from: publisher,
          value: e18Campaign.taskBudget,
        },
      );

      const updatedCampaign = updateCampaign(campaign, 0, CAMPAIGN_OPERATION.CAMPAIGN_CREATION);
      currentCampaignsStatus[2] = updatedCampaign;
      publisherContractBalance = updatedCampaign.currentBudget;

      assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisher balance');
    });

    it(`it should forward the third campaign's reward to secondUser, update secondUser's contract balance accordingly and allow secondUser to withdraw to their wallet`, async () => {
      const campaign = currentCampaignsStatus[2];
      await crowdclickEscrow.forwardRewards(
        secondUser,
        publisher,
        campaign.uuid,
        {
          from: owner,
        },
      );
      secondUserContractBalance += campaign.taskReward;
      publisherContractBalance -= campaign.taskReward;
      currentCampaignsStatus[2] = updateCampaign(campaign, campaign.currentBudget, CAMPAIGN_OPERATION.FORWARD_REWARD);
      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), secondUserContractBalance, 'wrong user balance');

      const fee = calculateFee(+fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), campaignFee);
      secondUserWalletBalance = fromE18(await web3.eth.getBalance(secondUser)) + secondUserContractBalance - fee;
      console.log('')
      collectedFee += fee;
      const tx = await crowdclickEscrow.withdrawUserBalance({ from: secondUser });
      await truffleAssert.eventEmitted(tx, 'UserWithdrawalEmitted', (ev) => {
        console.log(`###UserWithdrawalEmitted### recipient: ${ev.recipient}, amount: ${ev.amount.toString()}`);
        return ev.recipient === secondUser && +ev.amount.toString() === +toE18((secondUserContractBalance - fee).toString());
      });
      secondUserContractBalance = 0;
      assert.equal(fromE18(await crowdclickEscrow.balanceOfUser(secondUser)), 0, `wrong secondUser's contract balance`);
      console.log('fromE18(await web3.eth.getBalance(secondUser) ', fromE18(await web3.eth.getBalance(secondUser)))
      console.log('secondUserWalletBalance ', secondUserWalletBalance)
      assert.isTrue(
        approximateEquality(fromE18(await web3.eth.getBalance(secondUser)), secondUserWalletBalance, 0.001),
        `wrong secondUser's wallet balance`
      );
    });

    it(`should show the updated collectedFee value after the secondUser's withdrawal`, async () => {
      assert.equal(fromE18(await crowdclickEscrow.collectedFee.call()), collectedFee, 'wrong collectedFee');
    });

    it('should fail: user tries to withdraw twice in the same day', async () => {
      try {
        const campaign = currentCampaignsStatus[2];
        await crowdclickEscrow.forwardRewards(
          secondUser,
          publisher,
          campaign.uuid,
          {
            from: owner,
          },
        );

        secondUserContractBalance += campaign.taskReward;
        publisherContractBalance -= campaign.taskReward;
        currentCampaignsStatus[2] = updateCampaign(campaign, campaign.currentBudget, CAMPAIGN_OPERATION.FORWARD_REWARD);

        secondUserWalletBalance = fromE18(await web3.eth.getBalance(secondUser)) + secondUserContractBalance;
        await crowdclickEscrow.withdrawUserBalance({ from: secondUser });
      } catch (error) {
        assert.equal(error.reason, 'DAILY_WITHDRAWALS_EXCEEDED');
      }
    });

    it('should fail: only owner can change maximumWeiUserWithdrawal', async () => {
      try {
        await crowdclickEscrow.changeMaximumWeiUserWithdrawal('300000000000000000', { from: user });
      } catch (error) {
        assert.equal(error.reason, 'Ownable: caller is not the owner');
      }
    });

    it('owner can change maximumWeiUserWithdrawal', async () => {
      const updatedMaximumWeiUserWithdrawal = '300000000000000000';
      await crowdclickEscrow.changeMaximumWeiUserWithdrawal(updatedMaximumWeiUserWithdrawal, { from: owner });
      const currentMaximumWeiUserWithdrawal = await crowdclickEscrow.maximumWeiUserWithdrawal.call();
      assert.equal(updatedMaximumWeiUserWithdrawal, currentMaximumWeiUserWithdrawal.toString(), 'wrong maximumWeiUserWithdrawal');
    });

    it(`publisher creates the fourth contract campaign with the same url as the first contract campaign`, async () => {
      const campaign = currentCampaignsStatus[3];
      const e18Campaign = toE18Campaign(campaign);
      await crowdclickEscrow.openTask(
        campaign.uuid,
        e18Campaign.taskBudget,
        e18Campaign.taskReward,
        e18Campaign.url,
        {
          from: publisher,
          value: e18Campaign.taskBudget,
        },
      );

      const updatedCampaign = updateCampaign(campaign, 0, CAMPAIGN_OPERATION.CAMPAIGN_CREATION);
      currentCampaignsStatus[3] = updatedCampaign;
      publisherContractBalance += updatedCampaign.currentBudget;

      assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(publisher)), publisherContractBalance, 0.001), 'wrong publisher balance');
    });

    it(`forwards reward for a second time for the third campaign`, async () => {
      const campaign = currentCampaignsStatus[2];

      const campaignBeforeForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );
      const secondUserBalanceBefore = fromE18(await crowdclickEscrow.balanceOfUser(secondUser))

      await crowdclickEscrow.forwardRewards(
        secondUser,
        publisher,
        campaign.uuid,
        {
          from: owner,
        },
      );
      const campaignAfterForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );

      secondUserContractBalance += campaign.taskReward;
      publisherContractBalance -= campaign.taskReward;

      const secondUserBalanceAfter = fromE18(await crowdclickEscrow.balanceOfUser(secondUser))      

      assert.equal(secondUserBalanceAfter, secondUserBalanceBefore + fromE18(campaignAfterForward.taskReward))
      assert.equal(+campaignAfterForward.currentBudget, +campaignBeforeForward.currentBudget - +campaignAfterForward.taskReward, 'wrong campaign.currentBudget after forwardRewards');
      assert.isTrue(+campaignAfterForward.currentBudget > +campaignAfterForward.taskReward);
      assert.isTrue(campaignAfterForward.isActive);  
    });

    it(`forwards reward for a third time for the third campaign`, async () => {
      const campaign = currentCampaignsStatus[2];

      const campaignBeforeForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );
      const secondUserBalanceBefore = fromE18(await crowdclickEscrow.balanceOfUser(secondUser))

      await crowdclickEscrow.forwardRewards(
        secondUser,
        publisher,
        campaign.uuid,
        {
          from: owner,
        },
      );
      const campaignAfterForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );

      secondUserContractBalance += campaign.taskReward;
      publisherContractBalance -= campaign.taskReward;

      const secondUserBalanceAfter = fromE18(await crowdclickEscrow.balanceOfUser(secondUser));

      assert.equal(secondUserBalanceAfter, secondUserBalanceBefore + fromE18(campaignAfterForward.taskReward));
      assert.equal(+campaignAfterForward.currentBudget, +campaignBeforeForward.currentBudget -  +campaignAfterForward.taskReward, 'wrong campaign.currentBudget after forwardRewards');
      assert.isTrue(+campaignAfterForward.currentBudget > +campaignAfterForward.taskReward);
      assert.isTrue(campaignAfterForward.isActive);
    });


    it(`forwards reward for the fourth time for the third campaign`, async () => {
    const campaign = currentCampaignsStatus[2];

    const campaignBeforeForward = await crowdclickEscrow.lookupTask(
      campaign.uuid,
      publisher
    );
    const secondUserBalanceBefore = fromE18(await crowdclickEscrow.balanceOfUser(secondUser))

    await crowdclickEscrow.forwardRewards(
      secondUser,
      publisher,
      campaign.uuid,
      {
        from: owner,
      },
    );
    const campaignAfterForward = await crowdclickEscrow.lookupTask(
      campaign.uuid,
      publisher
    );
    
    secondUserContractBalance += campaign.taskReward;
    publisherContractBalance -= campaign.taskReward;

    const secondUserBalanceAfter = fromE18(await crowdclickEscrow.balanceOfUser(secondUser));

    assert.isTrue(approximateEquality(secondUserBalanceAfter, secondUserBalanceBefore + fromE18(campaignAfterForward.taskReward)), `wrong secondUser contract balance`);
    assert.equal(+campaignAfterForward.currentBudget, +campaignBeforeForward.currentBudget - +campaignAfterForward.taskReward, 'wrong campaign.currentBudget after forwardRewards');
    assert.equal(+campaignAfterForward.currentBudget, +campaignAfterForward.taskReward, `wrong campaign's current budget`);
    assert.isTrue(campaignAfterForward.isActive, `wrong campaign's isActive field`);
    });

    it(`forwards reward for the fifth time for the third campaign`, async () => {
      const campaign = currentCampaignsStatus[2];
  
      const campaignBeforeForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );
      const secondUserBalanceBefore = fromE18(await crowdclickEscrow.balanceOfUser(secondUser))
  
      await crowdclickEscrow.forwardRewards(
        secondUser,
        publisher,
        campaign.uuid,
        {
          from: owner,
        },
      );
      const campaignAfterForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        publisher
      );
      
      secondUserContractBalance += campaign.taskReward;
      publisherContractBalance -= campaign.taskReward;
  
      const secondUserBalanceAfter = fromE18(await crowdclickEscrow.balanceOfUser(secondUser));
  
      assert.isTrue(approximateEquality(secondUserBalanceAfter, secondUserBalanceBefore + fromE18(campaignAfterForward.taskReward)), `wrong secondUser contract balance`);
      assert.equal(+campaignAfterForward.currentBudget, +campaignBeforeForward.currentBudget - +campaignAfterForward.taskReward, 'wrong campaign.currentBudget after forwardRewards');
      assert.isTrue(+campaignAfterForward.currentBudget < +campaignAfterForward.taskReward, `wrong campaign's current budget`);
      assert.isFalse(campaignAfterForward.isActive, `wrong campaign's isActive field`);
      });

    it(`forwards reward for a sixth time for the third campaign`, async () => {
      try {
        const campaign = currentCampaignsStatus[2];
        await crowdclickEscrow.forwardRewards(
          secondUser,
          publisher,
          campaign.uuid,
          {
            from: owner,
          },
        );
        } catch(e) {
          assert.equal(e.reason, 'CAMPAIGN_NOT_ACTIVE')
        }
      });


    it(`secondPublisher creates the fifth contract campaign`, async () => {
      const campaign = currentCampaignsStatus[4];
      const e18Campaign = toE18Campaign(campaign);
      await crowdclickEscrow.openTask(
        campaign.uuid,
        e18Campaign.taskBudget,
        e18Campaign.taskReward,
        e18Campaign.url,
        {
          from: secondPublisher,
          value: e18Campaign.taskBudget,
        },
      );

      const updatedCampaign = updateCampaign(campaign, 0, CAMPAIGN_OPERATION.CAMPAIGN_CREATION);
      currentCampaignsStatus[4] = updatedCampaign;
      secondPublisherContractBalance = updatedCampaign.currentBudget;

      const createdCampaign = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        secondPublisher
      );
      const parsedCeatedCampaign = {
        taskBudget: +fromE18(createdCampaign.taskBudget).toFixed(6),
        taskReward: +fromE18(createdCampaign.taskReward).toFixed(6),
        currentBudget: +fromE18(createdCampaign.currentBudget).toFixed(6),
        url: createdCampaign.url,
        isActive: createdCampaign.isActive,
      };

      const { uuid, ...updatedCampaigncampaignComparison } = currentCampaignsStatus[4];
      assert.deepEqual(parsedCeatedCampaign, updatedCampaigncampaignComparison);
      assert.isTrue(approximateEquality(fromE18(await crowdclickEscrow.balanceOfPublisher(secondPublisher)), secondPublisherContractBalance, 0.001), 'wrong publisher balance');
    });

    it(`secondPublisher's campaign forwards reward correctly`, async () => {
      const campaign = currentCampaignsStatus[4];

      const campaignBeforeForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        secondPublisher
      );
      const secondUserBalanceBefore = fromE18(await crowdclickEscrow.balanceOfUser(secondUser))

      await crowdclickEscrow.forwardRewards(
        secondUser,
        secondPublisher,
        campaign.uuid,
        {
          from: owner,
        },
      );
      const campaignAfterForward = await crowdclickEscrow.lookupTask(
        campaign.uuid,
        secondPublisher
      );

      secondUserContractBalance += campaign.taskReward;
      publisherContractBalance -= campaign.taskReward;

      const secondUserBalanceAfter = fromE18(await crowdclickEscrow.balanceOfUser(secondUser));

      assert.equal(secondUserBalanceAfter, secondUserBalanceBefore + fromE18(campaignAfterForward.taskReward));
      assert.equal(+campaignAfterForward.currentBudget, +campaignBeforeForward.currentBudget -  +campaignAfterForward.taskReward, 'wrong campaign.currentBudget after forwardRewards');
      assert.isTrue(+campaignAfterForward.currentBudget > +campaignAfterForward.taskReward);
      assert.isTrue(campaignAfterForward.isActive);
    });
  });
});
