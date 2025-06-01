/**
 * Get Transaction By Hash Action
 * 
 * This action retrieves details for a specific transaction by its hash.
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


  // Helper function to extract transaction hash from text
  const extractTransactionHash = (text: string): string | null => {
    logger.debug(`Attempting to extract transaction hash from: "${text}"`);
    
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
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        logger.debug(`Found transaction hash with pattern ${pattern}: ${match[1]}`);
        return match[1];
      }
    }
    
    logger.debug("No transaction hash found in text");
    return null;
  };
  
  /**
   * Action to retrieve transaction details by hash
   */
  export const getTransactionByHashAction: Action = {
    /**
     * Action identifier
     */
    name: "GET_TRANSACTION_BY_HASH_DATAI",
    
    /**
     * Alternative action names
     */
    similes: [
      "GET_TX_BY_HASH_DATAI",
      "FETCH_TRANSACTION_DETAILS_DATAI",
      "LOOKUP_TRANSACTION_DATAI",
      "FIND_TX_BY_HASH_DATAI",
      "SHOW_TX_DETAILS_DATAI"
    ],
    
    /**
     * Human-readable description of the action
     */
    description: "Retrieves detailed information for a specific transaction by its hash",
    
    /**
     * Validate action prerequisites
     * 
     * @param runtime - ElizaOS agent runtime
     * @param message - Triggering message
     * @returns Whether the action can be executed
     */
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      logger.debug("Validating GET_TRANSACTION_BY_HASH_DATAI action");
      logger.debug(`Message content: ${JSON.stringify(message.content)}`);
      
      const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                    process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
      
      if (!apiKey) {
        logger.error(`GET_TRANSACTION_BY_HASH_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
        return false;
      }
      
      const messageText = message.content?.text || '';
      
      // Extract wallet address
      logger.debug("Extracting wallet address from message");
      const userAddress = extractWalletAddress(messageText);
      if (!userAddress) {
        logger.debug("GET_TRANSACTION_BY_HASH_DATAI validation failed: No wallet address found in message");
        return false;
      }
      
      if (!isValidWalletAddress(userAddress)) {
        logger.error(`GET_TRANSACTION_BY_HASH_DATAI validation failed: Invalid wallet address ${userAddress}`);
        return false;
      }
      logger.debug(`Found valid wallet address: ${userAddress}`);
      
      // Extract chain ID
      logger.debug("Extracting chain ID from message");
      const chainId = extractChainId(messageText);
      if (!chainId) {
        logger.debug("GET_TRANSACTION_BY_HASH_DATAI validation failed: No chain ID found in message");
        return false;
      }
      logger.debug(`Found chain ID: ${chainId}`);
      
      // Extract transaction hash
      logger.debug("Extracting transaction hash from message");
      const txHash = extractTransactionHash(messageText);
      if (!txHash) {
        logger.debug("GET_TRANSACTION_BY_HASH_DATAI validation failed: No transaction hash found in message");
        return false;
      }
      logger.debug(`Found transaction hash: ${txHash}`);
      
      logger.debug(`GET_TRANSACTION_BY_HASH_DATAI validation successful - Address: ${userAddress}, Chain: ${chainId}, Hash: ${txHash}`);
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
      logger.info("Executing GET_TRANSACTION_BY_HASH_DATAI action");
      logger.debug(`Message content: ${JSON.stringify(message.content)}`);
      logger.debug(`Options: ${JSON.stringify(options)}`);
      
      try {
        // Extract parameters
        const messageText = message.content?.text || '';
        const userAddress = extractWalletAddress(messageText);
        const chainId = extractChainId(messageText) || '';
        const txHash = options?.hash as string || extractTransactionHash(messageText) || '';
        
        logger.debug(`Extracted parameters - Address: ${userAddress}, Chain: ${chainId}, Hash: ${txHash}`);
        
        if (!userAddress || !chainId || !txHash || !callback) {
          // We need all parameters and callback to proceed
          if (callback) {
            if (!userAddress) {
              logger.error("Missing wallet address parameter");
              callback({
                text: 'Please provide a valid wallet address to check transaction details. For example: "Show me transaction 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on ETH for wallet 0x218e312fF5181290A46e3f87A73A8aD40C05A944"',
                content: { 
                  success: false, 
                  error: 'No wallet address provided' 
                }
              });
            } else if (!chainId) {
              logger.error("Missing chain ID parameter");
              callback({
                text: 'Please specify which blockchain (e.g., "eth", "bsc", "polygon") the transaction is on.',
                content: { 
                  success: false, 
                  error: 'No chain ID provided' 
                }
              });
            } else if (!txHash) {
              logger.error("Missing transaction hash parameter");
              callback({
                text: 'Please provide a valid transaction hash to look up. For example: "Show me details for transaction 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf"',
                content: { 
                  success: false, 
                  error: 'No transaction hash provided' 
                }
              });
            }
          } else {
            logger.error('GET_TRANSACTION_BY_HASH_DATAI: No callback provided');
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
        const endpoint = ENDPOINTS.GET_TRANSACTION_BY_HASH_DATAI
          .replace('{chain}', chainId)
          .replace('{hash}', txHash)
          .replace('{userAddress}', userAddress);
        
        logger.debug(`API endpoint: ${endpoint}`);
        logger.info(`Fetching transaction details for hash ${txHash} on ${chainId} for address ${userAddress}`);
        
        const response = await apiClient.get<TransactionHistoryItem>(endpoint);
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
            text: `Error fetching transaction details: ${errorMessage}`,
            content: { 
              success: false, 
              error: errorMessage 
            }
          });
          
          return false;
        }
        
        // Process successful response
        const tx = response.data;
        
        if (!tx) {
          logger.info(`No transaction found with hash ${txHash} on ${chainId} for address ${userAddress}`);
          callback({
            text: `No transaction found with hash ${txHash} on ${chainId} for address ${userAddress}.`,
            content: { 
              success: true, 
              data: { transaction: null } 
            }
          });
          
          return true;
        }
        
        logger.debug(`Found transaction data: ${JSON.stringify(tx)}`);
        
        // Use dedicated formatting function for response text
        const responseText = formatTransactionResponse(tx, txHash, userAddress, chainId);
        
        logger.debug("Successfully formatted transaction response");
        callback({
          text: responseText,
          content: { 
            success: true, 
            data: { transaction: tx } 
          }
        });
        
        return true;
      } catch (error) {
        // Handle unexpected errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`GET_TRANSACTION_BY_HASH_DATAI error: ${errorMessage}`);
        
        if (error instanceof Error && error.stack) {
          logger.debug(`Error stack: ${error.stack}`);
        }
        
        if (callback) {
          callback({
            text: `Failed to retrieve transaction details: ${errorMessage}`,
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
            text: "Show me the details for transaction hash 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on Ethereum for wallet 0x218e312fF5181290A46e3f87A73A8aD40C05A944 on DATAI"
          }
        },
        {
          name: "{{name2}}",
          content: {
            text: "I'll look up the details for that transaction hash on Ethereum. One moment...",
            actions: ["GET_TRANSACTION_BY_HASH_DATAI"]
          }
        }
      ],
      [
        {
          name: "{{name1}}",
          content: {
            text: "What can you tell me about this transaction 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on eth chain for my address 0x218e312fF5181290A46e3f87A73A8aD40C05A944 on DATAI?"
          }
        },
        {
          name: "{{name2}}",
          content: {
            text: "Let me fetch the details of that transaction on Ethereum for you...",
            actions: ["GET_TRANSACTION_BY_HASH_DATAI"]
          }
        }
      ],
      [
        {
          name: "{{name1}}",
          content: {
            text: "Find transaction 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on the eth blockchain for wallet 0x218e312fF5181290A46e3f87A73A8aD40C05A944 on DATAI"
          }
        },
        {
          name: "{{name2}}",
          content: {
            text: "I'll retrieve the details for this Ethereum transaction. This will show the full transaction information including status, value, and token transfers...",
            actions: ["GET_TRANSACTION_BY_HASH_DATAI"]
          }
        }
      ]
    ] as ActionExample[][],
  };

/**
 * Format transaction details into a user-friendly message
 * 
 * @param tx - Transaction data from API
 * @param txHash - The transaction hash that was queried
 * @param userAddress - The wallet address that was queried
 * @param chainId - The blockchain chain ID that was queried
 * @returns Formatted response message
 */
function formatTransactionResponse(
  tx: TransactionHistoryItem,
  txHash: string,
  userAddress: string,
  chainId: string
): string {
  // Format response text
  let responseText = `Transaction details for hash ${txHash}:\n\n`;
  
  // Add transaction details
  const date = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : 'Unknown date';
  const txFeeEth = tx.txFee ? `${(tx.txFee / 1e18).toFixed(6)} ETH` : '';
  const txFeeUsd = tx.txFeeUsd ? `$${tx.txFeeUsd.toFixed(2)} USD` : 'N/A';
  const feeDisplay = txFeeEth ? `${txFeeEth} (${txFeeUsd})` : txFeeUsd;
  
  responseText += `Type: ${tx.txType || 'Unknown'}\n`;
  responseText += `Date: ${date}\n`;
  responseText += `Chain: ${tx.chain || chainId}\n`;
  responseText += `Block: ${tx.block || 'Unknown'}\n`;
  responseText += `Fee: ${feeDisplay}\n`;
  
  if (tx.from) {
    const fromAddress = tx.from === userAddress ? 'Your address' : tx.from;
    responseText += `From: ${fromAddress}\n`;
  }
  
  if (tx.to) {
    const toAddress = tx.to === userAddress ? 'Your address' : tx.to;
    responseText += `To: ${toAddress}\n`;
  }
  
  if (tx.txAction) {
    responseText += `Action: ${tx.txAction}\n`;
  }
  
  if (tx.contractName) {
    responseText += `Contract: ${tx.contractName}\n`;
  }
  
  if (tx.functionName) {
    responseText += `Function: ${tx.functionName}\n`;
  }
  
  if (tx.encodingFunction) {
    responseText += `Encoding: ${tx.encodingFunction}\n`;
  }
  
  if (tx.standard) {
    responseText += `Standard: ${tx.standard}\n`;
  }
  
  responseText += `Status: ${tx.successful ? 'Successful' : 'Failed'}\n`;
  
  if (tx.balances && tx.balances.length > 0) {
    responseText += "\nToken Balances:\n";
    for (const balance of tx.balances) {
      responseText += `- ${balance.tokenSymbol || 'Unknown token'}: ${balance.balance || 'N/A'} (${balance.balanceUSD ? `$${balance.balanceUSD.toFixed(2)}` : 'N/A'})\n`;
    }
  }
  
  return responseText;
}

/**
 * TEST DATA FOR THIS ACTION
 * 
 * ## 23. Get Transaction by Hash (Supports EVM and Solana)
 * 
 * Endpoint: https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/{chain}/{hash}/{userAddress}
 * 
 * Test Parameters Used (EVM):
 * - chain: eth
 * - hash: 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf
 * - userAddress: 0x218e312fF5181290A46e3f87A73A8aD40C05A944
 * 
 * Tested cURL Command (EVM):
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" \
 * "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944"
 * 
 * Also supports Solana transactions with the following format:
 * https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/solana/{solana_hash}/{solana_address}
 * 
 * Description: Get full transaction details for a specific transaction hash. Supports all chains 
 * compatible with Advanced Transactions, including EVM chains and Solana.
 * 
 * Path Parameters:
 * - chain (string, required): The chain ID of the transaction (e.g., eth, bsc, solana)
 * - hash (string, required): The transaction hash (hex string for EVM, base58 string for Solana)
 * - userAddress (string, required): The wallet address associated with the transaction context
 */
