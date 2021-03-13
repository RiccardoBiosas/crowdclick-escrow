const CrowdclickOracle = artifacts.require('CrowdclickOracle')
const truffleAssert = require('truffle-assertions')
const { time } = require('@openzeppelin/test-helpers')
const { assert } = require('chai')
const { crowdclickChainlinkOracleData } = require('../../dao/constants')

const {
  chainlinkAggregatorRinkebyAddress, 
  startTracking, 
  trackingInterval 
} = crowdclickChainlinkOracleData

contract("CrowdclickOracle (with chainlink) contract's tests", accounts =>
{
  const [ owner, user ] = accounts

  /** contracts */
  let crowdclickOracle
  /** contracts' values */
  let latestEthPrice, updatedTrackingInterval, currentStartTracking

  before(async () => {
    crowdclickOracle = await CrowdclickOracle.new(chainlinkAggregatorRinkebyAddress, startTracking, trackingInterval, { from: owner })
  })

  it('should check the contract was initialized with the expected values', async() => {
    assert.equal((await crowdclickOracle.startTracking.call()).toString(), startTracking)
    assert.equal((await crowdclickOracle.trackingInterval.call()).toString(), trackingInterval)
    assert.isNotNull((await crowdclickOracle.getEthUsdPriceFeed.call()).toString())
  })

  it('should return the cached result if trackingInterval is not expired', async() => {
    const tx = await crowdclickOracle.getEthUsdPriceFeed()
    await truffleAssert.eventEmitted(tx, 'PricefeedUpdate', ev => {
        console.log(`was cached: ${ev.wasCached}, value: ${ev.value.toString()}`)
        return ev.wasCached === true
    })
  })

  it("should update the pricefeed via chainlink oracle's request after the trackingInterval expires", async() => {
    await time.increase(trackingInterval + 1)
    currentStartTracking = +(await time.latest()).toString()
    const tx = await crowdclickOracle.getEthUsdPriceFeed()
    await truffleAssert.eventEmitted(tx, 'PricefeedUpdate', ev => {
        console.log(`was cached: ${ev.wasCached}, value: ${ev.value.toString()}`)
        return ev.wasCached === false
    })
})

  it('should not allow non-owner to update tracking interval', async() => {
    try {
        updatedTrackingInterval = 60 * 60 * 48
        await crowdclickOracle.changeTrackingInterval(updatedTrackingInterval, { from: user })
    } catch(e) {
        assert.equal(e.reason, 'Ownable: caller is not the owner')
    }
  })

  it('should allow owner to update the tracking interval', async() => {
    await crowdclickOracle.changeTrackingInterval(updatedTrackingInterval, { from: owner })
    assert((await crowdclickOracle.trackingInterval).toString(), updatedTrackingInterval.toString())
  })
})
