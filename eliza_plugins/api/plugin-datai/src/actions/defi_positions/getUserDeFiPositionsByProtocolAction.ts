/**
 * Get User DeFi Positions By Protocol Action
 * 
 * This action retrieves all DeFi information (active open positions) for a specific user in a specific protocol.
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
import type { UserDeFiPosition } from "../../types";

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
 * Validation function for GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI params
 */
function validateGetUserDeFiPositionsByProtocolParams(params: { 
  userAddress: string;
  protocol: string;
  chain?: string;
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!params.protocol) {
    return { isValid: false, error: "Missing required parameter: protocol" };
  }

  return { isValid: true };
}

/**
 * Extract protocol name from message text
 */
function extractProtocolName(text: string): string | null {
  logger.debug(`Attempting to extract protocol name from: ${text}`);
  
  // Look for common protocol extraction patterns
  const protocolPatterns = [
    /on (\w+) protocol/i,
    /in (\w+) protocol/i,
    /for (\w+) protocol/i,
    /at (\w+) protocol/i,
    /protocol (\w+)/i,
    /for (\w+)/i,
    /in (\w+)/i,
    /(\w+_\w+)/i, // Support for protocol IDs like avax_gmx
  ];

  for (const pattern of protocolPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      logger.debug(`Found protocol match: ${match[1].toLowerCase()}`);
      return match[1].toLowerCase();
    }
  }

  logger.debug("No protocol name found in text");
  return null;
}

/**
 * Extract and count protocol names from message text
 */
function extractProtocolNumbers(text: string): number {
  logger.debug(`Counting protocols in text: ${text}`);
  
  const protocolPatterns = [
    /on (\w+) protocol/gi,
    /in (\w+) protocol/gi,
    /for (\w+) protocol/gi,
    /at (\w+) protocol/gi,
    /protocol (\w+)/gi,
    /(\w+_\w+)/gi, // Support for protocol IDs like avax_gmx
  ];

  const foundProtocols = new Set<string>();
  
  for (const pattern of protocolPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        foundProtocols.add(match[1].toLowerCase());
      }
    }
  }

  const count = foundProtocols.size;
  logger.debug(`Found ${count} unique protocols: ${Array.from(foundProtocols).join(', ')}`);
  return count;
}

/**
 * Check if text contains "single protocol" keywords
 */
function containsSingleProtocolKeywords(text: string): boolean {
  const singleProtocolKeywords = [
    /single protocol/i,
    /one protocol/i,
    /specific protocol/i,
    /individual protocol/i,
    /particular protocol/i,
  ];

  for (const pattern of singleProtocolKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found single protocol keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

/**
 * Action to retrieve a user's DeFi positions in a specific protocol
 */
export const getUserDeFiPositionsByProtocolAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI",
    "FETCH_PROTOCOL_POSITIONS",
    "GET_DEFI_ACTIVITIES_IN_PROTOCOL",
    "SHOW_PROTOCOL_POSITIONS",
    "LIST_PROTOCOL_POSITIONS"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves all DeFi information (active open positions) for a specific user in a specific protocol",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content?.text || '')}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug("Attempting to extract protocol name from message");
    const protocol = extractProtocolName(message.content?.text || '');
    logger.debug(`Extracted protocol: ${protocol || 'None'}`);
    
    if (!protocol) {
      logger.debug("GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI validation failed: No protocol name found in message");
      return false;
    }
    
    // Check for single protocol validation to prevent race conditions
    logger.debug("Checking for single protocol validation");
    const protocolCount = extractProtocolNumbers(message.content?.text || '');
    const hasSingleProtocolKeywords = containsSingleProtocolKeywords(message.content?.text || '');
    
    logger.debug(`Protocol count: ${protocolCount}, Has single protocol keywords: ${hasSingleProtocolKeywords}`);
    
    // Validate that we have exactly one protocol and either single protocol keywords or exactly one protocol mentioned
    if (protocolCount !== 1 && !hasSingleProtocolKeywords) {
      logger.debug(`GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI validation failed: Multiple protocols detected (${protocolCount}) without single protocol keywords`);
      return false;
    }
    
    if (protocolCount > 1 && !hasSingleProtocolKeywords) {
      logger.debug(`GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI validation failed: Multiple protocols detected (${protocolCount}) - this action is for single protocol only`);
      return false;
    }
    
    // Chain is optional in validation but will be needed for the API call
    logger.debug("Attempting to extract chain ID from message");
    const chain = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chain || 'None'}`);
    
    logger.debug(`Validating parameters: userAddress=${userAddress}, protocol=${protocol}, chain=${chain || 'Not specified'}`);
    const validation = validateGetUserDeFiPositionsByProtocolParams({ 
      userAddress, 
      protocol,
      chain: chain || undefined 
    });
    
    if (!validation.isValid) {
      logger.error(`GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI validation failed: ${validation.error}`);
      return false;
    }
    
    logger.debug(`GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI validation successful for wallet ${userAddress} on protocol ${protocol}`);
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
    logger.info("Executing GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI action");
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      const protocol = extractProtocolName(message.content?.text || '');
      const chain = extractChainId(message.content?.text || '');
      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, protocol: ${protocol || 'None'}, chain: ${chain || 'None'}`);
      
      if (!userAddress || !protocol || !callback) {
        // We need a wallet address, protocol, and callback to proceed
        logger.error(`Missing required parameters - userAddress: ${!!userAddress}, protocol: ${!!protocol}, callback: ${!!callback}`);
        
        if (callback) {
          logger.debug("Returning error response: Missing required parameters");
          callback({
            text: 'Please provide both a valid wallet address and protocol name to check DeFi positions.',
            content: { 
              success: false, 
              error: 'Missing required parameters' 
            }
          });
        } else {
          logger.error('GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI: No callback provided');
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
      
      // Call API - substitute the userAddress and protocol values into the endpoint
      let endpoint = ENDPOINTS.GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI
        .replace('{userAddress}', userAddress);
      
      // Add chain parameter if available
      if (chain) {
        endpoint += `?chain=${chain}&protocol=${protocol}`;
      } else {
        endpoint += `?protocol=${protocol}`;
      }
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching DeFi positions for ${userAddress} in protocol: ${protocol}${chain ? ` on chain: ${chain}` : ''}`);
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
        logger.debug(`No DeFi positions found for address ${userAddress} in protocol ${protocol}`);
        callback({
          text: `No DeFi positions found for address ${userAddress} in protocol ${protocol}.`,
          content: { 
            success: true, 
            data: { positions: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function for response
      logger.debug("Using dedicated formatting function for response");
      const { responseText, totalSupplyUSD, totalDebtUSD, totalNavUSD } = 
        formatProtocolDeFiPositionsResponse(positions, userAddress, protocol);
      
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
              totalNavUSD
            }
          } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI error: ${errorMessage}`);
      
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
          text: "What single protocol DeFi positions does wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 have in avax_gmx protocol on Avalanche on DATAI ?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check the positions in the avax_gmx protocol on Avalanche...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me GMX investments for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on avax chain on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Checking the avax_gmx protocol positions for this wallet...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get single protocol 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 positions on avax_gmx on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Fetching positions in the avax_gmx protocol...",
          actions: ["GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format DeFi positions from a specific protocol into a user-friendly message
 * 
 * @param positions - DeFi positions data from API
 * @param userAddress - The wallet address that was queried
 * @param protocol - The protocol that was queried
 * @returns Formatted response text and calculated totals
 */
// Actual API response structure for single protocol (differs from type definition)
interface ActualProtocolPortfolioItem {
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
      balanceDecimal: number;
    }>;
    borrow?: Array<{
      tokenSymbol: string;
      balance: number;
      balanceUSD: number;
      tokenAddress: string;
      tokenDecimals: number;
      tokenName: string;
      balanceDecimal: number;
    }>;
    rewards?: Array<{
      tokenSymbol: string;
      balance: number;
      balanceUSD: number;
      tokenAddress: string;
      tokenDecimals: number;
      tokenName: string;
      balanceDecimal: number;
    }>;
  };
  module: string;
}

function formatProtocolDeFiPositionsResponse(
  positions: UserDeFiPosition[], 
  userAddress: string,
  protocol: string
): { 
  responseText: string; 
  totalSupplyUSD: number; 
  totalDebtUSD: number; 
  totalNavUSD: number;
} {
  // Format response text
  let responseText = `DeFi Positions for ${userAddress} in ${protocol.toUpperCase()}:\n\n`;
  
  // Calculate total values
  let totalSupplyUSD = 0;
  let totalDebtUSD = 0;
  let totalNavUSD = 0;
  
  // Process positions
  for (const [index, position] of positions.entries()) {
    // Use type assertion to access commonName and site properties from actual API response
    const actualPosition = position as unknown as { commonName?: string; name: string; chain: string; site?: string; portfolio: ActualProtocolPortfolioItem[] };
    responseText += `${index + 1}. Protocol: ${actualPosition.commonName || actualPosition.name}\n`;
    responseText += `   Chain: ${actualPosition.chain.toUpperCase()}\n`;
    if (actualPosition.site) {
      responseText += `   Website: ${actualPosition.site}\n`;
    }
    
    // Process portfolio details
    if (position.portfolio && position.portfolio.length > 0) {
      for (const portfolioItem of position.portfolio) {
        const actualPortfolioItem = portfolioItem as unknown as ActualProtocolPortfolioItem;
        const module = actualPortfolioItem.module || 'Unknown';
        responseText += `   Type: ${module}\n`;
        
        // Use 'total' property from actual API response instead of 'statistic' from type definition
        const total = (portfolioItem as unknown as ActualProtocolPortfolioItem).total;
        if (total) {
          const supplyUSD = total.supplyUSD || 0;
          const debtUSD = total.debtUSD || 0;
          const navUSD = total.navUSD || 0;
          
          responseText += `   Supply Value: $${supplyUSD.toFixed(2)}\n`;
          responseText += `   Debt Value: $${debtUSD.toFixed(2)}\n`;
          responseText += `   Net Value: $${navUSD.toFixed(2)}\n`;
          
          // Add to totals
          totalSupplyUSD += supplyUSD;
          totalDebtUSD += debtUSD;
          totalNavUSD += navUSD;
        }
        
        // Use 'detailed' property from actual API response instead of 'detail' from type definition
        const detailed = (portfolioItem as unknown as ActualProtocolPortfolioItem).detailed;
        
        // Show supply tokens
        if (detailed?.supply && detailed.supply.length > 0) {
          responseText += "   Supply Tokens:\n";
          for (const token of detailed.supply) {
            const amount = token.balanceDecimal?.toFixed(4) || Number(token.balance || 0).toFixed(4);
            const value = Number(token.balanceUSD || 0).toFixed(2);
            const name = token.tokenName ? ` (${token.tokenName})` : '';
            responseText += `     • ${amount} ${token.tokenSymbol}${name} ($${value})\n`;
            responseText += `       Address: ${token.tokenAddress}\n`;
          }
        }
        
        // Show borrow tokens
        if (detailed?.borrow && detailed.borrow.length > 0) {
          responseText += "   Borrow Tokens:\n";
          for (const token of detailed.borrow) {
            const amount = token.balanceDecimal?.toFixed(4) || Number(token.balance || 0).toFixed(4);
            const value = Number(token.balanceUSD || 0).toFixed(2);
            const name = token.tokenName ? ` (${token.tokenName})` : '';
            responseText += `     • ${amount} ${token.tokenSymbol}${name} ($${value})\n`;
            responseText += `       Address: ${token.tokenAddress}\n`;
          }
        }
        
        // Show rewards tokens
        if (detailed?.rewards && detailed.rewards.length > 0) {
          responseText += "   Rewards:\n";
          for (const token of detailed.rewards) {
            const amount = token.balanceDecimal?.toFixed(4) || Number(token.balance || 0).toFixed(4);
            const value = Number(token.balanceUSD || 0).toFixed(2);
            const name = token.tokenName ? ` (${token.tokenName})` : '';
            responseText += `     • ${amount} ${token.tokenSymbol}${name} ($${value})\n`;
            responseText += `       Address: ${token.tokenAddress}\n`;
          }
        }
        
        responseText += '\n';
      }
    }
    
    responseText += "-------------------\n\n";
  }
  
  // Add summary
  responseText += `Overall Summary in ${protocol.toUpperCase()}:\n`;
  responseText += `Total Supply Value: $${totalSupplyUSD.toFixed(2)}\n`;
  responseText += `Total Debt Value: $${totalDebtUSD.toFixed(2)}\n`;
  responseText += `Total Net Value: $${totalNavUSD.toFixed(2)}\n`;
  
  return { responseText, totalSupplyUSD, totalDebtUSD, totalNavUSD };
}

/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 4. Get User DeFi Positions by Protocol
 * 
 * **Endpoint:** `https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/protocol/{userAddress}?chain={chain}&protocol={protocol}`
 * 
 * **Test Parameters Used:**
 * - userAddress: 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50
 * - chain: avax
 * - protocol: avax_gmx
 * 
 * **Tested cURL Command:**
 * curl -X GET -H "Authorization: GET_YOUR_DATAI_API" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/protocol/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=avax&protocol=avax_gmx" | cat
 * 
 * **Essential Information:**
 * - Description: Get all DeFi historical information (active open positions) for a specific user, on a specific chain, and for a specific protocol.
 * - API Key: Pass the API key in the Authorization header.
 * - Method: GET
 * - Path Parameters:
 *   - userAddress (string, required): The wallet address of the user.
 * - Query Parameters:
 *   - chain (string, required): The chain ID (e.g., eth, avax).
 *   - protocol (string, required): The protocol identifier (e.g., avax_gmx).
 * - Response: Returns a JSON array containing the DeFi positions for the specified protocol, including supply, debt, rewards, NAV, etc.
 */
