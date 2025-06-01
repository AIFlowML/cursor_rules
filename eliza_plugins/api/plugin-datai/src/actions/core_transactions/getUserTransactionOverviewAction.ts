/**
 * Get User Transaction Overview Action
 * 
 * This action retrieves a comprehensive overview of a user's transaction history.
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
import { DataiApiClient } from "../../utils/apiClient";
import { isValidWalletAddress, extractWalletAddress } from "../../utils/validation";
import { API_CONFIG, ENDPOINTS } from "../../constants";
import type { UserTransactionOverviewResponse } from "../../types";

/**
 * Extract limit parameter from prompt
 * @param prompt - The user prompt
 * @returns The limit value if found, otherwise null
 */
function extractLimitFromPrompt(prompt: string): number | null {
  // Look for "LIMIT X" or "limit X" pattern
  const limitMatch = prompt.match(/limit\s+(\d+)/i);
  if (limitMatch?.[1]) {
    return Number.parseInt(limitMatch[1], 10);
  }
  return null;
}

/**
 * Action to retrieve transaction overview for a user wallet
 */
export const getUserTransactionOverviewAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_TRANSACTION_OVERVIEW_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_TX_OVERVIEW_SUMMARY_DATAI",
    "FETCH_TRANSACTION_OVERVIEW_DATAI",
    "SHOW_TX_STATS_DATAI",
    "DISPLAY_WALLET_TX_SUMMARY_DATAI",
    "TRANSACTION_OVERVIEW_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves a comprehensive overview of a user's transaction history, including summary statistics",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getUserTransactionOverview action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    if (!apiKey) {
      logger.error(`getUserTransactionOverview validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }

    const messageText = message.content?.text?.toLowerCase() || '';

    // Keyword check for terms related to overview/summary
    const overviewKeywords = ['overview', 'summary', 'stats', 'statistic'];
    const hasOverviewKeyword = overviewKeywords.some(keyword => messageText.includes(keyword));

    if (!hasOverviewKeyword) {
      logger.debug("getUserTransactionOverview validation failed: Missing overview-related keyword in message.");
      return false;
    }
    
    // Need a valid wallet address
    logger.debug("Attempting to extract wallet address from message");
    const walletAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${walletAddress || 'None'}`);
    
    if (!walletAddress) {
      logger.debug("getUserTransactionOverview validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug(`Validating wallet address format: ${walletAddress}`);
    if (!isValidWalletAddress(walletAddress)) {
      logger.error(`getUserTransactionOverview validation failed: Invalid wallet address format ${walletAddress}`);
      return false;
    }
    
    logger.debug("getUserTransactionOverview validation successful");
    return true;
  },
  
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
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info("Executing getUserTransactionOverview action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    logger.debug(`Options: ${JSON.stringify(options)}`);
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const walletAddress = options?.walletAddress as string || extractWalletAddress(message.content?.text || '');
      logger.debug(`Extracted wallet address: ${walletAddress}`);
     
      // Extract limit from the message text if available
      const messageLimit = message.content?.text ? extractLimitFromPrompt(message.content.text) : null;
      logger.debug(`Extracted limit from message: ${messageLimit}`);
      
      // Use extracted limit, options limit, or default to 10 transactions
      // Ensure options.limit is treated as a number or undefined
      const optionsLimit = (typeof options?.limit === 'number') ? options.limit : undefined;
      const limit = messageLimit ?? optionsLimit ?? 10;
      logger.debug(`Using limit: ${limit}`);      

      if (!walletAddress || !isValidWalletAddress(walletAddress) || !callback) {
        // We need the wallet address and callback to proceed
        logger.error(`Missing required parameters: walletAddress=${!!walletAddress}, validAddress=${walletAddress ? isValidWalletAddress(walletAddress) : false}, callback=${!!callback}`);
        
        if (callback) {
          if (!walletAddress || !isValidWalletAddress(walletAddress)) {
            logger.debug("Responding with missing wallet address error");
            callback({
              text: 'Please provide a valid wallet address to check transaction overview.',
              content: { 
                success: false, 
                error: 'Invalid or missing wallet address' 
              }
            });
          }
        } else {
          logger.error('getUserTransactionOverview: No callback provided');
        }
        
        return false;
      }
      
      // Create API client
      const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                    process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
      logger.debug(`Using API key (truncated): ${apiKey ? `${apiKey.substring(0, 5)}...` : 'Missing'}`);
      
      if (!apiKey) {
        logger.error(`Missing API key: ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
        callback({
          text: `Error: API key not found. Please configure the ${API_CONFIG.DATAI_API_KEY_ENV_VAR} environment variable.`,
          content: { 
            success: false, 
            error: `Missing API key: ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`
          }
        });
        return false;
      }
      
      const apiClient = new DataiApiClient(apiKey);
      
      // Build the endpoint with path parameter
      const endpoint = ENDPOINTS.GET_USER_TRANSACTION_OVERVIEW_DATAI.replace('{userAddress}', walletAddress);
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching transaction overview for wallet ${walletAddress}`);
      const response = await apiClient.get<UserTransactionOverviewResponse>(endpoint);
      logger.debug(`API response received: success=${response.success}, error=${response.error || 'none'}`);
      logger.debug(`Response status code: ${response.statusCode}`);
      
      // Log the API response for debugging
      if (response.data) {
        logger.debug("==================== FULL API RESPONSE DATA ====================");
        try {
          const jsonString = JSON.stringify(response.data, null, 2);
          logger.debug(jsonString);
        } catch (error) {
          logger.debug(`Error stringifying response data: ${error}`);
        }
        logger.debug("==================== END FULL API RESPONSE DATA ====================");
      }
      
      // Handle API errors
      if (!response.success) {
        const errorMessage = response.error || "Unknown API error";
        logger.error(`API error: ${errorMessage}`);
        callback({
          text: `Error fetching transaction overview: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const overview = response.data;
      logger.debug(`Received overview data: ${overview ? 'Yes' : 'No'}`);
      
      if (!overview) {
        logger.info(`No transaction data found for wallet ${walletAddress}`);
        callback({
          text: `No transaction data found for wallet ${walletAddress}.`,
          content: { 
            success: true, 
            data: { overview: null } 
          }
        });
        
        return true;
      }
      
      // Format the response
      logger.debug("Formatting response text");
      
      logger.debug("Sending successful response with transaction overview data");
      callback({
        text: formatTransactionOverviewResponse(overview, walletAddress, limit),
        content: { 
          success: true, 
          data: { overview } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`getUserTransactionOverview error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        logger.debug("Sending error response to callback");
        callback({
          text: `Failed to retrieve transaction overview: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
      }
      
      return false;
    }
  },
  
  /**
   * Example conversations for this action
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me a transaction overview for wallet 0x4f2083f5fbede34c2714affb3105539775f7fe64"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll get you a summary of all transaction activity for that wallet. One moment...",
          actions: ["GET_USER_TRANSACTION_OVERVIEW_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What's the transaction overview for this address: 0x4f2083f5fbede34c2714affb3105539775f7fe64?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch the transaction overview for 0x4f2083f5fbede34c2714affb3105539775f7fe64...",
          actions: ["GET_USER_TRANSACTION_OVERVIEW_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you give me an overview of transactions for 0x4f2083f5fbede34c2714affb3105539775f7fe64?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Analyzing transaction history for 0x4f2083f5fbede34c2714affb3105539775f7fe64. This will show you activity across chains, transaction types, and more...",
          actions: ["GET_USER_TRANSACTION_OVERVIEW_DATAI"]
        }
      }
    ]
  ] as ActionExample[][],
}; 

/**
 * Format the transaction overview data into a user-friendly message
 * 
 * @param overview - Transaction overview data from API response
 * @param walletAddress - The wallet address that was queried
 * @param limit - Optional limit for number of items to display in lists
 * @returns Formatted response message
 */
function formatTransactionOverviewResponse(overview: UserTransactionOverviewResponse, walletAddress: string, limit?: number): string {
  let responseText = `Transaction Overview for ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\n`;
  const displayLimit = limit ?? 10; // Default to showing 10 items if no limit specified for lists
   
  // Basic Overview from the direct API response
  responseText += "📊 Wallet Summary:\n";
  responseText += `• Total Chains Active On: ${overview.nbOfChains || 0}\n`;
  responseText += `• Total Initiated Transactions: ${overview.nbOfTransactions || 0}\n`;
  if (overview.creationTimestamp) {
    const creationDate = new Date(overview.creationTimestamp * 1000).toLocaleDateString();
    responseText += `• Wallet First Seen: ${creationDate}\n`;
  }

  // Chain-specific overview from the 'overview' array
  if (overview.overview && overview.overview.length > 0) {
    responseText += "\n🔗 Chain Activity Details:\n";
    
    const chainsToShow = overview.overview.slice(0, displayLimit);

    for (const chainInfo of chainsToShow) {
      responseText += `• Chain: ${chainInfo.chainId.toUpperCase()}\n`;
      responseText += `  - Transactions on this chain: ${chainInfo.nbOfTransactions ?? 'N/A'}\n`;
      if (chainInfo.creationTimestamp) {
        const firstActivityDate = new Date(chainInfo.creationTimestamp * 1000).toLocaleDateString();
        responseText += `  - First activity on chain: ${firstActivityDate}\n`;
      }
    }
    
    if (overview.overview.length > displayLimit) {
      responseText += `\n  ...and ${overview.overview.length - displayLimit} more chains.`;
    }
  } else {
    responseText += "\n🔗 No specific chain activity details available.\n";
  }
   
  // End with suggestion
  responseText += "\n\nUse other actions like 'Get User Transactions by Chain' for more detailed transaction history.";
  
  return responseText;
}

// FULL TEST DATA FOR THIS ACTION
// ## 26. Get User Transaction Overview - NEED TO FIX IN THE CONSTANT.ts

// **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/{userAddress}`

// **cURL to run (Generic):**
// ```bash
// curl -X GET -H "Authorization: GET_YOUR_DATAI_API" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/{userAddress}"
// ```
// *(Replace `{userAddress}` with the actual user's wallet address. Refer to `api_help.md` (Entry #26) for a working example: `userAddress=0x4f2083f5fbede34c2714affb3105539775f7fe64`)*

// **Test Parameters Used:**
// *   `userAddress`: `0x4f2083f5fbede34c2714affb3105539775f7fe64`

// **Tested cURL Command:**
// ```bash
// curl -X GET -H "Authorization: GET_YOUR_DATAI_API" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/0x4f2083f5fbede34c2714affb3105539775f7fe64" | cat
// ```

// **Essential Information:**
// *   **Description:** Get a list of chains the specific user is active on, and the number of transactions initiated by the user on those chains (excluding Solana). This is not the total number of transactions involved but only those initiated by the user.
// *   **API Key:** Pass the API key `GET_YOUR_DATAI_API` in the `Authorization` header (e.g., `Authorization: your_api_key`).
// *   **Method:** `GET`
// *   **Path Parameters:**
//     *   `userAddress` (string, required): The wallet address of the user.
// *   **Query Parameters:** None specified.
// *   **Response:** Returns a JSON object containing `wallet` address, `nbOfChains` active, `nbOfTransactions` initiated, `creationTimestamp` of the wallet, and an `overview` array. Each item in the `overview` array represents a chain and includes `chainId`, `creationTimestamp` (first activity on that chain), and `nbOfTransactions` (initiated on that chain, can be null). (See original documentation for schema details).
// *   **Note:** The documentation states this endpoint provides the number of transactions *initiated* by the user on Advanced Transactions supported chains (excluding Solana).

// **Suggested Action Name:** `GET_USER_TRANSACTION_OVERVIEW_DATAI`
// **Corresponding .ts File:** `getUserTransactionOverviewAction.ts`

// # Action: GET_USER_TRANSACTION_OVERVIEW_DATAI
// run_curl_test "GET_USER_TRANSACTION_OVERVIEW_DATAI" "curl -X GET -H \"Authorization: GET_YOUR_DATAI_API\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/0x4f2083f5fbede34c2714affb3105539775f7fe64\" | cat"
