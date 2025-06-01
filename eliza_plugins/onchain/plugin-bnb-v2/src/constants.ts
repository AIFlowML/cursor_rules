/**
 * Constants and configuration values for BNB Plugin
 */

/**
 * Default RPC URLs as fallbacks
 */
export const API_CONFIG = {
  DEFAULT_BSC_PROVIDER_URL: "https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3",
  DEFAULT_BSC_TESTNET_PROVIDER_URL: "https://data-seed-prebsc-2-s3.bnbchain.org:8545",
  DEFAULT_OPBNB_PROVIDER_URL: "https://opbnb-mainnet-rpc.bnbchain.org",
  
  // Required environment variables
  REQUIRED_ENV_VARS: [
    "BNB_PRIVATE_KEY", 
    "BNB_PUBLIC_KEY"
  ],
};

/**
 * Chain IDs for supported networks
 */
export const CHAIN_IDS = {
  BSC: 56,
  BSC_TESTNET: 97,
  OPBNB: 204,
};

/**
 * Blockchain explorer URLs
 */
export const EXPLORERS = {
  BSC: {
    name: "BscScan",
    url: "https://bscscan.com",
    apiUrl: "https://api.bscscan.com/api",
  },
  BSC_TESTNET: {
    name: "BscScan Testnet",
    url: "https://testnet.bscscan.com",
    apiUrl: "https://api-testnet.bscscan.com/api",
  },
  OPBNB: {
    name: "opBNB Explorer",
    url: "https://opbnb.bscscan.com",
    apiUrl: "https://api-opbnb.bscscan.com/api",
  },
};

/**
 * Native tokens for supported chains
 */
export const NATIVE_TOKENS = {
  BSC: "BNB",
  BSC_TESTNET: "tBNB",
  OPBNB: "BNB",
};

/**
 * Gas price configuration
 */
export const GAS_CONFIG = {
  DEFAULT_GAS_PRICE_GWEI: 3, // 3 Gwei
  DEFAULT_GAS_LIMIT_TRANSFER: 21000,
  DEFAULT_GAS_LIMIT_ERC20_TRANSFER: 65000,
  DEFAULT_GAS_LIMIT_SWAP: 350000,
};

/**
 * Standard token addresses
 */
export const TOKEN_ADDRESSES = {
  BSC: {
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
  },
  BSC_TESTNET: {
    BUSD: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
    USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
  },
  OPBNB: {
    USDT: "0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3",
  },
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  MISSING_PRIVATE_KEY: "BNB private key is required but not provided",
  MISSING_WALLET: "No wallet configured. Please provide BNB_PRIVATE_KEY or BNB_PUBLIC_KEY",
  INVALID_CHAIN: "Invalid chain specified. Supported chains are: bsc, bscTestnet, opbnb",
  NETWORK_ERROR: "Network error occurred while connecting to the blockchain",
};

export default {
  API_CONFIG,
  CHAIN_IDS,
  EXPLORERS,
  NATIVE_TOKENS,
  GAS_CONFIG,
  TOKEN_ADDRESSES,
  ERROR_MESSAGES
}; 