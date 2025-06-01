/**
 * Launch Workload Action
 * 
 * This action launches a new workload on the Comput3AI platform.
 */
import {
  type Action,
  type ActionExample,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  ModelType,
  composePrompt,
  logger,
  parseJSONObjectFromText,
} from "@elizaos/core";
import dotenv from "dotenv";
import { createComput3ApiClient } from "../utils/apiClient";
import type { LaunchWorkloadRequest, LaunchWorkloadResponse, WorkloadType } from "../types";
import { ERROR_MESSAGES } from "../constants";
import { ENHANCED_LAUNCH_WORKLOAD_TEMPLATE, validateLaunchWorkloadFromText } from "../utils/validation";

// Load environment variables
dotenv.config();

/**
 * Interface for launch workload content extracted from user message
 */
interface LaunchWorkloadContent extends Content {
  type: WorkloadType;
  expires?: number;
}

/**
 * Validates if the content is valid for launching a workload
 * 
 * @param content - Content to validate
 * @returns Whether the content is valid
 */
function isLaunchWorkloadContent(content: LaunchWorkloadContent): boolean {
  logger.debug("Validating launch workload content:", content);
  
  if (!content.type || typeof content.type !== 'string') {
    logger.debug("Invalid content: Missing or invalid workload type");
    return false;
  }
  
  if (content.expires !== undefined && typeof content.expires !== 'number') {
    logger.debug("Invalid content: Expires must be a number if provided");
    return false;
  }
  
  return true;
}

/**
 * Template for extracting launch workload parameters from user messages
 */
const launchWorkloadTemplate = ENHANCED_LAUNCH_WORKLOAD_TEMPLATE;

/**
 * Action to launch a new workload on Comput3AI
 */
export const launchWorkloadAction: Action = {
  /**
   * Action identifier
   */
  name: "LAUNCH_WORKLOAD",
  
  /**
   * Alternative action names
   */
  similes: [
    "START_WORKLOAD",
    "CREATE_WORKLOAD",
    "LAUNCH_GPU",
    "START_GPU",
    "CREATE_GPU_WORKLOAD",
  ],
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, _message: Memory): Promise<boolean> => {
    logger.debug("Validating LAUNCH_WORKLOAD action");
    
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    
    if (!apiKey) {
      logger.error("LAUNCH_WORKLOAD validation failed: Missing API key");
      return false;
    }
    
    logger.debug("LAUNCH_WORKLOAD validation successful");
    return true;
  },
  
  /**
   * Human-readable description of the action
   */
  description: "Launches a new GPU workload on Comput3AI",
  
  /**
   * Main action handler
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @param state - State object
   * @param options - Additional options
   * @param callback - Callback for sending response
   * @returns Success status
   */
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<boolean> => {
    logger.info("Executing LAUNCH_WORKLOAD action");
    
    try {
      // Create API client
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      
      // Extract launch parameters from message
      logger.debug("Extracting launch parameters from message");
      let launchParams: LaunchWorkloadContent;
      
      if (message.content && 'type' in message.content) {
        // Parameters were directly provided in structured content
        launchParams = message.content as LaunchWorkloadContent;
      } else {
        // Need to extract parameters from text
        const prompt = composePrompt({
          template: launchWorkloadTemplate,
          state: { recentMessages: formatRecentMessages(state) },
        });
        
        logger.debug("Extracting workload parameters using LLM");
        const result = await runtime.useModel(ModelType.TEXT_SMALL, {
          prompt,
        });
        
        launchParams = parseJSONObjectFromText(result) as LaunchWorkloadContent;
        
        // If LLM parsing failed, try direct text extraction
        if (!isLaunchWorkloadContent(launchParams) && message.content && typeof message.content.text === 'string') {
          logger.debug("LLM parsing failed, trying direct text extraction");
          const extractedParams = validateLaunchWorkloadFromText(message.content.text);
          
          if (extractedParams) {
            logger.debug("Direct text extraction successful:", extractedParams);
            launchParams = extractedParams;
          }
        }
      }
      
      // Validate parameters
      if (!isLaunchWorkloadContent(launchParams)) {
        const errorMessage = ERROR_MESSAGES.INVALID_WORKLOAD_TYPE;
        logger.error(`LAUNCH_WORKLOAD failed: ${errorMessage}`);
        
        callback({
          text: `Failed to launch workload: ${errorMessage}. Please specify a valid workload type.`,
          content: { 
            success: false, 
            error: errorMessage 
          },
        });
        
        return false;
      }
      
      // Set default expiration if not provided
      if (launchParams.expires === undefined) {
        launchParams.expires = 10; // Default 10 minutes
      }
      
      // Prepare launch request
      const request: LaunchWorkloadRequest = {
        type: launchParams.type,
        expires: Math.floor(Date.now() / 1000) + (launchParams.expires * 60), // Convert minutes to Unix timestamp
      };
      
      // Add detailed logging
      logger.debug("Launching workload with parameters:", request);
      logger.debug("Request JSON body:", JSON.stringify(request, null, 2));
      logger.debug("Requested workload type:", request.type);
      logger.debug("Requested expiration minutes:", request.expires);
      logger.debug("About to make API call to launch workload");
      
      // Launch workload
      const response = await apiClient.launchWorkload(request);
      
      // Log API response
      logger.debug("API call completed with response:", response);
      
      // Check for success
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to launch workload";
        logger.error(`LAUNCH_WORKLOAD failed: ${errorMessage}`);
        logger.debug("Full error response:", JSON.stringify(response, null, 2));
        
        let userMessage = `Failed to launch workload: ${errorMessage}`;
        
        // Add more helpful context for 502 errors
        if (response.statusCode === 502) {
          userMessage = 'Failed to launch workload: Server error (502 Bad Gateway). The Comput3AI service is currently experiencing issues. Please try again later or contact Comput3AI support if the problem persists.';
        }
        
        callback({
          text: userMessage,
          content: { 
            success: false, 
            error: errorMessage,
            statusCode: response.statusCode
          },
        });
        
        return false;
      }
      
      // Process successful response
      const launchResponse = response.data;
      logger.info("Successfully launched workload");
      logger.debug("Launch response:", launchResponse);
      
      // Format user-friendly response
      const formattedResponse = formatLaunchResponse(launchResponse, request, launchParams.expires);
      
      callback({
        text: formattedResponse,
        content: { 
          success: true, 
          data: launchResponse,
          request: request,
        },
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`LAUNCH_WORKLOAD error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      // Try to log more details about the error
      if (typeof error === 'object' && error !== null) {
        try {
          logger.debug("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
          logger.debug("Could not stringify full error object");
        }
      }

      // Check for 502 errors in the catch block too
      let userMessage = `Failed to launch workload: ${errorMessage}`;
      if (errorMessage.includes("502") || errorMessage.includes("Bad Gateway")) {
        userMessage = 'Failed to launch workload: Server error (502 Bad Gateway). The Comput3AI service is currently experiencing issues. Please try again later or contact Comput3AI support if the problem persists.';
      }
      
      callback({
        text: userMessage,
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
          text: "Launch a new GPU workload of type media:fast that expires in 10 minutes",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Launching a new workload...",
          actions: ["LAUNCH_WORKLOAD"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Start a llama_webui:coder workload that expires in 30 minutes",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Creating a new workload for you...",
          actions: ["LAUNCH_WORKLOAD"],
        },
      },
    ],
  ] as ActionExample[][],
} as Action;

/**
 * Format recent messages for context in the LLM prompt
 * 
 * @param state - State object containing messages
 * @returns Formatted messages string
 */
function formatRecentMessages(state: State): string {
  const messages = state.messages || [];
  return messages.slice(-3).map((msg: { role?: string; content: string | { text: string } }) => {
    if (typeof msg.content === 'string') {
      return `${msg.role || 'user'}: ${msg.content}`;
    }
    if (msg.content && typeof msg.content.text === 'string') {
      return `${msg.role || 'user'}: ${msg.content.text}`;
    }
    return '';
  }).join('\n\n');
}

/**
 * Format launch response into a user-friendly message
 * 
 * @param response - Launch response from API
 * @param request - Original launch request
 * @param expiresMinutes - Original expiration time in minutes
 * @returns Formatted response message
 */
function formatLaunchResponse(response: LaunchWorkloadResponse, request: LaunchWorkloadRequest, expiresMinutes: number): string {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + expiresMinutes);
  
  return [
    `Successfully launched a new ${request.type} workload!`,
    "",
    `Workload ID: ${response.workload}`,
    `Workload Key: ${response.workload_key}`,
    `Node: ${response.node}`,
    `Type: ${request.type}`,
    `Expires: in ${expiresMinutes} minutes (${expiryTime.toLocaleString()})`,
  ].join('\n');
} 