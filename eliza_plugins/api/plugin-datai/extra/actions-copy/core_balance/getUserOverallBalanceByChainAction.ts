/**
 * Get User Overall Balance By Chain Action
 * 
 * This action retrieves the user's overall balance for a specific chain,
 * including tokens, NFTs, and DeFi exposures.
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
import type { UserOverallBalanceByChainResponse } from "../../types";

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
 * Check if text contains single chain balance keywords
 */
function containsSingleChainBalanceKeywords(text: string): boolean {
  const singleChainKeywords = [
    /total balance.*on/i,
    /overall balance.*on/i,
    /balance.*on.*chain/i,
    /net worth.*on/i,
    /portfolio.*on/i,
    /worth.*on/i,
    /balance.*for.*chain/i,
    /total.*on.*chain/i,
    /overall.*on.*chain/i,
    /my.*balance.*on/i,
    /wallet.*worth.*on/i,
    /balance.*specific.*chain/i,
    /single.*chain.*balance/i,
  ];

  for (const pattern of singleChainKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found single chain balance keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

/**
 * Count the number of specific chain names mentioned in text
 */
function countSpecificChains(text: string): number {
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
    /blast/gi,
    /linea/gi,
    /scroll/gi,
    /zksync/gi,
    /\bera\b/gi,
    /berachain/gi,
    /mantle/gi,
    /\bmnt\b/gi,
    /fantom/gi,
    /\bftm\b/gi,
    /celo/gi,
    /kaia/gi,
    /\bklay\b/gi,
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
  logger.debug(`Found ${count} specific chains: ${Array.from(foundChains).join(', ')}`);
  return count;
}

/**
 * Check if text contains "all chains" keywords that should use the all chains action
 */
function containsAllChainsKeywords(text: string): boolean {
  const allChainsKeywords = [
    /balance.*across.*all.*chains/i,
    /balance.*on.*all.*chains/i,
    /all.*chains.*balance/i,
    /overall.*balance.*all.*chains/i,
    /total.*balance.*all.*chains/i,
    /portfolio.*all.*chains/i,
    /across.*all.*blockchains/i,
    /complete.*portfolio/i,
    /full.*portfolio/i,
  ];

  for (const pattern of allChainsKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found all chains keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

/**
 * Action to retrieve the user's overall balance for a specific chain
 */
export const getUserOverallBalanceByChainAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI",
    "FETCH_SINGLE_CHAIN_OVERALL_BALANCE_DATAI",
    "GET_TOTAL_BALANCE_FOR_SINGLE_CHAIN_DATAI",
    "SHOW_NET_WORTH_ON_SINGLE_CHAIN_DATAI",
    "CHECK_BALANCE_FOR_SPECIFIC_CHAIN_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves the user's overall balance for a specific chain, including tokens, NFTs, and DeFi exposures",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const messageText = message.content?.text || '';
    logger.debug(`Analyzing message text: ${messageText}`);
    
    const userAddress = extractWalletAddress(messageText);
    logger.debug(`Extracted wallet address: ${userAddress || 'none'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    const chain = extractChainId(messageText);
    logger.debug(`Extracted chain ID: ${chain || 'none'}`);
    
    if (!chain) {
      logger.debug("GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI validation failed: No chain ID found in message");
      return false;
    }
    
    // Enhanced validation to prevent race conditions
    logger.debug("Checking for single chain validation to prevent race conditions");
    const hasSingleChainKeywords = containsSingleChainBalanceKeywords(messageText);
    const hasAllChainsKeywords = containsAllChainsKeywords(messageText);
    const specificChainCount = countSpecificChains(messageText);
    
    logger.debug(`Single chain keywords: ${hasSingleChainKeywords}, All chains keywords: ${hasAllChainsKeywords}, Specific chains: ${specificChainCount}`);
    
    // This action should be used when:
    // 1. User asks for balance on a single specific chain (has single chain keywords + exactly 1 chain)
    // 2. OR when exactly one chain is mentioned with balance/total/overall keywords
    // 3. Avoid when "all chains" keywords are present (should use all chains action)
    // 4. Avoid when multiple chains are mentioned (should use multi-chain action)
    
    if (hasAllChainsKeywords) {
      logger.debug("GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI validation failed: All chains keywords detected - use all chains action instead");
      return false;
    }
    
    if (specificChainCount > 1) {
      logger.debug(`GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI validation failed: Multiple specific chains detected (${specificChainCount}) - use multi-chain action instead`);
      return false;
    }
    
    if (specificChainCount === 0 && !hasSingleChainKeywords) {
      logger.debug("GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI validation failed: No specific chain mentioned and no single chain keywords - unclear intent");
      return false;
    }
    
    // Must have exactly 1 chain mentioned OR single chain keywords with a detected chain
    if (specificChainCount !== 1 && !hasSingleChainKeywords) {
      logger.debug("GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI validation failed: Must have exactly 1 chain mentioned or single chain keywords");
      return false;
    }
    
    logger.debug("GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI validation successful");
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
    logger.info("Executing GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    try {
      // Extract parameters
      const messageText = message.content?.text || '';
      logger.debug(`Analyzing message text for parameters: ${messageText}`);
      
      const userAddress = extractWalletAddress(messageText);
      logger.debug(`Extracted wallet address: ${userAddress || 'none'}`);
      
      const chain = extractChainId(messageText);
      logger.debug(`Extracted chain ID: ${chain || 'none'}`);
      
      if (!userAddress || !chain || !callback) {
        // We need both a wallet address, chain, and a callback to proceed
        logger.error(`Missing parameters: userAddress=${!!userAddress}, chain=${!!chain}, callback=${!!callback}`);
        
        if (callback) {
          callback({
            text: 'Please provide a valid wallet address and chain ID to check overall balance.',
            content: { 
              success: false, 
              error: !userAddress ? 'No wallet address provided' : 'No chain ID provided' 
            }
          });
        } else {
          logger.error('GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI: No callback provided');
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
      const endpoint = ENDPOINTS.GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI
        .replace('{userAddress}', userAddress)
        .replace('{chain}', chain);
      
      logger.info(`Fetching overall balance for ${userAddress} on chain ${chain}`);
      logger.debug(`Making API request to endpoint: ${endpoint}`);
      
      const response = await apiClient.get<UserOverallBalanceByChainResponse>(endpoint);
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
        logger.error(`API error when fetching overall balance: ${errorMessage}`);
        callback({
          text: `Error fetching overall balance on chain ${chain}: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const balanceData = response.data;
      logger.debug(`Balance data: ${JSON.stringify(balanceData)}`);
      
      if (!balanceData) {
        logger.debug(`No balance data found for address ${userAddress} on chain ${chain}`);
        callback({
          text: `No balance data found for address ${userAddress} on chain ${chain}.`,
          content: { 
            success: true, 
            data: { balance: null } 
          }
        });
        
        return true;
      }
      
      // Format response text
      logger.debug("Formatting response for balance data");
      
      callback({
        text: formatBalanceResponse(balanceData, userAddress, chain),
        content: { 
          success: true, 
          data: { balance: balanceData }
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI unexpected error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve overall balance: ${errorMessage}`,
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
          text: "What's my total balance on Avalanche chain? My wallet is 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your overall balance on Avalanche...",
          actions: ["GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show the net worth for 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3 on avax on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch your overall balance on Avalanche. One moment please...",
          actions: ["GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "How much is my wallet worth on avax? The address is 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving your overall balance on the Avalanche blockchain...",
          actions: ["GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format the overall balance data into a user-friendly message
 * 
 * @param balanceData - Balance data from API response
 * @param userAddress - The wallet address that was queried
 * @param chain - The blockchain chain identifier
 * @returns Formatted response message
 */
function formatBalanceResponse(balanceData: UserOverallBalanceByChainResponse, userAddress: string, chain: string): string {
  const usdValue = balanceData.valueUsd || 0;
  
  // Get chain display name
  const chainDisplayNames: { [key: string]: string } = {
    'eth': 'Ethereum',
    'arb': 'Arbitrum',
    'avax': 'Avalanche',
    'matic': 'Polygon',
    'op': 'Optimism',
    'base': 'Base',
    'bsc': 'BNB Chain',
    'blast': 'Blast',
    'linea': 'Linea',
    'scrl': 'Scroll',
    'era': 'zkSync Era',
    'bera': 'Berachain',
    'mnt': 'Mantle',
    'ftm': 'Fantom',
    'celo': 'Celo',
    'klay': 'Kaia',
  };
  
  const chainName = chainDisplayNames[chain.toLowerCase()] || chain.toUpperCase();
  
  let responseText = `💰 Overall Balance for ${userAddress}\n`;
  responseText += `🔗 Chain: ${chainName}\n\n`;
  
  // Primary currency (USD) with emphasis
  responseText += `💵 Primary Value: $${usdValue.toFixed(2)} USD\n\n`;
  
  // Other currencies in a more organized format
  if (usdValue > 0) {
    responseText += "🌍 Multi-Currency Values:\n";
    responseText += `• EUR: €${(balanceData.valueEUR || 0).toFixed(2)}\n`;
    responseText += `• GBP: £${(balanceData.valueGBP || 0).toFixed(2)}\n`;
    responseText += `• AUD: A$${(balanceData.valueAUD || 0).toFixed(2)}\n`;
    responseText += `• CAD: C$${(balanceData.valueCAD || 0).toFixed(2)}\n`;
    responseText += `• AED: ${(balanceData.valueAED || 0).toFixed(2)} AED\n`;
    responseText += `• INR: ₹${(balanceData.valueINR || 0).toFixed(2)}\n\n`;
    
    // Add some context based on value
    if (usdValue >= 10000) {
      responseText += "🚀 Significant portfolio value detected!\n";
    } else if (usdValue >= 1000) {
      responseText += "📈 Good portfolio value on this chain.\n";
    } else if (usdValue >= 100) {
      responseText += "💼 Moderate balance on this chain.\n";
    } else if (usdValue > 0) {
      responseText += "🔍 Small balance detected on this chain.\n";
    }
  } else {
    responseText += "❌ No balance found on this chain.\n";
  }
  
  // Add wallet address for easy reference (truncated)
  const truncatedAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  responseText += `\n📋 Wallet: ${truncatedAddress}\n`;
  responseText += `🔗 Full Address: ${userAddress}`;
  
  return responseText;
}

/**
 * TEST DATA FOR THIS ACTION
 * 
 * Endpoint: https://api-v1.mymerlin.io/api/merlin/public/balances/chain/{userAddress}?chain={chain}
 * 
 * Test Parameters Used:
 * - userAddress: 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3
 * - chain: avax
 * 
 * Tested cURL Command:
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" \
 * "https://api-v1.mymerlin.io/api/merlin/public/balances/chain/0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3?chain=avax" | cat
 */

