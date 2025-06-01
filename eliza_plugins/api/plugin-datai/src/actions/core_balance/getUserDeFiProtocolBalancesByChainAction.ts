/**
 * Get User DeFi Protocol Balances By Chain Action
 * 
 * This action retrieves a summary of user's balances (supply, debt, NAV) across all DeFi protocols on a specific chain.
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
import type { UserDeFiProtocolBalance } from "../../types";


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
 * Check if text contains protocol balance keywords
 */
function containsProtocolBalanceKeywords(text: string): boolean {
  const protocolBalanceKeywords = [
    /protocol balance/i,
    /protocol balances/i,
    /balance of.*protocol/i,
    /balances.*protocol/i,
    /protocol.*balance/i,
    /all protocol/i,
    /protocol summary/i,
    /protocol overview/i,
    /across.*protocol/i,
    /all.*defi.*protocol/i,
  ];

  for (const pattern of protocolBalanceKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found protocol balance keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

/**
 * Count the number of specific protocol names mentioned in text
 */
function countSpecificProtocols(text: string): number {
  const protocolPatterns = [
    /(\w+_\w+)/gi, // Support for protocol IDs like avax_gmx
    /compound/gi,
    /aave/gi,
    /uniswap/gi,
    /curve/gi,
    /yearn/gi,
    /badger/gi,
    /pendle/gi,
    /etherfi/gi,
    /stakestone/gi,
    /harvest/gi,
    /instadapp/gi,
    /rari/gi,
    /mesher/gi,
    /etherdelta/gi,
  ];

  const foundProtocols = new Set<string>();
  
  for (const pattern of protocolPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[0]) {
        foundProtocols.add(match[0].toLowerCase());
      }
    }
  }

  const count = foundProtocols.size;
  logger.debug(`Found ${count} specific protocols: ${Array.from(foundProtocols).join(', ')}`);
  return count;
}

/**
 * Count the number of chain names mentioned in text
 */
function countChainNames(text: string): number {
  const chainPatterns = [
    /ethereum/gi,
    /\beth\b/gi,
    /arbitrum/gi,
    /\barb\b/gi,
    /avalanche/gi,
    /\bavax\b/gi,
    /polygon/gi,
    /\bmatic\b/gi,
    /optimism/gi,
    /\bop\b/gi,
    /base/gi,
    /binance/gi,
    /\bbsc\b/gi,
    /\bbnb\b/gi,
  ];

  const foundChains = new Set<string>();
  
  for (const pattern of chainPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[0]) {
        foundChains.add(match[0].toLowerCase());
      }
    }
  }

  const count = foundChains.size;
  logger.debug(`Found ${count} chains: ${Array.from(foundChains).join(', ')}`);
  return count;
}

/**
 * Validation function for GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI params
 */
function validateGetUserDeFiProtocolBalancesByChainParams(params: { 
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
 * Action to retrieve a user's DeFi protocol balances on a specific chain
 */
export const getUserDeFiProtocolBalancesByChainAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI",
    "FETCH_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI",
    "GET_USER_DEFI_PROTOCOL_SUMMARY_BY_CHAIN_DATAI",
    "SHOW_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI",
    "LIST_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves a summary of user's balances (supply, debt, NAV) across all DeFi protocols on a specific chain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content?.text || '')}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    logger.debug("Attempting to extract chain ID from message");
    const chain = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chain || 'None'}`);
    
    if (!chain) {
      logger.debug("GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI validation failed: No chain ID found in message");
      return false;
    }
    
    // Enhanced validation to prevent race conditions
    logger.debug("Checking for protocol balance validation to prevent race conditions");
    const hasProtocolBalanceKeywords = containsProtocolBalanceKeywords(message.content?.text || '');
    const specificProtocolCount = countSpecificProtocols(message.content?.text || '');
    const chainCount = countChainNames(message.content?.text || '');
    
         logger.debug(`Protocol balance keywords: ${hasProtocolBalanceKeywords}, Specific protocols: ${specificProtocolCount}, Chains: ${chainCount}`);
     
     // This action should be used when:
     // 1. User asks for protocol balances/summary (has keywords) AND exactly one chain
     // 2. OR when no specific protocols are mentioned (wants all protocols) AND exactly one chain
     // 3. Avoid when multiple specific protocols are mentioned (should use single protocol action)
     // 4. Avoid when multiple chains are mentioned (should use multi-chain action)
     
     if (chainCount > 1) {
       logger.debug(`GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI validation failed: Multiple chains detected (${chainCount}) - this action is for single chain only`);
       return false;
     }
     
     if (specificProtocolCount > 1 && !hasProtocolBalanceKeywords) {
       logger.debug(`GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI validation failed: Multiple specific protocols detected (${specificProtocolCount}) without protocol balance keywords`);
       return false;
     }
     
     // Require either protocol balance keywords OR no specific protocols mentioned (meaning all protocols)
     if (specificProtocolCount === 1 && !hasProtocolBalanceKeywords) {
       logger.debug("GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI validation failed: Single specific protocol mentioned without protocol balance keywords - use single protocol action instead");
       return false;
     }
    
    logger.debug(`Validating parameters: userAddress=${userAddress}, chain=${chain}`);
    const validation = validateGetUserDeFiProtocolBalancesByChainParams({ userAddress, chain });
    if (!validation.isValid) {
      logger.error(`GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI validation failed: ${validation.error}`);
      return false;
    }
    
    logger.debug(`GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI validation successful for wallet ${userAddress} on chain ${chain}`);
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
    logger.info("Executing GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI action");
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chain = extractChainId(message.content?.text || '');
      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, chain: ${chain || 'None'}`);
      
      if (!userAddress || !chain || !callback) {
        // We need a wallet address, chain, and callback to proceed
        logger.error(`Missing required parameters - userAddress: ${!!userAddress}, chain: ${!!chain}, callback: ${!!callback}`);
        
        if (callback) {
          logger.debug("Returning error response: Missing required parameters");
          callback({
            text: 'Please provide both a valid wallet address and chain ID to check DeFi protocol balances.',
            content: { 
              success: false, 
              error: 'Missing required parameters' 
            }
          });
        } else {
          logger.error('GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI: No callback provided');
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
      
      // Call API - substitute the userAddress value into the endpoint and add chain as query parameter
      const endpoint = `${ENDPOINTS.GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI
        .replace('{userAddress}', userAddress)}?chain=${chain}`;
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching DeFi protocol balances for ${userAddress} on chain: ${chain}`);
      logger.debug(`Making API request to endpoint: ${endpoint}`);
      const response = await apiClient.get<UserDeFiProtocolBalance[]>(endpoint);
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
          text: `Error fetching DeFi protocol balances: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const protocolBalances = response.data;
      logger.debug(`Retrieved ${protocolBalances?.length || 0} DeFi protocols`);
      
      if (!protocolBalances || protocolBalances.length === 0) {
        logger.debug(`No DeFi protocol balances found for address ${userAddress} on chain ${chain}`);
        callback({
          text: `No DeFi protocol balances found for address ${userAddress} on chain ${chain.toUpperCase()}.`,
          content: { 
            success: true, 
            data: { protocolBalances: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function for response text
      logger.debug("Formatting response using dedicated function");
      const responseText = formatDeFiProtocolBalancesResponse(protocolBalances, userAddress, chain);
      
      logger.debug("Sending successful response");
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { 
            protocolBalances,
            summary: {
              totalSupplyUSD: calculateTotalValue(protocolBalances, 'assetUSD'),
              totalDebtUSD: calculateTotalValue(protocolBalances, 'debtUSD'), 
              totalNavUSD: calculateTotalValue(protocolBalances, 'navUSD'),
              protocolCount: protocolBalances.length
            }
          } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve DeFi protocol balances: ${errorMessage}`,
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
          text: "What is my DeFi protocol balances on the chain Ethereum for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check your protocol balances on Ethereum...",
          actions: ["GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me a summary of DeFi protocols for address 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on eth chain on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving a summary of DeFi protocol balances on Ethereum...",
          actions: ["GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What DeFi positions does 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 have on Ethereum? Show me all protocol balances on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Fetching DeFi protocol balances on Ethereum for this address...",
          actions: ["GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Helper function to calculate total values from protocol balances
 * 
 * @param protocolBalances - Array of protocol balance objects
 * @param valueType - Type of value to sum ('assetUSD', 'debtUSD', or 'navUSD')
 * @returns Total value
 */
function calculateTotalValue(protocolBalances: UserDeFiProtocolBalance[], valueType: 'assetUSD' | 'debtUSD' | 'navUSD'): number {
  return protocolBalances.reduce((total, protocol) => {
    return total + (protocol.balance[valueType] || 0);
  }, 0);
}

// Actual API response structure for protocol balances (differs from type definition)
interface ActualProtocolBalance {
  chain: string;
  name: string;
  commonName: string;
  logo: string;
  site: string;
  balance: {
    navUSD: number;
    assetUSD: number;
    debtUSD: number;
  };
}

/**
 * Format DeFi protocol balances response into a user-friendly message
 * 
 * @param protocolBalances - Array of protocol balance data from API
 * @param userAddress - The wallet address that was queried
 * @param chain - The blockchain chain ID
 * @returns Formatted response message
 */
function formatDeFiProtocolBalancesResponse(
  protocolBalances: UserDeFiProtocolBalance[], 
  userAddress: string,
  chain: string
): string {
  // Calculate totals
  const totalSupplyUSD = calculateTotalValue(protocolBalances, 'assetUSD');
  const totalDebtUSD = calculateTotalValue(protocolBalances, 'debtUSD');
  const totalNavUSD = calculateTotalValue(protocolBalances, 'navUSD');
  
  // Sort protocols by net value (highest first)
  const sortedProtocols = [...protocolBalances].sort((a, b) => 
    (b.balance.navUSD || 0) - (a.balance.navUSD || 0)
  );
  
  // Format response text
  let responseText = `DeFi Protocol Balances for ${userAddress} on ${chain.toUpperCase()}:\n\n`;
  
  // Process balances by protocol
  for (const [index, protocol] of sortedProtocols.entries()) {
    // Use type assertion to access actual API response properties
    const actualProtocol = protocol as unknown as ActualProtocolBalance;
    
    responseText += `${index + 1}. Protocol: ${actualProtocol.commonName || actualProtocol.name}\n`;
    if (actualProtocol.site) {
      responseText += `   Website: ${actualProtocol.site}\n`;
    }
    
    const supplyUSD = protocol.balance.assetUSD || 0;
    const debtUSD = protocol.balance.debtUSD || 0;
    const navUSD = protocol.balance.navUSD || 0;
    
    responseText += `   Supply Value: $${supplyUSD.toFixed(2)}\n`;
    responseText += `   Debt Value: $${debtUSD.toFixed(2)}\n`;
    responseText += `   Net Value: $${navUSD.toFixed(2)}\n`;
    
    // Show percentage of total portfolio
    if (totalNavUSD > 0) {
      const percentage = (navUSD / totalNavUSD) * 100;
      responseText += `   Portfolio %: ${percentage.toFixed(1)}%\n`;
    }
    
    responseText += "\n";
  }
  
  // Add summary
  responseText += "-------------------\n";
  responseText += `Overall Summary on ${chain.toUpperCase()}:\n`;
  responseText += `Total Supply Value: $${totalSupplyUSD.toFixed(2)}\n`;
  responseText += `Total Debt Value: $${totalDebtUSD.toFixed(2)}\n`;
  responseText += `Total Net Value: $${totalNavUSD.toFixed(2)}\n`;
  responseText += `Active Protocols: ${protocolBalances.length}\n`;
  
  // Show top 3 protocols by value
  if (sortedProtocols.length > 0) {
    responseText += "\nTop Protocols by Value:\n";
    const topProtocols = sortedProtocols.slice(0, 3);
    for (const [index, protocol] of topProtocols.entries()) {
      const actualProtocol = protocol as unknown as ActualProtocolBalance;
      const navUSD = protocol.balance.navUSD || 0;
      const percentage = totalNavUSD > 0 ? (navUSD / totalNavUSD) * 100 : 0;
      responseText += `${index + 1}. ${actualProtocol.commonName || actualProtocol.name}: $${navUSD.toFixed(2)} (${percentage.toFixed(1)}%)\n`;
    }
  }
  
  return responseText;
}






/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 5. Get User DeFi Protocol Balances by Chain
 * 
 * **Endpoint:** `https://api-v1.mymerlin.io/api/merlin/public/balances/protocol/{userAddress}?chain={chain}`
 * 
 * **Test Parameters Used:**
 * - userAddress: 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106
 * - chain: eth
 * 
 * **Tested cURL Command:**
 * curl -X GET -H "Authorization: GET_YOUR_DATAI_API" "https://api-v1.mymerlin.io/api/merlin/public/balances/protocol/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=eth" | cat
 * 
 * **Essential Information:**
 * - Description: Get all DeFi balances (balances from active open positions) for a specific user, aggregated by protocol on a specific chain.
 * - API Key: Pass the API key in the Authorization header.
 * - Method: GET
 * - Path Parameters:
 *   - userAddress (string, required): The wallet address of the user.
 * - Query Parameters:
 *   - chain (string, required): The chain ID (e.g., eth).
 * - Response: Returns a JSON array of objects, where each object represents a protocol and its balance details (navUSD, assetUSD, debtUSD) for the user on the specified chain.
 */
