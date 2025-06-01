/**
 * Get User Transactions By Period And Chain Raw Label 20 Action
 * 
 * This action retrieves raw labeled transaction history (limited to 20) for a user within a specific time period on a specific chain.
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
import { 
  isValidWalletAddress, 
  extractWalletAddress, 
  extractChainId,
  containsTimePeriodKeywords,
  extractTimePeriodFromText
} from "../../utils/validation";
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
 * Check if text contains raw transaction keywords
 */
function containsRawTxKeywords(text: string): boolean {
  const rawTxKeywords = [
    /raw\s+transaction/i,
    /raw\s+tx/i,
    /raw\s+short\s+tx/i,
    /raw\s+transaction\s+short/i,
    /raw\s+label/i,
    /raw\s+labeled/i,
    /classification/i,
  ];

  for (const pattern of rawTxKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found raw tx keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

// Helper functions for date extraction
const extractDateRange = (text: string): { startDate?: number; endDate?: number } => {
  // Look for common date patterns and time periods in the text
  const result: { startDate?: number; endDate?: number } = {};
  const now = new Date();
  
  // Pattern: "last X days/weeks/months"
  const lastPeriodRegex = /last\s+(\d+)\s+(day|days|week|weeks|month|months)/i;
  const lastPeriodMatch = text.match(lastPeriodRegex);
  if (lastPeriodMatch?.[1] && lastPeriodMatch?.[2]) {
    const amount = Number.parseInt(lastPeriodMatch[1], 10);
    const unit = lastPeriodMatch[2].toLowerCase();
    
    // Calculate start date based on the time period
    const startDate = new Date();
    if (unit === 'day' || unit === 'days') {
      startDate.setDate(now.getDate() - amount);
    } else if (unit === 'week' || unit === 'weeks') {
      startDate.setDate(now.getDate() - (amount * 7));
    } else if (unit === 'month' || unit === 'months') {
      startDate.setMonth(now.getMonth() - amount);
    }
    
    result.startDate = Math.floor(startDate.getTime() / 1000); // Convert to Unix timestamp
    result.endDate = Math.floor(now.getTime() / 1000); // Current time as end date
    return result;
  }
  
  // Pattern: "since yesterday/last week/last month"
  if (text.includes('since yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    result.startDate = Math.floor(yesterday.getTime() / 1000);
    result.endDate = Math.floor(now.getTime() / 1000);
    return result;
  }
  
  if (text.includes('since last week')) {
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0);
    result.startDate = Math.floor(lastWeek.getTime() / 1000);
    result.endDate = Math.floor(now.getTime() / 1000);
    return result;
  }
  
  if (text.includes('since last month')) {
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    result.startDate = Math.floor(lastMonth.getTime() / 1000);
    result.endDate = Math.floor(now.getTime() / 1000);
    return result;
  }
  
  // Pattern: "this week/month/year"
  if (text.includes('this week')) {
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as first day of week
    startOfWeek.setHours(0, 0, 0, 0);
    result.startDate = Math.floor(startOfWeek.getTime() / 1000);
    result.endDate = Math.floor(now.getTime() / 1000);
    return result;
  }
  
  if (text.includes('this month')) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    result.startDate = Math.floor(startOfMonth.getTime() / 1000);
    result.endDate = Math.floor(now.getTime() / 1000);
    return result;
  }
  
  if (text.includes('this year')) {
    const startOfYear = new Date();
    startOfYear.setMonth(0);
    startOfYear.setDate(1);
    startOfYear.setHours(0, 0, 0, 0);
    result.startDate = Math.floor(startOfYear.getTime() / 1000);
    result.endDate = Math.floor(now.getTime() / 1000);
    return result;
  }
  
  // Default to last 7 days if no specific period is detected
  return result;
};

/**
 * Action to retrieve a list of raw labeled transactions (limited to 20) for a user within a time period on a specific chain
 */
export const getUserTxByPeriodAndChainRawLabel20Action: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_TX_BY_PERIOD_CHAIN_RAW_LABEL",
    "FETCH_RAW_LABEL_TX_BY_TIMEFRAME_CHAIN",
    "LIST_RAW_CHAIN_TX_BY_PERIOD",
    "SHOW_RAW_LABEL_TX_HISTORY_TIME_RANGE_CHAIN",
    "GET_RAW_LABELED_CHAIN_TX_BY_DATE_RANGE"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves raw labeled transaction history (limited to 20) for a user within a specific time period on a particular blockchain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`)
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    if (!apiKey) {
      logger.error(`GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug(`Validating wallet address: ${userAddress}`);
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Also need a chain ID
    const chainId = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chainId || 'None'}`);
    
    if (!chainId) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI validation failed: No chain ID found in message");
      return false;
    }
    
    const messageText = message.content?.text || '';
    
    // Enhanced validation to prevent race conditions
    logger.debug("Checking for raw transaction keywords to prevent race conditions");
    
    // Check for raw transaction keywords
    const hasRawTxKeywords = containsRawTxKeywords(messageText);
    if (!hasRawTxKeywords) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI validation failed: No raw transaction keywords found");
      return false;
    }
    
    // Check for time period keywords
    const hasTimePeriodKeywords = containsTimePeriodKeywords(messageText);
    if (!hasTimePeriodKeywords) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI validation failed: No time period keywords found");
      return false;
    }
    
    // Verify we can extract a valid time period
    const timePeriod = extractTimePeriodFromText(messageText);
    if (!timePeriod) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI validation failed: Could not extract valid time period");
      return false;
    }
    
    logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI validation successful");
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
    logger.info("Executing GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`)
    logger.debug(`Options: ${JSON.stringify(options || {})}`)
    
    try {
      // Extract parameters
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chainId = extractChainId(message.content?.text || '') || '';
      const messageText = message.content?.text || '';
      
      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, chainId: ${chainId || 'None'}`);
      
      // Extract time period using the enhanced validation function
      let startTime: number | undefined;
      let endTime: number | undefined;
      
      // Use the enhanced time period extraction function
      const timePeriod = extractTimePeriodFromText(messageText);
      if (timePeriod) {
        startTime = timePeriod.startTime;
        endTime = timePeriod.endTime;
        logger.debug(`Extracted time period: startTime=${startTime} (${new Date(startTime * 1000).toISOString()}), endTime=${endTime} (${new Date(endTime * 1000).toISOString()})`);
      } else {
        // Fallback to the original date range extraction for backward compatibility
        const dateRange = options?.dateRange as { startDate?: number; endDate?: number } || extractDateRange(messageText);
        logger.debug(`Using fallback date range: ${JSON.stringify(dateRange)}`);
        
        startTime = dateRange.startDate;
        endTime = dateRange.endDate;
      }
      
      logger.debug(`Final time parameters - startTime: ${startTime || 'None'}, endTime: ${endTime || 'None'}`);
       
      if (!userAddress || !chainId || !callback) {
        // We need a wallet address, chain ID, and callback to proceed
        logger.error(`Missing required parameters - userAddress: ${Boolean(userAddress)}, chainId: ${Boolean(chainId)}, callback: ${Boolean(callback)}`);
        
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
          } else if (!chainId) {
            logger.debug("Sending error response: No chain ID provided");
            callback({
              text: 'Please specify which blockchain (e.g., "eth", "bsc", "polygon") you want to check transactions for.',
              content: { 
                success: false, 
                error: 'No chain ID provided' 
              }
            });
          }
        } else {
          logger.error('GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI: No callback provided');
        }
        
        return false;
      }
      
      if (!startTime && !endTime) {
        logger.debug("Missing time period parameters");
        if (callback) {
          callback({
            text: 'Please specify a time period for the transaction history (e.g., "last 7 days", "this month", or use startTime and endTime parameters).',
            content: { 
              success: false, 
              error: 'No time period specified' 
            }
          });
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
      
      // Create API client with extended timeout for this endpoint
      const apiClient = new DataiApiClient(apiKey, API_CONFIG.API_BASE_URL);
      logger.debug("Created API client with extended timeout");
      
      // Build the endpoint with query parameters
      let endpoint = ENDPOINTS.GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI.replace('{userAddress}', userAddress);
      const queryParams = [`chain=${chainId}`];
      
      // Add date parameters if available - use startTime/endTime when available
      if (startTime) {
        queryParams.push(`startTime=${startTime}`);
      }
      
      if (endTime) {
        queryParams.push(`endTime=${endTime}`);
      }
      
      // Append all query parameters
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
      
      logger.debug(`API endpoint: ${endpoint}`);
      logger.debug(`Full URL will be: ${API_CONFIG.API_BASE_URL}${endpoint}`);
      logger.debug("Expected working cURL URL: https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=eth&startTime=1716346533&endTime=1705895733");
      
      // Format date strings for logging
      const startTimeFormatted = startTime ? new Date(startTime * 1000).toISOString() : 'none specified';
      const endTimeFormatted = endTime ? new Date(endTime * 1000).toISOString() : 'now';
      
      logger.info(`Fetching raw labeled transactions for ${userAddress} on ${chainId} from ${startTimeFormatted} to ${endTimeFormatted}`);
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
      
      if (!transactions || transactions.length === 0) {
        logger.info(`No transactions found for address ${userAddress} on ${chainId} in the specified time period`);
        callback({
          text: `No transactions found for address ${userAddress} on ${chainId} in the specified time period.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      // Format response text
      logger.debug(`Formatting response for ${transactions.length} transactions`);
      
      logger.debug("Sending successful response with transaction data");
      callback({
        text: formatRawLabeledTransactionsResponse(transactions, userAddress, chainId, startTime, endTime),
        content: { 
          success: true, 
          data: { transactions } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        logger.debug(`Sending error response: ${errorMessage}`);
        callback({
          text: `Failed to retrieve raw labeled transactions by time period: ${errorMessage}`,
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
          text: "Show me raw transaction history for Ethereum wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 with startTime=1716346533 and endTime=1705895733 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll get your raw transaction history for Ethereum wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 with startTime 1716346533 and endTime 1705895733 on DATAI...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What are my raw tx on eth for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 between startTime 1716346533 and endTime 1705895733 on DATAI?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch your raw transactions on Ethereum for 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 with startTime 1716346533 and endTime 1705895733 on DATAI...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get my raw short tx on Arbitrum for the last 30 days for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll retrieve your raw short transactions on Arbitrum for the last 30 days for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me raw transaction short history on Polygon from 01/15/2024 to 03/20/2024 for address 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Fetching your raw transaction short history on Polygon from 01/15/2024 to 03/20/2024 for 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need my raw labeled transactions on Base for the past 3 months for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Getting your raw labeled transactions on Base for the past 3 months for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you get my raw tx classification on Optimism since last week for 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3 on DATAI ?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll get your raw transaction classification on Optimism since last week for 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Find raw transaction data on Avalanche this month for my wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Searching for raw transaction data on Avalanche this month for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI"]
        }
      }
    ]
  ] as ActionExample[][],
}; 

/**
 * Format raw labeled transaction history data into a user-friendly message
 * 
 * @param transactions - Transaction history data from API response
 * @param userAddress - The wallet address that was queried
 * @param chainId - The blockchain chain identifier
 * @param startTime - The start time of the period as Unix timestamp (optional)
 * @param endTime - The end time of the period as Unix timestamp (optional)
 * @returns Formatted response message
 */
function formatRawLabeledTransactionsResponse(
  transactions: TransactionHistoryItem[], 
  userAddress: string, 
  chainId: string,
  startTime?: number,
  endTime?: number
): string {
  // Format date range for response text
  const dateRangeText = startTime && endTime
    ? `from ${new Date(endTime * 1000).toLocaleDateString()} to ${new Date(startTime * 1000).toLocaleDateString()}`
    : startTime 
    ? `up to ${new Date(startTime * 1000).toLocaleDateString()}`
    : '';
  
  // Chain display names
  const chainDisplayNames: { [key: string]: string } = {
    'eth': 'Ethereum',
    'arb': 'Arbitrum', 
    'avax': 'Avalanche',
    'matic': 'Polygon',
    'op': 'Optimism',
    'base': 'Base',
    'bsc': 'BNB Chain',
    'blast': 'Blast',
    'xdai': 'xDai',
    'ftm': 'Fantom',
  };
  
  const chainName = chainDisplayNames[chainId.toLowerCase()] || chainId.toUpperCase();
  
  // Format response text
  let responseText = `📊 Raw Transaction History for ${userAddress}\n`;
  responseText += `🔗 Chain: ${chainName}\n`;
  if (dateRangeText) {
    responseText += `📅 Period: ${dateRangeText}\n`;
  }
  responseText += `📈 Found ${transactions.length} raw labeled transactions (limit: 20)\n\n`;
  
  if (transactions.length === 0) {
    responseText += "No transactions found in the specified period.";
    return responseText;
  }
  
  // Group transactions by type for summary
  const txTypeGroups: { [key: string]: TransactionHistoryItem[] } = {};
  const classificationGroups: { [key: string]: number } = {};
  
  for (const tx of transactions) {
    if (!tx) continue;
    
    const txType = tx.txType || 'Unknown';
    if (!txTypeGroups[txType]) {
      txTypeGroups[txType] = [];
    }
    txTypeGroups[txType].push(tx);
    
    // Count classifications
    if (tx.txClassification) {
      classificationGroups[tx.txClassification] = (classificationGroups[tx.txClassification] || 0) + 1;
    }
  }
  
  // Add summary
  responseText += "📋 Transaction Types:\n";
  for (const [txType, txs] of Object.entries(txTypeGroups)) {
    responseText += `• ${txType}: ${txs.length} transaction${txs.length > 1 ? 's' : ''}\n`;
  }
  
  if (Object.keys(classificationGroups).length > 0) {
    responseText += "\n🏷️ Classifications:\n";
    for (const [classification, count] of Object.entries(classificationGroups)) {
      responseText += `• ${classification}: ${count} transaction${count > 1 ? 's' : ''}\n`;
    }
  }
  responseText += "\n";
  
     // List detailed transactions (show all since limit is 20)
   responseText += "🔍 Raw Transaction Details:\n\n";
  
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if (!tx) continue;
    
    const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
    const txType = tx.txType || 'Transaction';
    const classification = tx.txClassification ? ` (${tx.txClassification})` : '';
    
    responseText += `${i + 1}. ${txType}${classification}\n`;
    responseText += `   📅 ${date}\n`;
    responseText += `   🔗 Hash: ${tx.hash}\n`;
    
    // Show addresses
    if (tx.from || tx.to) {
      if (tx.from) {
        const fromAddress = tx.from === userAddress ? 'You' : `${tx.from.substring(0, 6)}...${tx.from.substring(38)}`;
        responseText += `   📤 From: ${fromAddress}\n`;
      }
      if (tx.to) {
        const toAddress = tx.to === userAddress ? 'You' : `${tx.to.substring(0, 6)}...${tx.to.substring(38)}`;
        responseText += `   📥 To: ${toAddress}\n`;
      }
    }
    
    // Add action details if available
    if (tx.txAction) {
      responseText += `   ⚡ Action: ${tx.txAction}\n`;
    }
    
    // Add contract info if available
    if (tx.contractName) {
      responseText += `   📄 Contract: ${tx.contractName}\n`;
    }
    
    // Add function info if available
    if (tx.functionName) {
      responseText += `   🔧 Function: ${tx.functionName}\n`;
    }
    
         responseText += "\n";
  }
  
     responseText += "💡 Note: This shows raw transaction data with classifications but without USD valuations (limit: 20 transactions).";
  
  return responseText;
}










// FULL TEST DATA FOR THIS ACTION
// ## 22. Get User Transactions by Period and Chain - Raw Label (Fixed 20 Limit, No USD Values) 

// **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}?chain={chain}&startTime={Integer}&endTime={Integer}`
// **Corresponding .ts File:** `getUserTxByPeriodAndChainRawLabel20Action.ts`

// **cURL to run (Generic):**
// ```bash
// curl -X GET -H "Authorization: YOUR_API_KEY" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}?chain={chain}&startTime={startTime}&endTime={endTime}"
// ```
// *(Replace `{userAddress}`, `{chain}`, `{startTime}`, and `{endTime}`. Timestamps are Unix timestamps. The `/20/` in the path fixes the limit. Note: User-provided working examples may have specific `startTime`/`endTime` conventions, and the API documentation itself can sometimes have `startTime` as the LATER date and `endTime` as the EARLIER date for period queries.)*

// **Test Parameters Used (User-provided working cURL):**
// *   `userAddress`: `0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50`
// *   `chain`: `eth`
// *   `startTime`: `1716346533`
// *   `endTime`: `1705895733`
// *   API Key: `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS`

// **Tested cURL Command (User-provided working cURL):**
// ```bash
// curl --location "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=eth&startTime=1716346533&endTime=1705895733" --header "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" | cat
// ```
// **Notes from cURL testing:**
// *   This cURL command and parameters were provided by the user as a working example.
// *   The API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` was used.
// *   It's important to note the `startTime` (1716346533) is later than `endTime` (1705895733) in this working example, and this is how the API expects it for this call as confirmed by the user.
// *   Previous tests with the `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` API key for this endpoint type sometimes returned empty arrays. This user-provided cURL is taken as the current correct working example.

// **Essential Information:**
// *   **Description:** Get up to 20 transactions for a specific user, on a specific chain (excluding Solana), within a specified timeframe. This version excludes token USD valuations and has the limit of 20 fixed in the path.
// *   **API Key:** Pass the API key in the `Authorization` header (e.g., `Authorization: YOUR_API_KEY`). The user-provided working example uses `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS`.
// *   **Method:** `GET`
// *   **Path Parameters:**
//     *   `userAddress` (string, required): The wallet address of the user. The `/20/` segment in the path indicates a fixed limit.
// *   **Query Parameters:**
//     *   `chain` (string, required): The chain ID (e.g., `eth`). Cannot be Solana.
//     *   `startTime` (integer, required): Unix timestamp. In the user-provided working example, this was the LATER date of the period.
//     *   `endTime` (integer, required): Unix timestamp. In the user-provided working example, this was the EARLIER date of the period.
// *   **Response:** Returns a JSON array of up to 20 transaction objects for the specified chain and period. USD value fields will be 0 or null. (See original documentation for schema).
// *   **Note:** 
//     *   The API documentation has sometimes specified `startTime` as LATER date, `endTime` as EARLIER date for period queries. The user-provided working example follows this.
//     *   "Solana blockchain transactions cannot be retrieved by timeframe."
//     *   If 20 transactions are returned and `endTime` is older than the oldest retrieved, more transactions might exist.

// **Suggested Action Name:** `GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI`
// **Corresponding .ts File:** `getUserTxByPeriodAndChainRawLabel20Action.ts`

// # Action: GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI
// run_curl_test "GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20" "curl --location \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=eth&startTime=1716346533&endTime=1705895733\" --header \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" | cat"
