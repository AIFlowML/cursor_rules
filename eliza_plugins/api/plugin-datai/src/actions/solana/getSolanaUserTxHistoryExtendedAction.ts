/**
 * Get Solana User Transaction History - Extended Action
 * 
 * This action retrieves detailed transaction history for a user on the Solana blockchain.
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
 * Action to retrieve a detailed list of transactions for a user on Solana blockchain
 */
export const getSolanaUserTxHistoryExtendedAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_SOLANA_TX_HISTORY_EXTENDED_DATAI",
    "FETCH_DETAILED_SOLANA_TRANSACTIONS_DATAI",
    "LIST_MY_SOLANA_TRANSACTIONS_EXTENDED_DATAI",
    "SHOW_SOLANA_TX_HISTORY_DETAILED_DATAI",
    "GET_MY_SOLANA_TRANSACTION_DETAILS_DATAI",
    "SHOW_SOLANA_EXTENDED_TX_HISTORY_DATAI",
    "GET_DETAILED_SOLANA_TRANSACTION_LOG_DATAI",
    "FETCH_FULL_SOLANA_TX_DETAILS_DATAI",
    "LIST_SOLANA_LONG_VERSION_TRANSACTIONS_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves detailed transaction history for a user on the Solana blockchain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    if (!apiKey) {
      logger.error(`GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'null'}`);
    if (!userAddress) {
      logger.debug("GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug(`Validating wallet address: ${userAddress}`);
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Specifically check for Solana-related keywords AND extended/detailed keywords in the message
    const messageText = (message.content?.text || '').toLowerCase();
    const isSolanaQuery = messageText.includes('solana');
    logger.debug(`Message contains Solana keyword: ${isSolanaQuery}`);

    const extendedKeywords = ['extended', 'detailed', 'full', 'long version', 'details'];
    const hasExtendedKeyword = extendedKeywords.some(keyword => messageText.includes(keyword));
    logger.debug(`Message contains extended/detailed keyword: ${hasExtendedKeyword}`);
    
    if (!isSolanaQuery || !hasExtendedKeyword) {
      logger.debug("GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI validation failed: Query doesn't mention Solana and/or extended/detailed terms");
      return false;
    }
    
    logger.debug("GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI validation successful");
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
    logger.info("Executing GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI action");
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      logger.debug(`Extracted parameters: userAddress=${userAddress}`);

      // Extract limit from the message text if available
      const messageLimit = message.content?.text ? extractLimitFromPrompt(message.content.text) : null;
      logger.debug(`Extracted limit from message: ${messageLimit}`);
      
      // Use extracted limit, options limit, or default to 10 transactions
      // Ensure options.limit is treated as a number or undefined
      const optionsLimit = (typeof options?.limit === 'number') ? options.limit : undefined;
      const limit = messageLimit ?? optionsLimit ?? 10;
      logger.debug(`Using limit: ${limit}`);

      if (!userAddress || !callback) {
        // We need a wallet address and callback to proceed
        logger.error(`Missing required parameters: userAddress=${!!userAddress}, callback=${!!callback}`);
        if (callback) {
          if (!userAddress) {
            callback({
              text: 'Please provide a valid Solana wallet address to check transaction history.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          }
        } else {
          logger.error('GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI: No callback provided');
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
      // For Solana, we need to add chain=solana as a query parameter
      const endpoint = `${ENDPOINTS.GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI.replace('{userAddress}', userAddress)}?chain=solana&limit=${limit}`;
      
      logger.info(`Fetching Solana transaction history for ${userAddress} (limit: ${limit})`);
      logger.debug(`API endpoint: ${endpoint}`);

      // Log the API key being used (first 10 chars only for security)
      const apiKeyTruncated = `${apiKey.substring(0, 10)}...`;
      logger.debug(`Using API key: ${apiKeyTruncated}`);
      
      logger.debug("Making API request to DataI service...");

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
          text: `Error fetching Solana transaction history: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const transactions = response.data;
      logger.debug(`Received ${transactions?.length || 0} Solana transactions`);
      
      if (!transactions || transactions.length === 0) {
        logger.info(`No Solana transactions found for address ${userAddress}`);
        callback({
          text: `No Solana transactions found for address ${userAddress}.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function to format the response
      logger.debug("Formatting response using dedicated formatting function");
      const responseText = formatSolanaTransactionsResponse(transactions, userAddress, limit);
      
      logger.info("Successfully processed Solana transactions, sending response");
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { transactions } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve Solana transaction history: ${errorMessage}`,
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
          text: "Show me my detailed Solana transaction history for wallet rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ on DATAI LIMIT 10",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me retrieve your Solana transaction history. One moment please...",
          actions: ["GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What transactions has rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ made on Solana? on DATAI LIMIT 5",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch the detailed Solana transaction history for this wallet address...",
          actions: ["GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get the most recent 5 Solana transactions for rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ with full details on DATAI LIMIT 5",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving your detailed Solana transaction history...",
          actions: ["GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format Solana transaction history into a user-friendly message
 * 
 * @param transactions - Array of transaction history items from API
 * @param userAddress - The wallet address that was queried
 * @param limit - The limit for the number of transactions to show
 * @returns Formatted response message
 */
function formatSolanaTransactionsResponse(
  transactions: TransactionHistoryItem[],
  userAddress: string,
  limit?: number
): string {
  const transactionsToShow = limit ? transactions.slice(0, limit) : transactions;

  let responseText = `Found ${transactions.length} Solana transactions for ${userAddress}`;

  if (limit && transactions.length > limit) {
    responseText += ` (showing the ${limit} most recent)`;
  } else if (transactionsToShow.length > 0) {
    responseText += ` (showing all ${transactionsToShow.length})`;
  }
  responseText += ':\n\n';
  
  // List transactions
  for (const tx of transactionsToShow) {
    const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
    const txValue = tx.txFeeUsd ? `${tx.txFeeUsd.toFixed(2)} USD` : 'N/A';
    
    responseText += `- ${tx.txType || 'Transaction'} (${date})`;
    responseText += `\n  Signature: ${tx.hash}`;
    responseText += `\n  Fee: ${txValue}`;
    
    if (tx.from) {
      const fromAddress = tx.from === userAddress ? 'You' : tx.from;
      responseText += `\n  From: ${fromAddress}`;
    }
    
    if (tx.to) {
      const toAddress = tx.to === userAddress ? 'You' : tx.to;
      responseText += `\n  To: ${toAddress}`;
    }
    
    // Add specific Solana details if available
    if (tx.txAction) {
      responseText += `\n  Action: ${tx.txAction}`;
    }
    
    if (tx.balances && tx.balances.length > 0) {
      responseText += "\n  Tokens Involved:";
      for (const balance of tx.balances) {
        responseText += `\n    ${balance.tokenSymbol || 'Unknown Token'}: ${balance.balance} ${balance.balanceUSD ? `($${balance.balanceUSD.toFixed(2)})` : ''}`;
      }
    }
    
    responseText += '\n\n';
  }
  
  return responseText;
}

/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 18. Get Solana User Transaction History - Extended (Default 100)
 * 
 * **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/{userAddress}?chain=solana`
 * 
 * **Test Parameters Used:**
 * - `userAddress`: `rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ`
 * - `chain`: `solana`
 * - `limit`: `5`
 * 
 * **Tested cURL Command:**
 * curl -X GET -H "Authorization: GET_YOUR_DATAI_API" 
 * "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ?chain=solana&limit=5"
 * 
 * **Essential Information:**
 * - Description: Retrieves extended transaction history for a Solana user address. Includes detailed information for each transaction.
 * - Path Parameters:
 *   - `userAddress` (string, required): The Solana wallet address of the user.
 * - Query Parameters:
 *   - `chain` (string, required): Must be set to `solana`.
 *   - `beforeHash` (string, optional): If set, returns transactions prior to this hash. Used for pagination.
 *   - `limit` (integer, optional): Number of transactions to return. Default is 100.
 * - Response: Returns a JSON array of Solana transaction objects with detailed information including
 *   transaction signature, timestamp, from/to addresses, chain, protocol, type, action, hash, fee, and token balances.
 * - Note: Classification coverage for Solana transactions includes wallet transfers, NFT airdrops,
 *   liquidity pool exchange, and staking operations.
 */

