/**
 * Get Token Balances By Chain Action
 * 
 * This action retrieves a user's wallet balances for all tokens, including the native token,
 * on a specific chain with detailed information for each token including price and fiat values.
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
import { extractWalletAddress, extractChainId } from "../../utils/validation";
import { API_CONFIG, ENDPOINTS } from "../../constants";
import type { TokenBalanceWithPrice } from "../../types";

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
 * Validation function for getTokenBalancesByChain params
 */
function validateGetTokenBalancesByChainParams(params: { 
  userAddress: string;
  chain: string;
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!params.chain) {
    return { isValid: false, error: "Missing required parameter: chain" };
  }

  return { isValid: true };
}

/**
 * Action to retrieve a user's token balances for a specific chain
 */
export const getTokenBalancesByChainAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI",
    "FETCH_SINGLE_CHAIN_TOKEN_BALANCES_DATAI",
    "LIST_ALL_TOKENS_ON_SINGLE_CHAIN_DATAI",
    "SHOW_ALL_MY_TOKENS_ON_SINGLE_CHAIN_DATAI",
    "WHAT_TOKENS_DO_I_HAVE_ON_SINGLE_CHAIN_DATAI",
    "LIST_MY_TOKEN_ASSETS_ON_SINGLE_CHAIN_WITH_PRICES_DATAI",
    "SHOW_TOKEN_PRICES_FOR_SINGLE_CHAIN_DATAI",
    "CHECK_TOKEN_VALUES_ON_SINGLE_CHAIN_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves all individual token balances (including native token) for a user\'s wallet on a specific chain, with detailed price information for each token",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    if (!apiKey) {
      logger.error(`GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const messageText = message.content?.text?.toLowerCase() || '';

    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(messageText);
    logger.debug(`Extracted wallet address: ${userAddress || 'null'}`);
    if (!userAddress) {
      logger.debug("GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug("Attempting to extract chain ID from message");
    const chain = extractChainId(messageText);
    logger.debug(`Extracted chain ID: ${chain || 'null'}`);
    if (!chain) {
      logger.debug("GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI validation failed: No chain ID found in message");
      return false;
    }
    
    // MODIFICATION START: Add keyword check for stronger matching
    const keywords = ['tokens', 'all tokens', 'token list', 'list my tokens balance', 'assets', 'prices', 'balances for all tokens in chain', 'token values'];
    const hasKeyword = keywords.some(keyword => messageText.includes(keyword));

    if (!hasKeyword) {
      logger.debug("GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI validation failed: Message does not contain specific keywords for listing all token balances (e.g., 'tokens', 'all tokens', 'assets', 'prices').");
      return false;
    }
    // MODIFICATION END: Add keyword check

    logger.debug(`Validating parameters: userAddress=${userAddress}, chain=${chain}`);
    const validation = validateGetTokenBalancesByChainParams({ userAddress, chain });
    if (!validation.isValid) {
      logger.error(`GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI validation failed: ${validation.error}`);
      return false;
    }
    
    logger.debug("GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI validation successful with keyword match.");
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
    logger.info("Executing GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI action");
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chain = extractChainId(message.content?.text || '');
      logger.debug(`Extracted parameters: userAddress=${userAddress}, chain=${chain}`);
      
      if (!userAddress || !chain || !callback) {
        // We need a wallet address, chain ID, and callback to proceed
        logger.error(`Missing required parameters: userAddress=${!!userAddress}, chain=${!!chain}, callback=${!!callback}`);
        if (callback) {
          callback({
            text: 'Please provide both a valid wallet address and chain ID to check token balances.',
            content: { 
              success: false, 
              error: 'Missing required parameters' 
            }
          });
        } else {
          logger.error('GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI: No callback provided');
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
      
      // Call API - substitute the userAddress and chain values into the endpoint
      const endpoint = ENDPOINTS.GET_TOKEN_BALANCES_BY_CHAIN_DATAI
        .replace('{userAddress}', userAddress)
        .replace('{chain}', chain);
      
      logger.info(`Fetching token balances for ${userAddress} on chain ${chain}`);
      logger.debug(`API endpoint: ${endpoint}`);

      const response = await apiClient.get<TokenBalanceWithPrice[]>(endpoint);
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
          text: `Error fetching token balances: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const tokenBalances = response.data;
      logger.debug(`Received ${tokenBalances?.length || 0} token balances`);
      
      if (!tokenBalances || tokenBalances.length === 0) {
        logger.info(`No token balances found for address ${userAddress} on chain ${chain}`);
        callback({
          text: `No token balances found for address ${userAddress} on chain ${chain}.`,
          content: { 
            success: true, 
            data: { tokens: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function
      logger.debug("Formatting response using dedicated function");
      const responseText = formatTokenBalancesByChainResponse(tokenBalances, userAddress, chain);
      
      logger.info("Successfully processed token balances, sending response");
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { tokens: tokenBalances } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve token balances: ${errorMessage}`,
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
          text: "List my tokens balance and their prices on Base chain for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI ?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check your token balances and their values on Base chain...",
          actions: ["GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me all tokens for 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on base on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch your token values on Base...",
          actions: ["GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get detailed token balances on base for 0x3764D79db51726E900a1380055F469eB6e2a7fD3 including prices on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving detailed token balances for this address on Base chain, including current prices...",
          actions: ["GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format token balances by chain into a user-friendly message
 * 
 * @param tokenBalances - Array of token balance items with price information
 * @param userAddress - The wallet address that was queried
 * @param chain - The blockchain chain ID that was queried
 * @returns Formatted response message
 */
function formatTokenBalancesByChainResponse(
  tokenBalances: TokenBalanceWithPrice[],
  userAddress: string,
  chain: string
): string {
  let responseText = `Token Balances for ${userAddress} on ${chain.toUpperCase()}:\n\n`;
  
  // Calculate total value
  const totalValueUsd = tokenBalances.reduce((total, token) => {
    const tokenValue = token.balance / (10 ** token.decimals) * token.price;
    return total + (Number.isNaN(tokenValue) ? 0 : tokenValue);
  }, 0);
  
  responseText += `Total Value: $${totalValueUsd.toFixed(2)}\n\n`;
  
  // Sort tokens by USD value (descending)
  const sortedTokens = [...tokenBalances].sort((a, b) => {
    const aValue = (a.balance / (10 ** a.decimals)) * a.price;
    const bValue = (b.balance / (10 ** b.decimals)) * b.price;
    return bValue - aValue;
  });
  
  // Add individual token balances
  for (const token of sortedTokens) {
    const tokenAmount = token.balance / (10 ** token.decimals);
    const tokenValue = tokenAmount * token.price;
    
    if (tokenAmount > 0) {
      responseText += `- ${token.name} (${token.symbol}):\n`;
      responseText += `  Amount: ${tokenAmount.toFixed(token.decimals > 6 ? 6 : token.decimals)}\n`;
      
      if (!Number.isNaN(tokenValue) && tokenValue > 0) {
        responseText += `  Value: $${tokenValue.toFixed(2)}\n`;
        
        // Add 24h change if available
        if (token.priceChange24h) {
          const changeSymbol = token.priceChange24h >= 0 ? '↑' : '↓';
          const changeAbs = Math.abs(token.priceChange24h).toFixed(2);
          responseText += `  24h: ${changeSymbol} ${changeAbs}%\n`;
        }
      }
      
      responseText += '\n';
    }
  }
  
  return responseText;
}

/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 10. Get User Token Balances by Chain (Including Native)
 * 
 * **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/token/{userAddress}?chain={chain}`
 * 
 * **Test Parameters Used:**
 * - `userAddress`: `0x3764D79db51726E900a1380055F469eB6e2a7fD3`
 * - `chain`: `base`
 * 
 * **Tested cURL Command:**
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" 
 * "https://api-v1.mymerlin.io/api/merlin/public/balances/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=base"
 * 
 * **Essential Information:**
 * - Description: Get the user's wallet balances for all tokens, including the native token, on a specific chain. 
 *   Provides detailed information for each token including price and fiat values.
 * - Path Parameters:
 *   - `userAddress` (string, required): The wallet address of the user.
 * - Query Parameters:
 *   - `chain` (string, required): The chain ID (e.g., `eth`, `base`).
 * - Response: Returns a JSON array of token objects including token_address, name, symbol, logo, decimals, 
 *   balance, price, and prices object with various fiat currency denominations.
 */
