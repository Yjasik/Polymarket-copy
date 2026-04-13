require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

const PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: parseInt(process.env.HARDHAT_CHAIN_ID || '31337'),
      mining: {
        auto: true,
        interval: parseInt(process.env.HARDHAT_BLOCK_INTERVAL || '0'),
      },
    },
    localhost: {
      url: process.env.LOCALHOST_RPC_URL || 'http://127.0.0.1:8545',
      chainId: parseInt(process.env.HARDHAT_CHAIN_ID || '31337'),
    },
  },

  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
}
