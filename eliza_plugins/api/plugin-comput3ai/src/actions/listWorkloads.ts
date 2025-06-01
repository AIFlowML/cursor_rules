/**
 * List Workloads Action
 * 
 * This action retrieves a list of user workloads from the Comput3AI API.
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
import type { WorkloadItem, ListWorkloadsRequest } from "../types";

// Load environment variables
dotenv.config();

/**
 * Action to retrieve a list of user workloads from Comput3AI API
 */
export const listWorkloadsAction: Action = {
  /**
   * Action identifier
   */
  name: "LIST_WORKLOADS",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_WORKLOADS",
    "SHOW_WORKLOADS",
    "LIST_MY_WORKLOADS",
    "DISPLAY_WORKLOADS",
    "SHOW_MY_WORKLOADS",
  ],
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, _message: Memory): Promise<boolean> => {
    logger.debug("Validating LIST_WORKLOADS action");
    
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    
    if (!apiKey) {
      logger.error("LIST_WORKLOADS validation failed: Missing API key");
      return false;
    }
    
    logger.debug("LIST_WORKLOADS validation successful");
    return true;
  },
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves a list of user workloads from Comput3AI",
  
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
    message: Memory,
    _state: State,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<boolean> => {
    logger.info("Executing LIST_WORKLOADS action");
    
    try {
      // Create API client
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      
      // Determine if we should filter for running workloads only
      const messageText = message.content?.text as string || "";
      const showOnlyRunning = messageText.toLowerCase().includes("running");
      logger.debug(`Filtering for running workloads only: ${showOnlyRunning}`);
      
      const requestOptions: ListWorkloadsRequest = {
        running: showOnlyRunning || undefined,
      };
      
      // Fetch workloads list
      logger.debug("Fetching workloads list from Comput3AI API", requestOptions);
      const response = await apiClient.listWorkloads(requestOptions);
      
      // Check for success
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to retrieve workloads";
        logger.error(`LIST_WORKLOADS failed: ${errorMessage}`);
        
        callback({
          text: `Failed to retrieve workloads: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          },
        });
        
        return false;
      }
      
      // Process successful response
      const workloads = response.data;
      logger.info(`Retrieved ${workloads.length} workloads`);
      logger.debug("Workloads:", workloads);
      
      // Format user-friendly response
      const formattedWorkloads = formatWorkloadsList(workloads, showOnlyRunning);
      
      callback({
        text: formattedWorkloads,
        content: { 
          success: true, 
          data: workloads 
        },
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`LIST_WORKLOADS error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      callback({
        text: `Failed to retrieve workloads: ${errorMessage}`,
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
          text: "List all my Comput3 workloads",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Here are your Comput3AI workloads...",
          actions: ["LIST_WORKLOADS"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me my running workloads on Comput3AI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch your running workloads...",
          actions: ["LIST_WORKLOADS"],
        },
      },
    ],
  ] as ActionExample[][],
} as Action;

/**
 * Format workloads list into a readable string
 * 
 * @param workloads - Array of workload items
 * @param showOnlyRunning - Whether only running workloads were requested
 * @returns Formatted string
 */
function formatWorkloadsList(workloads: WorkloadItem[], showOnlyRunning: boolean): string {
  if (workloads.length === 0) {
    return `No ${showOnlyRunning ? 'running ' : ''}workloads found.`;
  }
  
  const header = `Found ${workloads.length} ${showOnlyRunning ? 'running ' : ''}workload${workloads.length > 1 ? 's' : ''}:`;
  
  const workloadLines = workloads.map((workload) => {
    const createdDate = new Date(workload.created * 1000).toLocaleString();
    const expiresDate = new Date(workload.expires * 1000).toLocaleString();
    
    return [
      `\n• Workload: ${workload.workload}`,
      `  Type: ${workload.type}`,
      `  Status: ${workload.status}`,
      `  Node: ${workload.node}`,
      `  Running: ${workload.running ? 'Yes' : 'No'}`,
      `  Created: ${createdDate}`,
      `  Expires: ${expiresDate}`,
    ].join('\n');
  });
  
  return `${header}${workloadLines.join('\n')}`;
} 