/**
 * Get User DeFi Positions By Multiple Chains Action
 * 
 * This action retrieves all DeFi information (active open positions) for a specific user across multiple specified chains.
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
import { extractWalletAddress, extractMultipleChainIds } from "../../utils/validation";
import { API_CONFIG, ENDPOINTS } from "../../constants";
import type { UserDeFiPosition } from "../../types";

// Actual API response structure (differs from type definition)
interface ActualDeFiPortfolioItem {
  total: {
    supplyUSD: number;
    debtUSD: number;
    navUSD: number;
    active: boolean;
  };
  detailed: {
    supply?: Array<{
      tokenSymbol: string;
      balance: number;
      balanceUSD: number;
      tokenAddress: string;
      tokenDecimals: number;
      tokenName: string;
    }>;
    borrow?: Array<{
      tokenSymbol: string;
      balance: number;
      balanceUSD: number;
      tokenAddress: string;
      tokenDecimals: number;
      tokenName: string;
    }>;
    rewards?: Array<{
      tokenSymbol: string;
      balance: number;
      balanceUSD: number;
      tokenAddress: string;
      tokenDecimals: number;
      tokenName: string;
    }>;
  };
  module?: string;
}

interface ActualUserDeFiPosition {
  chain: string;
  name: string;
  commonName?: string;
  logo: string;
  site: string;
  portfolio: ActualDeFiPortfolioItem[];
}


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
 * Validation function for GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI params
 */
function validateGetUserDeFiPositionsByMultipleChainsParams(params: { 
  userAddress: string;
  chains: string[];
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!params.chains || params.chains.length === 0) {
    return { isValid: false, error: "Missing required parameter: chains" };
  }

  if (params.chains.length > 10) {
    return { isValid: false, error: "Maximum 10 chains can be specified" };
  }

  return { isValid: true };
}

/**
 * Action to retrieve a user's DeFi positions across multiple chains
 */
export const getUserDeFiPositionsByMultipleChainsAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI",
    "FETCH_MULTI_CHAIN_DEFI_POSITIONS",
    "GET_DEFI_ACTIVITIES_ACROSS_CHAINS",
    "SHOW_MULTI_CHAIN_DEFI_POSITIONS",
    "LIST_DEFI_PROTOCOLS_ACROSS_CHAINS"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves all DeFi information (active open positions) for a specific user across multiple specified chains",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content?.text || '')}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug("Attempting to extract multiple chain IDs from message");
    const chains = extractMultipleChainIds(message.content?.text || '');
    logger.debug(`Extracted chain IDs: ${chains ? chains.join(', ') : 'None'}`);
    
    if (!chains || chains.length === 0) {
      logger.debug("GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI validation failed: No chain IDs found in message");
      return false;
    }
    
    logger.debug(`Validating parameters: userAddress=${userAddress}, chains=${chains.join(',')}`);
    const validation = validateGetUserDeFiPositionsByMultipleChainsParams({ userAddress, chains });
    if (!validation.isValid) {
      logger.error(`GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI validation failed: ${validation.error}`);
      return false;
    }
    
    logger.debug(`GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI validation successful for wallet ${userAddress} on chains ${chains.join(',')}`);
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
    logger.info("Executing GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI action");
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chains = extractMultipleChainIds(message.content?.text || '');
      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, chains: ${chains ? chains.join(',') : 'None'}`);
      
      if (!userAddress || !chains || chains.length === 0 || !callback) {
        // We need a wallet address, chains array, and callback to proceed
        logger.error(`Missing required parameters - userAddress: ${!!userAddress}, chains: ${!!chains && chains.length > 0}, callback: ${!!callback}`);
        
        if (callback) {
          logger.debug("Returning error response: Missing required parameters");
          callback({
            text: 'Please provide both a valid wallet address and at least one chain ID to check DeFi positions.',
            content: { 
              success: false, 
              error: 'Missing required parameters' 
            }
          });
        } else {
          logger.error('GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI: No callback provided');
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
      
      // Join chains with commas for the API
      const chainParam = chains.join(',');
      logger.debug(`Chain parameter for API: ${chainParam}`);
      
      // Call API - substitute the userAddress value into the endpoint and add chains as query parameter
      const endpoint = `${ENDPOINTS.GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI
        .replace('{userAddress}', userAddress)}?chains=${chainParam}`;
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching DeFi positions for ${userAddress} across chains: ${chainParam}`);
      logger.debug(`Making API request to endpoint: ${endpoint}`);
      const response = await apiClient.get<UserDeFiPosition[]>(endpoint);
      logger.debug(`API response received: ${JSON.stringify(response)}`);
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
      logger.debug(`Retrieved ${positions?.length || 0} DeFi positions`);
      
      if (!positions || positions.length === 0) {
        logger.debug(`No DeFi positions found for address ${userAddress} across chains: ${chainParam}`);
        callback({
          text: `No DeFi positions found for address ${userAddress} across the specified chains.`,
          content: { 
            success: true, 
            data: { positions: [] } 
          }
        });
        
        return true;
      }
      
      // Calculate data and format response
      logger.debug("Processing position data and formatting response");
      const { responseText, totalSupplyUSD, totalDebtUSD, totalNavUSD, chainTotals } = 
        formatMultipleChainDeFiPositionsResponse(positions, userAddress, chains);
      
      logger.debug("Sending successful response");
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { 
            positions,
            summary: {
              totalSupplyUSD,
              totalDebtUSD, 
              totalNavUSD,
              chainTotals
            }
          } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI error: ${errorMessage}`);
      
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
          text: "What multi chain DeFi positions does wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 have on Avalanche and Arbitrum on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check the DeFi positions across both Avalanche and Arbitrum chains...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me multi chain DeFi investments for 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on avax and arb chains on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch DeFi positions across Avalanche and Arbitrum chains...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Compare multi chain DeFi protocols for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on avax,arb on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving DeFi protocol usage across both chains for this address...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format DeFi positions from multiple chains into a user-friendly message
 * 
 * @param positions - DeFi positions data from API
 * @param userAddress - The wallet address that was queried
 * @param chains - The chain IDs that were queried
 * @returns Formatted response text and calculated totals
 */
function formatMultipleChainDeFiPositionsResponse(
  positions: UserDeFiPosition[], 
  userAddress: string,
  chains: string[]
): { 
  responseText: string; 
  totalSupplyUSD: number; 
  totalDebtUSD: number; 
  totalNavUSD: number;
  chainTotals: { [chainId: string]: { supply: number; debt: number; nav: number } };
} {
  // Format response text
  let responseText = `DeFi Positions for ${userAddress} across ${chains.map((c: string) => c.toUpperCase()).join(', ')}:\n\n`;
  
  // Calculate total values per chain and overall
  const chainTotals: { [chainId: string]: { supply: number, debt: number, nav: number } } = {};
  let totalSupplyUSD = 0;
  let totalDebtUSD = 0;
  let totalNavUSD = 0;
  
  // Group positions by chain
  const positionsByChain: { [chainId: string]: UserDeFiPosition[] } = {};
  
  for (const position of positions) {
    if (!positionsByChain[position.chain]) {
      positionsByChain[position.chain] = [];
      chainTotals[position.chain] = { supply: 0, debt: 0, nav: 0 };
    }
    
    // Safe access after the null check
    const chainPositions = positionsByChain[position.chain];
    if (chainPositions) {
      chainPositions.push(position);
    }
    
    // Calculate totals for this position
    if (position.portfolio && position.portfolio.length > 0) {
      for (const portfolioItem of position.portfolio) {
        // Use 'total' property from actual API response instead of 'statistic' from type definition
        const total = (portfolioItem as unknown as ActualDeFiPortfolioItem).total;
        if (total) {
          const supplyUSD = total.supplyUSD || 0;
          const debtUSD = total.debtUSD || 0;
          const navUSD = total.navUSD || 0;
          
          // Safe access after the null check
          const chainTotal = chainTotals[position.chain];
          if (chainTotal) {
            // Add to chain totals
            chainTotal.supply += supplyUSD;
            chainTotal.debt += debtUSD;
            chainTotal.nav += navUSD;
          }
          
          // Add to overall totals
          totalSupplyUSD += supplyUSD;
          totalDebtUSD += debtUSD;
          totalNavUSD += navUSD;
        }
      }
    }
  }
  
  // Display positions by chain
  for (const [chainId, chainPositions] of Object.entries(positionsByChain)) {
    responseText += `Chain: ${chainId.toUpperCase()}\n`;
    
    // Safe access to chain totals
    const chainTotal = chainTotals[chainId];
    if (chainTotal) {
      responseText += `Total Supply: $${chainTotal.supply.toFixed(2)}\n`;
      responseText += `Total Debt: $${chainTotal.debt.toFixed(2)}\n`;
      responseText += `Total NAV: $${chainTotal.nav.toFixed(2)}\n\n`;
    }
    
    // Show protocols for this chain
    for (const position of chainPositions) {
      responseText += `  Protocol: ${position.name}\n`;
      
      // Show portfolio details (limited to conserve response size)
      if (position.portfolio && position.portfolio.length > 0) {
        // Just show supply/borrow counts to keep response concise
        // Use 'detailed' property from actual API response instead of 'detail' from type definition
        const supplyTokenCount = position.portfolio.reduce((count, p) => 
          count + ((p as unknown as ActualDeFiPortfolioItem).detailed?.supply?.length || 0), 0);
        
        const borrowTokenCount = position.portfolio.reduce((count, p) => 
          count + ((p as unknown as ActualDeFiPortfolioItem).detailed?.borrow?.length || 0), 0);
          
        if (supplyTokenCount > 0) {
          responseText += `    Supply: ${supplyTokenCount} token(s)\n`;
        }
        
        if (borrowTokenCount > 0) {
          responseText += `    Borrow: ${borrowTokenCount} token(s)\n`;
        }
      }
      
      responseText += '\n';
    }
    
    responseText += "-------------------\n\n";
  }
  
  // Add overall summary
  responseText += "Overall Summary:\n";
  responseText += `Total Supply Value: $${totalSupplyUSD.toFixed(2)}\n`;
  responseText += `Total Debt Value: $${totalDebtUSD.toFixed(2)}\n`;
  responseText += `Total Net Value: $${totalNavUSD.toFixed(2)}\n`;
  
  return { responseText, totalSupplyUSD, totalDebtUSD, totalNavUSD, chainTotals };
}

/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 3. Get User DeFi Positions by Multiple Chains
 * 
 * **Endpoint:** `https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsByChains/{userAddress}?chains={chain1,chain2,...,chain10}`
 * 
 * **Test Parameters Used:**
 * - userAddress: 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50
 * - chains: avax,arb
 * 
 * **Tested cURL Command:**
 * curl -X GET -H "Authorization: GET_YOUR_DATAI_API" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsByChains/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chains=avax,arb" | cat
 * 
 * **Notes from cURL Testing:**
 * - The API call with the specified parameters was successful and returned DeFi position data for the user on the Avalanche and Arbitrum chains.
 * 
 * **Essential Information:**
 * - Description: Get all DeFi historical information (active open positions) for a specific user across multiple specified chains (up to 10).
 * - API Key: Pass the API key in the Authorization header.
 * - Method: GET
 * - Path Parameters:
 *   - userAddress (string, required): The wallet address of the user.
 * - Query Parameters:
 *   - chains (string, required): A comma-separated list of chain IDs (e.g., eth,bsc,matic). Supports up to 10 chains.
 * - Response: Returns a JSON array of protocol objects, aggregated from the specified chains.
 */

