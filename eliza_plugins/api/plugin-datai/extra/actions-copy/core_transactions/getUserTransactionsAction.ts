/**
 * Get User Transactions Action
 * 
 * This action retrieves transaction history for a user across chains.
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
import type { TransactionHistoryItem } from "../../types";

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
 * Action to retrieve a list of transactions for a user
 */
export const getUserTransactionsAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI",
    "FETCH_TRANSACTION_HISTORY_DATAI",
    "LIST_MY_TRANSACTIONS_DATAI",
    "SHOW_TX_HISTORY_DATAI",
    "GET_MY_TRANSACTION_HISTORY_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves transaction history for a user across blockchains",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getUserTransactions action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    if (!apiKey) {
      logger.error(`GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug(`Validating wallet address format: ${userAddress}`);
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI validation failed: Invalid wallet address format ${userAddress}`);
      return false;
    }
    
    logger.debug("GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI validation successful");
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
    logger.info("Executing GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    logger.debug(`Options: ${JSON.stringify(options)}`);
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      logger.debug(`Extracted wallet address: ${userAddress}`);
      
      // Extract limit from the message text if available
      const messageLimit = message.content?.text ? extractLimitFromPrompt(message.content.text) : null;
      logger.debug(`Extracted limit from message: ${messageLimit}`);
      
      // Use extracted limit, options limit, or default to 5 transactions
      const limit = messageLimit || options?.limit || 5;
      logger.debug(`Using limit: ${limit}`);
      
      if (!userAddress || !callback) {
        // We need a wallet address and callback to proceed
        logger.error(`Missing required parameters: userAddress=${!!userAddress}, callback=${!!callback}`);
        
        if (callback) {
          if (!userAddress) {
            logger.debug("Responding with missing wallet address error");
            callback({
              text: 'Please provide a valid wallet address to check transaction history.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          }
        } else {
          logger.error('GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI: No callback provided');
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
      
      // Call API - substitute the userAddress value into the endpoint
      const endpoint = `${ENDPOINTS.GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI.replace('{userAddress}', userAddress)}?limit=${limit}`;
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching transaction history for ${userAddress} (limit: ${limit})`);
      const response = await apiClient.get<TransactionHistoryItem[]>(endpoint);
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
          text: `Error fetching transaction history: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const transactions = response.data;
      logger.debug(`Received ${transactions?.length || 0} transactions`);
      
      if (!transactions || transactions.length === 0) {
        logger.info(`No transactions found for address ${userAddress}`);
        callback({
          text: `No transactions found for address ${userAddress}.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      // Format and return response
      logger.debug("Sending successful response with transaction data");
      callback({
        text: formatTransactionsResponse(transactions, userAddress, limit as number),
        content: { 
          success: true, 
          data: { transactions } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        logger.debug("Sending error response to callback");
        callback({
          text: `Failed to retrieve transaction history: ${errorMessage}`,
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
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me transaction history for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI LIMIT 5",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me retrieve the transaction history for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI. I'll limit the results to 5 transactions...",
          actions: ["GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What are the last 5 transactions that 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 made across all chains on DATAI LIMIT 5",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch the 5 most recent transactions for this wallet address across all supported chains on DATAI LIMIT 5...",
          actions: ["GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you show me the transaction history for address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI LIMIT 5",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving transaction history for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 across all chains on DATAI LIMIT 5...",
          actions: ["GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
};

/**
 * Format the transaction history data into a user-friendly message
 * 
 * @param transactions - Transaction history data from API response
 * @param userAddress - The wallet address that was queried
 * @param limit - Optional limit for number of transactions to display
 * @returns Formatted response message
 */
function formatTransactionsResponse(
  transactions: TransactionHistoryItem[], 
  userAddress: string,
  limit?: number
): string {
  // Apply limit if provided
  const transactionsToShow = limit ? transactions.slice(0, limit) : transactions;
  
  let responseText = `📊 Transaction History for ${userAddress} 📊\n\n`;
  responseText += `Found ${transactions.length} transactions`;
  
  // Add note about limiting display if applicable
  if (limit && transactions.length > limit) {
    responseText += ` (showing ${limit})`;
  }
  
  responseText += '\n\n';
  
  // List transactions with improved formatting
  for (const tx of transactionsToShow) {
    // Format date
    const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
    
    // Format transaction heading
    responseText += `🔷 Transaction on ${tx.chain?.toUpperCase() || 'Unknown chain'}\n`;
    responseText += `   Date: ${date}\n`;
    responseText += `   Type: ${tx.txType || 'Unknown'}\n`;
    
    // Add function name if available
    if (tx.functionName) {
      responseText += `   Function: ${tx.functionName}\n`;
    }
    
    // Add token details if available
    if (tx.balances && tx.balances.length > 0) {
      const tokenData = tx.balances[0];
      if (tokenData) {
        responseText += `   Token: ${tokenData.tokenSymbol || tokenData.tokenName || 'Unknown'}\n`;
        
        if (tokenData.tokenAddress) {
          responseText += `   Token Address: ${tokenData.tokenAddress}\n`;
        }
        
        // Include token amount if available and we have decimals
        if (tokenData.balance !== undefined && tokenData.tokenDecimals !== undefined) {
          const readableAmount = Number(tokenData.balance) / (10 ** tokenData.tokenDecimals);
          responseText += `   Amount: ${readableAmount.toLocaleString()}\n`;
        }
      }
    }
    
    // Add from/to addresses
    if (tx.from) {
      responseText += `   From: ${tx.from}\n`;
    }
    
    if (tx.to) {
      responseText += `   To: ${tx.to}\n`;
    }
    
    // Add transaction hash
    responseText += `   Hash: ${tx.hash}\n`;
    
    // Add transaction fee if available
    if (tx.txFeeUsd !== undefined) {
      responseText += `   Fee: ${tx.txFeeUsd.toFixed(2)} USD\n`;
    }
    
    // Add a separator line
    responseText += '\n';
  }
  
  return responseText;
}



// FULL TEST DATA FOR THIS ACTION
// ## 14. Get User Transaction History - All Chains, Extended Info

// **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/{userAddress}?limit={limit}`

// **cURL to run (Generic):**
// ```bash
// curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/{userAddress}?limit={limit}"
// ```
// *(Replace `{userAddress}` with the actual user's wallet address and `{limit}` with the desired number of transactions. Refer to `api_help.md` for working examples like `userAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`, `limit=5`)*

// **Test Parameters Used:**
// *   `userAddress`: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
// *   `limit`: `5`

// **Tested cURL Command:**
// ```bash
// curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=5" | cat
// ```

// **Essential Information:**
// *   **Description:** Get the latest transactions (default 100) for a specific user, across all supported chains they are active on (excluding Solana, which has a dedicated endpoint). Includes classification and DeFi PNL.
// *   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
// *   **Method:** `GET`
// *   **Path Parameters:**
//     *   `userAddress` (string, required): The wallet address of the user.
// *   **Query Parameters (from description, not formally listed but important):**
//     *   `startTime` (timestamp, optional): If set, will return the latest transactions (up to default/specified limit) *prior* to this Unix timestamp.
//     *   `limit` (integer, optional, behavior observed): While the docs state a default of 100, testing with `?limit=5` appeared to return a smaller set. Official support for a `limit` param should be confirmed.
// *   **Response:** Returns a JSON array of transaction objects. Each object is detailed, including `id`, `balances` (tokens moved, with full details), `chain`, `hash`, `timeStamp`, `txFee`, `txFeeUsd`, `txType`, `protocol`, `pnlUsd`, `yieldUSD`, etc. (See original documentation for the extensive schema).
// *   **Note:** The documentation explicitly states, "*For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below."

// **Suggested Action Name:** `GET_USER_TX_HISTORY_ALL_EXTENDED_DATAI`
// **Corresponding .ts File:** `getUserTransactionsAction.ts`