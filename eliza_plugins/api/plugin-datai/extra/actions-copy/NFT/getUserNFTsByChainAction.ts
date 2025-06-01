/**
 * Get User NFTs By Chain Action
 * 
 * This action retrieves all NFTs for a user on a specific chain.
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
import { isValidWalletAddress, extractWalletAddress, extractChainId } from "../../utils/validation";
import { API_CONFIG, ENDPOINTS } from "../../constants";
import type { NftBalanceDetail } from "../../types";

/**
 * Action to retrieve a list of all NFTs owned by a user on a specific chain
 */
export const getUserNFTsByChainAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_NFTS_BY_CHAIN_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_NFTS_BY_CHAIN_DATAI",
    "FETCH_THIS_CHAIN_NFTS_DATAI",
    "LIST_NFT_COLLECTION_FOR_CHAIN_DATAI",
    "SHOW_CHAIN_SPECIFIC_NFTS_DATAI",
    "GET_MY_NFTS_ON_CHAIN_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves all NFTs owned by a user on a specific blockchain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getUserNFTsByChain action");
    logger.debug(`Message content: ${JSON.stringify(message.content?.text || '')}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`getUserNFTsByChain validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    logger.debug("Attempting to extract wallet address from message");
    const userAddress = extractWalletAddress(message.content?.text || '');
    logger.debug(`Extracted wallet address: ${userAddress || 'None'}`);
    
    if (!userAddress) {
      logger.debug("getUserNFTsByChain validation failed: No wallet address found in message");
      return false;
    }
    
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`getUserNFTsByChain validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    logger.debug(`Wallet address is valid: ${userAddress}`);
    
    logger.debug("Attempting to extract chain ID from message");
    const chainId = extractChainId(message.content?.text || '');
    logger.debug(`Extracted chain ID: ${chainId || 'None'}`);
    
    if (!chainId) {
      logger.debug("getUserNFTsByChain validation failed: No chain ID found in message");
      return false;
    }
    
    logger.debug(`getUserNFTsByChain validation successful: Will check NFTs for wallet ${userAddress} on chain ${chainId}`);
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
    logger.info("Executing getUserNFTsByChain action");
    
    try {
      // Extract parameters
      logger.debug("Extracting parameters from message");
      const userAddress = extractWalletAddress(message.content?.text || '');
      const chainId = extractChainId(message.content?.text || '');
      logger.debug(`Extracted parameters - userAddress: ${userAddress || 'None'}, chainId: ${chainId || 'None'}`);
      
      if (!userAddress || !chainId || !callback) {
        // We need a wallet address, chain ID, and callback to proceed
        logger.error(`Missing required parameters - userAddress: ${!!userAddress}, chainId: ${!!chainId}, callback: ${!!callback}`);
        
        if (callback) {
          if (!userAddress) {
            logger.debug("Returning error response: No wallet address provided");
            callback({
              text: 'Please provide a valid wallet address to check NFTs.',
              content: { 
                success: false, 
                error: 'No wallet address provided' 
              }
            });
          } else if (!chainId) {
            logger.debug("Returning error response: No chain ID provided");
            callback({
              text: 'Please specify a blockchain to check NFTs on (e.g., eth, matic, bsc).',
              content: { 
                success: false, 
                error: 'No chain ID provided' 
              }
            });
          }
        } else {
          logger.error('getUserNFTsByChain: No callback provided');
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
      let endpoint = ENDPOINTS.GET_USER_NFTS_BY_CHAIN_DATAI.replace('{userAddress}', userAddress);
      endpoint += `?chain=${chainId}`;
      logger.debug(`API endpoint: ${endpoint}`);
      
      logger.info(`Fetching NFTs for ${userAddress} on chain ${chainId}`);
      logger.debug(`Making API request to endpoint: ${endpoint}`);
      const response = await apiClient.get<NftBalanceDetail[]>(endpoint);
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
          text: `Error fetching NFTs: ${errorMessage}`,
          content: { 
            success: false, 
            error: errorMessage 
          }
        });
        
        return false;
      }
      
      // Process successful response
      const nfts = response.data;
      logger.debug(`Retrieved ${nfts?.length || 0} NFTs`);
      
      if (!nfts || nfts.length === 0) {
        logger.debug(`No NFTs found for address ${userAddress} on chain ${chainId}`);
        callback({
          text: `No NFTs found for address ${userAddress} on chain ${chainId}.`,
          content: { 
            success: true, 
            data: { nfts: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function
      logger.debug("Using dedicated formatting function for response");
      const responseText = formatNFTsByChainResponse(nfts, userAddress, chainId);
      
      logger.debug("Sending successful response");
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { nfts } 
        }
      });
      
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`getUserNFTsByChain error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        callback({
          text: `Failed to retrieve NFTs: ${errorMessage}`,
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
          text: "What NFTs do I own on Polygon for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your Polygon NFT collection...",
          actions: ["GET_USER_NFTS_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me the NFTs for address 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on matic chain on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch the NFTs on Polygon (matic). One moment please...",
          actions: ["GET_USER_NFTS_BY_CHAIN_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Do I have any NFTs on Polygon? My wallet is 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving your Polygon NFTs for this wallet address...",
          actions: ["GET_USER_NFTS_BY_CHAIN_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format NFTs by chain response into a user-friendly message
 * 
 * @param nfts - NFT data from API
 * @param userAddress - The wallet address that was queried
 * @param chainId - The blockchain chain ID
 * @returns Formatted response message
 */
function formatNFTsByChainResponse(
  nfts: NftBalanceDetail[],
  userAddress: string,
  chainId: string
): string {
  // Format response text with emojis and better visual structure
  let responseText = `📊 NFT Collection for ${userAddress} 📊\n`;
  responseText += `Found ${nfts.length} NFTs on ${chainId.toUpperCase()}\n\n`;
  
  // Add chain header
  responseText += `🔷 ${chainId.toUpperCase()} (${nfts.length} NFTs)\n`;
  
  // List all NFTs
  for (const nft of nfts) {
    // Basic NFT info with name and ID
    responseText += `• ${nft.tokenName || 'Unnamed NFT'} (#${nft.tokenId})`;
    
    // Add contract type if available
    if (nft.contractType) {
      responseText += ` [${nft.contractType}]`;
    }
    
    responseText += '\n';
    
    // Add contract address
    if (nft.tokenAddress) {
      responseText += `  Contract: ${nft.tokenAddress}\n`;
    }
    
    // Add link to view the NFT if available
    if (nft.detailUrl) {
      responseText += `  View: ${nft.detailUrl}\n`;
    }
    
    responseText += '\n';
  }
  
  return responseText;
}

/**
 * FULL TEST DATA FOR THIS ACTION
 * 
 * ## 13. Get User NFT List by Chain
 * 
 * **Endpoint:** `https://api-v1.mymerlin.io/api/merlin/public/balances/nft/chain/{userAddress}?chain={chain}`
 * 
 * **Test Parameters Used:**
 * - userAddress: 0x3764D79db51726E900a1380055F469eB6e2a7fD3
 * - chain: matic
 * 
 * **Tested cURL Command:**
 * curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/nft/chain/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic" | cat
 * 
 * **Essential Information:**
 * - Description: Get the user's wallet list of NFTs for a specific chain.
 * - API Key: Pass the API key in the Authorization header.
 * - Method: GET
 * - Path Parameters:
 *   - userAddress (string, required): The wallet address of the user.
 * - Query Parameters:
 *   - chain (string, required): The chain ID (e.g., eth, matic).
 */
