/**
 * Get User Overall Balance Across All Chains Action
 * 
 * This action retrieves a user's overall balance across all chains, including tokens, NFTs, and DeFi exposures.
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
import { extractWalletAddress } from "../../utils/validation";
import { API_CONFIG, ENDPOINTS } from "../../constants";
import type { UserOverallBalanceAllChains } from "../../types";

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
 * Check if text contains "all chains" keywords
 */
function containsAllChainsKeywords(text: string): boolean {
  const allChainsKeywords = [
    /balance on all chains/i,
    /balance across all chains/i,
    /overall balance on all chains/i,
    /all chains balance/i,
    /all chains balances/i,
    /total balance.*all chains/i,
    /portfolio.*all chains/i,
    /across all.*chain/i,
    /all.*chain.*balance/i,
    /overall.*balance/i,
    /total.*portfolio/i,
    /complete.*balance/i,
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
    /mantle/gi,
    /\bmnt\b/gi,
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
 * Validation function for GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI params
 */
function validateGetUserOverallBalanceAllChainsParams(params: { 
  userAddress: string 
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  return { isValid: true };
}

/**
 * Action to retrieve a user's overall balance across all chains
 */
export const getUserOverallBalanceAllChainsAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI",
    "FETCH_ALL_CHAIN_USER_TOTAL_BALANCE_DATAI",
    "RETRIEVE_USER_OVERALL_BALANCES_ALL_CHAINS_DATAI",
    "SHOW_TOTAL_BALANCE_ALL_CHAINS_DATAI",
    "LIST_ALL_BALANCES_FOR_ALL_CHAINS_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves a user's overall balance across all chains, including tokens, NFTs, and DeFi exposures",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const messageText = message.content?.text || '';
    logger.debug(`Analyzing message text: ${messageText}`);
    
    const userAddress = extractWalletAddress(messageText);
    logger.debug(`Extracted wallet address: ${userAddress || 'none'}`);
    
    if (!userAddress) {
      logger.debug("GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI validation failed: No wallet address found in message");
      return false;
    }
    
    // Enhanced validation to prevent race conditions
    logger.debug("Checking for all chains validation to prevent race conditions");
    const hasAllChainsKeywords = containsAllChainsKeywords(messageText);
    const specificChainCount = countSpecificChains(messageText);
    
    logger.debug(`All chains keywords: ${hasAllChainsKeywords}, Specific chains: ${specificChainCount}`);
    
    // This action should be used when:
    // 1. User asks for "all chains" balance/portfolio (has keywords)
    // 2. OR when no specific chains are mentioned (wants overall balance)
    // 3. Avoid when specific single chain is mentioned (should use single chain action)
    // 4. Avoid when multiple specific chains are mentioned (should use multi-chain action)
    
    if (specificChainCount === 1 && !hasAllChainsKeywords) {
      logger.debug("GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI validation failed: Single specific chain mentioned without all chains keywords - use single chain action instead");
      return false;
    }
    
    if (specificChainCount > 1 && !hasAllChainsKeywords) {
      logger.debug(`GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI validation failed: Multiple specific chains detected (${specificChainCount}) without all chains keywords - use multi-chain action instead`);
      return false;
    }
    
    const validation = validateGetUserOverallBalanceAllChainsParams({ userAddress });
    logger.debug(`Validation result: ${validation.isValid ? 'valid' : 'invalid'}, ${validation.error || 'no errors'}`);
    
    if (!validation.isValid) {
      logger.error(`GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI validation failed: ${validation.error}`);
      return false;
    }
    
    logger.debug("GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI validation successful");
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
    logger.info("Executing GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    try {
      // Extract parameters
      const messageText = message.content?.text || '';
      logger.debug(`Analyzing message text for parameters: ${messageText}`);
      
      const userAddress = extractWalletAddress(messageText);
      logger.debug(`Extracted wallet address: ${userAddress || 'none'}`);
      
      if (!userAddress || !callback) {
        // We need both a wallet address and a callback to proceed
        logger.error(`Missing parameters: userAddress=${!!userAddress}, callback=${!!callback}`);
        
        if (callback) {
          callback({
            text: 'Please provide a valid wallet address to check balances.',
            content: { 
              success: false, 
              error: 'No wallet address provided' 
            }
          });
        } else {
          logger.error('GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI: No callback provided');
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
      const endpoint = ENDPOINTS.GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI.replace('{userAddress}', userAddress);
      logger.info(`Fetching overall balance for ${userAddress}`);
      logger.debug(`Making API request to endpoint: ${endpoint}`);
      
      const response = await apiClient.get<UserOverallBalanceAllChains>(endpoint);
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
          text: `Error fetching overall balance: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const balance = response.data;
      logger.debug(`Balance data: ${JSON.stringify(balance)}`);
      
      if (!balance) {
        logger.debug(`No balance information found for address ${userAddress}`);
        callback({
          text: `No balance information found for address ${userAddress}.`,
          content: { 
            success: true, 
            data: { balance: null } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function
      logger.debug("Using dedicated formatting function for balance data");
      const responseText = formatUserOverallBalanceResponse(balance, userAddress);
      
      logger.debug("Sending success response with formatted text");
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { balance } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI unexpected error: ${errorMessage}`);
      
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
          text: "What is my total balance across all chains? My wallet address is 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your overall balance across all blockchains...",
          actions: ["GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me the all chains portfolio value for 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch your total portfolio value across all chains. One moment please...",
          actions: ["GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get overall balance all all chains for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving overall balance across all chains for this wallet address...",
          actions: ["GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format user overall balance response into a user-friendly message
 * 
 * @param balance - Balance data from API
 * @param userAddress - The wallet address that was queried
 * @returns Formatted response message
 */
function formatUserOverallBalanceResponse(
  balance: UserOverallBalanceAllChains,
  userAddress: string
): string {
  const totalValue = balance.totalValueUsd || 0;
  
  // Format response text
  let responseText = `Overall Portfolio Balance for ${userAddress}:\n\n`;
  responseText += `💰 Total Value: $${totalValue.toFixed(2)}\n\n`;
  
  // Filter chains with non-zero values and sort by value (highest first)
  const chainsWithValue = balance.byChain?.filter(chain => (chain.valueUsd || 0) > 0) || [];
  const sortedChains = chainsWithValue.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
  
  if (sortedChains.length > 0) {
    responseText += `📊 Active Chains (${sortedChains.length} of ${balance.byChain?.length || 0}):\n\n`;
    
    // Show top chains with significant value
    for (const [index, chainBalance] of sortedChains.entries()) {
      const value = chainBalance.valueUsd || 0;
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      
      // Only show chains with meaningful value (> $0.01) or top 10
      if (value > 0.01 || index < 10) {
        responseText += `${index + 1}. ${chainBalance.name} (${chainBalance.id.toUpperCase()})\n`;
        responseText += `   Value: $${value.toFixed(2)}`;
        
        if (percentage >= 0.1) {
          responseText += ` (${percentage.toFixed(1)}%)`;
        }
        responseText += '\n\n';
      }
    }
    
    // Show summary of remaining small balances
    const smallBalances = sortedChains.filter((chain, index) => 
      (chain.valueUsd || 0) <= 0.01 && index >= 10
    );
    
    if (smallBalances.length > 0) {
      const smallTotal = smallBalances.reduce((sum, chain) => sum + (chain.valueUsd || 0), 0);
      responseText += `... and ${smallBalances.length} other chains with small balances totaling $${smallTotal.toFixed(4)}\n\n`;
    }
    
    // Show top 3 chains summary
    if (sortedChains.length > 1) {
      responseText += "🏆 Top 3 Chains by Value:\n";
      const topChains = sortedChains.slice(0, 3);
      for (const [index, chain] of topChains.entries()) {
        const value = chain.valueUsd || 0;
        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
        responseText += `${index + 1}. ${chain.name}: $${value.toFixed(2)} (${percentage.toFixed(1)}%)\n`;
      }
    }
  } else {
    responseText += "No active balances found across any chains.\n";
  }
  
  // Add portfolio insights
  if (totalValue > 0) {
    responseText += "\n📈 Portfolio Insights:\n";
    responseText += `• Active Chains: ${sortedChains.length}\n`;
    responseText += `• Largest Position: ${sortedChains[0]?.name || 'N/A'}\n`;
    
    if (sortedChains.length > 1) {
      const topChainPercentage = totalValue > 0 ? ((sortedChains[0]?.valueUsd || 0) / totalValue) * 100 : 0;
      responseText += `• Concentration: ${topChainPercentage.toFixed(1)}% in top chain\n`;
    }
  }
  
  return responseText;
}

/**
 * TEST DATA FOR THIS ACTION
 * 
 * Endpoint: https://api-v1.mymerlin.io/api/merlin/public/balances/all/{userAddress}
 * 
 * Test Parameters Used:
 * - userAddress: 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106
 * 
 * Tested cURL Command:
 * curl -X GET -H "Authorization: GET_YOUR_DATAI_API" \
 * "https://api-v1.mymerlin.io/api/merlin/public/balances/all/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106" | cat
 * 
 * Description: Get the user's overall balance across all chains, including tokens, NFTs, and DeFi exposures.
 * Path Parameters:
 * - userAddress (string, required): The wallet address of the user.
 * 
 * Response includes totalValueUsd and a byChain array with chain-specific values.
 */
