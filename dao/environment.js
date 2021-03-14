
/**
 * @dev
 * local -> ganache deployment
 * development -> testnets deployment
 * production -> mainnet deployment
 */
const APP_ENVIRONMENT = {
    LOCAL: 'LOCAL',
    DEVELOPMENT: 'DEVELOPMENT',
    PRODUCTION: 'PRODUCTION',
}
const environment = process.env.APP_ENVIRONMENT || APP_ENVIRONMENT.LOCAL
const isProduction = environment === APP_ENVIRONMENT.PRODUCTION
/**
 * TODO:
 * use a chainlink mock on local ganache environment
 */
const networkAddresses = {
    [APP_ENVIRONMENT.LOCAL]: {
        chainlinkAggregatorAddress: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e' // rinkeby
    },
    [APP_ENVIRONMENT.DEVELOPMENT]: {
        chainlinkAggregatorAddress: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e' // rinkeby
    },
    [APP_ENVIRONMENT.PRODUCTION]: {
        chainlinkAggregatorAddress: ''
    }
}

const config = {
    environment,
    isProduction,
    api: {
        coingecko: 'https://api.coingecko.com/api/v3/'
    },
    contractDeployment: {
        crowdclickEscrow: {
            minimumUsdWithdrawal: 4,
            feePercentage: 10,
        },
        crowdclickOracle: {
            trackingInterval: 60 * 60 * 24 // time interval = 1 day
        }
    },
    networkAddresses: networkAddresses[environment]    
}

module.exports = config