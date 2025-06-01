/**
 * Get Solana User Transaction History - Short Action
 * 
 * This action retrieves a shorter version of transaction history for a user on the Solana blockchain.
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
 * Action to retrieve a shorter list of transactions for a user on Solana blockchain
 */
export const getSolanaUserTxHistoryShortAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_SOLANA_USER_TX_HISTORY_SHORT",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_SOLANA_TX_HISTORY_SHORT",
    "FETCH_RECENT_SOLANA_TRANSACTIONS",
    "LIST_MY_RECENT_SOLANA_TRANSACTIONS",
    "SHOW_SOLANA_TX_SUMMARY",
    "GET_LATEST_SOLANA_TRANSACTIONS"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves a short transaction history for a user on the Solana blockchain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getSolanaUserTxHistoryShort action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    if (!apiKey) {
      logger.error(`getSolanaUserTxHistoryShort validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'null'}`);
    if (!userAddress) {
      logger.debug("getSolanaUserTxHistoryShort validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug(`Validating wallet address: ${userAddress}`);
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`getSolanaUserTxHistoryShort validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Check for Solana-related keywords and short history request keywords
    const messageText = (message.content?.text || '').toLowerCase();
    const isSolanaQuery = messageText.includes('solana');
    const isShortHistoryQuery = messageText.includes('recent') || 
                                messageText.includes('latest') || 
                                messageText.includes('short') || 
                                messageText.includes('summary');
    
    logger.debug(`Message contains Solana keyword: ${isSolanaQuery}`);
    logger.debug(`Message contains short history keywords: ${isShortHistoryQuery}`);
    
    if (!isSolanaQuery || !isShortHistoryQuery) {
      logger.debug("getSolanaUserTxHistoryShort validation failed: Query doesn't match short Solana history pattern");
      return false;
    }
    
    logger.debug("getSolanaUserTxHistoryShort validation successful");
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
    logger.info("Executing getSolanaUserTxHistoryShort action");
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      // Use a smaller limit for short history
      // Extract limit from the message text if available
      const messageLimit = message.content?.text ? extractLimitFromPrompt(message.content.text) : null;
      logger.debug(`Extracted limit from message: ${messageLimit}`);
      
      // Use extracted limit, options limit, or default to 10 transactions
      // Ensure options.limit is treated as a number or undefined
      const optionsLimit = (typeof options?.limit === 'number') ? options.limit : undefined;
      const limit = messageLimit ?? optionsLimit ?? 10;
      logger.debug(`Using limit: ${limit}`);
      logger.debug(`Extracted parameters: userAddress=${userAddress}, limit=${limit}`);
      
      if (!userAddress || !callback) {
        // We need a wallet address and callback to proceed
        logger.error(`Missing required parameters: userAddress=${!!userAddress}, callback=${!!callback}`);
        if (callback) {
          if (!userAddress) {
            callback({
              text: 'Please provide a valid Solana wallet address to check recent transactions.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          }
        } else {
          logger.error('getSolanaUserTxHistoryShort: No callback provided');
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
      const endpoint = `${ENDPOINTS.GET_SOLANA_USER_TX_HISTORY_SHORT.replace('{userAddress}', userAddress)}?chain=solana&limit=${limit}`;
      
      logger.info(`Fetching recent Solana transactions for ${userAddress} (limit: ${limit})`);
      logger.debug(`API endpoint: ${endpoint}`);
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
          text: `Error fetching recent Solana transactions: ${errorMessage}`,
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
        logger.info(`No recent Solana transactions found for address ${userAddress}`);
        callback({
          text: `No recent Solana transactions found for address ${userAddress}.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function for response text
      logger.debug("Formatting response using dedicated function");
      const responseText = formatSolanaTransactionsShortResponse(transactions, userAddress, limit);
      
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
      logger.error(`getSolanaUserTxHistoryShort error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve recent Solana transactions: ${errorMessage}`,
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
          text: "Show me a short history of my recent Solana transactions for wallet HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g, on DATAI LIMIT 5",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me retrieve your recent Solana transactions. One moment please...",
          actions: ["GET_SOLANA_USER_TX_HISTORY_SHORT"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What are the latest transactions on my Solana account HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g on DATAI LIMIT 5",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll get a summary of your recent Solana transactions...",
          actions: ["GET_SOLANA_USER_TX_HISTORY_SHORT"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Give me a short history of HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g Solana transactions, on DATAI LIMIT 5",
        },
      },
      {
        name: "{{name2}}",
        content: {  
          text: "Retrieving a brief transaction history for this Solana wallet...",
          actions: ["GET_SOLANA_USER_TX_HISTORY_SHORT"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format Solana transaction history (short version) into a user-friendly message
 * 
 * @param transactions - Array of transaction history items from API
 * @param userAddress - The wallet address that was queried
 * @param limit - The limit for the number of transactions to show
 * @returns Formatted response message
 */
function formatSolanaTransactionsShortResponse(
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
  
  // List transactions (shorter format)
  for (const tx of transactionsToShow) {
    const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
    
    responseText += `▪️ ${tx.txType || 'Transaction'} (${date})`;
    responseText += `\n  Signature: ${tx.hash.substring(0, 12)}...`;
    
    if (tx.from) {
      const fromDisplay = tx.from.toLowerCase() === userAddress.toLowerCase() ? 'You' : `${tx.from.substring(0,6)}...${tx.from.substring(tx.from.length-4)}`;
      responseText += `\n  From: ${fromDisplay}`;
    }
    if (tx.to) {
      const toDisplay = tx.to.toLowerCase() === userAddress.toLowerCase() ? 'You' : `${tx.to.substring(0,6)}...${tx.to.substring(tx.to.length-4)}`;
      responseText += `\n  To: ${toDisplay}`;
    }

    if (tx.txFeeUsd !== null && tx.txFeeUsd !== undefined) {
      responseText += `\n  Fee: $${tx.txFeeUsd.toFixed(4)} USD`;
    }
    
    if (tx.txAction) {
      responseText += `\n  Action: ${tx.txAction}`;
    }

    if (tx.balances && tx.balances.length > 0) {
      const firstToken = tx.balances[0];
      if (firstToken) { 
        responseText += `\n  Token: ${firstToken.tokenSymbol || firstToken.tokenName || 'Unknown'}`;
        if (tx.balances.length > 1) {
          responseText += ` (+${tx.balances.length - 1} more)`;
        }
      }
    }
    
    responseText += '\n\n';
  }
  
  return responseText;
}

/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 19. Get Solana User Transaction History - Short (Default 20)
 * 
 * **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/{userAddress}?chain=solana`
 * 
 * **Test Parameters Used:**
 * - `userAddress`: `HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g`
 * - `chain`: `solana`
 * - `limit`: `5`
 * 
 * **Tested cURL Command:**
 * curl -X GET -H "Authorization: GET_YOUR_DATAI_API" 
 * "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g?chain=solana&limit=5"
 * 
 * **Essential Information:**
 * - Description: Get the latest Solana transactions (default 20) for a specific user on the Solana chain.
 *   Includes classification (with limited coverage as per docs).
 * - Path Parameters:
 *   - `userAddress` (string, required): The Solana wallet address of the user.
 * - Query Parameters:
 *   - `chain` (string, required): Must be set to "solana".
 *   - `limit` (number, optional): Maximum number of transactions to return. Default is 20.
 */
