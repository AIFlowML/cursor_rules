/**
 * Get Transaction Transfers By Hash Action
 * 
 * This action retrieves token transfers for a specific transaction by its hash.
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
import type { TransactionTransferItem } from "../../types";


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


// Helper function to extract transaction hash from text
const extractTransactionHash = (text: string): string | null => {
  // Look for common transaction hash mention patterns
  const patterns = [
    // Pattern: "transaction hash: 0x..."
    /transaction hash:?\s*(0x[a-fA-F0-9]{64})/i,
    // Pattern: "tx hash: 0x..."
    /tx hash:?\s*(0x[a-fA-F0-9]{64})/i,
    // Pattern: "hash: 0x..."
    /hash:?\s*(0x[a-fA-F0-9]{64})/i,
    // Pattern: "0x..." (standalone hash)
    /(0x[a-fA-F0-9]{64})/i,
    // Pattern for Solana transaction hashes (base58 format)
    /transaction hash:?\s*([1-9A-HJ-NP-Za-km-z]{88,98})/i,
    /tx hash:?\s*([1-9A-HJ-NP-Za-km-z]{88,98})/i,
    /hash:?\s*([1-9A-HJ-NP-Za-km-z]{88,98})/i,
    /([1-9A-HJ-NP-Za-km-z]{88,98})/i,
  ];
  
  logger.debug("Attempting to extract transaction hash");
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      logger.debug(`Found transaction hash: ${match[1]} using pattern ${pattern}`);
      return match[1];
    }
  }
  
  logger.debug("No transaction hash found in text");
  return null;
};

/**
 * Action to retrieve token transfers in a transaction by hash
 */
export const getTransactionTransfersByHashAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_TRANSACTION_TRANSFERS_BY_HASH",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_TX_TRANSFERS",
    "FETCH_TRANSACTION_TRANSFERS",
    "SHOW_TOKENS_MOVED",
    "LIST_TRANSACTION_TRANSFERS",
    "VIEW_TOKEN_MOVEMENTS"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves token transfers and movements within a specific transaction by its hash",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getTransactionTransfersByHash action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    if (!apiKey) {
      logger.error(`getTransactionTransfersByHash validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'Not found'}`);
    if (!userAddress) {
      logger.debug("getTransactionTransfersByHash validation failed: No wallet address found in message");
      return false;
    }
    
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`getTransactionTransfersByHash validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Also need a chain ID
    const chainId = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chainId || 'Not found'}`);
    if (!chainId) {
      logger.debug("getTransactionTransfersByHash validation failed: No chain ID found in message");
      return false;
    }
    
    // Need a transaction hash
    const txHash = extractTransactionHash(message.content?.text || '');
    logger.debug(`Extracted transaction hash: ${txHash || 'Not found'}`);
    if (!txHash) {
      logger.debug("getTransactionTransfersByHash validation failed: No transaction hash found in message");
      return false;
    }
    
    logger.debug("getTransactionTransfersByHash validation successful");
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
    logger.info("Executing getTransactionTransfersByHash action");
    
    try {
      // Extract parameters
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chainId = extractChainId(message.content?.text || '') || '';
      const txHash = options?.hash as string || extractTransactionHash(message.content?.text || '') || '';
      
      logger.debug(`Extracted parameters: userAddress=${userAddress}, chainId=${chainId}, txHash=${txHash}`);
      
      if (!userAddress || !chainId || !txHash || !callback) {
        // We need all parameters and callback to proceed
        logger.error(`Missing required parameter(s): userAddress=${!!userAddress}, chainId=${!!chainId}, txHash=${!!txHash}, callback=${!!callback}`);
        
        if (callback) {
          if (!userAddress) {
            callback({
              text: 'Please provide a valid wallet address to check transaction transfers.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          } else if (!chainId) {
            callback({
              text: 'Please specify which blockchain (e.g., "eth", "bsc", "polygon") the transaction is on.',
              content: { 
                success: false, 
                error: 'No chain ID provided' 
              }
            });
          } else if (!txHash) {
            callback({
              text: 'Please provide a valid transaction hash to look up transfers.',
              content: { 
                success: false, 
                error: 'No transaction hash provided' 
              }
            });
          }
        } else {
          logger.error('getTransactionTransfersByHash: No callback provided');
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
      
      // Build the endpoint
      const endpoint = ENDPOINTS.GET_TRANSACTION_TRANSFERS_BY_HASH
        .replace('{chain}', chainId)
        .replace('{hash}', txHash)
        .replace('{userAddress}', userAddress);
      
      logger.info(`Fetching transaction transfers for hash ${txHash} on ${chainId} for address ${userAddress}`);
      logger.debug(`API endpoint: ${endpoint}`);
      
      const response = await apiClient.get<TransactionTransferItem[]>(endpoint);
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
          text: `Error fetching transaction transfers: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const transfers = response.data || [];
      logger.debug(`Received ${transfers.length} token transfers`);
      
      if (transfers.length === 0) {
        logger.info(`No token transfers found for transaction ${txHash} on ${chainId}`);
        callback({
          text: `No token transfers found for transaction ${txHash} on ${chainId}.`,
          content: { 
            success: true, 
            data: { transfers: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function
      const responseText = formatTransactionTransfersResponse(transfers, txHash, userAddress);
      
      logger.info(`Successfully formatted ${transfers.length} token transfers for response`);
      
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { transfers: transfers } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`getTransactionTransfersByHash error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve transaction transfers: ${errorMessage}`,
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
          text: "Show me the token transfers for transaction hash 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on Ethereum for the wallet 0x218e312fF5181290A46e3f87A73A8aD40C05A944 please on DATAI."
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll look up the token transfers for that transaction hash on Ethereum. One moment...",
          actions: ["GET_TRANSACTION_TRANSFERS_BY_HASH"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What tokens moved in transaction 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on eth chain for wallet 0x218e312fF5181290A46e3f87A73A8aD40C05A944 please on DATAI."
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch the token movements in that Ethereum transaction for you...",
          actions: ["GET_TRANSACTION_TRANSFERS_BY_HASH"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Check transaction 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on Ethereum network, what tokens were transferred for address 0x218e312fF5181290A46e3f87A73A8aD40C05A944?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll analyze the token transfers in this Ethereum transaction. Just a moment...",
          actions: ["GET_TRANSACTION_TRANSFERS_BY_HASH"]
        }
      }
    ]
  ] as ActionExample[][],
}; 

/**
 * Format transaction transfers data into a user-friendly message
 * 
 * @param transfers - Transfer data from API
 * @param txHash - The transaction hash that was queried
 * @param userAddress - The wallet address that was queried
 * @returns Formatted response message
 */
function formatTransactionTransfersResponse(
  transfers: TransactionTransferItem[],
  txHash: string,
  userAddress: string
): string {
  // Format response text
  let responseText = `Token transfers for transaction ${txHash}:\n\n`;
  
  transfers.forEach((transfer, index) => {
    // Prefer tokenName over tokenSymbol if symbol is empty, otherwise use symbol
    const symbol = transfer.tokenSymbol || transfer.tokenName || 'Unknown Token';
    const amount = transfer.balance || 0;
    const decimals = transfer.tokenDecimals || 0;
    const valueUsd = transfer.balanceUSD && transfer.balanceUSD > 0 ? `(~$${transfer.balanceUSD.toFixed(2)})` : '';
    
    // Format amount based on standard and decimals
    let formattedAmount = amount.toString();
    
    // Handle NFTs differently from fungible tokens
    if (transfer.standard === 'ERC721' || transfer.standard === 'ERC1155') {
      // For NFTs, show the raw balance (usually 1)
      formattedAmount = amount.toString();
    } else if (decimals > 0 && transfer.standard !== 'ERC721') {
      // For fungible tokens with decimals, format properly
      const fullAmount = amount / (10 ** decimals);
      formattedAmount = fullAmount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      });
    }
    
    const standardType = transfer.standard ? `[${transfer.standard}] ` : '';
    
    // Truncate addresses for better readability
    const truncateAddress = (addr: string) => {
      if (addr === userAddress) return 'Your wallet';
      return `${addr.substring(0, 10)}...${addr.substring(addr.length - 8)}`;
    };
    
    const fromAddress = truncateAddress(transfer.from);
    const toAddress = truncateAddress(transfer.to);
    
    // Show token name in parentheses if different from symbol
    const tokenInfo = transfer.tokenName && transfer.tokenName !== symbol ? 
      `${symbol} (${transfer.tokenName})` : symbol;
    
    responseText += `${index + 1}. ${formattedAmount} ${tokenInfo} ${valueUsd} ${standardType}\n`;
    responseText += `   From: ${fromAddress}\n`;
    responseText += `   To: ${toAddress}\n`;
    
    if (index < transfers.length - 1) {
      responseText += '\n';
    }
  });
  
  return responseText;
}








/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 24. Get Transaction Transfers by Hash (Supports EVM and Solana)
 * 
 * **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/{chain}/{hash}/{userAddress}`
 * 
 * **cURL to run (EVM example - Generic):**
 * ```bash
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/{chain}/{hash}/{userAddress}"
 * ```
 * *(Replace `{chain}`, `{hash}`, and `{userAddress}` with actual values. Refer to `api_help.md` (Entry #24) for EVM example: `chain=eth`, `hash=0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf`, `userAddress=0x218e312fF5181290A46e3f87A73A8aD40C05A944`)*
 * 
 * **Test Parameters Used (EVM):**
 * *   `chain`: `eth`
 * *   `hash`: `0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf`
 * *   `userAddress`: `0x218e312fF5181290A46e3f87A73A8aD40C05A944`
 * 
 * **Tested cURL Command (EVM):**
 * ```bash
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944" | cat
 * ```
 * 
 * **cURL to run (Solana example - Generic):**
 * ```bash
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/solana/{solana_hash}/{solana_address}"
 * ```
 * *(Replace `{solana_hash}` and `{solana_address}`. `api_help.md` does not provide a direct Solana example for this specific `userTxTransfers` endpoint, but the structure is similar to the `userTx/byHash` Solana calls. Refer to Section 23 or original `datai_elizaos.md` for Solana hash/address examples if needed for testing.)*
 * 
 * **Essential Information:**
 * *   **Description:** Get only the transaction transfers (moved balances) for a specific transaction hash. Supports EVM and Solana chains.
 * *   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
 * *   **Method:** `GET`
 * *   **Path Parameters:**
 *     *   `chain` (string, required): The chain ID of the transaction (e.g., `eth`, `solana`).
 *     *   `hash` (string, required): The transaction hash.
 *     *   `userAddress` (string, required): The wallet address associated with the transaction context.
 * *   **Query Parameters:** None specified.
 * *   **Response:** Returns a JSON array of transfer objects. Each object details a balance movement, including `balance`, `balanceUSD`, `tokenAddress`, `tokenSymbol`, `tokenName`, `tokenDecimals`, `standard`, `from`, and `to`. (See original documentation for schema details, which matches the EVM test result structure).
 * 
 * **Suggested Action Name:** `GET_TRANSACTION_TRANSFERS_BY_HASH`
 * **Corresponding .ts File:** `getTransactionTransfersByHashAction.ts`
 * 
 * # Action: GET_TRANSACTION_TRANSFERS_BY_HASH
 * run_curl_test "GET_TRANSACTION_TRANSFERS_BY_HASH" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944\" | cat"
 */
