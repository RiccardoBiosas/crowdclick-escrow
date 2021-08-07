const HDWalletProvider = require('@truffle/hdwallet-provider')
require('dotenv').config()

module.exports = {
  networks: {
    develop: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    rinkebyFork: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 4
    },
    goerliFork: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 5
    },
    mumbaiFork: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 80001
    },
    bscTestnetFork: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 97
    },
    ropsten: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_ROPSTEN),      
      network_id: 3
    },
    goerli: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_GOERLI),
      network_id: 5
    },
    mumbai: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://rpc-mumbai.matic.today`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skyDryRun: true
    },
    polygon: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://matic-mainnet.chainstacklabs.com`),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skyDryRun: true
    },
    bscMainnet: {
      provider: () => new HDWalletProvider(process.env.PRODUCTION_MNEMONIC, process.env.BSC_CHAINSTACK),
      network_id: 56,
      confirmations: 3,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    bscTestnet: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://data-seed-prebsc-1-s2.binance.org:8545/`),
      network_id: 97,
      confirmations: 2,
      timeoutBlocks: 2000,
      skipDryRun: true,
      gas: 5000000,
      gasPrice: 25000000000,
    },
  },
  mocha: {

  },
  compilers: {
    solc: {
      version: "0.8.0"
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API,
    bscscan: process.env.BSCSCAN_API
  }
};
