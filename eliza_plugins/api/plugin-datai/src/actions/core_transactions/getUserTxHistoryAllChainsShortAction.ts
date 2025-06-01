/**
 * Get User Transaction History - All Chains Short Action
 * 
 * This action retrieves a shorter version of transaction history for a user across chains.
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
 * Check if text contains "all chains" keywords
 */
function containsAllChainsKeywords(text: string): boolean {
  const allChainsKeywords = [
    /all chains/i,
    /across.*chains/i,
    /all.*blockchains/i,
    /every.*chain/i,
    /multi.*chain/i,
    /cross.*chain/i,
    /all.*networks/i,
  ];

  for (const pattern of allChainsKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found all chains keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

/**
 * Check if text contains short/brief transaction history keywords
 */
function containsShortTxHistoryKeywords(text: string): boolean {
  const shortTxKeywords = [
    /brief.*tx.*history/i,
    /short.*tx.*history/i,
    /tx.*history.*short/i,
    /brief.*transaction.*history/i,
    /short.*transaction.*history/i,
    /transaction.*history.*short/i,
    /recent.*transactions/i,
    /latest.*transactions/i,
    /quick.*overview/i,
    /summary.*transactions/i,
    /brief.*summary/i,
    /short.*list/i,
    /recent.*activity/i,
    /latest.*activity/i,
  ];

  for (const pattern of shortTxKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found short tx history keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

/**
 * Count the number of specific chain names mentioned in text
 */
function countSpecificChains(text: string): number {
  const chainPatterns = [
    /ethereum/gi,
    /\beth\b/gi,
    /arbitrum/gi,
    /\barb\b/gi,
    /avalanche/gi,
    /\bavax\b/gi,
    /polygon/gi,
    /\bmatic\b/gi,
    /optimism/gi,
    /\bop\b/gi,
    /base/gi,
    /binance/gi,
    /\bbsc\b/gi,
    /\bbnb\b/gi,
    /blast/gi,
    /linea/gi,
    /scroll/gi,
    /zksync/gi,
    /\bera\b/gi,
    /berachain/gi,
    /mantle/gi,
    /\bmnt\b/gi,
    /fantom/gi,
    /\bftm\b/gi,
    /celo/gi,
    /kaia/gi,
    /\bklay\b/gi,
  ];

  const foundChains = new Set<string>();
  
  for (const pattern of chainPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[0]) {
        foundChains.add(match[0].toLowerCase());
      }
    }
  }

  const count = foundChains.size;
  logger.debug(`Found ${count} specific chains: ${Array.from(foundChains).join(', ')}`);
  return count;
}


/**
 * Action to retrieve a shorter list of transactions for a user across chains
 */
export const getUserTxHistoryAllChainsShortAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI",
    "FETCH_SHORT_TX_HISTORY_ALL_CHAINS_DATAI",
    "LIST_RECENT_TRANSACTIONS_SHORT_ALL_CHAINS_DATAI",
    "SHOW_BRIEF_TX_HISTORY_ALL_CHAINS_DATAI",
    "GET_MY_RECENT_TRANSACTIONS_SHORT_LIST_ALL_CHAINS_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves a shorter transaction history (up to 20 entries) for a user across blockchains",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`)
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    if (!apiKey) {
      logger.error(`GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const messageText = message.content?.text || '';
    const userAddress = extractWalletAddress(messageText);
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug(`Validating wallet address: ${userAddress}`);
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Enhanced validation to prevent race conditions
    logger.debug("Checking for all chains + short tx history validation to prevent race conditions");
    const hasAllChainsKeywords = containsAllChainsKeywords(messageText);
    const hasShortTxKeywords = containsShortTxHistoryKeywords(messageText);
    const specificChainCount = countSpecificChains(messageText);
    
    logger.debug(`All chains keywords: ${hasAllChainsKeywords}, Short tx keywords: ${hasShortTxKeywords}, Specific chains: ${specificChainCount}`);
    
    // This action should be used when:
    // 1. User asks for "all chains" + "short/brief" transaction history (both keywords present)
    // 2. OR when no specific chains are mentioned + short/brief keywords (wants short overview across all)
    // 3. Avoid when specific single chain is mentioned (should use single chain action)
    // 4. Avoid when multiple specific chains are mentioned without "all chains" (should use multi-chain action)
    // 5. Avoid when "all chains" is mentioned without short/brief keywords (should use full all chains action)
    
    if (specificChainCount === 1) {
      logger.debug("GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation failed: Single specific chain mentioned - use single chain tx history action instead");
      return false;
    }
    
    if (specificChainCount > 1 && !hasAllChainsKeywords) {
      logger.debug(`GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation failed: Multiple specific chains detected (${specificChainCount}) without all chains keywords - use multi-chain action instead`);
      return false;
    }
    
    if (hasAllChainsKeywords && !hasShortTxKeywords) {
      logger.debug("GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation failed: All chains keywords without short/brief keywords - use full all chains tx history action instead");
      return false;
    }
    
    if (!hasAllChainsKeywords && !hasShortTxKeywords && specificChainCount === 0) {
      logger.debug("GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation failed: No clear intent for all chains or short history - unclear request");
      return false;
    }
    
    // Must have either:
    // - "all chains" + "short/brief" keywords, OR
    // - "short/brief" keywords with no specific chains (implies all chains)
    if (!((hasAllChainsKeywords && hasShortTxKeywords) || (hasShortTxKeywords && specificChainCount === 0))) {
      logger.debug("GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation failed: Must have all chains + short keywords OR short keywords with no specific chains");
      return false;
    }
    
    logger.debug("GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI validation successful");
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
    logger.info("Executing GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`)
    logger.debug(`Options: ${JSON.stringify(options || {})}`)
    
    try {
      // Extract parameters
      const userAddress = extractWalletAddress(message.content?.text || '');
      const limit = options?.limit || 20; // Default to 20 transactions (shorter history)
      
      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, limit: ${limit}`);
      
      if (!userAddress || !callback) {
        // We need a wallet address and callback to proceed
        logger.error(`Missing required parameters - userAddress: ${Boolean(userAddress)}, callback: ${Boolean(callback)}`);
        
        if (callback) {
          if (!userAddress) {
            logger.debug("Sending error response: No wallet address provided");
            callback({
              text: 'Please provide a valid wallet address to check transaction history.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          }
        } else {
          logger.error('GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI: No callback provided');
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

      logger.debug("Created API client");
      
      // Call API - substitute the userAddress value into the endpoint
      const endpoint = `${ENDPOINTS.GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI.replace('{userAddress}', userAddress)}?limit=${limit}`;
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching short transaction history for ${userAddress} (limit: ${limit})`);
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
      
      // Use dedicated formatting function for response text
      logger.debug(`Formatting response for ${transactions.length} transactions`);
      const responseText = formatTxHistoryAllChainsShortResponse(transactions, userAddress);
      
      logger.debug("Sending successful response with transaction data");
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
      logger.error(`GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        logger.debug(`Sending error response: ${errorMessage}`);
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
          text: "Give me a brief transaction history across all chains for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Here's a brief summary of your recent transactions across all chains for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045...",
          actions: ["GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me a short tx history on all chains for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Fetching a short transaction history across all chains for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045...",
          actions: ["GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What are my recent transactions across all chains? Quick overview for address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me retrieve a quick overview of your recent blockchain activities across all chains for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045...",
          actions: ["GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you show me a brief summary of transactions on all chains for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Generating a brief summary of your transactions across all chains for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045...",
          actions: ["GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Latest activity across all chains - short list for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Here's your latest activity across all chains in a short list format for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045...",
          actions: ["GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format transaction history across all chains (short version) into a user-friendly message
 * 
 * @param transactions - Array of transaction history items from API
 * @param userAddress - The wallet address that was queried
 * @returns Formatted response message
 */
function formatTxHistoryAllChainsShortResponse(
  transactions: TransactionHistoryItem[],
  userAddress: string
): string {
  const truncatedAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  
  let responseText = `📊 Recent Transaction History (${transactions.length} transactions)\n`;
  responseText += `👤 Wallet: ${truncatedAddress}\n\n`;
  
  // Group transactions by chain for better overview
  const chainGroups = new Map<string, TransactionHistoryItem[]>();
  for (const tx of transactions) {
    const chain = tx.chain || 'unknown';
    if (!chainGroups.has(chain)) {
      chainGroups.set(chain, []);
    }
         chainGroups.get(chain)?.push(tx);
  }
  
  // Show chain summary first
  if (chainGroups.size > 1) {
    responseText += `🔗 Active Chains: ${Array.from(chainGroups.keys()).map(chain => chain.toUpperCase()).join(', ')}\n\n`;
  }
  
  // List transactions with enhanced formatting
  for (let i = 0; i < Math.min(transactions.length, 10); i++) { // Limit to 10 for short version
    const tx = transactions[i];
    if (!tx) continue;
    
    const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleDateString() : 'Unknown date';
    const time = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleTimeString() : '';
    
    // Get chain display name
    const chainDisplayNames: { [key: string]: string } = {
      'eth': 'Ethereum',
      'arb': 'Arbitrum', 
      'avax': 'Avalanche',
      'matic': 'Polygon',
      'op': 'Optimism',
      'base': 'Base',
      'bsc': 'BNB Chain',
      'blast': 'Blast',
      'zora': 'Zora',
      'abs': 'Abstract',
    };
    
    const chainName = chainDisplayNames[tx.chain?.toLowerCase() || ''] || tx.chain?.toUpperCase() || 'Unknown';
    
         // Get transaction value from balances
     let txValue = 'N/A';
     let tokenSymbol = '';
     if (tx.balances && tx.balances.length > 0) {
       const balance = tx.balances[0];
       if (balance?.balanceUSD && balance.balanceUSD > 0) {
         txValue = `$${balance.balanceUSD.toFixed(2)}`;
         tokenSymbol = balance.tokenSymbol || '';
       } else if (balance?.balance && balance.tokenSymbol) {
         const amount = Number(balance.balance) / (10 ** (balance.tokenDecimals || 18));
         if (amount > 0.001) {
           txValue = `${amount.toFixed(4)} ${balance.tokenSymbol}`;
           tokenSymbol = balance.tokenSymbol;
         }
       }
     }
    
    // Transaction type with emoji
    const txTypeEmoji: { [key: string]: string } = {
      'Send': '📤',
      'Receive': '📥',
      'execute': '⚡',
      'mintBatch': '🎨',
      'Swap': '🔄',
      'Transfer': '↔️',
    };
    
    const emoji = txTypeEmoji[tx.txType || ''] || '📋';
    const txType = tx.txType || 'Transaction';
    
    responseText += `${i + 1}. ${emoji} ${txType} on ${chainName}\n`;
    responseText += `   💰 Value: ${txValue}`;
    if (tokenSymbol && txValue !== 'N/A') {
      responseText += ` (${tokenSymbol})`;
    }
    responseText += `\n   📅 ${date} ${time}\n`;
    
    // Show hash (truncated)
    if (tx.hash) {
      const truncatedHash = `${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}`;
      responseText += `   🔗 Hash: ${truncatedHash}\n`;
    }
    
         // Show NFT details if present
     if (tx.balances?.[0]?.nftDetails) {
       const nft = tx.balances[0].nftDetails;
       responseText += `   🎨 NFT: ${nft.action || 'NFT'} - ${tx.balances[0].tokenName || 'Unknown'}\n`;
     }
    
    responseText += '\n';
  }
  
  // Show summary if more transactions exist
  if (transactions.length > 10) {
    responseText += `... and ${transactions.length - 10} more transactions\n\n`;
  }
  
  // Add chain activity summary
  if (chainGroups.size > 0) {
    responseText += "📈 Chain Activity Summary:\n";
    const sortedChains = Array.from(chainGroups.entries())
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 5); // Top 5 most active chains
    
         for (const [chain, txs] of sortedChains) {
       const chainDisplayNames: { [key: string]: string } = {
         'eth': 'Ethereum',
         'arb': 'Arbitrum', 
         'avax': 'Avalanche',
         'matic': 'Polygon',
         'op': 'Optimism',
         'base': 'Base',
         'bsc': 'BNB Chain',
         'blast': 'Blast',
         'zora': 'Zora',
         'abs': 'Abstract',
       };
       const chainName = chainDisplayNames[chain.toLowerCase()] || chain.toUpperCase();
       responseText += `• ${chainName}: ${txs.length} transaction${txs.length > 1 ? 's' : ''}\n`;
     }
  }
  
  responseText += `\n🔍 Full Address: ${userAddress}`;
  
  return responseText;
}


// FULL TEST DATA FOR THIS ACTION
// ## 15. Get User Transaction History - All Chains (Default 20)

// **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/{userAddress}?limit={limit}`

// **cURL to run (Generic):**
// ```bash
// curl -X GET -H "Authorization: GET_YOUR_DATAI_API" "https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/{userAddress}?limit={limit}"
// ```
// *(Replace `{userAddress}` with the actual user's wallet address and `{limit}` with the desired number of transactions. The API defaults to 20 transactions if limit is not specified. Refer to `api_help.md` for working examples like `userAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`, `limit=10`)*

// **Test Parameters Used:**
// *   `userAddress`: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
// *   `limit`: `10`

// **Tested cURL Command:**
// ```bash
// curl -X GET -H "Authorization: GET_YOUR_DATAI_API" "https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=10" | cat
// ```

// **Essential Information:**
// *   **Description:** Get the latest transactions (default 20) for a specific user, across all supported chains they are active on (excluding Solana). Includes classification and DeFi PNL.
// *   **API Key:** Pass the API key `GET_YOUR_DATAI_API` in the `Authorization` header (e.g., `Authorization: your_api_key`).
// *   **Method:** `GET`
// *   **Path Parameters:**
//     *   `userAddress` (string, required): The wallet address of the user.
// *   **Query Parameters (from description, not formally listed but important):**
//     *   `startTime` (timestamp, optional): If set, will return the latest transactions (up to 20) *prior* to this Unix timestamp.
// *   **Response:** Returns a JSON array of transaction objects, similar in structure to the `/extended/` endpoint. (See original documentation for schema).
// *   **Note:**
//     *   The documentation explicitly states, "*For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below."
//     *   Testing with address `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` returned `List is empty.`, while the `/extended/` version returned data for the same address. This suggests a potential difference in data availability or filtering between the two endpoints.

// **Suggested Action Name:** `GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI`
// **Corresponding .ts File:** `GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAIAction.ts`

// # Action: GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI
// run_curl_test "GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI" "curl -X GET -H \"Authorization: GET_YOUR_DATAI_API\" \"https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=10\" | cat"
