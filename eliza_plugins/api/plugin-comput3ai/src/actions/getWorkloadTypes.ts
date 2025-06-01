/**
 * Get Workload Types Action
 * 
 * This action retrieves the available workload types from the Comput3AI API.
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
import type { WorkloadType } from "../types";

// Load environment variables
dotenv.config();

/**
 * Action to retrieve available workload types from Comput3AI API
 */
export const getWorkloadTypesAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_WORKLOAD_TYPES",
  
  /**
   * Alternative action names
   */
  similes: [
    "LIST_WORKLOAD_TYPES",
    "GET_COMPUT3_TYPES",
    "LIST_COMPUT3_TYPES",
    "SHOW_WORKLOAD_TYPES",
  ],
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, _message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_WORKLOAD_TYPES action");
    
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    
    if (!apiKey) {
      logger.error("GET_WORKLOAD_TYPES validation failed: Missing API key");
      return false;
    }
    
    logger.debug("GET_WORKLOAD_TYPES validation successful");
    return true;
  },
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves available GPU workload types from Comput3AI",
  
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
    logger.info("Executing GET_WORKLOAD_TYPES action");
    
    try {
      // Create API client
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      
      // Fetch workload types
      logger.debug("Fetching workload types from Comput3AI API");
      const response = await apiClient.getWorkloadTypes();
      
      // Check for success
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to retrieve workload types";
        logger.error(`GET_WORKLOAD_TYPES failed: ${errorMessage}`);
        
        callback({
          text: `Failed to retrieve workload types: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          },
        });
        
        return false;
      }
      
      // Process successful response
      const workloadTypes = response.data;
      logger.info(`Retrieved ${workloadTypes.length} workload types`);
      logger.debug("Workload types:", workloadTypes);
      
      // Format user-friendly response
      const formattedTypes = formatWorkloadTypes(workloadTypes);
      
      callback({
        text: `Available workload types: ${formattedTypes}`,
        content: { 
          success: true, 
          data: workloadTypes 
        },
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`GET_WORKLOAD_TYPES error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      callback({
        text: `Failed to retrieve workload types: ${errorMessage}`,
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
          text: "What workload types are available on Comput3?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check the available workload types...",
          actions: ["GET_WORKLOAD_TYPES"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me the GPU workload options I can launch",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Here are the available GPU workload types...",
          actions: ["GET_WORKLOAD_TYPES"],
        },
      },
    ],
  ] as ActionExample[][],
} as Action;

/**
 * Format workload types into a readable string
 * 
 * @param types - List of workload types
 * @returns Formatted string
 */
function formatWorkloadTypes(types: WorkloadType[]): string {
  if (types.length === 0) {
    return "No workload types available";
  }
  
  return types.map(type => `'${type}'`).join(", ");
} 