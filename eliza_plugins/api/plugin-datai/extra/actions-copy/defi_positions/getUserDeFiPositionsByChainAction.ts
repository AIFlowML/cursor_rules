/**
 * Get User DeFi Positions By Chain Action
 * 
 * This action retrieves all DeFi information (active open positions) for a specific user on a specific chain.
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
import type { UserDeFiPositionByChain } from "../../types";


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
 * Validation function for getUserDeFiPositionsByChain params
 */
function validateGetUserDeFiPositionsByChainParams(params: { 
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
 * Action to retrieve a user's DeFi positions on a specific chain
 */
export const getUserDeFiPositionsByChainAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_DEFI_POSITIONS_BY_SINGLE_CHAIN_DATAI",
    "FETCH_SINGLE_CHAIN_POSITIONS_DATAI",
    "GET_DEFI_ACTIVITIES_BY_SINGLE_CHAIN_DATAI",
    "SHOW_SINGLE_CHAIN_DEFI_POSITIONS_DATAI",
    "LIST_DEFI_PROTOCOLS_BY_SINGLE_CHAIN_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves all DeFi information (active open positions) for a specific user on a specific chain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    if (!apiKey) {
      logger.error(`GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'Not found'}`);
    if (!userAddress) {
      logger.debug("GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    const chain = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chain || 'Not found'}`);
    if (!chain) {
      logger.debug("GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI validation failed: No chain ID found in message");
      return false;
    }
    
    logger.debug(`Validating parameters: userAddress=${userAddress}, chain=${chain}`);
    const validation = validateGetUserDeFiPositionsByChainParams({ userAddress, chain });
    if (!validation.isValid) {
      logger.error(`GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI validation failed: ${validation.error}`);
      return false;
    }
    
    logger.debug("GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI validation successful");
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
    logger.info("Executing GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI action");
    
    try {
      // Extract parameters
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chain = extractChainId(message.content?.text || '');
      
      logger.debug(`Extracted parameters: userAddress=${userAddress}, chain=${chain}`);
      
      if (!userAddress || !chain || !callback) {
        // We need a wallet address, chain, and callback to proceed
        logger.error(`Missing required parameter(s): userAddress=${!!userAddress}, chain=${!!chain}, callback=${!!callback}`);
        
        if (callback) {
          callback({
            text: 'Please provide both a valid wallet address and chain ID to check DeFi positions.',
            content: { 
              success: false, 
              error: 'Missing required parameters' 
            }
          });
        } else {
          logger.error('GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI: No callback provided');
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
      const endpoint = ENDPOINTS.GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI
        .replace('{userAddress}', userAddress)
        .replace('{chain}', chain);
      
      logger.info(`Fetching DeFi positions for ${userAddress} on chain: ${chain}`);
      logger.debug(`API endpoint: ${endpoint}`);
      
      const response = await apiClient.get<UserDeFiPositionByChain[]>(endpoint);
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
          text: `Error fetching DeFi positions: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const positions = response.data;
      logger.debug(`Received ${positions?.length || 0} DeFi positions`);
      
      if (!positions || positions.length === 0) {
        logger.info(`No DeFi positions found for ${userAddress} on chain ${chain}`);
        callback({
          text: `No DeFi positions found for address ${userAddress} on chain ${chain.toUpperCase()}.`,
          content: { 
            success: true, 
            data: { positions: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function for response text
      const responseText = formatDeFiPositionsByChainResponse(positions, userAddress, chain);
      
      logger.info(`Successfully processed DeFi positions for ${userAddress} on chain ${chain}`);
      
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { 
            positions,
            summary: {
              totalSupplyUSD: calculateTotalSupplyUSD(positions),
              totalDebtUSD: calculateTotalDebtUSD(positions), 
              totalNavUSD: calculateTotalNavUSD(positions),
              protocolCount: positions.length
            }
          } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve DeFi positions: ${errorMessage}`,
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
          text: "What single chain DeFi positions do I have on Arbitrum with wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check your DeFi positions on Arbitrum for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me all my DeFi investments on arb chain for address 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving your DeFi positions on Arbitrum chain...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What protocols am I using on Arbitrum? My wallet is 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check which DeFi protocols you're using on Arbitrum...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Calculate total supply USD value from positions
 * 
 * @param positions - DeFi positions data from API
 * @returns Total supply USD value
 */
function calculateTotalSupplyUSD(positions: UserDeFiPositionByChain[]): number {
  let totalSupplyUSD = 0;
  
  for (const position of positions) {
    if (position.portfolio && position.portfolio.length > 0) {
      for (const portfolioItem of position.portfolio) {
        if (portfolioItem.total) {
          totalSupplyUSD += portfolioItem.total.supplyUSD || 0;
        }
      }
    }
  }
  
  return totalSupplyUSD;
}

/**
 * Calculate total debt USD value from positions
 * 
 * @param positions - DeFi positions data from API
 * @returns Total debt USD value
 */
function calculateTotalDebtUSD(positions: UserDeFiPositionByChain[]): number {
  let totalDebtUSD = 0;
  
  for (const position of positions) {
    if (position.portfolio && position.portfolio.length > 0) {
      for (const portfolioItem of position.portfolio) {
        if (portfolioItem.total) {
          totalDebtUSD += portfolioItem.total.debtUSD || 0;
        }
      }
    }
  }
  
  return totalDebtUSD;
}

/**
 * Calculate total NAV USD value from positions
 * 
 * @param positions - DeFi positions data from API
 * @returns Total NAV USD value
 */
function calculateTotalNavUSD(positions: UserDeFiPositionByChain[]): number {
  let totalNavUSD = 0;
  
  for (const position of positions) {
    if (position.portfolio && position.portfolio.length > 0) {
      for (const portfolioItem of position.portfolio) {
        if (portfolioItem.total) {
          totalNavUSD += portfolioItem.total.navUSD || 0;
        }
      }
    }
  }
  
  return totalNavUSD;
}

/**
 * Format DeFi positions by chain response into a user-friendly message
 * 
 * @param positions - DeFi positions data from API
 * @param userAddress - The wallet address that was queried
 * @param chain - The chain ID that was queried
 * @returns Formatted response message
 */
function formatDeFiPositionsByChainResponse(
  positions: UserDeFiPositionByChain[], 
  userAddress: string,
  chain: string
): string {
  // Format response text
  let responseText = `DeFi Positions for ${userAddress} on ${chain.toUpperCase()}:\n\n`;
  
  // Calculate total values
  let totalSupplyUSD = 0;
  let totalDebtUSD = 0;
  let totalNavUSD = 0;
  
  // Process positions by protocol
  for (const [index, position] of positions.entries()) {
    // Use name as the type definition doesn't include commonName
    responseText += `${index + 1}. Protocol: ${position.name}\n`;
    responseText += `   Website: ${position.site}\n`;
    
    // Process portfolio details
    if (position.portfolio && position.portfolio.length > 0) {
      for (const portfolioItem of position.portfolio) {
        // Note: module is not in the type definition, so we'll skip it for now
        
        if (portfolioItem.total) {
          const supplyUSD = portfolioItem.total.supplyUSD || 0;
          const debtUSD = portfolioItem.total.debtUSD || 0;
          const navUSD = portfolioItem.total.navUSD || 0;
          
          responseText += `   Supply Value: $${supplyUSD.toFixed(2)}\n`;
          responseText += `   Debt Value: $${debtUSD.toFixed(2)}\n`;
          responseText += `   Net Value: $${navUSD.toFixed(2)}\n`;
          
          // Add to totals
          totalSupplyUSD += supplyUSD;
          totalDebtUSD += debtUSD;
          totalNavUSD += navUSD;
        }
        
        // Show supply tokens (limited to 5 for readability)
        if (portfolioItem.detailed?.supply && portfolioItem.detailed.supply.length > 0) {
          responseText += "   Supply Tokens:\n";
          const supplyTokens = portfolioItem.detailed.supply.slice(0, 5);
          for (const token of supplyTokens) {
            if (token.tokenSymbol && token.balance !== undefined) {
              // Calculate decimal amount from balance and decimals
              const decimals = token.tokenDecimals || 0;
              const amount = decimals > 0 ? token.balance / (10 ** decimals) : token.balance;
              const formattedAmount = amount.toFixed(6);
              const value = token.balanceUSD ? Number(token.balanceUSD).toFixed(2) : "0.00";
              responseText += `     • ${formattedAmount} ${token.tokenSymbol} ($${value})\n`;
              responseText += `       Token Address: ${token.tokenAddress}\n`;
            }
          }
          
          if (portfolioItem.detailed.supply.length > 5) {
            responseText += `     • ...and ${portfolioItem.detailed.supply.length - 5} more tokens\n`;
          }
        }
        
        // Show reward tokens if available
        if (portfolioItem.detailed?.rewards && portfolioItem.detailed.rewards.length > 0) {
          responseText += "   Reward Tokens:\n";
          const rewardTokens = portfolioItem.detailed.rewards.slice(0, 5);
          for (const token of rewardTokens) {
            if (token.tokenSymbol && token.balance !== undefined) {
              // Calculate decimal amount from balance and decimals
              const decimals = token.tokenDecimals || 0;
              const amount = decimals > 0 ? token.balance / (10 ** decimals) : token.balance;
              const formattedAmount = amount.toFixed(6);
              const value = token.balanceUSD ? Number(token.balanceUSD).toFixed(2) : "0.00";
              responseText += `     • ${formattedAmount} ${token.tokenSymbol} ($${value})\n`;
              responseText += `       Token Address: ${token.tokenAddress}\n`;
            }
          }
          
          if (portfolioItem.detailed.rewards.length > 5) {
            responseText += `     • ...and ${portfolioItem.detailed.rewards.length - 5} more reward tokens\n`;
          }
        }
        
        // Show borrow tokens (limited to 5 for readability)
        if (portfolioItem.detailed?.borrow && portfolioItem.detailed.borrow.length > 0) {
          responseText += "   Borrow Tokens:\n";
          const borrowTokens = portfolioItem.detailed.borrow.slice(0, 5);
          for (const token of borrowTokens) {
            if (token.tokenSymbol && token.balance !== undefined) {
              // Calculate decimal amount from balance and decimals
              const decimals = token.tokenDecimals || 0;
              const amount = decimals > 0 ? token.balance / (10 ** decimals) : token.balance;
              const formattedAmount = amount.toFixed(6);
              const value = token.balanceUSD ? Number(token.balanceUSD).toFixed(2) : "0.00";
              responseText += `     • ${formattedAmount} ${token.tokenSymbol} ($${value})\n`;
              responseText += `       Token Address: ${token.tokenAddress}\n`;
            }
          }
          
          if (portfolioItem.detailed.borrow.length > 5) {
            responseText += `     • ...and ${portfolioItem.detailed.borrow.length - 5} more tokens\n`;
          }
        }
        
        responseText += '\n';
      }
    }
    
    responseText += "-------------------\n\n";
  }
  
  // Add summary
  responseText += `Overall Summary on ${chain.toUpperCase()}:\n`;
  responseText += `Total Supply Value: $${totalSupplyUSD.toFixed(2)}\n`;
  responseText += `Total Debt Value: $${totalDebtUSD.toFixed(2)}\n`;
  responseText += `Total Net Value: $${totalNavUSD.toFixed(2)}\n`;
  responseText += `Protocol Count: ${positions.length}\n`;
  
  return responseText;
}

/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 2. Get User DeFi Positions by Chain
 * 
 * **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/{userAddress}?chain={chain}`
 * 
 * **cURL to run (Generic):**
 * ```bash
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/{userAddress}?chain={chain}"
 * ```
 * *(Replace `{userAddress}` with the actual user's wallet address, and `{chain}` with the desired chain ID. Refer to `api_help.md` (Entry #7) for working examples like `userAddress=0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`, `chain=arb`)*
 * 
 * **Test Parameters Used:**
 * *   `userAddress`: `0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`
 * *   `chain`: `arb`
 * 
 * **Tested cURL Command:**
 * ```bash
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=arb" | cat
 * ```
 * **Notes from cURL Testing:**
 * *   The API call with the specified parameters was **successful** and returned DeFi position data for the user on the Arbitrum chain.
 * 
 * **Essential Information:**
 * *   **Description:** Get all DeFi information (active open positions) for a specific user and a specific chain.
 * *   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
 * *   **Method:** `GET`
 * *   **Path Parameters:**
 *     *   `userAddress` (string, required): The wallet address of the user.
 * *   **Query Parameters:**
 *     *   `chain` (string, required): The chain ID to filter by (e.g., `eth`, `bsc`, `matic`).
 * *   **Response:** Returns a JSON array of protocol objects specific to the queried chain. Each object includes chain, protocol name, logo, site, and portfolio details (supply, borrow, rewards, NAV, P&L, poolData, etc.). (See original documentation for full response schema).
 * 
 * **Suggested Action Name:** `GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI`
 * **Corresponding .ts File:** `getUserDeFiPositionsByChainAction.ts`
 * 
 * # Action: GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI
 * run_curl_test "GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=arb\" | cat"
 */
