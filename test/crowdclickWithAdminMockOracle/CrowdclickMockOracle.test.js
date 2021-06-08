const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { assert } = require('chai');

const CrowdclickMockOracle = artifacts.require('CrowdclickMockOracle');
const { fromE18, toE18 } = require('../../dao/helpers');
const currencyApi = require('../../dao/api');

contract("CrowdclickMockOracle contract's tests", (accounts) => {
  const [owner, user, newDataSource] = accounts;

  /** contracts */
  let crowdclickMockOracle;
  /** contracts' values */
  let latestPushedPricefeed;
  let currentPriceFeedToWei;

  before(async () => {
    latestPushedPricefeed = await currencyApi.fetchEthToUSD();
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
      latestPushedPricefeed = 2100;
      try {
        await crowdclickMockOracle.adminPushUnderlyingUSDPrice(latestPushedPricefeed, { from: user });
      } catch (e) {
        assert.equal(e.reason, 'NOT_DATASOURCE');
      }
    });

    it('should succeed: dataSource updates pricefeed', async () => {
      await crowdclickMockOracle.adminPushUnderlyingUSDPrice(latestPushedPricefeed, { from: owner });
    });

    it('should retrieve the updated pricefeed', async () => {
      assert.equal(((await crowdclickMockOracle.getUnderlyingUsdPriceFeed()).toString()), latestPushedPricefeed.toString(), 'wrong pricefeed');
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
      latestPushedPricefeed = 2200;
      try {
        await crowdclickMockOracle.adminPushUnderlyingUSDPrice(latestPushedPricefeed, { from: owner });
      } catch (e) {
        assert.equal(e.reason, 'NOT_DATASOURCE');
      }
    });

    it('should succeed: new dataSource updates pricefeed', async () => {
      await crowdclickMockOracle.adminPushUnderlyingUSDPrice(latestPushedPricefeed, { from: newDataSource });
    });

    it('should retrieve the updated pricefeed', async () => {
      assert.equal(((await crowdclickMockOracle.getUnderlyingUsdPriceFeed()).toString()), latestPushedPricefeed.toString(), 'wrong pricefeed');
    });
  });
});
