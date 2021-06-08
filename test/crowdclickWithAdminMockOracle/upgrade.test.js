const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const CrowdclickEscrow = artifacts.require('CrowdclickEscrow');
const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle');
const { assert } = require('chai');
const {
  fromE18, approximateEquality, updateCampaign, calculateFee, toE18Campaign,
} = require('../../dao/helpers');
const { crowdclickEscrowData, crowdclickMockOracleData, CAMPAIGN_OPERATION } = require('../../dao/constants');
const currencyApi = require('../../dao/api');

const {
  mockCampaigns,
  minimumUsdWithdrawal,
  campaignFee,
} = crowdclickEscrowData;

contract('UPGRADES', (accounts) => {
  const [owner, publisher, user, feeCollector, secondUser] = accounts;

  /** contracts */
  let crowdclickEscrow; let
    crowdclickMockOracle;
  /** contracts' values */
  let crowdclickMockOracleAddress; let
    currentEthPrice;
  /** balances */
  let publisherWalletBalance; let userWalletBalance; let feeCollectorWalletBalance; let publisherContractBalance; let userContractbalance; let secondUserContractBalance; let
    secondUserWalletBalance;
  const collectedFee = 0;
  const currentCampaignsStatus = mockCampaigns;

  before(async () => {
    currentEthPrice = await currencyApi.fetchEthToUSD();
    crowdclickMockOracle = await deployProxy(CrowdclickMockOracle, [currentEthPrice, owner], { owner });
    crowdclickMockOracleAddress = crowdclickMockOracle.address;
    console.log('crowdclickMockOracleAddress', crowdclickMockOracleAddress);
    crowdclickEscrow = await deployProxy(CrowdclickEscrow, [crowdclickMockOracleAddress, minimumUsdWithdrawal, campaignFee, feeCollector], { owner });
  });

  //   it('upgrades', async() => {
  //       try {

  //           const currentMinimumUsdWithdrawal = await crowdclickEscrow.minimumUsdWithdrawal.call()
  //           console.log('currentMinimumUsdWithdrawal ', currentMinimumUsdWithdrawal.toString())

  //         // const secondInstance = await CrowdclickEscrow.deploy(crowdclickMockOracleAddress, 199, campaignFee, feeCollector, { from:owner })
  //         console.log('crowdclickEscrow.address ', crowdclickEscrow.address)
  //         await upgradeProxy(crowdclickMockOracleAddress, CrowdclickEscrow,[crowdclickMockOracleAddress, 199, campaignFee,feeCollector], { owner});
  //         // // const newMin = await crowdclickEscrow.minimumUsdWithdrawal.call()
  //         const a = await crowdclickEscrow.minimumUsdWithdrawal.call()

  //         console.log('newminimum ', a.toString())
  //       } catch(e) {
  //           console.error('error upgrade test', e)
  //       }

//   })
});
