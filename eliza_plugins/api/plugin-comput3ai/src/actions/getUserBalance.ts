/**
 * Get User Balance Action
 * 
 * This action retrieves the user's balance information from the Comput3AI API.
 */
import {
  type Action,
  type ActionExample,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import dotenv from "dotenv";
import { createComput3ApiClient } from "../utils/apiClient";
import type { UserBalance } from "../types";

// Load environment variables
dotenv.config();

/**
 * Action to retrieve user balance information from Comput3AI API
 */
export const getUserBalanceAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_BALANCE",
  
  /**
   * Alternative action names
   */
  similes: [
    "SHOW_USER_BALANCE",
    "CHECK_BALANCE",
    "GET_COMPUT3_BALANCE",
    "DISPLAY_USER_BALANCE",
    "MY_COMPUT3_BALANCE",
  ],
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, _message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_BALANCE action");
    
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    
    if (!apiKey) {
      logger.error("GET_USER_BALANCE validation failed: Missing API key");
      return false;
    }
    
    logger.debug("GET_USER_BALANCE validation successful");
    return true;
  },
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves user balance information from Comput3AI",
  
  /**
   * Main action handler
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @param state - Agent state
   * @param options - Additional options
   * @param callback - Callback for sending response
   * @returns Success status
   */
  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<boolean> => {
    logger.info("Executing GET_USER_BALANCE action");
    
    try {
      // Create API client
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      
      // Fetch user balance
      logger.debug("Fetching user balance from Comput3AI API");
      const response = await apiClient.getUserBalance();
      
      // Check for success
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to retrieve user balance";
        logger.error(`GET_USER_BALANCE failed: ${errorMessage}`);
        
        callback({
          text: `Failed to retrieve user balance: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          },
        });
        
        return false;
      }
      
      // Process successful response
      const balance = response.data;
      logger.info("Retrieved user balance");
      logger.debug("User balance:", balance);
      
      // Format user-friendly response
      const formattedBalance = formatUserBalance(balance);
      
      callback({
        text: formattedBalance,
        content: { 
          success: true, 
          data: balance 
        },
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`GET_USER_BALANCE error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      callback({
        text: `Failed to retrieve user balance: ${errorMessage}`,
        content: { 
          success: false, 
          error: errorMessage 
        },
      });
      
      return false;
    }
  },
  
  /**
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "What's my current balance on Comput3?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your Comput3AI balance...",
          actions: ["GET_USER_BALANCE"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "How many tokens do I have in my Comput3AI account?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your current token balance...",
          actions: ["GET_USER_BALANCE"],
        },
      },
    ],
  ] as ActionExample[][],
} as Action;

/**
 * Format user balance into a readable string
 * 
 * @param balance - User balance object
 * @returns Formatted string
 */
function formatUserBalance(balance: UserBalance): string {
  return `Your current Comput3AI balance is: ${balance.balance} tokens`;
} 