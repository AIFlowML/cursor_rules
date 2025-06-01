/**
 * Get Transactions For DeFi Position Action
 * 
 * This action retrieves transactions related to a specific DeFi position.
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


// Helper function to extract position ID from text
const extractPositionId = (text: string): string | null => {
  logger.debug(`Attempting to extract position ID from: "${text}"`);
  
  // Try to match a fully qualified position ID format first
  // Format: protocol__type:contract-address:wallet:index
  const fullPositionPattern = /([\w\d_]+:[\w\d-]+:0x[a-fA-F0-9]+:[0-9]+)/i;
  const fullMatch = text.match(fullPositionPattern);
  if (fullMatch?.[1]) {
    logger.debug(`Found full position ID format: ${fullMatch[1]}`);
    return fullMatch[1];
  }
  
  // Look for common position ID mention patterns
  const patterns = [
    // Pattern: "position id: xyz"
    /position id:?\s*([\w\d_:.-]+)/i,
    // Pattern: "position: xyz"
    /position:?\s*([\w\d_:.-]+)/i,
    // Pattern: "for position xyz"
    /for position\s*([\w\d_:.-]+)/i,
    // Pattern: "defi position xyz"
    /defi position\s*([\w\d_:.-]+)/i,
    // Pattern: "position with id xyz"
    /position with id\s*([\w\d_:.-]+)/i,
    // Pattern: "compound position" - extract the whole compound position pattern
    /compound__[\w\d_:.-]+/i,
    // Fallbacks for simple numeric IDs
    /#(\d+)\b/i,
    /\b(\d+)\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      logger.debug(`Found position ID with pattern ${pattern}: ${match[1]}`);
      return match[1];
    }
  }
  
  logger.debug("No position ID found in text");
  return null;
};

/**
 * Action to retrieve transactions for a specific DeFi position
 */
export const getTransactionsForDeFiPositionAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_POSITION_TRANSACTIONS_DEFIPOSITION_DATAI",
    "FETCH_DEFI_POSITION_HISTORY_TRANSACTIONS_DATAI",
    "SHOW_POSITION_ACTIVITY_TRANSACTIONS_DATAI",
    "VIEW_POSITION_TX_HISTORY_DATAI",
    "LIST_POSITION_TRANSACTIONS_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves transaction history for a specific DeFi position by its identifier",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    // Need a position ID
    const messageText = message.content?.text || '';
    logger.debug(`Extracting position ID from message: "${messageText}"`);
    const positionId = extractPositionId(messageText);
    
    if (!positionId) {
      logger.debug("GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI validation failed: No position ID found in message");
      return false;
    }
    
    logger.debug(`GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI validation successful with position ID: ${positionId}`);
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
    logger.info("Executing GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    logger.debug(`Options: ${JSON.stringify(options)}`);
    
    try {
      // Extract parameters
      const messageText = message.content?.text || '';
      const positionId = options?.positionId as string || extractPositionId(messageText) || '';
      logger.debug(`Extracted position ID: ${positionId}`);
      
      if (!positionId || !callback) {
        // We need the position ID and callback to proceed
        if (callback) {
          if (!positionId) {
            logger.error('No position ID provided');
            callback({
              text: 'Please provide a valid position ID to check transaction history. Example: "Show me transactions for Compound position compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0"',
              content: { 
                success: false, 
                error: 'No position ID provided' 
              }
            });
          }
        } else {
          logger.error('GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI: No callback provided');
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
      
      // Build the endpoint with query parameter
      const endpoint = `${ENDPOINTS.GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI}?position=${encodeURIComponent(positionId)}`;
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching transactions for DeFi position ID ${positionId}`);
      const response = await apiClient.get<TransactionHistoryItem[]>(endpoint);
      logger.debug(`API response status: ${response.success ? 'Success' : 'Failed'}`);
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
          text: `Error fetching transactions for position: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const transactions = response.data || [];
      logger.debug(`Retrieved ${transactions.length} transactions for position ID ${positionId}`);
      
      if (transactions.length === 0) {
        logger.info(`No transactions found for position ID ${positionId}`);
        callback({
          text: `No transactions found for DeFi position ID ${positionId}.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function
      const responseText = formatDeFiPositionTransactionsResponse(transactions, positionId);
      
      logger.debug('Successfully formatted response for position transactions');
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { transactions: transactions } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve transactions for DeFi position: ${errorMessage}`,
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
          text: "Show me all transactions for DeFi position compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0 please."
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll look up the transaction history for the Compound lending position. One moment...",
          actions: ["GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What's the transaction history for Compound position compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch the transaction history for that Compound lending position...",
          actions: ["GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need to see all transactions related to my position compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll retrieve all transactions for your Compound position. This will show you the full history including fees and P&L...",
          actions: ["GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI"]
        }
      }
    ]
  ] as ActionExample[][],
}; 

/**
 * Format DeFi position transactions into a user-friendly message
 * 
 * @param transactions - Transaction data from API
 * @param positionId - The position ID that was queried
 * @returns Formatted response message
 */
function formatDeFiPositionTransactionsResponse(
  transactions: TransactionHistoryItem[],
  positionId: string
): string {
  // Format response text
  let responseText = `Transactions for DeFi position ID ${positionId}:\n\n`;
  
  // Sort transactions by timestamp (newest first)
  transactions.sort((a, b) => b.timeStamp - a.timeStamp);
  
  // Format each transaction
  for (const [index, tx] of transactions.entries()) {
    // Format date
    const date = new Date(tx.timeStamp * 1000).toLocaleString();
    
    // Format transaction type and action
    const type = tx.txType || 'Transaction';
    const action = tx.txAction ? ` (${tx.txAction})` : '';
    
    // Format chain
    const chain = tx.chain || 'Unknown chain';
    
    // Format transaction fee
    const fee = tx.txFeeUsd ? `$${tx.txFeeUsd.toFixed(2)}` : 'N/A';
    
    // Format profit/loss
    const pnl = tx.pnlUsd !== null && tx.pnlUsd !== undefined 
      ? `$${tx.pnlUsd > 0 ? '+' : ''}${tx.pnlUsd.toFixed(2)}`
      : 'N/A';
    
    // Build transaction entry
    responseText += `${index + 1}. ${type}${action}\n`;
    responseText += `   Date: ${date}\n`;
    responseText += `   Chain: ${chain}\n`;
    if (tx.from) responseText += `   From: ${tx.from}\n`;
    if (tx.to) responseText += `   To: ${tx.to}\n`;
    responseText += `   Fee: ${fee}\n`;
    
    if (tx.pnlUsd !== null && tx.pnlUsd !== undefined) {
      responseText += `   P&L: ${pnl}\n`;
    }
    
    responseText += `   Hash: ${tx.hash}\n`;
    
    // Add balance changes if available
    if (tx.balances && tx.balances.length > 0) {
      responseText += '   Token movements:\n';
      for (const balance of tx.balances.slice(0, 3)) {
        const symbol = balance.tokenSymbol || 'Unknown Symbol';
        const name = balance.tokenName ? ` (${balance.tokenName})` : '';
        const valueUsd = balance.balanceUSD ? `($${balance.balanceUSD.toFixed(2)})` : '';
        responseText += `     • ${balance.balance} ${symbol}${name} ${valueUsd}\n`;
      }
      
      if (tx.balances.length > 3) {
        responseText += `     • ...and ${tx.balances.length - 3} more token movements\n`;
      }
    }
    
    // Add a separator between transactions
    if (index < transactions.length - 1) {
      responseText += '\n';
    }
  }
  
  // Add summary info
  const totalTx = transactions.length;
  const totalFees = transactions.reduce((sum, tx) => sum + (tx.txFeeUsd || 0), 0);
  const totalPnl = transactions
    .filter(tx => tx.pnlUsd !== null && tx.pnlUsd !== undefined)
    .reduce((sum, tx) => sum + (tx.pnlUsd || 0), 0);
  
  responseText += `\n\nSummary: ${totalTx} transactions`;
  responseText += `\nTotal fees: $${totalFees.toFixed(2)}`;
  
  if (transactions.some(tx => tx.pnlUsd !== null && tx.pnlUsd !== undefined)) {
    const pnlPrefix = totalPnl > 0 ? '+' : '';
    responseText += `\nTotal P&L: ${pnlPrefix}$${totalPnl.toFixed(2)}`;
  }
  
  return responseText;
}

/**
 * TEST DATA FOR THIS ACTION
 * 
 * ## 25. Get Transactions for a DeFi Position (Up to 100)
 * 
 * Endpoint: https://api-v1.mymerlin.io/api/merlin/public/userTx/position/?position={position}
 * 
 * Test Parameters Used:
 * position: compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0
 * 
 * Tested cURL Command:
 * curl -X GET -H "Authorization: GET_YOUR_DATAI_API" "https://api-v1.mymerlin.io/api/merlin/public/userTx/position/?position=compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726E900a1380055F469eB6e2a7fD3:0"
 * 
 * Essential Information:
 * Description: Get all transactions (up to 100) for a specific user's DeFi position in a protocol.
 * Query Parameters:
 *   position (string, required): The identifier of the DeFi position.
 * Response: JSON array of transaction objects with detailed transaction information.
 */
