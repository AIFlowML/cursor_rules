/**
 * Get User Transaction History By Chain Raw Label Action
 * 
 * This action retrieves raw labeled transaction history for a user on a specific chain.
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
import { isValidWalletAddress, extractWalletAddress, extractChainId } from "../../utils/validation";
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
 * Action to retrieve a list of transactions with raw labels for a user on a specific chain
 */
export const getUserTxHistoryByChainRawLabelAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_TX_HISTORY_CHAIN_RAW_LABEL_DATAI",
    "FETCH_RAW_LABEL_CHAIN_TRANSACTIONS_DATAI",
    "LIST_CHAIN_TX_RAW_LABELS_DATAI",
    "SHOW_CHAIN_TRANSACTIONS_RAW_LABEL_DATAI",
    "GET_MY_CHAIN_TX_WITH_RAW_LABELS_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves transaction history with raw labels for a user on a specific blockchain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    if (!apiKey) {
      logger.error(`GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }

    const messageText = message.content?.text?.toLowerCase() || '';

    // Keyword check for terms related to "raw label"
    const rawLabelKeywords = ['raw label', 'raw labeled', 'raw tx'];
    const hasRawLabelKeyword = rawLabelKeywords.some(keyword => messageText.includes(keyword));

    if (!hasRawLabelKeyword) {
      logger.debug("GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI validation failed: Missing raw label-related keyword in message.");
      return false;
    }
    
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'Not found'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Also need a chain ID
    const chainId = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chainId || 'Not found'}`);
    
    if (!chainId) {
      logger.debug("GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI validation failed: No chain ID found in message");
      return false;
    }
    
    logger.debug("GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI validation successful");
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
    logger.info("Executing GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`);
    logger.debug(`Options: ${JSON.stringify(options || {})}`);
    
    try {
      // Extract parameters
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chainId = extractChainId(message.content?.text || '') || '';

      // Extract limit from the message text if available
      const messageLimit = message.content?.text ? extractLimitFromPrompt(message.content.text) : null;
      logger.debug(`Extracted limit from message: ${messageLimit}`);
      
      // Use extracted limit, options limit, or default to 10 transactions
      // Ensure options.limit is treated as a number or undefined
      const optionsLimit = (typeof options?.limit === 'number') ? options.limit : undefined;
      const limit = messageLimit ?? optionsLimit ?? 20;
      logger.debug(`Using limit: ${limit}`);

      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, chainId: ${chainId || 'None'}, limit: ${limit}`);
      
      if (!userAddress || !chainId || !callback) {
        // We need a wallet address, chain ID, and callback to proceed
        const missingParams = [];
        if (!userAddress) missingParams.push('userAddress');
        if (!chainId) missingParams.push('chainId');
        if (!callback) missingParams.push('callback');
        
        logger.error(`Missing required parameters: ${missingParams.join(', ')}`);
        
        if (callback) {
          if (!userAddress) {
            logger.debug("Notifying user about missing wallet address");
            callback({
              text: 'Please provide a valid wallet address to check transaction history.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          } else if (!chainId) {
            logger.debug("Notifying user about missing chain ID");
            callback({
              text: 'Please specify which blockchain (e.g., "eth", "bsc", "polygon") you want to check transactions for.',
              content: { 
                success: false, 
                error: 'No chain ID provided' 
              }
            });
          }
        } else {
          logger.error('GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI: No callback provided');
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

      logger.debug(`Created API client with key availability: ${apiKey ? 'Yes' : 'No'}`);
      
      // Call API - substitute the userAddress value into the endpoint
      const endpoint = `${ENDPOINTS.GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI.replace('{userAddress}', userAddress)}?chain=${chainId}&limit=${limit}`;
      
      logger.info(`Fetching raw labeled transaction history for ${userAddress} on chain ${chainId} (limit: ${limit})`);
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
          text: `Error fetching transactions: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const transactions = response.data;
      logger.debug(`Transactions data received: ${transactions ? `${transactions.length} items` : 'None'}`);
      
      if (!transactions || transactions.length === 0) {
        logger.info(`No transactions found for address ${userAddress} on ${chainId}`);
        callback({
          text: `No transactions found for address ${userAddress} on ${chainId}.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      logger.debug(`Processing ${transactions.length} transactions for formatting`);
      
      // Use dedicated formatting function to generate response text
      const responseText = formatRawLabelTransactionsResponse(transactions, userAddress, chainId, limit);
      
      logger.debug(`Response text prepared (${responseText.length} chars)`);
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { transactions } 
        }
      });
      logger.info(`Successfully completed GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI for ${userAddress} on ${chainId}`);
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve raw labeled transaction history: ${errorMessage}`,
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
          text: "Show me my raw labeled transaction history on Ethereum for 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e on DATAI LIMIT 10"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch your raw labeled transaction history on Ethereum (eth) for 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e. One moment...",
          actions: ["GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What are my transactions with raw labels for wallet 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e on eth chain on DATAI LIMIT 10?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me get your raw labeled transaction history for 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e from the Ethereum (eth) chain...",
          actions: ["GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get the latest 10 raw labeled transactions for 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e on Ethereum on DATAI LIMIT 10"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving the 10 most recent transactions with raw labels for 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e on Ethereum (eth)...",
          actions: ["GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI"]
        }
      }
    ]
  ] as ActionExample[][]
}; 

/**
 * Format transaction history with raw labels into a user-friendly message
 * 
 * @param transactions - Array of transaction history items from API
 * @param userAddress - The wallet address that was queried
 * @param chainId - The blockchain chain ID that was queried
 * @param limit - The limit for the number of transactions to show
 * @returns Formatted response message
 */
function formatRawLabelTransactionsResponse(
  transactions: TransactionHistoryItem[],
  userAddress: string,
  chainId: string,
  limit?: number
): string {
  const transactionsToShow = limit ? transactions.slice(0, limit) : transactions;
  
  let responseText = `Found ${transactions.length} transactions with raw labels for ${userAddress} on ${chainId.toUpperCase()}`;

  if (limit && transactions.length > limit) {
    responseText += ` (showing the ${limit} most recent)`;
  } else if (transactionsToShow.length > 0) {
    responseText += ` (showing all ${transactionsToShow.length})`;
  }
  responseText += ':\n\n';
  
  // List transactions
  for (let i = 0; i < transactionsToShow.length; i++) {
    const tx = transactionsToShow[i];
    if (!tx) {
      continue;
    }
    
    const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
    
    responseText += `- ${tx.txType || 'Transaction'} (${date})`;
    responseText += `\n  Hash: ${tx.hash}`;
    
    if (tx.txClassification) {
      responseText += `\n  Classification: ${tx.txClassification}`;
    }
    
    if (tx.from) {
      const fromAddress = tx.from === userAddress ? 'You' : tx.from;
      responseText += `\n  From: ${fromAddress}`;
    }
    
    if (tx.to) {
      const toAddress = tx.to === userAddress ? 'You' : tx.to;
      responseText += `\n  To: ${toAddress}`;
    }
    
    // Add action details if available
    if (tx.txAction) {
      responseText += `\n  Action: ${tx.txAction}`;
    }
    
    // Add contract info if available
    if (tx.contractName) {
      responseText += `\n  Contract: ${tx.contractName}`;
    }
    
    // Add function info if available
    if (tx.functionName) {
      responseText += `\n  Function: ${tx.functionName}`;
    }
    
    responseText += '\n\n';
  }
  
  return responseText;
}


// FULL TEST DATA FOR THIS ACTION
// ## 17. Get User Transaction History by Chain - Raw Label (Default 400, No USD Values)

// **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}?chain={chain}`

// **cURL to run (Generic):**
// ```bash
// curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}?chain={chain}&limit={limit}"
// ```
// *(Replace `{userAddress}` with the actual user's wallet address, `{chain}` with the chain ID, and optionally `{limit}`. The API defaults to 400 transactions. Refer to `api_help.md` (Entry #17) for working examples like `userAddress=0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e`, `chain=eth`. Test used `limit=10` for brevity.)*

// **Test Parameters Used:**
// *   `userAddress`: `0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e`
// *   `chain`: `eth`
// *   `limit`: `10`

// **Tested cURL Command:**
// ```bash
// curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10" | cat
// ```

// **Essential Information:**
// *   **Description:** Get the latest transactions (default 400) for a specific user on a specific chain (excluding Solana). This version excludes token USD valuations (e.g., `balanceUSD`, `txFeeUsd` will be 0 or null) but includes classification.
// *   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
// *   **Method:** `GET`
// *   **Path Parameters:**
//     *   `userAddress` (string, required): The wallet address of the user.
// *   **Query Parameters:**
//     *   `chain` (string, required): The chain ID (e.g., `eth`). Cannot be Solana for this endpoint.
//     *   `startTime` (timestamp, optional): If set, will return the latest transactions (up to default/specified limit) on that chain *prior* to this Unix timestamp.
//     *   `limit` (integer, optional, behavior observed): While docs state a default of 400, testing with `&limit=5` returned a smaller set. Official support should be confirmed.
// *   **Response:** Returns a JSON array of transaction objects for the specified chain. USD value fields (like `balanceUSD`, `txFeeUsd`, `pnlUsd`, `yieldUSD`) will be 0 or null. Otherwise, the structure is similar to other transaction history endpoints. (See original documentation for schema).
// *   **Note:** The documentation explicitly states, "*For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below."

// **Suggested Action Name:** `GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI`
// **Corresponding .ts File:** `getUserTxHistoryByChainRawLabelAction.ts`

// # Action: GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI
// run_curl_test "GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10\" | cat"
