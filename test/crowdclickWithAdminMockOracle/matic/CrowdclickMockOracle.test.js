const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle');
const { assert } = require('chai');
const { fromE18, toE18 } = require('../../../dao/helpers');
const currencyApi = require('../../../dao/api');

contract("CrowdclickMockOracle contract's tests on Matic/Polygon", (accounts) => {
  const [owner, user, newDataSource] = accounts;

  /** contracts */
  let crowdclickMockOracle;
  /** contracts' values */
  let currentPriceFeedToWei;

  before(async () => {
    latestPushedPricefeed = await currencyApi.fetchMaticToUSD();
    currentPriceFeedToWei = toE18(latestPushedPricefeed.toString());
    console.log('latestPushedPricefeed', latestPushedPricefeed);
    crowdclickMockOracle = await deployProxy(CrowdclickMockOracle, [currentPriceFeedToWei, owner], { owner });
  });

  context("Check deployment's data", () => {
    it('should check the contract was initialized with the expected values', async () => {
      assert.equal(fromE18((await crowdclickMockOracle.getUnderlyingUsdPriceFeed())), latestPushedPricefeed, 'wrong pricefeed');
      assert.equal(await crowdclickMockOracle.dataSource.call(), owner, 'wrong dataSource');
    });
  });

  context("CrowdclickMockOracle's logic", () => {
    it('should fail: non-dataSource should not be able to update the pricefeed', async () => {
      const latestPushedPricefeed = 0.4;
      currentPriceFeedToWei = toE18(latestPushedPricefeed.toString());
      console.log('currentPriceFeedToWei ', currentPriceFeedToWei)
      try {
        await crowdclickMockOracle.adminPushUnderlyingUSDPrice(currentPriceFeedToWei, { from: user });
      } catch (e) {
        assert.equal(e.reason, 'NOT_DATASOURCE');
      }
    });

    it('should succeed: dataSource updates pricefeed', async () => {
      await crowdclickMockOracle.adminPushUnderlyingUSDPrice(currentPriceFeedToWei, { from: owner });
    });

    it('should retrieve the updated pricefeed', async () => {
      assert.equal(((await crowdclickMockOracle.getUnderlyingUsdPriceFeed()).toString()), currentPriceFeedToWei.toString(), 'wrong pricefeed');
    });

    it('should fail: non-owner cannot change the dataSource', async () => {
      try {
        await crowdclickMockOracle.changeDataSource(newDataSource, { from: user });
      } catch (e) {
        assert.equal(e.reason, 'Ownable: caller is not the owner');
      }
    });

    it('should still show the owner as the current dataSource', async () => {
      assert.equal(await crowdclickMockOracle.dataSource.call(), owner, 'wrong dataSource');
    });

    it('should allow the owner to change the dataSource', async () => {
      await crowdclickMockOracle.changeDataSource(newDataSource, { from: owner });
      assert.equal(await crowdclickMockOracle.dataSource.call(), newDataSource, 'wrong dataSource');
    });

    it('should fail: previous dataSource cannot update the pricefeed', async () => {
      const latestPushedPricefeed = 0.6;
      currentPriceFeedToWei = toE18(latestPushedPricefeed.toString());
      try {
        await crowdclickMockOracle.adminPushUnderlyingUSDPrice(currentPriceFeedToWei, { from: owner });
      } catch (e) {
        assert.equal(e.reason, 'NOT_DATASOURCE');
      }
    });

    it('should succeed: new dataSource updates pricefeed', async () => {
      await crowdclickMockOracle.adminPushUnderlyingUSDPrice(currentPriceFeedToWei, { from: newDataSource });
    });

    it('should retrieve the updated pricefeed', async () => {
    //   console.log(`await crowdclickMockOracle.getUnderlyingUsdPriceFeed()`,( await crowdclickMockOracle.getUnderlyingUsdPriceFeed()).toString())
      assert.equal(((await crowdclickMockOracle.getUnderlyingUsdPriceFeed()).toString()), currentPriceFeedToWei.toString(), 'wrong pricefeed');
    });
  });
});
