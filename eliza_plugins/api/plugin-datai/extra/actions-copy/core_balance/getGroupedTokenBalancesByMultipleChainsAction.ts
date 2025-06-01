/**
 * Get Grouped Token Balances By Multiple Chains Action
 * 
 * This action retrieves the user's token balances (including native) for multiple specified chains,
 * with results grouped by chain ID.
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
import type { TokenBalancesByMultipleChainsResponse } from "../../types";

/**
 * Action to retrieve the user's token balances grouped by multiple chains
 */
export const getGroupedTokenBalancesByMultipleChainsAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_GROUPED_TOKEN_BALANCES_BY_CHAINS_DATAI",
    "FETCH_TOKENS_ACROSS_CHAINS_DATAI",
    "GET_MULTI_CHAIN_TOKEN_BALANCES_DATAI",
    "SHOW_TOKENS_ON_MULTIPLE_CHAINS_DATAI",
    "CHECK_ALL_CHAIN_TOKEN_BALANCES_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves the user's token balances (including native) for multiple specified chains, with results grouped by chain ID",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("---------------------------------------");
    logger.debug("Validating getGroupedTokenBalancesByMultipleChains action");
    logger.debug(`Full message text: "${message.content?.text || ''}"`);
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    if (!apiKey) {
      logger.error(`getGroupedTokenBalancesByMultipleChains validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("getGroupedTokenBalancesByMultipleChains validation failed: No wallet address found in message");
      // If the message contains wallet-related keywords but no address was extracted, log extra info
      const messageText = message.content?.text || '';
      if (messageText.toLowerCase().includes('wallet') || messageText.toLowerCase().includes('address')) {
        logger.debug("Message contains wallet/address keywords but extraction failed");
        logger.debug("Check the wallet address format or update extraction regex if needed");
      }
      return false;
    }
    
    const chains = extractMultipleChainIds(message.content?.text || '');
    logger.debug(`Extracted chain IDs: ${chains.length > 0 ? chains.join(', ') : 'None'}`);
    
    if (chains.length === 0) {
      logger.debug("getGroupedTokenBalancesByMultipleChains validation failed: No chain IDs found in message");
      // Log extra info if message contains chain-related keywords
      const messageText = message.content?.text || '';
      if (messageText.toLowerCase().includes('chain') || 
          messageText.toLowerCase().includes('ethereum') || 
          messageText.toLowerCase().includes('eth') || 
          messageText.toLowerCase().includes('base') ||
          messageText.toLowerCase().includes('polygon')) {
        logger.debug("Message contains chain-related keywords but extraction failed");
        logger.debug("Check chain name format or update extraction patterns if needed");
      }
      return false;
    }
    
    logger.debug("getGroupedTokenBalancesByMultipleChains validation passed");
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
    logger.info("---------------------------------------");
    logger.info("Executing getGroupedTokenBalancesByMultipleChains action");
    logger.debug(`Full message text: "${message.content?.text || ''}"`);
    logger.debug(`Message: ${JSON.stringify(message)}`);
    logger.debug(`State: ${JSON.stringify(state || {})}`);
    logger.debug(`Options: ${JSON.stringify(options || {})}`);
    
    try {
      // Extract parameters
      const userText = message.content?.text || '';
      logger.debug(`Attempting to extract wallet address from: "${userText}"`);
      const userAddress = extractWalletAddress(userText);
      logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
      
      logger.debug(`Attempting to extract chain IDs from: "${userText}"`);
      const chains = extractMultipleChainIds(userText);
      logger.debug(`Extracted chain IDs: ${chains.length > 0 ? chains.join(', ') : 'None'}`);
      
      if (!userAddress || chains.length === 0 || !callback) {
        // We need a wallet address, chains, and a callback to proceed
        logger.error("Missing required parameters or callback");
        logger.debug(`userAddress: ${userAddress ? 'present' : 'missing'}`);
        logger.debug(`chains: ${chains.length > 0 ? 'present' : 'missing'}`);
        logger.debug(`callback: ${callback ? 'present' : 'missing'}`);
        
        if (callback) {
          const errorMessage = !userAddress 
            ? 'No wallet address provided' 
            : 'No chain IDs provided';
          
          logger.debug(`Sending error response: ${errorMessage}`);
          callback({
            text: 'Please provide a valid wallet address and at least one chain ID to check token balances.',
            content: { 
              success: false, 
              error: errorMessage
            }
          });
        } else {
          logger.error('getGroupedTokenBalancesByMultipleChains: No callback provided');
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
      
      // Join chains for API call
      const chainParam = chains.join(',');
      logger.debug(`Chain parameter for API call: ${chainParam}`);
      
      // Call API - substitute the userAddress and chains values into the endpoint
      const endpoint = ENDPOINTS.GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI
        .replace('{userAddress}', userAddress);
      
      logger.info(`Fetching token balances for ${userAddress} on chains: ${chainParam}`);
      logger.debug(`API endpoint: ${endpoint}`);
      
      // Log the API key being used (first 10 chars only for security)
      const apiKeyTruncated = `${apiKey.substring(0, 10)}...`;
      logger.debug(`Using API key: ${apiKeyTruncated}`);
      
      logger.debug("Making API request to DataI service...");
      const response = await apiClient.get<TokenBalancesByMultipleChainsResponse>(endpoint, { chains: chainParam });
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
      
      // Log the response structure (but not the entire response which could be large)
      if (response.data) {
        const chainIds = Object.keys(response.data);
        logger.debug(`Response data contains ${chainIds.length} chains: ${chainIds.join(', ')}`);
        
        // Log a sample of the data structure for the first chain
        if (chainIds.length > 0) {
          const firstChain = chainIds[0]; // This is safe - we already checked chainIds.length > 0
          // Fix TypeScript error by asserting that firstChain is a valid key
          const chainData = firstChain ? response.data[firstChain as keyof typeof response.data] : undefined;
          
          if (chainData) {
            const tokenCount = chainData.length;
            logger.debug(`Chain ${firstChain} has ${tokenCount} tokens`);
            
            // Log the first token as an example of the structure
            if (chainData.length > 0) {
              const sampleToken = chainData[0];
              logger.debug(`Sample token structure: ${JSON.stringify(sampleToken, null, 2)}`);
            }
          } else {
            logger.debug(`Chain ${firstChain} has no token data`);
          }
        }
      } else {
        logger.debug("Response data is empty or null");
      }
      
      // Handle API errors
      if (!response.success) {
        const errorMessage = response.error || "Unknown API error";
        logger.error(`API error: ${errorMessage}`);
        logger.debug(`API response status code: ${response.statusCode}`);
        
        callback({
          text: `Error fetching token balances on chains ${chainParam}: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const tokenDataByChain = response.data;
      logger.debug(`Received data for ${Object.keys(tokenDataByChain || {}).length} chains`);
      
      if (!tokenDataByChain || Object.keys(tokenDataByChain).length === 0) {
        logger.info(`No token balances found for address ${userAddress}`);
        callback({
          text: `No token balances found for address ${userAddress} on the specified chains.`,
          content: { 
            success: true, 
            data: { tokenBalances: {} } 
          }
        });
        
        return true;
      }
      
      // Detailed logging for token data processing
      let totalTokensCount = 0;
      let totalSignificantTokens = 0; // Tokens with value > $1
      
      for (const [chain, tokens] of Object.entries(tokenDataByChain)) {
        logger.debug(`Processing ${tokens?.length || 0} tokens for chain ${chain}`);
        totalTokensCount += tokens?.length || 0;
        
        // Count significant tokens (value > $1)
        const significantTokens = (tokens || []).filter(t => (t.prices?.USD || 0) > 1);
        totalSignificantTokens += significantTokens.length;
        
        logger.debug(`Chain ${chain}: ${significantTokens.length} significant tokens out of ${tokens?.length || 0} total`);
        
        // Log some details for significant tokens
        if (significantTokens.length > 0) {
          logger.debug(`Top tokens on ${chain} by value:`);
          const topTokens = [...significantTokens]
            .sort((a, b) => (b.prices?.USD || 0) - (a.prices?.USD || 0))
            .slice(0, 3);
          
          for (const token of topTokens) {
            logger.debug(`- ${token.symbol}: ${token.balance} ($${token.prices?.USD?.toFixed(2) || '0.00'})`);
          }
        }
      }
      
      logger.debug(`Total tokens across all chains: ${totalTokensCount}`);
      logger.debug(`Total significant tokens (value > $1): ${totalSignificantTokens}`);
      
      logger.debug("Generating formatted response using dedicated formatting function");
      const { formattedResponse, totalValueUsd } = formatTokenBalancesResponse(tokenDataByChain, userAddress);
      logger.debug(`Total value calculated: $${totalValueUsd.toFixed(2)}`);
      logger.debug(`Response text (truncated): ${formattedResponse.substring(0, 100)}...`);
      
      logger.debug("Sending response with token balance data");
      callback({
        text: formattedResponse,
        content: { 
          success: true, 
          data: { 
            tokenBalances: tokenDataByChain,
            totalValueUsd
          } 
        }
      });
      
      logger.debug("Successfully completed getGroupedTokenBalancesByMultipleChains action");
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`getGroupedTokenBalancesByMultipleChains error: ${errorMessage}`);
      
      // Log the error stack trace if available
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        logger.debug(`Sending error response to user: ${errorMessage}`);
        callback({
          text: `Failed to retrieve token balances: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
      } else {
        logger.debug("No callback available to send error response");
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
          text: "Show me my token balances on Ethereum and Base for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll get your token balances across both Ethereum and Base networks for 0x3764D79db51726E900a1380055F469eB6e2a7fD3...",
          actions: ["GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What tokens do I have on ETH and Base chains for address 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Fetching your token balances across Ethereum and Base for 0x3764D79db51726E900a1380055F469eB6e2a7fD3...",
          actions: ["GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get token details for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on eth, base chains on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving token balances for 0x3764D79db51726E900a1380055F469eB6e2a7fD3 across Ethereum and Base networks...",
          actions: ["GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format token balances response into a user-friendly message
 * 
 * @param tokenDataByChain - Token data grouped by chain from API
 * @param userAddress - The wallet address that was queried
 * @returns Object containing formatted response text and total USD value
 */
function formatTokenBalancesResponse(
  tokenDataByChain: TokenBalancesByMultipleChainsResponse,
  userAddress: string
): { formattedResponse: string, totalValueUsd: number } {
  logger.debug("Formatting token balances response");
  logger.debug(`Input data: ${Object.keys(tokenDataByChain).length} chains, address: ${userAddress}`);
  
  // Format response text
  let responseText = `Token Balances for ${userAddress} across multiple chains:\n\n`;
  
  // Calculate total value in USD across all chains
  let totalValueUsd = 0;
  let totalTokenCount = 0;
  
  logger.debug("Processing chain data for formatting response");
  
  // Process each chain
  for (const [chain, tokens] of Object.entries(tokenDataByChain)) {
    // Skip if no tokens for this chain
    if (!tokens || tokens.length === 0) {
      logger.debug(`Chain ${chain} has no tokens, skipping`);
      continue;
    }
    
    logger.debug(`Formatting ${tokens.length} tokens for chain ${chain}`);
    totalTokenCount += tokens.length;
    
    // Calculate chain total value
    let chainTotalValue = 0;
    
    // Calculate token values and store for sorting
    const tokensWithValue = tokens.map(token => {
      // Convert balance to a human-readable number based on decimals
      const balance = token.decimals > 0 
        ? Number(token.balance) / (10 ** token.decimals) 
        : Number(token.balance);
        
      // Calculate token's USD value
      const tokenValueUsd = balance * (token.prices?.USD || 0);
      chainTotalValue += tokenValueUsd;
      
      return { 
        ...token, 
        valueUsd: tokenValueUsd,
        readableBalance: balance
      };
    });
    
    totalValueUsd += chainTotalValue;
    
    // Get proper chain name
    const chainDisplay = chain === 'eth' ? 'ETHEREUM' : 
                         chain === 'base' ? 'BASE' : 
                         chain === 'polygon' ? 'POLYGON' :
                         chain === 'avalanche' ? 'AVALANCHE' :
                         chain === 'optimism' ? 'OPTIMISM' :
                         chain === 'arbitrum' ? 'ARBITRUM' :
                         chain === 'gnosis' ? 'GNOSIS' :
                         chain === 'fantom' ? 'FANTOM' :
                         chain.toUpperCase();
    
    logger.debug(`Chain ${chainDisplay} total value: $${chainTotalValue.toFixed(2)}`);
    responseText += `${chainDisplay}: $${chainTotalValue.toFixed(2)}\n`;
    
    // Filter and sort tokens by actual value (not just price)
    const significantTokens = tokensWithValue
      .filter(t => t.valueUsd > 1)  // Only show tokens worth more than $1
      .sort((a, b) => b.valueUsd - a.valueUsd);  // Sort by value high to low
    
    logger.debug(`Chain ${chain} has ${significantTokens.length} significant tokens out of ${tokens.length} total`);
    
    if (significantTokens.length > 0) {
      responseText += "Significant tokens:\n";
      
      // Display top tokens (max 5)
      for (let i = 0; i < Math.min(significantTokens.length, 5); i++) {
        const token = significantTokens[i];
        if (token) {
          // Format balance with appropriate decimal places based on value
          let formattedBalance = token.readableBalance.toString();
          if (token.readableBalance < 0.0001) {
            formattedBalance = token.readableBalance.toExponential(4);
          } else if (token.readableBalance < 1) {
            formattedBalance = token.readableBalance.toFixed(6);
          } else if (token.readableBalance < 1000) {
            formattedBalance = token.readableBalance.toFixed(4);
          } else {
            formattedBalance = token.readableBalance.toLocaleString(undefined, { maximumFractionDigits: 2 });
          }
          
          responseText += `- ${token.symbol}: ${formattedBalance} ($${token.valueUsd.toFixed(2)})\n`;
        }
      }
      
      // Show count of remaining tokens
      if (significantTokens.length > 5) {
        responseText += `  ... and ${significantTokens.length - 5} more tokens\n`;
      }
    } else {
      responseText += "No significant token holdings found.\n";
    }
    
    // Also mention total tokens on this chain
    const otherTokens = tokens.length - significantTokens.length;
    if (otherTokens > 0) {
      responseText += `Plus ${otherTokens} other tokens with smaller values.\n`;
    }
    
    responseText += "\n";
  }
  
  logger.debug(`Overall statistics: Total value: $${totalValueUsd.toFixed(2)}, Total tokens: ${totalTokenCount}`);
  responseText += `Total value across all chains: $${totalValueUsd.toFixed(2)}\n`;
  
  return {
    formattedResponse: responseText,
    totalValueUsd
  };
}

