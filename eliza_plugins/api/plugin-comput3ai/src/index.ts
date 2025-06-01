/**
 * Comput3AI plugin for ElizaOS
 * 
 * This plugin provides integration with the Comput3AI GPU services API.
 */
import type { Plugin, IAgentRuntime } from "@elizaos/core";
import { logger } from "@elizaos/core";
import dotenv from "dotenv";

// Import actions
import { 
  getWorkloadTypesAction,
  getUserBalanceAction,
  getUserProfileAction,
  listWorkloadsAction,
  launchWorkloadAction,
  stopWorkloadAction,
} from "./actions";

import { API_CONFIG } from "./constants";

// Load environment variables
dotenv.config();

/**
 * Main plugin definition for Comput3AI integration
 */
export const comput3aiPlugin: Plugin = {
  /**
   * Initialize the plugin
   * 
   * @param config - Plugin configuration
   * @param runtime - ElizaOS agent runtime
   */
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    logger.info("Initializing Comput3AI plugin");
    logger.debug("Comput3AI plugin config:", config);
    
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
  name: "comput3ai",
  description: "Plugin for interacting with Comput3AI GPU services API",
  
  /**
   * Plugin components
   */
  actions: [
    getWorkloadTypesAction,
    getUserProfileAction,
    getUserBalanceAction,
    listWorkloadsAction,
    launchWorkloadAction,
    stopWorkloadAction,
    // Will add more actions as they are implemented
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
export default comput3aiPlugin;
