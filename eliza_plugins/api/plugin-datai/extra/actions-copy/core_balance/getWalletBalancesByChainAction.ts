/**
 * Get Wallet Balances By Chain Action
 * 
 * This action retrieves a user's direct wallet balances for a specific chain,
 * including native currency, tokens (ERC20, etc.), and NFTs (ERC721, ERC1155).
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
import type { WalletBalancesByChainResponse } from "../../types";

/**
 * Validation function for getWalletBalancesByChain params
 */
function validateGetWalletBalancesByChainParams(params: { 
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
 * Action to retrieve a user's wallet balances for a specific chain
 */
export const getWalletBalancesByChainAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_WALLET_BALANCES_BY_CHAIN_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_WALLET_BALANCES_BY_CHAIN_DATAI",
    "FETCH_CHAIN_WALLET_BALANCES",
    "GET_WALLET_DETAILS",
    "SHOW_BLOCKCHAIN_HOLDINGS",
    "LIST_CHAIN_ASSETS"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves a user's direct wallet balances for a specific chain, including native currency, tokens, and NFTs",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getWalletBalancesByChain action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    if (!apiKey) {
      logger.error(`getWalletBalancesByChain validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'Not found'}`);
    
    if (!userAddress) {
      logger.debug("getWalletBalancesByChain validation failed: No wallet address found in message");
      return false;
    }
    
    const chain = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chain || 'Not found'}`);
    
    if (!chain) {
      logger.debug("getWalletBalancesByChain validation failed: No chain ID found in message");
      return false;
    }
    
    const validation = validateGetWalletBalancesByChainParams({ userAddress, chain });
    logger.debug(`Validation result: ${validation.isValid ? 'Valid' : 'Invalid'}, Error: ${validation.error || 'None'}`);
    
    if (!validation.isValid) {
      logger.error(`getWalletBalancesByChain validation failed: ${validation.error}`);
      return false;
    }
    
    logger.debug("getWalletBalancesByChain validation successful");
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
    logger.info("Executing getWalletBalancesByChain action");
    logger.debug(`Message content: ${JSON.stringify(message.content || {})}`);
    logger.debug(`Options: ${JSON.stringify(options || {})}`);
    
    try {
      // Extract parameters
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chain = extractChainId(message.content?.text || '');
      
      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, chain: ${chain || 'None'}`);
      
      if (!userAddress || !chain || !callback) {
        // We need a wallet address, chain ID, and callback to proceed
        const missingParams = [];
        if (!userAddress) missingParams.push('userAddress');
        if (!chain) missingParams.push('chain');
        if (!callback) missingParams.push('callback');
        
        logger.error(`Missing required parameters: ${missingParams.join(', ')}`);
        
        if (callback) {
          callback({
            text: 'Please provide both a valid wallet address and chain ID to check balances.',
            content: { 
              success: false, 
              error: 'Missing required parameters' 
            }
          });
        } else {
          logger.error('getWalletBalancesByChain: No callback provided');
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
      logger.debug(`Created API client with key availability: ${apiKey ? 'Yes' : 'No'}`);
      
      // Call API - substitute the userAddress and chain values into the endpoint
      const endpoint = ENDPOINTS.GET_WALLET_BALANCES_BY_CHAIN_DATAI
        .replace('{userAddress}', userAddress)
        .replace('{chain}', chain);
      
      logger.info(`Fetching wallet balances for ${userAddress} on chain ${chain}`);
      logger.debug(`API endpoint: ${endpoint}`);
      
      const response = await apiClient.get<WalletBalancesByChainResponse>(endpoint);
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
          text: `Error fetching wallet balances: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const walletData = response.data;
      logger.debug(`Wallet data received: ${walletData ? 'Yes' : 'No'}`);
      
      if (!walletData) {
        logger.info(`No wallet data found for address ${userAddress} on chain ${chain}`);
        callback({
          text: `No wallet data found for address ${userAddress} on chain ${chain}.`,
          content: { 
            success: true, 
            data: { wallet: null } 
          }
        });
        
        return true;
      }
      
      logger.debug(`Processing wallet data - Native balance: ${walletData.nativeBalanceDecimal || '0.00'}`);
      logger.debug(`Token balances count: ${walletData.tokenBalances?.length || 0}`);
      logger.debug(`NFTs count: ${walletData.nfts?.length || 0}`);
      
      // Use the formatting function to generate response text
      const responseText = formatWalletBalancesResponse(walletData, userAddress, chain);
      
      logger.debug(`Response text prepared (${responseText.length} chars)`);
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { wallet: walletData } 
        }
      });
      logger.info(`Successfully completed getWalletBalancesByChain for ${userAddress} on ${chain}`);
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`getWalletBalancesByChain error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve wallet balances: ${errorMessage}`,
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
          text: "What is in my wallet balance on Polygon for address 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check your Polygon (matic) wallet contents for 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI...",
          actions: ["GET_WALLET_BALANCES_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me balance in my 0x3764D79db51726E900a1380055F469eB6e2a7fD3 wallet on Polygon on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch your Polygon (matic) wallet details for 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI. One moment please...",
          actions: ["GET_WALLET_BALANCES_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "List all assets balances in 0x3764D79db51726E900a1380055F469eB6e2a7fD3 wallet on matic on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving all assets in wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on the Polygon (matic) blockchain...",
          actions: ["GET_WALLET_BALANCES_BY_CHAIN_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format wallet balances response into a user-friendly message
 * 
 * @param walletData - Wallet balance data from API
 * @param userAddress - The wallet address that was queried
 * @param chain - The blockchain chain identifier
 * @returns Formatted response message
 */
function formatWalletBalancesResponse(
  walletData: WalletBalancesByChainResponse,
  userAddress: string,
  chain: string
): string {
  // Create a more visually appealing response
  let responseText = `📊 Wallet Holdings on ${chain.toUpperCase()} 📊\n\n`;
  responseText += `🔷 Wallet: ${userAddress}\n`;
  
  // Native token balance
  const nativeTokenSymbol = chain === 'matic' ? 'MATIC' : 
                          chain === 'eth' ? 'ETH' : 
                          chain === 'bsc' ? 'BNB' : 
                          chain === 'avax' ? 'AVAX' : 
                          chain === 'sol' ? 'SOL' : 
                          chain === 'arb' ? 'ETH' : 
                          chain === 'op' ? 'ETH' : 
                          chain === 'base' ? 'ETH' : 
                          chain.toUpperCase();
  
  const nativeBalanceNum = Number(walletData.nativeBalanceDecimal || 0);
  const formattedNativeBalance = nativeBalanceNum.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
  
  responseText += `🔷 Native Balance: ${formattedNativeBalance} ${nativeTokenSymbol}\n\n`;
  
  // Add token breakdown
  if (walletData.tokenBalances && walletData.tokenBalances.length > 0) {
    responseText += '💰 Token Balances 💰\n';
    
    // Sort tokens by value/balance (highest first)
    const tokens = [...walletData.tokenBalances].filter(token => {
      const decimals = token.tokenDecimals || 18;
      const amount = Number(token.balance) / (10 ** decimals);
      return amount > 0;
    });
    
    // Sort by balance
    tokens.sort((a, b) => {
      const aDecimals = a.tokenDecimals || 18;
      const bDecimals = b.tokenDecimals || 18;
      const aAmount = Number(a.balance) / (10 ** aDecimals);
      const bAmount = Number(b.balance) / (10 ** bDecimals);
      return bAmount - aAmount;
    });
    
    // Display tokens
    if (tokens.length === 0) {
      responseText += 'No token balances found.\n';
    } else {
      // Show all tokens - no display limit
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token) continue; // Skip if token is undefined
        
        const decimals = token.tokenDecimals || 18;
        const amount = Number(token.balance) / (10 ** decimals);
        
        // Format amount with appropriate decimal places
        const formattedAmount = amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        });
        
        responseText += `• ${token.tokenName || 'Unknown Token'} (${token.tokenSymbol || '???'}): ${formattedAmount}\n`;
      }
    }
  } else {
    responseText += '💰 Token Balances 💰\nNo tokens found.\n';
  }
  
  return responseText;
}

// FULL TEST DATA FOR THIS ACTION
// ## 8. Get User Wallet Balances by Chain (Native, Tokens, NFTs)

// **Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/{userAddress}?chain={chain}`

// **cURL to run (Generic):**
// ```bash
// curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/{userAddress}?chain={chain}"
// ```
// *(Replace `{userAddress}` with the actual user's wallet address and `{chain}` with the chain ID. Refer to `api_help.md` for working examples like `userAddress=0x3764D79db51726E900a1380055F469eB6e2a7fD3`, `chain=matic`)*

// **Test Parameters Used:**
// *   `userAddress`: `0x3764D79db51726E900a1380055F469eB6e2a7fD3`
// *   `chain`: `matic`

// **Tested cURL Command:**
// ```bash
// curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic" | cat
// ```

// **Essential Information:**
// *   **Description:** Get the user's direct wallet balances for a specific chain, including native currency, tokens (ERC20, etc.), and NFTs (ERC721, ERC1155).
// *   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
// *   **Method:** `GET`
// *   **Path Parameters:**
//     *   `userAddress` (string, required): The wallet address of the user.
// *   **Query Parameters:**
//     *   `chain` (string, required): The chain ID (e.g., `eth`, `matic`).
// *   **Response:** Returns a JSON object containing `nativeBalance`, `nativeBalanceDecimal`, an array of `tokenBalances` (with details like `tokenAddress`, `tokenName`, `tokenSymbol`, `tokenDecimals`, `balance`, `logoUrl`), and an array of `nfts` (with details like `tokenAddress`, `tokenName`, `tokenSymbol`, `chain`, `tokenId`, `contractType`, `ownerOf`, `detailUrl`). (See original documentation for schema details).

// **Suggested Action Name:** `GET_WALLET_BALANCES_BY_CHAIN_DATAI`
// **Corresponding .ts File:** `getWalletBalancesByChainAction.ts`

// # Action: GET_WALLET_BALANCES_BY_CHAIN_DATAI
// run_curl_test "GET_WALLET_BALANCES_BY_CHAIN_DATAI" "curl -X GET -H \"Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS\" \"https://api-v1.mymerlin.io/api/merlin/public/balances/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic\" | cat"
