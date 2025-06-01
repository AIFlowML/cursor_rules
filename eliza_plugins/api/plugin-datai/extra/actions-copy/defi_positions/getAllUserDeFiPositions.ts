/**
 * Get All User DeFi Positions Action
 * 
 * This action retrieves all DeFi positions for a user across all active chains.
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
import { validateGetAllUserDeFiPositionsParams, extractWalletAddress } from "../../utils/validation";
import { API_CONFIG, ENDPOINTS } from "../../constants";
import type { UserDeFiPosition } from "../../types";

/**
 * Interfaces to handle the mismatch between our type definitions and actual API response
 * The API returns a structure that doesn't match our TypeScript definitions:
 * - API returns 'total' instead of 'statistic' with navUSD property
 * - API returns 'detailed' instead of 'detail' with supply, borrow, rewards arrays
 */

// Token data structure, appears in supply/borrow/rewards arrays
interface TokenItem {
  id?: string;
  tokenAddress?: string;
  tokenDecimals?: number;
  tokenName?: string;
  tokenSymbol?: string;
  usdRate?: number;
  balance?: number;
  balanceUSD?: number;
  logo?: string;
  reserve?: unknown;
  apy?: unknown;
  balanceDecimal?: number;
}

// Structure for statistics or total field
interface StatisticsOrTotal {
  navUSD?: number;
  supplyUSD?: number;
  debtUSD?: number;
  txFeeUSD?: number;
  active?: boolean;
}

// Structure for detail or detailed field
interface DetailOrDetailed {
  supply?: TokenItem[];
  borrow?: TokenItem[];
  rewards?: TokenItem[];
  lpTokenAddress?: string;
  poolTokenName?: string;
  poolTokenSymbol?: string;
  poolAddress?: string;
  lpToken?: unknown;
  poolApy?: unknown;
  balanceOf?: unknown;
  totalSupply?: unknown;
  unlock?: unknown;
  description?: unknown;
}

// Combined interface that handles both API response and type definition structures
interface PortfolioItem {
  // From type definition
  statistic?: StatisticsOrTotal;
  detail?: DetailOrDetailed;
  
  // From actual API response
  total?: StatisticsOrTotal;
  detailed?: DetailOrDetailed;
  
  // Common fields
  yieldAndPnl?: unknown;
  poolData?: unknown;
  module?: string;
  proxy?: unknown;
}

/**
 * Get the NAV (Net Asset Value) from a portfolio item 
 * Handles the mismatch between our type definitions and the actual API response
 */
function getNavValue(portfolioItem: PortfolioItem): number {
  // If the item follows our type definition
  if (portfolioItem.statistic?.navUSD !== undefined) {
    return portfolioItem.statistic.navUSD;
  }
  // If the item follows the actual API response structure
  if (portfolioItem.total?.navUSD !== undefined) {
    return portfolioItem.total.navUSD;
  }
  return 0;
}

/**
 * Get token lists from a portfolio item
 * Handles the mismatch between our type definitions and the actual API response
 */
function getTokenLists(portfolioItem: PortfolioItem): { 
  supply: TokenItem[],
  borrow: TokenItem[],
  rewards: TokenItem[]
} {
  const empty = { supply: [], borrow: [], rewards: [] };
  
  // If the item follows our type definition
  if (portfolioItem.detail) {
    return {
      supply: portfolioItem.detail.supply || [],
      borrow: portfolioItem.detail.borrow || [],
      rewards: portfolioItem.detail.rewards || []
    };
  }
  
  // If the item follows the actual API response structure
  if (portfolioItem.detailed) {
    return {
      supply: portfolioItem.detailed.supply || [],
      borrow: portfolioItem.detailed.borrow || [],
      rewards: portfolioItem.detailed.rewards || []
    };
  }
  
  return empty;
}

/**
 * Action to retrieve all DeFi positions for a user across all active chains
 */
export const getAllUserDeFiPositionsAction: Action = {
  /**
   * Action identifier
   */
  name: "GET_ALL_USER_DEFI_POSITIONS_ON_DATAI",
  
  /**
   * Alternative action names
   */
  similes: [
    "GET_ALL_USER_DEFI_POSITIONS_ON_DATAI",
    "FETCH_ALL_DEFI_POSITIONS_ON_DATAI",
    "RETRIEVE_ALL_DEFI_INVESTMENTS_ON_DATAI",
    "SHOW_ALL_DEFI_POSITIONS_ON_DATAI",
    "LIST_ALL_DEFI_HOLDINGS_ON_DATAI"
  ],
  
  /**
   * Human-readable description of the action
   */
  description: "Retrieves all DeFi positions for a user across all active chains on DATAI",
  
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    logger.debug("Validating getAllUserDeFiPositions action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    
    // Check if message contains DATAI keyword
    const userText = message.content?.text || '';
    logger.debug(`Full message text: "${userText}"`);
    
    const containsDataiKeyword = userText.toLowerCase().includes('datai');
    logger.debug(`Contains DATAI keyword: ${containsDataiKeyword}`);
    
    // Check for DeFi positions related keywords
    const containsDeFiKeywords = 
      userText.toLowerCase().includes('defi') || 
      userText.toLowerCase().includes('positions') || 
      userText.toLowerCase().includes('investments');
    logger.debug(`Contains DeFi keywords: ${containsDeFiKeywords}`);
    
    // Verify API key is present
    const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                  process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
    
    logger.debug(`API key availability: ${apiKey ? 'Available' : 'Missing'}`);
    
    if (!apiKey) {
      logger.error(`getAllUserDeFiPositions validation failed: Missing ${API_CONFIG.DATAI_API_KEY_ENV_VAR}`);
      return false;
    }
    
    // Extract wallet address
    logger.debug(`Attempting to extract wallet address from: "${userText}"`);
    
    const userAddress = extractWalletAddress(userText);
    if (!userAddress) {
      logger.error("getAllUserDeFiPositions validation failed: No wallet address found in message");
      logger.debug(`Message text that failed wallet extraction: "${userText}"`);
      
      // If message contains wallet keyword but no address was found, log more details
      if (userText.toLowerCase().includes('wallet') || userText.toLowerCase().includes('address')) {
        logger.debug("Message contains wallet/address keywords but extraction failed");
        logger.debug("This might indicate a malformed address or regex pattern issue");
      }
      
      return false;
    }
    
    logger.debug(`Successfully extracted wallet address: ${userAddress}`);
    
    // Validate the address format
    const validation = validateGetAllUserDeFiPositionsParams({ userAddress });
    logger.debug(`Validation result: ${JSON.stringify(validation)}`);
    
    if (!validation.isValid) {
      logger.error(`getAllUserDeFiPositions validation failed: ${validation.error}`);
      return false;
    }
    
    // Additional validation step to ensure we have the right context (DeFi + Datai)
    if (!containsDataiKeyword && !containsDeFiKeywords) {
      logger.debug("Message lacks both DATAI and DeFi keywords - might be an unrelated wallet request");
      // Don't fail here - if address is valid we'll still proceed, but log the concern
    }
    
    logger.debug("getAllUserDeFiPositions validation successful");
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
    logger.info("Executing getAllUserDeFiPositions action");
    logger.debug(`Message content: ${JSON.stringify(message.content)}`);
    logger.debug(`State: ${JSON.stringify(state)}`);
    logger.debug(`Options: ${JSON.stringify(options)}`);
    
    try {
      // Extract parameters
      const userText = message.content?.text || '';
      logger.debug(`Attempting to extract wallet address from: "${userText}"`);
      
      const userAddress = extractWalletAddress(userText);
      logger.debug(`Extracted wallet address: ${userAddress || 'none'}`);
      
      if (!userAddress || !callback) {
        // We need both a wallet address and a callback to proceed
        logger.debug(`Missing requirements - userAddress: ${!!userAddress}, callback: ${!!callback}`);
        
        if (callback) {
          callback({
            text: 'Please provide a valid wallet address to check DeFi positions.',
            content: { 
              success: false, 
              error: 'No wallet address provided' 
            }
          });
          logger.debug("Sent error response: No wallet address provided");
        } else {
          logger.error('getAllUserDeFiPositions: No callback provided');
        }
        
        return false;
      }
      
      // Create API client
      const apiKey = runtime.getSetting(API_CONFIG.DATAI_API_KEY_ENV_VAR) || 
                   process.env[API_CONFIG.DATAI_API_KEY_ENV_VAR];
      logger.debug(`Using API key (truncated): ${apiKey ? `${apiKey.substring(0, 5)}...` : 'none'}`);
      
      const apiClient = new DataiApiClient(apiKey);
      
      // Call API - substitute the userAddress value into the endpoint
      const endpoint = ENDPOINTS.GET_ALL_USER_DEFI_POSITIONS.replace('{userAddress}', userAddress);
      logger.debug(`Constructed API endpoint: ${endpoint}`);
      
      logger.info(`Fetching DeFi positions for ${userAddress}`);
      logger.debug(`Making API request to ${endpoint}`);
      
      // Log the API key being used (first 5 chars only for security)
      const apiKeyTruncated = `${apiKey.substring(0, 10)}...`;
      logger.debug(`Using API key: ${apiKeyTruncated}`);
      
      const response = await apiClient.get<UserDeFiPosition[]>(endpoint);
      logger.debug(`API response received: success=${response.success}, error=${response.error || 'none'}`);
      logger.debug(`Response status code: ${response.statusCode}`);
      logger.debug(`Response data items: ${response.data ? response.data.length : 0}`);
      
      // Log the first position in detail to understand the structure
      if (response.data && response.data.length > 0) {
        const samplePosition = response.data[0];
        if (samplePosition) {
          logger.debug(`Sample position structure: ${JSON.stringify(samplePosition, null, 2)}`);
          
          // Check if portfolio exists and has items
          if (samplePosition.portfolio && samplePosition.portfolio.length > 0) {
            logger.debug(`Sample portfolio item: ${JSON.stringify(samplePosition.portfolio[0], null, 2)}`);
          }
        }
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
        
        logger.debug(`Sent error response to user: ${errorMessage}`);
        return false;
      }
      
      // Process successful response
      const positions = response.data || [];
      logger.debug(`Processing ${positions.length} DeFi positions`);
      
      if (!positions || positions.length === 0) {
        logger.debug(`No positions found for address ${userAddress}`);
        callback({
          text: `No DeFi positions found for address ${userAddress}.`,
          content: { 
            success: true, 
            data: { positions: [] } 
          }
        });
        
        logger.debug("Sent empty positions response to user");
        return true;
      }
      
      // Calculate total value across all positions
      let totalValue = 0;
      let positionCount = 0;
      
      logger.debug("Calculating total value across all positions");
      for (const pos of positions) {
        if (pos.portfolio) {
          for (const p of pos.portfolio) {
            const navValue = getNavValue(p as unknown as PortfolioItem);
            totalValue += navValue;
            positionCount++;
            logger.debug(`Position: ${pos.name}, portfolio item value: $${navValue.toFixed(2)}`);
          }
        }
      }
      logger.debug(`Total calculated value: $${totalValue.toFixed(2)} across ${positionCount} portfolio items`);
      
      // Group positions by chain for better presentation
      logger.debug("Grouping positions by chain");
      const positionsByChain: Record<string, UserDeFiPosition[]> = {};
      
      // Process each position and ensure the chain key exists first
      for (const pos of positions) {
        // Create array for this chain if it doesn't exist
        const chain = pos.chain || 'unknown';
        if (!positionsByChain[chain]) {
          positionsByChain[chain] = [];
          logger.debug(`Created new chain group for: ${chain}`);
        }
        
        // The code below is guaranteed to be safe because we've just initialized
        // the array if it didn't exist
        const chainArray = positionsByChain[chain];
        if (chainArray) {
          chainArray.push(pos);
          logger.debug(`Added position ${pos.name} to chain ${chain}`);
        }
      }
      
      logger.debug(`Grouped positions into ${Object.keys(positionsByChain).length} chains`);
      
      logger.debug("Generating response using formatting function");
      // Use type assertions with our new interfaces
      const responseText = formatDeFiPositionsResponse(
        positions as unknown as UserDeFiPositionExtended[], 
        userAddress, 
        totalValue, 
        positionsByChain as unknown as Record<string, UserDeFiPositionExtended[]>
      );
      
      logger.debug("Sending complete response to user");
      logger.debug(`Response text (truncated): ${responseText.substring(0, 100)}...`);
      
      callback({
        text: responseText,
        content: { 
          success: true, 
          data: { positions } 
        }
      });
      
      logger.debug("Successfully completed getAllUserDeFiPositions action");
      return true;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`getAllUserDeFiPositions error: ${errorMessage}`);
      
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      
      if (callback) {
        logger.debug(`Sending error response to user: ${errorMessage}`);
        callback({
          text: `Failed to retrieve DeFi positions: ${errorMessage}`,
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
          text: "What are all my DATAI DeFi positions for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 ?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check the DeFi positions for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 across all chains...",
          actions: ["GET_ALL_USER_DEFI_POSITIONS_ON_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me all DeFi investments for address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll fetch the DeFi positions for this wallet. One moment please...",
          actions: ["GET_ALL_USER_DEFI_POSITIONS_ON_DATAI"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get all DeFi positions for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 please",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Retrieving all DeFi positions for this wallet address across all chains...",
          actions: ["GET_ALL_USER_DEFI_POSITIONS_ON_DATAI"],
        },
      },
    ]
  ] as ActionExample[][],
}; 

// Extended UserDeFiPosition to include portfolioItems with our PortfolioItem type
interface UserDeFiPositionExtended extends Omit<UserDeFiPosition, 'portfolio'> {
  portfolio: PortfolioItem[];
}

/**
 * Format DeFi positions response into a user-friendly message
 * 
 * @param positions - DeFi positions data from API
 * @param userAddress - The wallet address that was queried
 * @param totalValue - Precalculated total value across all positions (optional)
 * @param positionsByChain - Precalculated positions grouped by chain (optional)
 * @returns Formatted response message
 */
function formatDeFiPositionsResponse(
  positions: UserDeFiPositionExtended[], 
  userAddress: string,
  precalculatedTotal?: number,
  precalculatedPositionsByChain?: Record<string, UserDeFiPositionExtended[]>
): string {
  // NOTE: The API response structure doesn't match our type definitions in types/index.ts
  // - Actual API returns 'total.navUSD' but our types expect 'statistic.navUSD'
  // - Actual API returns 'detailed.supply' but our types expect 'detail.supply'
  // We're using type assertions and helper functions to work around this mismatch
  
  // Calculate total value across all positions if not provided
  let totalValue = precalculatedTotal ?? 0;
  
  // Keep track of unique token symbols
  const uniqueTokens = new Set<string>();
  // Track total token quantity (sum of balanceDecimal)
  let totalTokenQuantity = 0;
  
  if (precalculatedTotal === undefined) {
    for (const pos of positions) {
      if (pos.portfolio) {
        for (const p of pos.portfolio) {
          // Use helper function to get NAV value
          totalValue += getNavValue(p);
          
          // Use helper function to get token lists
          const tokenLists = getTokenLists(p);
          
          // Add unique token symbols and sum balanceDecimal
          for (const token of tokenLists.supply) {
            if (token.tokenSymbol) uniqueTokens.add(token.tokenSymbol);
            // Add to total token quantity
            if (token.balanceDecimal !== undefined) {
              totalTokenQuantity += token.balanceDecimal;
            } else if (token.balance) {
              // Fallback if balanceDecimal not available
              totalTokenQuantity += Number(token.balance);
            }
          }
          
          for (const token of tokenLists.borrow) {
            if (token.tokenSymbol) uniqueTokens.add(token.tokenSymbol);
            // Add to total token quantity (borrow tokens count as negative)
            if (token.balanceDecimal !== undefined) {
              totalTokenQuantity -= token.balanceDecimal;
            } else if (token.balance) {
              // Fallback if balanceDecimal not available
              totalTokenQuantity -= Number(token.balance);
            }
          }
          
          for (const token of tokenLists.rewards) {
            if (token.tokenSymbol) uniqueTokens.add(token.tokenSymbol);
            // Add to total token quantity
            if (token.balanceDecimal !== undefined) {
              totalTokenQuantity += token.balanceDecimal;
            } else if (token.balance) {
              // Fallback if balanceDecimal not available
              totalTokenQuantity += Number(token.balance);
            }
          }
        }
      }
    }
  }
  
  // Group positions by chain for better presentation if not provided
  const positionsByChain: Record<string, UserDeFiPositionExtended[]> = precalculatedPositionsByChain ? 
    { ...precalculatedPositionsByChain } : {};
    
  if (precalculatedPositionsByChain === undefined) {
    for (const pos of positions) {
      const chain = pos.chain || 'unknown';
      if (!positionsByChain[chain]) {
        positionsByChain[chain] = [];
      }
      positionsByChain[chain].push(pos);
    }
  }
  
  // Format response text
  let responseText = `Found ${positions.length} DeFi protocols with active positions for ${userAddress}\n`;
  responseText += `Total position value: $${totalValue.toFixed(2)}\n`;
  // responseText += `Total token quantity: ${totalTokenQuantity.toFixed(2)}\n`;
  // responseText += `Total unique token types: ${uniqueTokens.size}\n`;
  
  if (totalValue <= 0) {
    responseText += "\nNote: This wallet shows no positions with USD value. This could mean:\n";
    responseText += "- The wallet has inactive or empty positions\n";
    responseText += "- Position values may be too small to register\n";
    responseText += "- Tokens might not have reliable price data\n";
  }
  
  responseText += "\n";
  
  // Add details for each chain
  for (const [chain, chainPositions] of Object.entries(positionsByChain)) {
    let chainTotal = 0;
    const chainUniqueTokens = new Set<string>();
    
    for (const pos of chainPositions) {
      if (pos.portfolio) {
        for (const p of pos.portfolio) {
          // Use helper function to get NAV value
          const navValue = getNavValue(p);
          chainTotal += navValue;
          
          // Use helper function to get token lists
          const tokenLists = getTokenLists(p);
          
          // Count unique tokens per chain
          for (const token of tokenLists.supply) {
            if (token.tokenSymbol) chainUniqueTokens.add(token.tokenSymbol);
          }
          
          for (const token of tokenLists.borrow) {
            if (token.tokenSymbol) chainUniqueTokens.add(token.tokenSymbol);
          }
          
          for (const token of tokenLists.rewards) {
            if (token.tokenSymbol) chainUniqueTokens.add(token.tokenSymbol);
          }
        }
      }
    }
    
    responseText += `${chain.toUpperCase()}: $${chainTotal.toFixed(2)} (${chainUniqueTokens.size} tokens)\n`;
    
    // List positions within the chain
    for (const pos of chainPositions) {
      let posValue = 0;
      const tokenList: string[] = [];
      
      if (pos.portfolio) {
        for (const p of pos.portfolio) {
          // Use helper function to get NAV value
          posValue += getNavValue(p);
          
          // Use helper function to get token lists
          const tokenLists = getTokenLists(p);
          
          // Process supply tokens
          for (const token of tokenLists.supply) {
            // Use balanceDecimal if available, otherwise format balance
            const amount = token.balanceDecimal !== undefined 
              ? token.balanceDecimal 
              : (token.balance || 0);
            
            const symbol = token.tokenSymbol || 'Unknown';
            const valueUSD = token.balanceUSD || 0;
            
            if (amount > 0 || valueUSD > 0) {
              tokenList.push(`${amount.toFixed(2)} ${symbol} ($${valueUSD.toFixed(2)})`);
            }
          }
          
          // Process borrow tokens
          for (const token of tokenLists.borrow) {
            // Use balanceDecimal if available, otherwise format balance
            const amount = token.balanceDecimal !== undefined 
              ? token.balanceDecimal 
              : (token.balance || 0);
            
            const symbol = token.tokenSymbol || 'Unknown';
            const valueUSD = token.balanceUSD || 0;
            
            if (amount > 0 || valueUSD > 0) {
              tokenList.push(`-${amount.toFixed(2)} ${symbol} ($${valueUSD.toFixed(2)})`);
            }
          }
          
          // Process rewards tokens
          for (const token of tokenLists.rewards) {
            // Use balanceDecimal if available, otherwise format balance
            const amount = token.balanceDecimal !== undefined 
              ? token.balanceDecimal 
              : (token.balance || 0);
            
            const symbol = token.tokenSymbol || 'Unknown';
            const valueUSD = token.balanceUSD || 0;
            
            if (amount > 0 || valueUSD > 0) {
              tokenList.push(`${amount.toFixed(2)} ${symbol} (reward: $${valueUSD.toFixed(2)})`);
            }
          }
        }
      }
      
      responseText += `- ${pos.name}: $${posValue.toFixed(2)}\n`;
      
      // Add token details if we have any
      if (tokenList.length > 0) {
        responseText += `  Tokens: ${tokenList.join(', ')}\n`;
      }
    }
    
    responseText += '\n';
  }
  
  return responseText;
}


