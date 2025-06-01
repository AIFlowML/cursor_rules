/**
 * Get User Native Token Balance By Chain Action
 * 
 * This action retrieves the user's native token balance (e.g., ETH for Ethereum, MATIC for Polygon)
 * for a specific chain.
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
import type { NativeTokenBalanceResponse } from "../../types";

/**
 * Action to retrieve the user's native token balance for a specific chain
 */
export const getNativeTokenBalanceByChainAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_NATIVE_TOKEN_BALANCE_BY_CHAIN_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_NATIVE_TOKEN_BALANCE_BY_CHAIN_DATAI",
    "FETCH_NATIVE_CURRENCY_BALANCE_DATAI",
    "GET_ETH_BALANCE_DATAI",
    "CHECK_NATIVE_TOKEN_BALANCE_DATAI",
    "SHOW_NATIVE_COIN_BALANCE_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves the user's native token balance (e.g., ETH for Ethereum, MATIC for Polygon) for a specific chain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getNativeTokenBalanceByChain action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    if (!apiKey) {
      logger.error(`getNativeTokenBalanceByChain validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'null'}`);
    if (!userAddress) {
      logger.debug("getNativeTokenBalanceByChain validation failed: No wallet address found in message");
      return false;
    }
    
    const chain = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chain || 'null'}`);
    if (!chain) {
      logger.debug("getNativeTokenBalanceByChain validation failed: No chain ID found in message");
      return false;
    }
    
    logger.debug("getNativeTokenBalanceByChain validation passed");
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
    logger.info("Executing getNativeTokenBalanceByChain action");
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chain = extractChainId(message.content?.text || '');
      
      logger.debug(`Extracted parameters: userAddress=${userAddress}, chain=${chain}`);
      
      if (!userAddress || !chain || !callback) {
        // We need both a wallet address, chain, and a callback to proceed
        logger.error(`Missing required parameters: userAddress=${!!userAddress}, chain=${!!chain}, callback=${!!callback}`);
        
        if (callback) {
          callback({
            text: 'Please provide a valid wallet address and chain ID to check native token balance.',
            content: { 
              success: false, 
              error: !userAddress ? 'No wallet address provided' : 'No chain ID provided' 
            }
          });
        } else {
          logger.error('getNativeTokenBalanceByChain: No callback provided');
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
      const endpoint = `${ENDPOINTS.GET_NATIVE_TOKEN_BALANCE_BY_CHAIN_DATAI.replace('{userAddress}', userAddress)}?chain=${chain}`;
      
      logger.info(`Fetching native token balance for ${userAddress} on chain ${chain}`);
      logger.debug(`API endpoint: ${endpoint}`);
      
      const response = await apiClient.get<NativeTokenBalanceResponse>(endpoint);
      logger.debug(`API response received: success=${response.success}, error=${response.error || 'none'}`);
      
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
          text: `Error fetching native token balance on chain ${chain}: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const balanceData = response.data;
      logger.debug(`Processing response data: ${JSON.stringify(balanceData)}`);
      
      if (!balanceData) {
        logger.debug(`No balance data returned for ${userAddress} on ${chain}`);
        callback({
          text: `No native token balance found for address ${userAddress} on chain ${chain}.`,
          content: { 
            success: true, 
            data: { balance: null } 
          }
        });
        
        return true;
      }
      
      // Map chain IDs to native token symbols
      const nativeTokens: Record<string, string> = {
        eth: 'ETH',
        matic: 'MATIC',
        bsc: 'BNB',
        avax: 'AVAX',
        ftm: 'FTM',
        op: 'ETH',
        arb: 'ETH',
        sol: 'SOL',
        solana: 'SOL',
        base: 'ETH',
   
      };
      
      const tokenSymbol = nativeTokens[chain.toLowerCase()] || chain.toUpperCase();
      logger.debug(`Identified token symbol: ${tokenSymbol} for chain ${chain}`);
      
      /* Original formatting code
      // Format response text
      let responseText = `Native Token Balance for ${userAddress} on ${chain.toUpperCase()}:\n\n`;
      responseText += `Raw Balance: ${balanceData.balance} wei\n`;
      responseText += `Decimal Balance: ${balanceData.balanceDecimal} ${tokenSymbol}\n`;
      */
      
      // Use dedicated formatting function for response text
      const responseText = formatNativeTokenBalanceResponse(
        balanceData,
        userAddress,
        chain,
        tokenSymbol
      );
      
      logger.debug(`Formatted response: ${responseText}`);
      
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { 
            balance: balanceData.balance,
            balanceDecimal: balanceData.balanceDecimal,
            tokenSymbol
          } 
        }
      });
      
      logger.info("getNativeTokenBalanceByChain action completed successfully");
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`getNativeTokenBalanceByChain error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve native token balance: ${errorMessage}`,
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
          text: "What is my ETH native balance for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI ?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your ETH native balance on Ethereum for 0x3764D79db51726E900a1380055F469eB6e2a7fD3...",
          actions: ["GET_NATIVE_TOKEN_BALANCE_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me the native token balance for 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on eth chain on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch the native ETH balance on Ethereum chain. One moment please...",
          actions: ["GET_NATIVE_TOKEN_BALANCE_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "How much ethereum does wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 have on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me retrieve the ETH balance for that wallet address...",
          actions: ["GET_NATIVE_TOKEN_BALANCE_BY_CHAIN_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format native token balance response into a user-friendly message
 * 
 * @param balanceData - Native token balance data from API
 * @param userAddress - The wallet address that was queried
 * @param chain - The blockchain chain identifier
 * @param tokenSymbol - The native token symbol (e.g., ETH, MATIC)
 * @returns Formatted response message
 */
function formatNativeTokenBalanceResponse(
  balanceData: NativeTokenBalanceResponse,
  userAddress: string,
  chain: string,
  tokenSymbol: string
): string {
  // Format the decimal balance with commas for thousands separators and 6 decimal places max
  const formattedBalance = Number.parseFloat(balanceData.balanceDecimal.toString()).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
  
  // Calculate USD value if we had the price data
  // For now, let's prepare a more user-friendly response
  
  // Create a more visually appealing response
  let responseText = "Native Token Balance Report\n\n";
  responseText += `Network: ${chain.toUpperCase()}\n`;
  responseText += `Wallet: ${userAddress}\n`;
  responseText += `Balance: ${formattedBalance} ${tokenSymbol}\n`;
  
  // Optional: Add a raw balance in a more readable format
  if (balanceData.balance) {
    // Convert to scientific notation for large numbers
    const rawBalanceFormatted = balanceData.balance.toString().length > 15 
      ? Number.parseFloat(balanceData.balance.toString()).toExponential(4)
      : balanceData.balance.toString();
    
    responseText += `\nRaw Balance: ${rawBalanceFormatted} wei`;
  }
  
  return responseText;
}


