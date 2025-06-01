/**
 * BNB Smart Chain (BSC) Plugin for ElizaOS
 * 
 * This plugin provides integration with the BNB Smart Chain ecosystem,
 * supporting transfers, swaps, staking, bridging, and token deployments.
 */
import type { Plugin, IAgentRuntime } from "@elizaos/core";
import { logger } from "@elizaos/core";
import dotenv from "dotenv";

// Import actions
import { swapAction } from "./actions/swap";
import { transferAction } from "./actions/transfer";
import { getBalanceAction } from "./actions/getBalance";
import { bridgeAction } from "./actions/bridge";
import { stakeAction } from "./actions/stake";
import { faucetAction } from "./actions/faucet";
import { deployAction } from "./actions/deploy";
import { greenfieldAction } from "./actions/gnfd";
import { getBucketAction } from "./actions/getBucket";

// Import provider
import { bnbWalletProvider } from "./providers/wallet";

// Import configuration utilities
import { validateBnbConfig } from "./environment";

// Load environment variables
dotenv.config();

/**
 * Main plugin definition for BNB Smart Chain integration
 */
export const bnbPlugin: Plugin = {
  /**
   * Initialize the plugin
   * 
   * @param config - Plugin configuration
   * @param runtime - ElizaOS agent runtime
   */
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    logger.info("Initializing BNB Smart Chain plugin");
    logger.debug("BNB plugin config:", config);
    
    try {
      // Validate BNB configuration
      const bnbConfig = await validateBnbConfig(runtime);
      
      const hasWallet = !!bnbConfig.BNB_PRIVATE_KEY || !!bnbConfig.BNB_PUBLIC_KEY;
      
      logger.info(`BNB plugin initialized with wallet: ${hasWallet ? "Yes" : "No"}`);
      logger.info(`BSC Provider: ${bnbConfig.BSC_PROVIDER_URL ? "Configured" : "Default"}`);
      logger.info(`BSC Testnet Provider: ${bnbConfig.BSC_TESTNET_PROVIDER_URL ? "Configured" : "Default"}`);
      logger.info(`OPBNB Provider: ${bnbConfig.OPBNB_PROVIDER_URL ? "Configured" : "Default"}`);
      
    } catch (error) {
      logger.error("Failed to initialize BNB plugin:", error);
    }
  },
  
  /**
   * Plugin metadata
   */
  name: "bnb",
  description: "BNB Smart Chain (BSC) and opBNB integration plugin supporting transfers, swaps, staking, bridging, and token deployments",
  
  /**
   * Plugin components
   */
  actions: [
    getBalanceAction,
    transferAction,
    swapAction,
    bridgeAction,
    stakeAction,
    faucetAction,
    deployAction,
    greenfieldAction,
    getBucketAction
  ],
  providers: [bnbWalletProvider],
  evaluators: [],
  services: [],
};

/**
 * Export all actions for external use
 */
export * from "./actions/swap";
export * from "./actions/transfer";
export * from "./actions/getBalance";
export * from "./actions/bridge";
export * from "./actions/deploy";
export * from "./actions/stake";
export * from "./actions/faucet";
export * from "./actions/gnfd";

/**
 * Export types and utilities
 */
export * from "./providers/wallet";
// export * from "./types";
export * from "./environment";

/**
 * Default export
 */
export default bnbPlugin; 