// const CrowdclickOracle = artifacts.require('CrowdclickOracle')
// const truffleAssert = require('truffle-assertions')
// const { assert } = require('chai')
// const { convertFromWeiToEthereum, approximateEquality } = require('../helpers')

// const chainlinkAggregatorRinkebyAddress = '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e'
// const startTracking = ~~(Date.now() / 1000)
// const trackingInterval = 60 * 60 * 24 // time interval = 1 day

// contract('Crowdclick oracle contract', accounts => {
//   const [ owner, user ] = accounts

//   /** contracts */
//   let crowdclickOracle
//   /** contracts' values */
//   let latestEthPrice, updatedTrackingInterval, newOracleImplementationAddress

//   before(async () => {
//     crowdclickOracle = await CrowdclickOracle.new(chainlinkAggregatorRinkebyAddress, startTracking, trackingInterval, { from: owner })
//   })

//   it('should check the contract was initialized with the expected values', async() => {

//   })


//   it('pricefeed', async () => {
//     //   console.log(crowdclickOracle.methods)
//     latestEthPrice = await crowdclickOracle.getEthUsdPriceFeed.call()
//     console.log('pricefeed result: ', latestEthPrice)
//     console.log('pricefeed result: ', latestEthPrice.toString())
//   }) 

//   it('should return the cached result', async() => {
//     const tx = await crowdclickOracle.getEthUsdPriceFeed()
//     await truffleAssert.eventEmitted(tx, 'PricefeedUpdate', ev => {
//         console.log(`was cached: ${ev.wasCached.toString()}, value: ${ev.value.toString()}`)
//         return true   
//     }) 
//   })

//   it('should return the cached result', async() => {
//       /** time-travel after now > startTracking + trackingInterval, expect wasCached to be false, expect new ethereum value */
//     const tx = await crowdclickOracle.getEthUsdPriceFeed()
//     await truffleAssert.eventEmitted(tx, 'PricefeedUpdate', ev => {
//         console.log(`was cached: ${ev.wasCached.toString()}, value: ${ev.value.toString()}`)
//         return true   
//     })
//   })

//   it('should not allow non-owner to update tracking interval', async() => {
//     try {
//         updatedTrackingInterval = 60 * 60 * 48
//         await crowdclickOracle.changeTrackingInterval(updatedTrackingInterval, { from: user })
//     } catch(e) {
//         assert.equal(e.reason, 'Ownable: caller is not the owner')
//     }
//   })

//   it('should allow owner to update the tracking interval', async() => {
//     await crowdclickOracle.changeTrackingInterval(updatedTrackingInterval, { from: owner })
//     assert((await crowdclickOracle.trackingInterval).toString(), updatedTrackingInterval.toString())
//   })

//   it('tests should be cached according to new tracking interval', async() => {

//   })


//   it('after tracking interval expires, pricefeed is correctly updated from the oracle', async() => {
      
//   })

// //   it('should not allow non-owner to update the address of the oracle implementation', async() => {
// //       try {
// //           newOracleImplementationAddress = '0x'
// //           await crowdclickOracle.changeTrackingInterval(newOracleImplementationAddress, { from: user })
// //       } catch(e) {
// //           console.error('non-owner updates: ', e)
// //       }
// //   })

// //   it('should allow owner to update the address of the oracle implementation', async() => {
// //       await crowdclickOracle.changeOracle( newOracleImplementationAddress, { from: owner })
// //       assert((await crowdclickOracle.trackingInterval).toString(), updatedTrackingInterval.toString())
// //     })



// })
