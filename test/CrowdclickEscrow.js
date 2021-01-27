const CrowdclickEscrow = artifacts.require('CrowdclickEscrow')
const CrowdclickOracle = artifacts.require('CrowdclickOracle')
const { assert } = require('chai')
const { convertFromWeiToEthereum, approximateEquality, toE18 } = require('../helpers')
const truffleAssert = require('truffle-assertions')


const mockCampaigns = [
  {
    taskBudget: '0.4',
    taskReward: '0.03',
    currentBudget: '0.4',
    url: 'https://ethereum.org/en/',
    isActive: true
  }
]
/** crowdclick oracle deployment */
const chainlinkAggregatorRinkebyAddress = '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e'
const startTracking = ~~(Date.now() / 1000)
const trackingInterval = 60 * 60 * 24 // time interval = 1 day

/** crowdclick escrow deployment */
const minimumUsdWithdrawal = 4


contract('Crowdclick escrow contract', accounts => {
  const [ owner, publisher, user ] = accounts

  /** contracts */
  let crowdclickEscrow, crowdclickOracle
  /** contracts' values */
  let crowdclickOracleAddress

  before(async () => {
    crowdclickOracle = await CrowdclickOracle.new(chainlinkAggregatorRinkebyAddress, startTracking, trackingInterval, { from: owner })
    crowdclickOracleAddress = crowdclickOracle.address
    crowdclickEscrow = await CrowdclickEscrow.new(crowdclickOracleAddress, minimumUsdWithdrawal, { from: owner })
  })

  it('should show 0 as the initial contract balance of the publisher', async () => {
    const publisherContractWeiBalance = await crowdclickEscrow.balanceOfPublisher(
      publisher
    )
    const publisherContractEtherereumBalance = convertFromWeiToEthereum(
      publisherContractWeiBalance
    )
    assert.equal(publisherContractEtherereumBalance, 0)
  })

  it('should show 0 as the initial balance of the user', async () => {
    const userContractWeiBalance = await crowdclickEscrow.balanceOfPublisher(
      user
    )
    const userContractEtherereumBalance = convertFromWeiToEthereum(
      userContractWeiBalance
    )
    assert.equal(userContractEtherereumBalance, 0)
  })

  it("should show the publisher's contract balance as equal to the budget of the first publisher's task being created", async () => {
    const campaign = mockCampaigns[0]
    const budgetToWei = toE18(campaign.taskBudget)
    const rewardToWei = toE18(campaign.taskReward)
    await crowdclickEscrow.openTask(
      budgetToWei,
      rewardToWei,
      campaign.url,
      {
        from: publisher,
        value: budgetToWei
      }
    )
    const publisherContractWeiBalance = await crowdclickEscrow.balanceOfPublisher(
      publisher
    )
    const publisherContractEtherereumBalance = convertFromWeiToEthereum(
      publisherContractWeiBalance
    )
    assert.equal(
      publisherContractEtherereumBalance,
      parseFloat(campaign.taskBudget, 10)
    )
  })

  it("should forward the reward for the task previously created and increase the user's contract balance by an amount equal to the campaign's reward", async () => {
    const campaign = mockCampaigns[0]
    await crowdclickEscrow.forwardRewards(
      user,
      publisher,
      campaign.url,
      {
        from: owner
      }
    )
    const userContractWeiBalance = await crowdclickEscrow.balanceOfUser(
      user
    )
    const userContractEtherereumBalance = convertFromWeiToEthereum(
      userContractWeiBalance
    )
    assert.equal(userContractEtherereumBalance, '0.03')
  })

  it("should show the publisher's contract balance as the initially allocated campaign budget minus the previously forwarded reward", async () => {
    const campaign = mockCampaigns[0]
    const publisherContractWeiBalance = await crowdclickEscrow.balanceOfPublisher(
      publisher
    )
    const publisherContractEtherereumBalance = convertFromWeiToEthereum(
      publisherContractWeiBalance
    )
    const userContractWeiBalance = await crowdclickEscrow.balanceOfUser(
      user
    )
    const userContractEtherereumBalance = convertFromWeiToEthereum(
      userContractWeiBalance
    )
    const expectedPublisherContractEthereumBalance =
      parseFloat(campaign.taskBudget) - userContractEtherereumBalance

    assert.equal(
      publisherContractEtherereumBalance,
      expectedPublisherContractEthereumBalance
    )
  })

  it("should allow the user to withdraw the earned balance and show the user's ethereum wallet balance as the initial balance plus the withdrawn balance minus the gas fee estimate", async () => {
    const campaign = mockCampaigns[0]
    const userInitialWalletBalance = await web3.eth.getBalance(user)

    const taskRewardToEth = toE18(campaign.taskReward)
    console.log('taskRewardToEth: ', taskRewardToEth.toString())
    const tx = await crowdclickEscrow.withdrawUserBalance(
      taskRewardToEth,
      { from: user }
    )

    const expectedBalance =
      parseFloat(userInitialWalletBalance, 10) + parseFloat(taskRewardToEth, 10)
    const expectedBalanceToEthereum = convertFromWeiToEthereum(
      expectedBalance.toString()
    )

    const userFinalBalance = await web3.eth.getBalance(user)
    const userFinalBalanceToEthereum = convertFromWeiToEthereum(
      userFinalBalance
    )
    // console.log('userFinalBalance', userFinalBalance)
    // console.log('userFinalBalanceToEthereum', userFinalBalanceToEthereum)
    // console.log('expectedBalanceToEthereum', expectedBalanceToEthereum)
    assert.isTrue(
      approximateEquality(userFinalBalanceToEthereum, expectedBalanceToEthereum, 0.03)
    )
  })

  it('should show the correct campaign stats given the url associated to the campaign', async () => {
    const campaign = mockCampaigns[0]
    const expectedCampaign = {
      ...campaign,
      currentBudget: (+campaign.currentBudget - +campaign.taskReward).toString()
    }

    const fetchedCampaign = await crowdclickEscrow.lookupTask(
      expectedCampaign.url,
      {
        from: publisher
      }
    )

    const fetchedCampaignToEthereum = {
      taskBudget: convertFromWeiToEthereum(
        fetchedCampaign.taskBudget
      ).toString(),
      taskReward: convertFromWeiToEthereum(
        fetchedCampaign.taskReward
      ).toString(),
      currentBudget: convertFromWeiToEthereum(
        fetchedCampaign.currentBudget
      ).toString(),
      url: fetchedCampaign.url,
      isActive: fetchedCampaign.isActive
    }
    assert.deepEqual(fetchedCampaignToEthereum, expectedCampaign)
  })

  it("should allow the publisher to withdraw the remaining allocated budget from the campaign and update the publisher's wallet balance as the remaining allocated budget on the given campaign minus the reward previously forwarded", async () => {
    /** get the publisher's initial wallet balance in ethereum, calculate the sum of the publisher's initial wallet balance and the remaining task budget 
     * get the publisher's wallet balance after withdrawal
     * assert equality
     */
    const campaign = mockCampaigns[0]

    const publisherInitialWalletWeiBalance = await web3.eth.getBalance(
      publisher
    )
    const publisherInitialWalletEthereumBalance = convertFromWeiToEthereum(
      publisherInitialWalletWeiBalance
    )

    const publisherExpectedFinalEthereumBalance =
      parseFloat(publisherInitialWalletEthereumBalance, 10) +
      parseFloat(campaign.taskBudget, 10) -
      parseFloat(campaign.taskReward, 10)

    /** we perform the withdrawal and check the actual balance after performing withdrawfromcampaign */
    await crowdclickEscrow.withdrawFromCampaign(campaign.url, {
      from: publisher
    })
    const publisherWalletBalanceAfterWithdraw = await web3.eth.getBalance(
      publisher
    )
    const publisherWalletBalanceAfterWithdrawToEthereum = convertFromWeiToEthereum(
      publisherWalletBalanceAfterWithdraw
    )

    assert.isTrue(
      approximateEquality(
        publisherExpectedFinalEthereumBalance,
        publisherWalletBalanceAfterWithdrawToEthereum
      )
    )
  })
})
