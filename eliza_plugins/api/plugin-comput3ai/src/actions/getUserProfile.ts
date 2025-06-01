/**
 * Get User Profile Action
 * 
 * This action retrieves the user profile information from the Comput3AI API.
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
import type { UserProfile } from "../types";

// Load environment variables
dotenv.config();

/**
 * Action to retrieve user profile information from Comput3AI API
 */
export const getUserProfileAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_PROFILE",
  
  /**
   * Alternative action names
   */
  similes: [
    "SHOW_USER_PROFILE",
    "GET_COMPUT3_PROFILE",
    "DISPLAY_USER_PROFILE",
    "MY_COMPUT3_PROFILE",
  ],
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, _message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_PROFILE action");
    
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    
    if (!apiKey) {
      logger.error("GET_USER_PROFILE validation failed: Missing API key");
      return false;
    }
    
    logger.debug("GET_USER_PROFILE validation successful");
    return true;
  },
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves user profile information from Comput3AI",
  
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
    logger.info("Executing GET_USER_PROFILE action");
    
    try {
      // Create API client
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      
      // Fetch user profile
      logger.debug("Fetching user profile from Comput3AI API");
      const response = await apiClient.getUserProfile();
      
      // Check for success
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to retrieve user profile";
        logger.error(`GET_USER_PROFILE failed: ${errorMessage}`);
        
        callback({
          text: `Failed to retrieve user profile: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          },
        });
        
        return false;
      }
      
      // Process successful response
      const profile = response.data;
      logger.info("Retrieved user profile");
      logger.debug("User profile:", profile);
      
      // Format user-friendly response
      const formattedProfile = formatUserProfile(profile);
      
      callback({
        text: formattedProfile,
        content: { 
          success: true, 
          data: profile 
        },
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`GET_USER_PROFILE error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      callback({
        text: `Failed to retrieve user profile: ${errorMessage}`,
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
          text: "What's my Comput3 profile?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your Comput3AI profile information...",
          actions: ["GET_USER_PROFILE"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me my Comput3AI user profile",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Here's your Comput3AI profile information...",
          actions: ["GET_USER_PROFILE"],
        },
      },
    ],
  ] as ActionExample[][],
} as Action;

/**
 * Format user profile into a readable string
 * 
 * @param profile - User profile object
 * @returns Formatted string
 */
function formatUserProfile(profile: UserProfile): string {
  const lines = [
    "User Profile Information:",
    `Wallet Address: ${profile.addr}`,
    `User UUID: ${profile.user_uuid}`,
  ];
  
  if (profile.tags && profile.tags.length > 0) {
    lines.push(`Tags: ${profile.tags.join(", ")}`);
  } else {
    lines.push("Tags: None");
  }
  
  return lines.join("\n");
} 