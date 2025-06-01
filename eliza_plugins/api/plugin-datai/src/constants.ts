/**
 * Constants and configuration for the Datai plugin
 * 
 * This file contains all API endpoints, configuration values, and error messages.
 */

/**
 * API configuration
 */
export const API_CONFIG = {
  /**
   * Base URL for the Datai (Merlin) API
   */
  API_BASE_URL: 'https://api-v1.mymerlin.io',
  
  /**
   * Timeout in milliseconds for API requests
   */
  TIMEOUT: 140000, // 2 minutes
  
  /**
   * Environment variable name for the API key
   */
  DATAI_API_KEY_ENV_VAR: 'DATAI_API_KEY',
  
  /**
   * Required environment variables for the plugin
   */
  REQUIRED_ENV_VARS: ['DATAI_API_KEY'],
  
  /**
   * API key header name
   */
  API_KEY_HEADER: 'Authorization',
};

/**
 * API endpoints
 */
export const ENDPOINTS = {
  /**
   * Get all user DeFi positions
   * GET /api/merlin/public/userDeFiPositions/all/{userAddress}
   * 
   * Tested Parameters:
   * - userAddress: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   * 
   * Returns an array of user's DeFi positions across all chains
   */
  GET_ALL_USER_DEFI_POSITIONS: '/api/merlin/public/userDeFiPositions/all/{userAddress}',
  
  /**
   * Get user DeFi positions by chain
   * GET /api/merlin/public/userDeFiPositions/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106
   * - chain: arb
   * 
   * Returns an array of user's DeFi positions on the specified chain
   */
  GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI: '/api/merlin/public/userDeFiPositions/{userAddress}',
  
  /**
   * Get user DeFi positions by multiple chains
   * GET /api/merlin/public/userDeFiPositionsByChains/{userAddress}?chains={chain1,chain2,...,chain10}
   * 
   * Tested Parameters:
   * - userAddress: 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50
   * - chains: avax,arb
   * 
   * Returns an array of user's DeFi positions across the specified chains
   */
  GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI: '/api/merlin/public/userDeFiPositionsByChains/{userAddress}',
  
  /**
   * Get user DeFi positions by protocol
   * GET /api/merlin/public/userDeFiPositions/protocol/{userAddress}?chain={chain}&protocol={protocol}
   * 
   * Tested Parameters:
   * - userAddress: 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50
   * - chain: avax
   * - protocol: avax_gmx
   * 
   * Returns an array of user's DeFi positions for a specific protocol on the specified chain
   */
  GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI: '/api/merlin/public/userDeFiPositions/protocol/{userAddress}',
  
  /**
   * Get user DeFi protocol balances by chain
   * GET /api/merlin/public/balances/protocol/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106
   * - chain: eth
   * 
   * Returns an array of protocol balances for the user on the specified chain
   */
  GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI: '/api/merlin/public/balances/protocol/{userAddress}',
  
  /**
   * Get user overall balance across all chains
   * GET /api/merlin/public/balances/all/{userAddress}
   * 
   * Tested Parameters:
   * - userAddress: 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106
   * 
   * Returns the total value across all chains with breakdown by chain
   */
  GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI: '/api/merlin/public/balances/all/{userAddress}',
  
  /**
   * Get user overall balance by chain
   * GET /api/merlin/public/balances/chain/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3
   * - chain: avax
   * 
   * Returns the total value on the specified chain in USD and other currencies
   */
  GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI: '/api/merlin/public/balances/chain/{userAddress}',
  
  /**
   * Get user wallet balances by chain
   * GET /api/merlin/public/balances/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x3764D79db51726E900a1380055F469eB6e2a7fD3
   * - chain: matic
   * 
   * Returns the native balance and token balances for the user on the specified chain
   */
  GET_WALLET_BALANCES_BY_CHAIN_DATAI: '/api/merlin/public/balances/{userAddress}',
  
  /**
   * Get user native token balance by chain
   * GET /api/merlin/public/balances/native/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x3764D79db51726E900a1380055F469eB6e2a7fD3
   * - chain: eth
   * 
   * Returns the native token balance (e.g., ETH) for the user on the specified chain
   */
  GET_NATIVE_TOKEN_BALANCE_BY_CHAIN_DATAI: '/api/merlin/public/balances/native/{userAddress}',
  
  /**
   * Get user token balances by chain
   * GET /api/merlin/public/balances/token/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x3764D79db51726E900a1380055F469eB6e2a7fD3
   * - chain: base
   * 
   * Returns an array of token balances for the user on the specified chain
   */
  GET_TOKEN_BALANCES_BY_CHAIN_DATAI: '/api/merlin/public/balances/token/{userAddress}',
  
  /**
   * Get user token balances grouped by multiple chains
   * GET /api/merlin/public/balances/chains/token/{userAddress}?chains={chains}
   * 
   * Tested Parameters:
   * - userAddress: 0x3764D79db51726E900a1380055F469eB6e2a7fD3
   * - chains: base,eth
   * 
   * Returns token balances grouped by chain for the specified chains
   */
  GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI: '/api/merlin/public/balances/chains/token/{userAddress}',
  
  /**
   * Get user NFTs list
   * GET /api/merlin/public/balances/nft/all/{userAddress}
   * 
   * Tested Parameters:
   * - userAddress: 0x3764D79db51726E900a1380055F469eB6e2a7fD3
   * 
   * Returns an array of all NFTs owned by the user across all chains
   */
  GET_USER_NFTS_LIST_DATAI: '/api/merlin/public/balances/nft/all/{userAddress}',
  
  /**
   * Get user NFTs by chain
   * GET /api/merlin/public/balances/nft/chain/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x3764D79db51726E900a1380055F469eB6e2a7fD3
   * - chain: matic
   * 
   * Returns an array of NFTs owned by the user on the specified chain
   */
  GET_USER_NFTS_BY_CHAIN_DATAI: '/api/merlin/public/balances/nft/chain/{userAddress}',
  
  /**
   * Get user transaction history
   * GET /api/merlin/public/v2/userTx/history/all/extended/{userAddress}
   * 
   * Tested Parameters:
   * - userAddress: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   * - limit: 5
   * 
   * Returns detailed transaction history for the user across all chains
   */
  GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI: '/api/merlin/public/v2/userTx/history/all/extended/{userAddress}',
  
  /**
   * Get transaction by hash
   * GET /api/merlin/public/v2/userTx/byHash/{chain}/{hash}/{userAddress}
   * 
   * Tested Parameters:
   * - chain: eth
   * - hash: 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf
   * - userAddress: 0x218e312fF5181290A46e3f87A73A8aD40C05A944
   * 
   * Returns details of a specific transaction by its hash
   */
  GET_TRANSACTION_BY_HASH_DATAI: '/api/merlin/public/v2/userTx/byHash/{chain}/{hash}/{userAddress}',
  
  /**
   * Get transaction transfers by hash
   * GET /api/merlin/public/v2/userTxTransfers/byHash/{chain}/{hash}/{userAddress}
   * 
   * Tested Parameters:
   * - chain: eth
   * - hash: 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf
   * - userAddress: 0x218e312fF5181290A46e3f87A73A8aD40C05A944
   * 
   * Returns token transfers associated with a specific transaction
   */
  GET_TRANSACTION_TRANSFERS_BY_HASH: '/api/merlin/public/v2/userTxTransfers/byHash/{chain}/{hash}/{userAddress}',
  
  /**
   * Get user transaction history by chain
   * GET /api/merlin/public/v2/userTx/history/chain/extended/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e
   * - chain: eth
   * - limit: 10
   * 
   * Returns detailed transaction history for the user on the specified chain
   */
  GET_USER_TRANSACTIONS_BY_CHAIN_DATAI: '/api/merlin/public/v2/userTx/history/chain/extended/{userAddress}',
  
  /**
   * Get user transaction history all chains short
   * GET /api/merlin/public/v2/userTx/history/all/{userAddress}
   * 
   * Tested Parameters:
   * - userAddress: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   * - limit: 10
   * 
   * Returns simplified transaction history for the user across all chains
   */
  GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI: '/api/merlin/public/v2/userTx/history/all/{userAddress}',
  
  /**
   * Get user transaction history by chain raw label
   * GET /api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}?chain={chain}
   * 
   * Tested Parameters:
   * - userAddress: 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e
   * - chain: eth
   * - limit: 10
   * 
   * Returns transaction history with raw labels for the user on the specified chain
   */
  GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI: '/api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}',
  
  /**
   * Get Solana user transaction history extended
   * GET /api/merlin/public/v2/userTx/history/all/extended/{userAddress}?chain=solana
   * 
   * Tested Parameters:
   * - userAddress: rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ
   * - chain: solana
   * - limit: 5
   * 
   * Returns detailed transaction history for the Solana user
   */
  GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI: '/api/merlin/public/v2/userTx/history/all/extended/{userAddress}',
  
  /**
   * Get Solana user transaction history short
   * GET /api/merlin/public/v2/userTx/history/all/{userAddress}?chain=solana
   * 
   * Tested Parameters:
   * - userAddress: HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g
   * - chain: solana
   * - limit: 5
   * 
   * Returns simplified transaction history for the Solana user
   */
  GET_SOLANA_USER_TX_HISTORY_SHORT: '/api/merlin/public/v2/userTx/history/all/{userAddress}',
  
  /**
   * Get user transactions by period all chains extended
   * GET /api/merlin/public/v2/userTx/period/all/extended/{userAddress}?startTime={Integer}&endTime={Integer}
   * 
   * Note: This endpoint returned error 524 during testing
   * 
   * Test attempted with:
   * - userAddress: 0x9a25d79ab755718e0b12bd3c927a010a543c2b31
   * - startTime: 1703999553
   * - endTime: 1698729153
   * 
   * Returns detailed transaction history for the user within a specific time period
   */
  GET_USER_TX_BY_PERIOD_ALL_CHAINS_EXTENDED: '/api/merlin/public/v2/userTx/period/all/extended/{userAddress}',
  
  /**
   * Get user transactions by period and chain extended
   * GET /api/merlin/public/v2/userTx/period/chain/extended/{userAddress}?chain={chain}&startTime={Integer}&endTime={Integer}
   * 
   * Tested Parameters:
   * - userAddress: 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50
   * - chain: xdai
   * - startTime: 1716346533
   * - endTime: 1705895733
   * 
   * Returns detailed transaction history for the user on the specified chain within a time period
   */
  GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI: '/api/merlin/public/v2/userTx/period/chain/extended/{userAddress}',
  
  /**
   * Get user transactions by period and chain raw label
   * GET /api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}?chain={chain}&startTime={Integer}&endTime={Integer}
   * 
   * Tested Parameters:
   * - userAddress: 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50
   * - chain: eth
   * - startTime: 1716346533
   * - endTime: 1705895733
   * 
   * Returns transactions with raw labels for the user on the specified chain within a time period
   */
  GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI: '/api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}',
  
  /**
   * Get transactions for DeFi position
   * GET /api/merlin/public/userTx/position/?position={position}
   * 
   * Tested Parameters:
   * - position: compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726E900a1380055F469eB6e2a7fD3:0
   * 
   * Returns transactions related to a specific DeFi position
   */
  GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI: '/api/merlin/public/userTx/position/',
  
  /**
   * Get user transaction overview
   * GET /api/merlin/public/userTx/overview/{userAddress}
   * 
   * Tested Parameters:
   * - userAddress: 0x4f2083f5fbede34c2714affb3105539775f7fe64
   * 
   * Returns an overview of user's transaction activity across chains
   */
  GET_USER_TRANSACTION_OVERVIEW_DATAI: '/api/merlin/public/v2/userTx/overview/{userAddress}',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  /**
   * Missing API key error
   */
  MISSING_API_KEY: 'Datai API key is required but not provided',
  
  /**
   * Invalid wallet address error
   */
  INVALID_WALLET_ADDRESS: 'Invalid wallet address provided',
  
  /**
   * Invalid chain ID error
   */
  INVALID_CHAIN_ID: 'Invalid chain ID provided',
  
  /**
   * Network error
   */
  NETWORK_ERROR: 'Network error occurred while connecting to the Datai API',
  
  /**
   * Unknown error
   */
  UNKNOWN_ERROR: 'An unknown error occurred',
}; 