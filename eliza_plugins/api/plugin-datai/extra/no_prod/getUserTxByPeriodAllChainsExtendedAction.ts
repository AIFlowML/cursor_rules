/**
 * Get User Transaction History By Period (All Chains) - Extended Action
 * 
 * This action retrieves detailed transaction history for a user across all chains within a specific time period.
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
 * Action to retrieve a detailed list of transactions for a user within a time period across all chains
 */
export const getUserTxByPeriodAllChainsExtendedAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_TX_BY_PERIOD_ALL_CHAINS_EXTENDED",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_TX_BY_PERIOD_ALL_CHAINS",
    "FETCH_TRANSACTIONS_BY_TIMEFRAME",
    "LIST_MY_TRANSACTIONS_BY_PERIOD",
    "SHOW_TRANSACTION_HISTORY_TIME_RANGE",
    "GET_MY_TRANSACTIONS_FROM_DATE_RANGE"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves detailed transaction history for a user within a specific time period across all chains",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getUserTxByPeriodAllChainsExtended action");
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`getUserTxByPeriodAllChainsExtended validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const userAddress = extractWalletAddress(message.content?.text || '');
    if (!userAddress) {
      logger.debug("getUserTxByPeriodAllChainsExtended validation failed: No wallet address found in message");
      return false;
    }
    
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`getUserTxByPeriodAllChainsExtended validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Check for time-period related keywords in the message
    const messageText = (message.content?.text || '').toLowerCase();
    const hasTimeKeywords = messageText.includes('since') || 
                           messageText.includes('last') ||
                           messageText.includes('this week') ||
                           messageText.includes('this month') ||
                           messageText.includes('this year') ||
                           messageText.includes('days') ||
                           messageText.includes('weeks') ||
                           messageText.includes('months');
                           
    if (!hasTimeKeywords) {
      logger.debug("getUserTxByPeriodAllChainsExtended validation failed: No time period specified in query");
      return false;
    }
    
    logger.debug("getUserTxByPeriodAllChainsExtended validation successful");
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
    logger.info("Executing getUserTxByPeriodAllChainsExtended action");
    
    try {
      // Extract parameters
      const userAddress = extractWalletAddress(message.content?.text || '');
      const messageText = message.content?.text || '';
      const limit = options?.limit || 50; // Default to 50 transactions
      
             // Extract date range from the message
       const dateRange = options?.dateRange as { startDate?: number; endDate?: number } || extractDateRange(messageText);
       const { startDate, endDate } = dateRange;
       
       if (!userAddress || !callback) {
        // We need a wallet address and callback to proceed
        if (callback) {
          if (!userAddress) {
            callback({
              text: 'Please provide a valid wallet address to check transaction history.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          }
        } else {
          logger.error('getUserTxByPeriodAllChainsExtended: No callback provided');
        }
        
        return false;
      }
      
      // Create API client
      const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
      const apiClient = new DataiApiClient(apiKey);
      
      // Build the endpoint with query parameters
      let endpoint = ENDPOINTS.GET_USER_TX_BY_PERIOD_ALL_CHAINS_EXTENDED.replace('{userAddress}', userAddress);
      const queryParams = [`limit=${limit}`];
      
      // Add date parameters if available
      if (startDate) {
        queryParams.push(`startDate=${startDate}`);
      }
      
      if (endDate) {
        queryParams.push(`endDate=${endDate}`);
      }
      
      // Append all query parameters
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
      
      // Format date strings for logging
      const startDateFormatted = startDate ? new Date(startDate * 1000).toISOString() : 'none specified';
      const endDateFormatted = endDate ? new Date(endDate * 1000).toISOString() : 'now';
      
      logger.info(`Fetching transactions for ${userAddress} from ${startDateFormatted} to ${endDateFormatted} (limit: ${limit})`);
      const response = await apiClient.get<TransactionHistoryItem[]>(endpoint);
      
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
        callback({
          text: `No transactions found for address ${userAddress} in the specified time period.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      // Format date range for response text
      const dateRangeText = startDate
        ? `from ${new Date(startDate * 1000).toLocaleDateString()} to ${endDate ? new Date(endDate * 1000).toLocaleDateString() : 'now'}`
        : '';
      
      // Format response text
      let responseText = `Found ${transactions.length} transactions for ${userAddress} ${dateRangeText}:\n\n`;
      
      // List transactions
      for (const tx of transactions) {
        const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
        const txValue = tx.txFeeUsd ? `${tx.txFeeUsd.toFixed(2)} USD` : 'N/A';
        
        responseText += `- ${tx.txType || 'Transaction'} on ${tx.chain || 'Unknown chain'} (${date})`;
        responseText += `\n  Hash: ${tx.hash}`;
        responseText += `\n  Fee: ${txValue}`;
        
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
        
        responseText += '\n\n';
      }
      
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
      logger.error(`getUserTxByPeriodAllChainsExtended error: ${errorMessage}`);
      
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
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me my transactions from the last 7 days",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch your transactions from the last 7 days...",
          actions: ["getUserTxByPeriodAllChainsExtended"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What transactions has 0x1234abcd made since last month?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me search for transactions for this address since last month...",
          actions: ["getUserTxByPeriodAllChainsExtended"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get my transaction history for this week",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving your transaction history for this week...",
          actions: ["getUserTxByPeriodAllChainsExtended"],
        },
      },
    ]
  ] as ActionExample[][],
}; 