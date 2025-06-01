/**
 * Datai plugin for ElizaOS
 * 
 * This plugin provides integration with the Datai (Merlin) API for DeFi data services.
 */
import type { Plugin, IAgentRuntime } from "@elizaos/core";
import { logger } from "@elizaos/core";
import dotenv from "dotenv";

// Import actions
import { 
  // DeFi Positions
  getAllUserDeFiPositionsAction,
  getUserDeFiPositionsByChainAction,
  getUserDeFiPositionsByMultipleChainsAction,
  getUserDeFiPositionsByProtocolAction,
  getUserDeFiProtocolBalancesByChainAction,
  
  // Balance Information
  getUserOverallBalanceAllChainsAction,
  getWalletBalancesByChainAction,
  getTokenBalancesByChainAction,
  getUserOverallBalanceByChainAction,
  getNativeTokenBalanceByChainAction,
  getGroupedTokenBalancesByMultipleChainsAction,
  
  // NFT Data
  getUserNFTsListAction,
  getUserNFTsByChainAction,
  
  // Transaction History
  getUserTransactionsAction,
  getUserTransactionsByChainAction,
  getUserTxHistoryAllChainsShortAction,
  getUserTxHistoryByChainRawLabelAction,
  getSolanaUserTxHistoryExtendedAction,
  getSolanaUserTxHistoryShortAction,
  
  // Period-Based Transactions
  getUserTxByPeriodAndChainExtendedAction,
  getUserTxByPeriodAndChainRawLabel20Action,
  
  // Transaction Details
  getTransactionByHashAction,
  getTransactionTransfersByHashAction,
  getTransactionsForDeFiPositionAction,
  
  // User Overview
  getUserTransactionOverviewAction
} from "./actions";

import { API_CONFIG } from "./constants";

// Load environment variables
dotenv.config();

/**
 * Main plugin definition for Datai integration
 */
export const dataiPlugin: Plugin = {
  /**
   * Initialize the plugin
   * 
   * @param config - Plugin configuration
   * @param runtime - ElizaOS agent runtime
   */
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    logger.info("Initializing Datai plugin");
    logger.debug("Datai plugin config:", config);
    
    // Validate required environment variables
    for (const varName of API_CONFIG.REQUIRED_ENV_VARS) {
      const value = runtime.getSetting(varName) || process.env[varName];
      if (!value) {
        logger.error(`Missing required environment variable: ${varName}`);
      } else {
        logger.debug(`Found environment variable: ${varName}`);
      }
    }
  },
  
  /**
   * Plugin metadata
   */
  name: "datai",
  description: "Plugin for accessing Datai (Merlin) API services for DeFi data",
  
  /**
   * Plugin components
   */
  actions: [
    // DeFi Positions
    getAllUserDeFiPositionsAction,
    getUserDeFiPositionsByChainAction,
    getUserDeFiPositionsByMultipleChainsAction,
    getUserDeFiPositionsByProtocolAction,
    getUserDeFiProtocolBalancesByChainAction,
    
    // Balance Information
    getUserOverallBalanceAllChainsAction,
    getWalletBalancesByChainAction,
    getTokenBalancesByChainAction,
    getUserOverallBalanceByChainAction,
    getNativeTokenBalanceByChainAction,
    getGroupedTokenBalancesByMultipleChainsAction,
    
    // NFT Data
    getUserNFTsListAction,
    getUserNFTsByChainAction,
    
    // Transaction History
    getUserTransactionsAction,
    getUserTransactionsByChainAction,
    getUserTxHistoryAllChainsShortAction,
    getUserTxHistoryByChainRawLabelAction,
    getSolanaUserTxHistoryExtendedAction,
    getSolanaUserTxHistoryShortAction,
    
    // Period-Based Transactions
    getUserTxByPeriodAndChainExtendedAction,
    getUserTxByPeriodAndChainRawLabel20Action,
    
    // Transaction Details
    getTransactionByHashAction,
    getTransactionTransfersByHashAction,
    getTransactionsForDeFiPositionAction,
    
    // User Overview
    getUserTransactionOverviewAction
  ],
  providers: [],
  evaluators: [],
  services: [],
  routes: [],
};

/**
 * Export all actions for external use
 */
export * as actions from "./actions";

/**
 * Export types for external use
 */
export * from "./types";

/**
 * Default export
 */
export default dataiPlugin;
