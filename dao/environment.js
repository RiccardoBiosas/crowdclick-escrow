
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

const NETWORK_ENVIRONMENT = {
    GOERLI: 'GOERLI',
    RINKEBY: 'RINKEBY',
    MUMBAI: 'MUMBAI',
    BSC_TESTNET: 'BSC_TESTNET',
    BSC_MAINNET: 'BSC_MAINNET'
}

const environment = process.env.APP_ENVIRONMENT || APP_ENVIRONMENT.DEVELOPMENT
const networkEnvironment = NETWORK_ENVIRONMENT.RINKEBY
const isProduction = environment === APP_ENVIRONMENT.PRODUCTION
console.log('current network environment: ', networkEnvironment)
/**
 * TODO:
 * use a chainlink mock on local ganache environment
 */
const networkContracts = {
    [NETWORK_ENVIRONMENT.GOERLI]: {
        chainlink: ''
    },
    [NETWORK_ENVIRONMENT.RINKEBY]: {
        chainlink: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e' /** ETH/USD */
    },
    [NETWORK_ENVIRONMENT.MATIC]: {
        chainlink: '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e' /** MATIC/USD */
    },
    [NETWORK_ENVIRONMENT.MUMBAI]: {
        chainlink: '' /** MATIC/USD */
    },
    [NETWORK_ENVIRONMENT.BSC_TESTNET]: {
        chainlink: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526' /** BNB/USD */
    },
    [NETWORK_ENVIRONMENT.BSC_MAINNET]: {
        chainlink: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE' /** BNB/USD */
    }
}

const config = {
    environment,
    networkEnvironment,
    isProduction,
    NETWORK_ENVIRONMENT,
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
    networkContracts
}

module.exports = config