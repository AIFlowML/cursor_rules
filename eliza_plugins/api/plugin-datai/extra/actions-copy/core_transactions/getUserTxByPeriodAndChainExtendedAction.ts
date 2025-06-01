/**
 * Get User Transactions By Period And Chain Extended Action
 * 
 * This action retrieves detailed transaction history for a user within a specific time period on a specific chain.
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
  containsExtendedTxHistoryKeywords,
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
 * Action to retrieve a detailed list of transactions for a user within a time period on a specific chain
 */
export const getUserTxByPeriodAndChainExtendedAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_TX_BY_PERIOD_CHAIN_EXTENDED_DATAI",
    "FETCH_TRANSACTIONS_BY_TIMEFRAME_CHAIN_EXTENDED_DATAI",
    "LIST_MY_TRANSACTIONS_BY_PERIOD_ON_CHAIN_EXTENDED_DATAI",
    "SHOW_CHAIN_TRANSACTION_HISTORY_TIME_RANGE_EXTENDED_DATAI",
    "GET_MY_CHAIN_TRANSACTIONS_FROM_DATE_RANGE_EXTENDED_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves detailed transaction history for a user within a specific time period on a particular blockchain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI action");
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const messageText = message.content?.text || '';
    const userAddress = extractWalletAddress(messageText);
    if (!userAddress) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Also need a chain ID
    const chainId = extractChainId(messageText);
    if (!chainId) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI validation failed: No chain ID found in message");
      return false;
    }
    
    // Enhanced validation to prevent race conditions
    logger.debug("Checking for extended transaction history keywords to prevent race conditions");
    
    // Check for extended transaction history keywords
    const hasExtendedKeywords = containsExtendedTxHistoryKeywords(messageText);
    if (!hasExtendedKeywords) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI validation failed: No extended transaction history keywords found");
      return false;
    }
    
    // Check for time period keywords
    const hasTimePeriodKeywords = containsTimePeriodKeywords(messageText);
    if (!hasTimePeriodKeywords) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI validation failed: No time period keywords found");
      return false;
    }
    
    // Verify we can extract a valid time period
    const timePeriod = extractTimePeriodFromText(messageText);
    if (!timePeriod) {
      logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI validation failed: Could not extract valid time period");
      return false;
    }
    
    logger.debug("GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI validation successful - found extended tx keywords and time period");
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
    logger.info("Executing GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`);
    logger.debug(`Options: ${JSON.stringify(options || {})}`);
    
    try {
      // Extract parameters
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chainId = extractChainId(message.content?.text || '') || '';
      const messageText = message.content?.text || '';
      const limit = options?.limit || 50; // Default to 50 transactions
      
      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, chainId: ${chainId || 'None'}, limit: ${limit}`);
      
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
        if (callback) {
          if (!userAddress) {
            logger.debug("Missing wallet address, sending error response");
            callback({
              text: 'Please provide a valid wallet address to check transaction history.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          } else if (!chainId) {
            logger.debug("Missing chain ID, sending error response");
            callback({
              text: 'Please specify which blockchain (e.g., "eth", "bsc", "polygon") you want to check transactions for.',
              content: { 
                success: false, 
                error: 'No chain ID provided' 
              }
            });
          }
        } else {
          logger.error('GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI: No callback provided');
        }
        
        return false;
      }
      
      if (!startTime && !endTime) {
        if (callback) {
          logger.debug("No time period specified, sending error response");
          callback({
            text: 'Please specify a time period for the transaction history (e.g., "last 7 days", "this month", or explicit Unix timestamps).',
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
      
      const apiClient = new DataiApiClient(apiKey);
      
      // Build the endpoint with query parameters
      let endpoint = ENDPOINTS.GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI.replace('{userAddress}', userAddress);
      const queryParams = [`chain=${chainId}`, `limit=${limit}`];
      
      // Add time parameters if available, using test-compatible parameter names
      if (startTime) {
        queryParams.push(`startTime=${startTime}`);
        logger.debug(`Using startTime=${startTime} (this is the LATER date in the period)`);
      }
      
      if (endTime) {
        queryParams.push(`endTime=${endTime}`);
        logger.debug(`Using endTime=${endTime} (this is the EARLIER date in the period)`);
      }
      
      // Append all query parameters
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
      
      logger.debug(`Final API endpoint: ${endpoint}`);
      
      // Format date strings for logging
      const startTimeFormatted = startTime ? new Date(startTime * 1000).toISOString() : 'none specified';
      const endTimeFormatted = endTime ? new Date(endTime * 1000).toISOString() : 'now';
      
      logger.info(`Fetching transactions for ${userAddress} on ${chainId} from ${startTimeFormatted} to ${endTimeFormatted} (limit: ${limit})`);
      
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
      logger.debug(`Received ${transactions?.length || 0} transactions in response`);
      
      if (!transactions || transactions.length === 0) {
        logger.debug("No transactions found in response");
        callback({
          text: `No transactions found for address ${userAddress} on ${chainId} in the specified time period.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      logger.debug("Sending formatted response to callback");
      callback({
        text: formatTransactionsByPeriodAndChainResponse(transactions, userAddress, chainId, startTime, endTime),
        content: { 
          success: true, 
          data: { transactions } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve transactions by time period: ${errorMessage}`,
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
          text: "Show me extended transaction history on xDai chain for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 with startTime=1716346533 and endTime=1705895733 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll get your extended xDai transaction history for 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 with startTime 1716346533 and endTime 1705895733...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What are my complete transactions on xDai for address 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 with startTime 1716346533 and endTime 1705895733 on DATAI?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Fetching your complete xDai chain transaction history for 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 with startTime=1716346533 and endTime=1705895733...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get my full tx list on Ethereum for the last 30 days for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll retrieve your full transaction list on Ethereum for the last 30 days for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me extended tx history on Arbitrum from 01/15/2024 to 03/20/2024 for address 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Fetching your extended transaction history on Arbitrum from 01/15/2024 to 03/20/2024 for 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need my complete transaction history on Polygon for the past 3 months for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Getting your complete transaction history on Polygon for the past 3 months for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you get my detailed tx history on Base since last week for 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3 on DATAI?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll get your detailed transaction history on Base since last week for 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Find all transactions on Avalanche this month for my wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 with full tx list on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Searching for all transactions on Avalanche this month for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 with full transaction list...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show comprehensive transaction data on Optimism from startDate=2024-01-01 to endDate=2024-02-28 for 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on DATAI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving comprehensive transaction data on Optimism from 2024-01-01 to 2024-02-28 for 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50...",
          actions: ["GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI"]
        }
      }
    ]
  ] as ActionExample[][],
}; 

/**
 * Format transaction history data by period and chain into a user-friendly message
 * 
 * @param transactions - Transaction history data from API response
 * @param userAddress - The wallet address that was queried
 * @param chainId - The blockchain chain identifier
 * @param startTime - The start time of the period as Unix timestamp (optional)
 * @param endTime - The end time of the period as Unix timestamp (optional)
 * @returns Formatted response message
 */
function formatTransactionsByPeriodAndChainResponse(
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
  let responseText = `📊 Extended Transaction History for ${userAddress}\n`;
  responseText += `🔗 Chain: ${chainName}\n`;
  if (dateRangeText) {
    responseText += `📅 Period: ${dateRangeText}\n`;
  }
  responseText += `📈 Found ${transactions.length} transactions\n\n`;
  
  if (transactions.length === 0) {
    responseText += "No transactions found in the specified period.";
    return responseText;
  }
  
  // Group transactions by type for summary
  const txTypeGroups: { [key: string]: TransactionHistoryItem[] } = {};
  let totalFees = 0;
  let totalValue = 0;
  
  for (const tx of transactions) {
    if (!tx) continue;
    
    const txType = tx.txType || 'Unknown';
    if (!txTypeGroups[txType]) {
      txTypeGroups[txType] = [];
    }
    txTypeGroups[txType].push(tx);
    
    // Accumulate fees and values
    if (tx.txFeeUsd) {
      totalFees += tx.txFeeUsd;
    }
    
    // Get transaction value from balances
    if (tx.balances && tx.balances.length > 0) {
      const balance = tx.balances[0];
      if (balance?.balanceUSD && balance.balanceUSD > 0) {
        totalValue += balance.balanceUSD;
      }
    }
  }
  
  // Add summary
  responseText += "📋 Summary:\n";
  for (const [txType, txs] of Object.entries(txTypeGroups)) {
    responseText += `• ${txType}: ${txs.length} transaction${txs.length > 1 ? 's' : ''}\n`;
  }
  responseText += `💰 Total Fees: $${totalFees.toFixed(4)}\n`;
  if (totalValue > 0) {
    responseText += `💵 Total Value: $${totalValue.toFixed(2)}\n`;
  }
  responseText += "\n";
  
  // List detailed transactions (limit to first 10 for readability)
  const displayLimit = Math.min(transactions.length, 10);
  responseText += `🔍 Transaction Details (showing ${displayLimit} of ${transactions.length}):\n\n`;
  
  for (let i = 0; i < displayLimit; i++) {
    const tx = transactions[i];
    if (!tx) continue;
    
    const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
    const txType = tx.txType || 'Transaction';
    const classification = tx.txClassification ? ` (${tx.txClassification})` : '';
    
    responseText += `${i + 1}. ${txType}${classification}\n`;
    responseText += `   📅 ${date}\n`;
    responseText += `   🔗 Hash: ${tx.hash}\n`;
    
    // Get transaction value from balances
    let txValue = 'N/A';
    let tokenInfo = '';
    if (tx.balances && tx.balances.length > 0) {
      const balance = tx.balances[0];
      if (balance?.balanceUSD && balance.balanceUSD > 0) {
        txValue = `$${balance.balanceUSD.toFixed(2)}`;
        tokenInfo = balance.tokenSymbol ? ` (${balance.tokenSymbol})` : '';
      } else if (balance?.balance && balance.tokenSymbol) {
        const amount = Number(balance.balance) / (10 ** (balance.tokenDecimals || 18));
        if (amount > 0.001) {
          txValue = `${amount.toFixed(4)} ${balance.tokenSymbol}`;
          tokenInfo = '';
        }
      }
    }
    
    responseText += `   💰 Value: ${txValue}${tokenInfo}\n`;
    
    if (tx.txFeeUsd) {
      responseText += `   ⛽ Fee: $${tx.txFeeUsd.toFixed(4)}\n`;
    }
    
    // Show addresses
    if (tx.from || tx.to) {
      if (tx.from) {
        const fromAddress = tx.from === userAddress ? 'You' : tx.from;
        responseText += `   📤 From: ${fromAddress}\n`;
      }
      if (tx.to) {
        const toAddress = tx.to === userAddress ? 'You' : tx.to;
        responseText += `   📥 To: ${toAddress}\n`;
      }
    }
    
    // Show NFT details if present
    if (tx.balances?.[0]?.nftDetails) {
      const nft = tx.balances[0].nftDetails;
      responseText += `   🎨 NFT: ${nft.action || 'NFT'} - ${tx.balances[0].tokenName || 'Unknown'}\n`;
    }
    
    // Add action details if available
    if (tx.txAction) {
      responseText += `   ⚡ Action: ${tx.txAction}\n`;
    }
    
    responseText += "\n";
  }
  
  if (transactions.length > displayLimit) {
    responseText += `... and ${transactions.length - displayLimit} more transactions.\n`;
  }
  
  return responseText;
}

// FULL TEST DATA FOR THIS ACTION
// ## 21. Get User Transactions by Period and Chain - Extended (Up to 100) 

// **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/{userAddress}?chain={chain}&startTime={Integer}&endTime={Integer}`

// **cURL to run (Generic):**
// ```bash
// curl -X GET -H "Authorization: YOUR_API_KEY" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/{userAddress}?chain={chain}&startTime={startTime}&endTime={endTime}&limit={limit}"
// ```
// *(Replace `{userAddress}`, `{chain}`, `{startTime}`, `{endTime}`, and optionally `{limit}`. Timestamps are Unix timestamps. `limit` is optional, default up to 100. Note: User-provided working examples may have specific `startTime`/`endTime` conventions, and the API documentation itself can sometimes have `startTime` as the LATER date and `endTime` as the EARLIER date for period queries.)*

// **Test Parameters Used (User-provided working cURL):**
// *   `userAddress`: `0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50`
// *   `chain`: `xdai`
// *   `startTime`: `1716346533`
// *   `endTime`: `1705895733`
// *   API Key: `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH`

// **Tested cURL Command (User-provided working cURL):**
// ```bash
// curl --location "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?startTime=1716346533&endTime=1705895733&chain=xdai" --header "Authorization: OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH" | cat
// ```
// **Notes from cURL Testing:**
// *   This cURL command and parameters were provided by the user as a working example.
// *   The API key `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH` was used.
// *   It's important to note the `startTime` (1716346533) is later than `endTime` (1705895733) in this working example, and this is how the API expects it for this call as confirmed by the user.
// *   Previous tests with the `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` API key for this endpoint type sometimes returned empty arrays or had different timestamp conventions. This user-provided cURL is taken as the current correct working example.

// **Essential Information:**
// *   **Description:** Get up to 100 transactions for a specific user, on a specific chain (excluding Solana), within a specified timeframe. Includes classification and DeFi PNL.
// *   **API Key:** Pass the API key in the `Authorization` header (e.g., `Authorization: YOUR_API_KEY`). The user-provided working example uses `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH`.
// *   **Method:** `GET`
// *   **Path Parameters:**
//     *   `userAddress` (string, required): The wallet address of the user.
// *   **Query Parameters:**
//     *   `chain` (string, required): The chain ID (e.g., `xdai`). Cannot be Solana.
//     *   `startTime` (integer, required): Unix timestamp. In the user-provided working example, this was the LATER date of the period.
//     *   `endTime` (integer, required): Unix timestamp. In the user-provided working example, this was the EARLIER date of the period.
//     *   `limit` (integer, optional, behavior observed): Testing with `&limit=5` returned a smaller set. Default is up to 100.
// *   **Response:** Returns a JSON array of transaction objects for the specified chain and period. Structure similar to other extended transaction history endpoints. (See original documentation for schema).
// *   **Note:** 
//     *   The API documentation has sometimes specified `startTime` as LATER date, `endTime` as EARLIER date for period queries. The user-provided working example follows this.
//     *   "Solana blockchain transactions cannot be retrieved by timeframe."
//     *   If 100 transactions are returned and `endTime` is older than the oldest retrieved, more might exist in the timeframe.

// **Suggested Action Name:** `GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI`
// **Corresponding .ts File:** `getUserTxByPeriodAndChainExtendedAction.ts`

// # Action: GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED_DATAI
// run_curl_test "GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED" "curl --location \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?startTime=1716346533&endTime=1705895733&chain=xdai\" --header \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" | cat"
