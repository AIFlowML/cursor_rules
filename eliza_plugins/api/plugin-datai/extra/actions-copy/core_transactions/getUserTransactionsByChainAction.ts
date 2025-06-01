/**
 * Get User Transactions By Chain Action
 * 
 * This action retrieves transaction history for a user on a specific chain.
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
 * Action to retrieve a list of transactions for a user on a specific chain
 */
export const getUserTransactionsByChainAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_TRANSACTIONS_BY_CHAIN_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_TRANSACTIONS_BY_CHAIN_DATAI",
    "FETCH_CHAIN_TX_HISTORY_FOR_USER_DATAI",
    "LIST_ALL_CHAIN_TRANSACTIONS_DATAI",
    "SHOW_ALL_CHAIN_TRANSACTIONS_DATAI",
    "GET_MY_FULL_CHAIN_TRANSACTIONS_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves transaction history for a user on a specific blockchain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getUserTransactionsByChain action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    if (!apiKey) {
      logger.error(`getUserTransactionsByChain validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("getUserTransactionsByChain validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug(`Validating wallet address format: ${userAddress}`);
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`getUserTransactionsByChain validation failed: Invalid wallet address format ${userAddress}`);
      return false;
    }
    
    logger.debug("Attempting to extract chain ID from message");
    const chainId = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chainId || 'None'}`);
    
    if (!chainId) {
      logger.debug("getUserTransactionsByChain validation failed: No chain ID found in message");
      return false;
    }
    
    logger.debug("getUserTransactionsByChain validation successful");
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
    logger.info("Executing getUserTransactionsByChain action");
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
      
      // Use extracted limit, options limit, or default to 10 transactions
      // Ensure options.limit is treated as a number or undefined
      const optionsLimit = (typeof options?.limit === 'number') ? options.limit : undefined;
      const limit = messageLimit ?? optionsLimit ?? 10;
      logger.debug(`Using limit: ${limit}`);

      const chainId = extractChainId(message.content?.text || '');
      logger.debug(`Extracted chain ID: ${chainId}`);
      
      if (!userAddress || !chainId || !callback) {
        // We need a wallet address, chain ID, and callback to proceed
        logger.error(`Missing required parameters: userAddress=${!!userAddress}, chainId=${!!chainId}, callback=${!!callback}`);
        
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
          } else if (!chainId) {
            logger.debug("Responding with missing chain ID error");
            callback({
              text: 'Please specify a blockchain to check transactions on (e.g., eth, matic, bsc).',
              content: { 
                success: false, 
                error: 'No chain ID provided' 
              }
            });
          }
        } else {
          logger.error('getUserTransactionsByChain: No callback provided');
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
      const endpoint = `${ENDPOINTS.GET_USER_TRANSACTIONS_BY_CHAIN_DATAI.replace('{userAddress}', userAddress)}?chain=${chainId}&limit=${limit}`;
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching transaction history for ${userAddress} on chain ${chainId} (limit: ${limit})`);
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
        logger.info(`No transactions found for address ${userAddress} on chain ${chainId}`);
        callback({
          text: `No transactions found for address ${userAddress} on chain ${chainId}.`,
          content: { 
            success: true, 
            data: { transactions: [] } 
          }
        });
        
        return true;
      }
      
      // Format response text
      logger.debug("Formatting response text");
      
      logger.debug("Sending successful response with transaction data");
      callback({
        text: formatTransactionsByChainResponse(transactions, userAddress, chainId, limit),
        content: { 
          success: true, 
          data: { transactions } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`getUserTransactionsByChain error: ${errorMessage}`);
      
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
          text: "Show me the transaction history by chain for wallet 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e on Ethereum on DATAI LIMIT 10",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me retrieve the Ethereum transaction history for 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e. One moment please...",
          actions: ["GET_USER_TRANSACTIONS_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What are the last 10 transactions that 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e made on eth?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch the 10 most recent Ethereum transactions for this wallet address...",
          actions: ["GET_USER_TRANSACTIONS_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you show me the transaction history for address 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e on the eth chain?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving transaction history for 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e on Ethereum...",
          actions: ["GET_USER_TRANSACTIONS_BY_CHAIN_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
};

/**
 * Format transaction history data for a specific chain into a user-friendly message
 * 
 * @param transactions - Transaction history data from API response
 * @param userAddress - The wallet address that was queried
 * @param chainId - The blockchain chain identifier
 * @param limit - Optional limit for number of transactions to display
 * @returns Formatted response message
 */
function formatTransactionsByChainResponse(
  transactions: TransactionHistoryItem[], 
  userAddress: string, 
  chainId: string,
  limit?: number
): string {
  // Apply limit if provided
  const transactionsToShow = limit ? transactions.slice(0, limit) : transactions;
  
  let responseText = `Found ${transactions.length} transactions for ${userAddress} on ${chainId.toUpperCase()}`;
  
  if (limit && transactions.length > limit) {
    responseText += ` (showing the ${limit} most recent)`;
  } else if (transactionsToShow.length > 0) {
    responseText += ` (showing all ${transactionsToShow.length})`;
  }
  responseText += ':\n\n';
  
  // List transactions (iterate over transactionsToShow)
  for (const tx of transactionsToShow) {
    const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
    const status = tx.successful ? '✅ Successful' : '❌ Failed';
    const classification = tx.txClassification ? ` (${tx.txClassification})` : '';
    const protocolInfo = tx.protocol ? `\n  Protocol: ${tx.protocol}` : '';
    const blacklistedInfo = tx.blacklisted ? '\n  Status: ⚠️ Blacklisted' : '';

    responseText += "----------------------------------------\n";
    responseText += `${tx.txType || 'Transaction'}${classification} - ${status}`;
    responseText += `\n  Date: ${date}`;
    responseText += `\n  Hash: ${tx.hash}`;
    
    const txFeeEth = tx.txFee ? `${(tx.txFee / 1e18).toFixed(6)} ETH` : '';
    const txFeeUsdDisplay = tx.txFeeUsd ? `$${tx.txFeeUsd.toFixed(2)} USD` : 'N/A';
    const feeDisplay = txFeeEth ? `${txFeeEth} (${txFeeUsdDisplay})` : txFeeUsdDisplay;
    responseText += `\n  Fee: ${feeDisplay}`;
    
    if (tx.from && tx.from.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
      const fromAddressDisplay = tx.from.toLowerCase() === userAddress.toLowerCase() ? 'You' : tx.from;
      responseText += `\n  From: ${fromAddressDisplay}`;
    }
    
    if (tx.to && tx.to.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
      const toAddressDisplay = tx.to.toLowerCase() === userAddress.toLowerCase() ? 'You' : tx.to;
      responseText += `\n  To: ${toAddressDisplay}`;
    }

    responseText += protocolInfo;
    responseText += blacklistedInfo;

    if (tx.balances && tx.balances.length > 0) {
      responseText += "\n  Transfers/Assets Involved:";
      for (const balance of tx.balances) {
        const tokenSymbol = balance.tokenSymbol || 'Unknown Token';
        const tokenName = balance.tokenName || tokenSymbol;
        const standard = balance.standard || 'Unknown Standard';
        let amount = Number.parseFloat(balance.balanceString || '0'); // Use balanceString for full precision before dividing
        const decimals = balance.tokenDecimals || 0;
        
        // Adjust amount based on decimals for fungible tokens
        if (standard !== 'ERC721' && standard !== 'ERC1155' && decimals > 0) {
          amount /= (10 ** decimals);
        }
        
        const balanceUsdDisplay = balance.balanceUSD ? `$${balance.balanceUSD.toFixed(2)}` : 'N/A';
        
        responseText += `\n    - ${tokenName} (${tokenSymbol}) [${standard}]`;
        
        if (standard === 'ERC721' || standard === 'ERC1155') { // NFT specific
          responseText += `\n      Token ID: ${balance.nftDetails?.innerId || 'N/A'}`;
          responseText += `\n      Action: ${balance.nftDetails?.action || 'N/A'}`;
          if (balance.from && balance.from.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
             const nftFrom = balance.from.toLowerCase() === userAddress.toLowerCase() ? 'You' : balance.from;
             responseText += `\n      From: ${nftFrom}`;
          }
          if (balance.to && balance.to.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
             const nftTo = balance.to.toLowerCase() === userAddress.toLowerCase() ? 'You' : balance.to;
             responseText += `\n      To: ${nftTo}`;
          }
        } else { // Fungible token specific
          responseText += `\n      Amount: ${amount.toFixed(decimals > 0 ? Math.min(decimals, 6) : 0)} ${tokenSymbol}`;
          responseText += `\n      Value (USD): ${balanceUsdDisplay}`;
           if (balance.from && balance.from.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
             const tokenFrom = balance.from.toLowerCase() === userAddress.toLowerCase() ? 'You' : balance.from;
             responseText += `\n      From: ${tokenFrom}`;
          }
          if (balance.to && balance.to.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
             const tokenTo = balance.to.toLowerCase() === userAddress.toLowerCase() ? 'You' : balance.to;
             responseText += `\n      To: ${tokenTo}`;
          }
        }
      }
    }
    responseText += '\n\n';
  }
  
  return responseText;
}







// FULL TEST DATA FOR THIS ACTION
// run_curl_test "GET_USER_TRANSACTIONS_BY_CHAIN_DATAI" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10\" | cat"
// 
// ## 16. Get User Transaction History by Chain - Extended (Default 100)

// **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/{userAddress}?chain={chain}`

// **cURL to run (Generic):**
// ```bash
// curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/{userAddress}?chain={chain}&limit={limit}"
// ```
// *(Replace `{userAddress}` with the user's wallet address, `{chain}` with the chain ID, and optionally `{limit}`. The API defaults to 100 transactions. Refer to `api_help.md` (Entry #16) for working examples like `userAddress=0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e`, `chain=eth`, `limit=10`)*

// **Test Parameters Used:**
// *   `userAddress`: `0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e`
// *   `chain`: `eth`
// *   `limit`: `10`

// **Tested cURL Command:**
// ```bash
// curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10" | cat
// ```

// **Essential Information:**
// *   **Description:** Get the latest transactions (default 100) for a specific user on a specific chain (excluding Solana). Includes classification and DeFi PNL.
// *   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
// *   **Method:** `GET`
// *   **Path Parameters:**
//     *   `userAddress` (string, required): The wallet address of the user.
// *   **Query Parameters:**
//     *   `chain` (string, required): The chain ID (e.g., `eth`). Cannot be Solana for this endpoint.
//     *   `startTime` (timestamp, optional): If set, will return the latest transactions (up to default/specified limit) on that chain *prior* to this Unix timestamp.
//     *   `limit` (integer, optional, behavior observed): While docs state a default of 100, testing with `&limit=5` returned a smaller set. Official support should be confirmed.
// *   **Response:** Returns a JSON array of transaction objects for the specified chain. Structure is similar to the `history/all/extended` endpoint. (See original documentation for schema).
// *   **Note:** The documentation explicitly states, "*For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below."

// **Suggested Action Name:** `GET_USER_TRANSACTIONS_BY_CHAIN_DATAI`
// **Corresponding .ts File:** `getUserTransactionsByChainAction.ts`
