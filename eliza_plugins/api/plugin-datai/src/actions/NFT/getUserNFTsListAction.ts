/**
 * Get User NFTs List Action
 * 
 * This action retrieves all NFTs for a user, optionally filtered by chain.
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
 * Action to retrieve a list of all NFTs owned by a user
 */
export const getUserNFTsListAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_USER_NFTS_LIST_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_USER_NFTS_LIST_DATAI",
    "FETCH_ALL_USER_NFTS",
    "LIST_USER_NFT_COLLECTION",
    "SHOW_ALL_NFTS",
    "GET_MY_NFT_COLLECTION"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves all NFTs owned by a user, optionally filtered by chain",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getUserNFTsList action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    if (!apiKey) {
      logger.error(`getUserNFTsList validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    const messageText = message.content?.text || '';
    logger.debug(`Analyzing message text: ${messageText}`);
    
    const userAddress = extractWalletAddress(messageText);
    logger.debug(`Extracted wallet address: ${userAddress || 'none'}`);
    
    if (!userAddress) {
      logger.debug("getUserNFTsList validation failed: No wallet address found in message");
      return false;
    }
    
    if (!isValidWalletAddress(userAddress)) {
      logger.error(`getUserNFTsList validation failed: Invalid wallet address ${userAddress}`);
      return false;
    }
    
    // Chain ID is optional for this action
    const chainId = extractChainId(messageText);
    logger.debug(`Extracted chain ID (optional): ${chainId || 'none'}`);
    
    logger.debug("getUserNFTsList validation successful");
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
    logger.info("Executing getUserNFTsList action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    try {
      // Extract parameters
      const messageText = message.content?.text || '';
      logger.debug(`Analyzing message text for parameters: ${messageText}`);
      
      const userAddress = extractWalletAddress(messageText);
      logger.debug(`Extracted wallet address: ${userAddress || 'none'}`);
      
      const chainId = extractChainId(messageText);
      logger.debug(`Extracted chain ID (optional): ${chainId || 'none'}`);
      
      if (!userAddress || !callback) {
        // We need both a wallet address and a callback to proceed
        logger.error(`Missing parameters: userAddress=${!!userAddress}, callback=${!!callback}`);
        
        if (callback) {
          callback({
            text: 'Please provide a valid wallet address to check NFTs.',
            content: { 
              success: false, 
              error: 'No wallet address provided' 
            }
          });
        } else {
          logger.error('getUserNFTsList: No callback provided');
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
      let endpoint = ENDPOINTS.GET_USER_NFTS_LIST_DATAI.replace('{userAddress}', userAddress);
      
      // Add chain parameter if provided
      if (chainId) {
        endpoint += `?chain=${chainId}`;
        logger.debug(`Chain filter applied: ${chainId}`);
      } else {
        logger.debug('No chain filter applied - getting NFTs across all chains');
      }
      
      logger.info(`Fetching NFTs for ${userAddress}${chainId ? ` on chain ${chainId}` : ''}`);
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
        logger.error(`API error when fetching NFTs: ${errorMessage}`);
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
      logger.debug(`NFT data received: ${nfts ? nfts.length : 0} NFTs found`);
      
      if (!nfts || nfts.length === 0) {
        logger.debug(`No NFTs found for address ${userAddress}${chainId ? ` on chain ${chainId}` : ''}`);
        callback({
          text: `No NFTs found for address ${userAddress}${chainId ? ` on chain ${chainId}` : ''}.`,
          content: { 
            success: true, 
            data: { nfts: [] } 
          }
        });
        
        return true;
      }
      
      // Use dedicated formatting function
      logger.debug('Using dedicated formatting function for NFT data');
      const responseText = formatNFTsListResponse(nfts, userAddress, chainId || null);
      
      logger.debug('Sending success response with formatted text');
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
      logger.error(`getUserNFTsList unexpected error: ${errorMessage}`);
      
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
          text: "What NFTs do I own? My wallet is 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI ?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your NFT collection...",
          actions: ["GET_USER_NFTS_LIST_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me all my NFTs on Ethereum for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch your Ethereum NFTs. One moment please...",
          actions: ["GET_USER_NFTS_LIST_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get all NFTs for 0x3764D79db51726E900a1380055F469eB6e2a7fD3 across all chains",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving all NFTs for this wallet address...",
          actions: ["GET_USER_NFTS_LIST_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

/**
 * Format NFTs list response into a user-friendly message
 * 
 * @param nfts - NFT data from API
 * @param userAddress - The wallet address that was queried
 * @param chainId - Optional chain ID if filtering by chain
 * @returns Formatted response message
 */
function formatNFTsListResponse(
  nfts: NftBalanceDetail[],
  userAddress: string,
  chainId: string | null
): string {
  // Group NFTs by chain for better presentation
  const nftsByChain: Record<string, NftBalanceDetail[]> = {};
  
  for (const nft of nfts) {
    if (!nftsByChain[nft.chain]) {
      nftsByChain[nft.chain] = [];
    }
    
    nftsByChain[nft.chain]?.push(nft);
  }
  
  // Format response text
  let responseText = `📊 NFT Collection for ${userAddress} 📊\n`;
  responseText += `Found ${nfts.length} NFTs${chainId ? ` on chain ${chainId.toUpperCase()}` : ' across all chains'}\n\n`;
  
  // Add details for each chain
  for (const [chain, chainNfts] of Object.entries(nftsByChain)) {
    responseText += `🔷 ${chain.toUpperCase()} (${chainNfts.length} NFTs)\n`;
    
    // List NFTs within the chain
    for (const nft of chainNfts) {
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
  }
  
  return responseText;
}

/**
 * TEST DATA FOR THIS ACTION
 * 
 * Endpoint: https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/{userAddress}?chain={chain}
 * 
 * Test Parameters Used:
 * - userAddress: 0x3764D79db51726E900a1380055F469eB6e2a7fD3
 * - chain: (Optional) Can be omitted to get NFTs across all chains
 * 
 * Tested cURL Command:
 * curl -X GET -H "Authorization: GET_YOUR_DATAI_API" \
 * "https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/0x3764D79db51726E900a1380055F469eB6e2a7fD3" | cat
 * 
 * Notes:
 * - The API call without a specific chain parameter was successful
 * - It returned NFTs owned by the address across multiple chains (base, matic, eth, etc.)
 * - To get NFTs for a specific chain, add "?chain={chain}" parameter to the endpoint
 */
