import {
  type Action,
  type ActionExample,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
  ModelType,
} from "@elizaos/core";
import { createRequire } from "node:module";

import { getGnfdConfig, InitGnfdClient } from "../providers/gnfd";
import {
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { getBucketTemplate } from "../templates";

// Import the Client from greenfield-js-sdk
const require = createRequire(import.meta.url);
const {
  Client,
} = require("@bnb-chain/greenfield-js-sdk");

export { getBucketTemplate };

/**
 * Interface for bucket info response
 */
interface BucketInfo {
  id: string;
  bucketName: string;
  visibility: string;
  owner: string;
  createAt: string;
  paymentAddress: string;
  spInfo?: {
    address: string;
    endpoint: string;
  };
}

/**
 * Interface for Greenfield bucket response item
 */
interface GnfdBucketInfo {
  id?: string;
  bucketName?: string;
  name?: string;
  visibility?: number;
  owner?: string;
  createAt?: string | number;
  paymentAddress?: string;
  primarySpAddress?: string;
  spInfo?: {
    primarySp?: {
      address?: string;
      endpoint?: string;
    };
  };
}

/**
 * Interface for direct chain query bucket response
 */
interface ChainQueryBucket {
  id?: string;
  bucketName?: string;
  name?: string;
  visibility?: number;
  owner?: string;
  createAt?: string | number;
  paymentAddress?: string;
  primarySpAddress?: string;
}

/**
 * Interface for Greenfield Bucket List response
 */
interface GetBucketsResponse {
  address: string;
  isInitialized: boolean;
  buckets: BucketInfo[];
  explorerUrl?: string;
}

/**
 * GetBucketAction class - Handles listing buckets on BNB Greenfield
 * 
 * This class implements the core functionality to list all buckets
 * associated with an account on Greenfield.
 */
export class GetBucketAction {
  /**
   * Creates a new GetBucketAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   * @param gnfdClient - Greenfield client for blockchain interactions
   */
  constructor(
    private walletProvider: WalletProvider,
    private gnfdClient: typeof Client
  ) {}

  /**
   * Check if an account is initialized on Greenfield
   * 
   * @param address - The wallet address to check
   * @returns True if the account is initialized, false otherwise
   */
  async isAccountInitialized(address: string): Promise<boolean> {
    try {
      logger.debug(`Checking if account ${address} is initialized on Greenfield`);
      await this.gnfdClient.account.getAccount(address);
      logger.debug(`Account ${address} is initialized on Greenfield`);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.debug(`Account ${address} is not initialized on Greenfield: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get all buckets owned by the specified address
   * 
   * @param address - The owner address to query
   * @returns List of buckets and their details
   */
  async listBuckets(address: string): Promise<BucketInfo[]> {
    try {
      logger.debug(`Listing buckets for address: ${address}`);
      
      if (!this.gnfdClient) {
        logger.error("gnfdClient is undefined or null");
        throw new Error("gnfdClient is not initialized");
      }
      
      // Try SDK methods first (these attempts might not work based on logs)
      try {
        logger.debug("Trying SDK methods for bucket listing");
        
        // Log available methods on bucket for clarity
        if (this.gnfdClient.bucket) {
          const bucketMethods = Object.keys(this.gnfdClient.bucket);
          logger.debug(`Available methods on bucket: ${bucketMethods.join(', ')}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Error with SDK methods: ${msg}`);
      }
      
      // Define all SP endpoints to try (both mainnet and testnet)
      const endpoints = [
        'https://greenfield-sp.bnbchain.org',    // Mainnet suggested by user
        'https://greenfield-sp.nodereal.io',     // Generic mainnet endpoint
        'https://greenfield-sp.ninicoin.io',     // Generic mainnet endpoint
        'https://greenfield-sp.bnbchain.org',    // Alternative mainnet endpoint
        'https://gnfd-testnet-sp1.bnbchain.org', // Testnet SP1
        'https://gnfd-testnet-sp2.bnbchain.org'  // Testnet SP2
      ];
      
      // Try each endpoint until we get a successful response
      for (const endpoint of endpoints) {
        try {
          logger.debug(`Trying SP endpoint: ${endpoint}`);
          
          // According to get_user_buckets.md, we need to use the root path (/)
          // with X-Gnfd-User-Address header containing the wallet address
          // Optional query parameter: include-removed=false
          const response = await fetch(`${endpoint}/?include-removed=false`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Gnfd-User-Address': address
            }
          });
          
          if (response.ok) {
            // According to docs, response should be XML
            const responseText = await response.text();
            logger.debug(`API response from ${endpoint}: ${responseText.substring(0, 500)}...`);
            
            // Basic XML parsing to extract bucket info
            // This is a simple approach - for production, use a proper XML parser
            try {
              // Extract buckets from XML response
              const buckets: BucketInfo[] = [];
              
              // Try to parse Buckets format (from get_user_buckets.md)
              const bucketMatches = responseText.match(/<Buckets>[\s\S]*?<\/Buckets>/g) || [];
              if (bucketMatches.length > 0) {
                logger.debug(`Found ${bucketMatches.length} buckets in XML response (Buckets format)`);
                
                for (const bucketXml of bucketMatches) {
                  // Extract essential info using regex
                  const bucketName = this.extractXmlValue(bucketXml, 'BucketName');
                  const id = this.extractXmlValue(bucketXml, 'Id');
                  const visibility = this.extractXmlValue(bucketXml, 'Visibility');
                  const owner = this.extractXmlValue(bucketXml, 'Owner');
                  const createAt = this.extractXmlValue(bucketXml, 'CreateAt');
                  const paymentAddress = this.extractXmlValue(bucketXml, 'PaymentAddress');
                  const spAddress = this.extractXmlValue(bucketXml, 'PrimarySpId');
                  
                  if (bucketName && id) {
                    buckets.push({
                      id,
                      bucketName,
                      visibility: this.getVisibilityString(Number(visibility) || 0),
                      owner: owner || address,
                      createAt: createAt ? new Date(Number(createAt) * 1000).toISOString() : "",
                      paymentAddress: paymentAddress || "",
                      spInfo: {
                        address: spAddress || "",
                        endpoint: ""
                      }
                    });
                  }
                }
              }
              
              // Try to parse BucketEntry format (from list_buckets_by_ids.md)
              const bucketEntryMatches = responseText.match(/<BucketEntry>[\s\S]*?<\/BucketEntry>/g) || [];
              if (bucketEntryMatches.length > 0) {
                logger.debug(`Found ${bucketEntryMatches.length} buckets in XML response (BucketEntry format)`);
                
                for (const bucketXml of bucketEntryMatches) {
                  // First extract Value section if it exists (contains detailed info)
                  const valueMatch = bucketXml.match(/<Value>([\s\S]*?)<\/Value>/);
                  const valueSection = valueMatch?.[1] || '';
                  
                  // Extract bucket info
                  const id = this.extractXmlValue(bucketXml, 'Id');
                  
                  // If we have a Value section, get detailed info
                  if (valueSection) {
                    const bucketInfo = this.extractXmlValue(valueSection, 'BucketInfo');
                    const bucketName = this.extractXmlValue(bucketInfo, 'BucketName');
                    const visibility = this.extractXmlValue(bucketInfo, 'Visibility');
                    const owner = this.extractXmlValue(bucketInfo, 'Owner');
                    const createAt = this.extractXmlValue(bucketInfo, 'CreateAt');
                    const paymentAddress = this.extractXmlValue(bucketInfo, 'PaymentAddress');
                    
                    if (bucketName && id) {
                      buckets.push({
                        id,
                        bucketName,
                        visibility: this.getVisibilityString(Number(visibility) || 0),
                        owner: owner || address,
                        createAt: createAt ? new Date(Number(createAt) * 1000).toISOString() : "",
                        paymentAddress: paymentAddress || "",
                        spInfo: { address: "", endpoint: "" }
                      });
                    }
                  }
                  // Otherwise just add basic info
                  else if (id) {
                    buckets.push({
                      id,
                      bucketName: `bucket-${id}`,
                      visibility: 'unknown',
                      owner: address,
                      createAt: "",
                      paymentAddress: "",
                      spInfo: { address: "", endpoint: "" }
                    });
                  }
                }
              }
              
              // Return buckets if we found any
              if (buckets.length > 0) {
                logger.debug(`Successfully extracted ${buckets.length} buckets from XML response`);
                return buckets;
              }
              
              logger.debug(`No buckets found in XML response from ${endpoint}`);
            } catch (parseError) {
              const msg = parseError instanceof Error ? parseError.message : String(parseError);
              logger.error(`Error parsing XML response from ${endpoint}: ${msg}`);
            }
          } else {
            // Check if there's an error response
            try {
              const errorText = await response.text();
              logger.error(`API request to ${endpoint} failed: ${response.status} ${response.statusText}`);
              logger.debug(`Error response: ${errorText}`);
            } catch (e) {
              logger.error(`API request to ${endpoint} failed: ${response.status} ${response.statusText}`);
            }
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          logger.error(`Error with API call to ${endpoint}: ${msg}`);
        }
      }
      
      logger.debug("No buckets found with any method or endpoint");
      return [];
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error listing buckets: ${errorMsg}`);
      throw new Error(`Failed to list buckets: ${errorMsg}`);
    }
  }
  
  /**
   * Helper method to extract values from XML
   */
  private extractXmlValue(xml: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`);
    const match = xml.match(regex);
    return match?.[1] || '';
  }

  /**
   * Convert visibility numeric value to human-readable string
   */
  private getVisibilityString(visibility: number): string {
    switch (visibility) {
      case 0:
        return "private";
      case 1:
        return "public-read";
      case 2:
        return "public-read-write";
      default:
        return "unknown";
    }
  }
}

/**
 * Action for listing buckets on BNB Greenfield
 * 
 * This action handles retrieving all buckets owned by an address on Greenfield,
 * and checks if the account is properly initialized.
 */
export const getBucketAction: Action = {
  name: "GET_BUCKETS_BNB",
  similes: ["LIST_BUCKETS_BNB", "SHOW_BUCKETS_BNB", "VIEW_BUCKETS_BNB", "GREENFIELD_BUCKETS_BNB"],
  description: "List all buckets owned by an address on BNB Greenfield",
  validate: async (runtime: IAgentRuntime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: Record<string, unknown> = {},
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info("Executing GET_BUCKETS_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    logger.debug("Message source:", message.content.source);

    // Validate message source - Allow both "direct" and "client_chat:user" sources
    if (!(message.content.source === "direct" || message.content.source === "client_chat:user")) {
      logger.warn("Bucket listing rejected: invalid source:", message.content.source);
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Bucket listing not allowed" },
      });
      return false;
    }
    logger.debug("Source validation passed");

    // Initialize or update state
    const currentState = state ? state : (await runtime.composeState(message)) as State;

    // Extract parameters using the model
    const templateData = {
      template: getBucketTemplate,
      state: currentState
    };

    logger.debug("Generating bucket listing parameters using model");
    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    
    // Parse the JSON output
    let content: Record<string, unknown>;
    try {
      let jsonString = typeof mlOutput === 'string' ? mlOutput : JSON.stringify(mlOutput);
      
      // Check if the output is wrapped in markdown code blocks
      if (typeof jsonString === 'string') {
        // Clean up markdown code blocks if present
        const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = jsonString.match(jsonRegex);
        
        if (match?.[1]) {
          jsonString = match[1];
          logger.debug("Extracted JSON from markdown code block");
        }
        
        // Remove any trailing/leading whitespace
        jsonString = jsonString.trim();
      }
      
      // Parse the cleaned JSON string
      content = JSON.parse(jsonString);
      logger.debug("Generated bucket listing parameters:", JSON.stringify(content, null, 2));
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
      content = { address: null, includeDetails: true };
      logger.debug("Using default parameters");
    }

    try {
      // Initialize providers and clients
      const config = await getGnfdConfig(runtime);
      const gnfdClient = await InitGnfdClient(runtime);
      const walletProvider = initWalletProvider(runtime);
      const action = new GetBucketAction(walletProvider, gnfdClient);
      
      // Get address to use (default to wallet's address if not specified)
      const queryAddress = (content.address as string) || walletProvider.getAddress();
      logger.debug(`Using address for bucket listing: ${queryAddress}`);
      
      // Check if account is initialized
      const isInitialized = await action.isAccountInitialized(queryAddress);
      
      // Create explorer URL
      const explorerUrl = `${config.GREENFIELD_SCAN}/account/${queryAddress}`;
      
      // Prepare response
      const response: GetBucketsResponse = {
        address: queryAddress,
        isInitialized: isInitialized,
        buckets: [],
        explorerUrl: explorerUrl
      };
      
      // Only attempt to list buckets if account is initialized
      if (isInitialized) {
        logger.debug("Account is initialized, listing buckets");
        response.buckets = await action.listBuckets(queryAddress);
      } else {
        logger.debug("Account is not initialized, skipping bucket listing");
      }
      
      // Format and send the response
      if (callback) {
        let responseText = "";
        
        if (!isInitialized) {
          responseText = `🚫 ACCOUNT NOT INITIALIZED

Your wallet address (${queryAddress}) is not initialized on the Greenfield network.

Before you can create or view buckets, you need to initialize your account by sending BNB from BSC to Greenfield. 

You can do this by:
1. Use the "GREENFIELD_BNB" action with a cross-chain transfer
2. Send a message like: "Transfer 0.01 BNB from BSC to my Greenfield account"

View your account: ${explorerUrl}`;
        }
        else if (response.buckets.length === 0) {
          responseText = `📂 NO BUCKETS FOUND

Your wallet (${queryAddress}) is initialized on Greenfield, but you don't have any buckets yet.

You can create a bucket using the "GREENFIELD_BNB" action by saying:
"Create a bucket called 'my-first-bucket' on Greenfield"

View your account: ${explorerUrl}`;
        }
        else {
          // Create a nice formatted list of buckets
          const bucketList = response.buckets.map((bucket, index) => {
            const bucketUrl = `${config.GREENFIELD_SCAN}/bucket/${bucket.id}`;
            return `${index + 1}. "${bucket.bucketName}" (${bucket.visibility})
   • ID: ${bucket.id}
   • Created: ${bucket.createAt ? new Date(bucket.createAt).toLocaleString() : "Unknown"}
   • View: ${bucketUrl}`;
          }).join("\n\n");
          
          responseText = `📂 YOUR GREENFIELD BUCKETS (${response.buckets.length})

${bucketList}

Account: ${queryAddress}
View on Explorer: ${explorerUrl}`;
        }
        
        callback({
          text: responseText,
          content: { 
            success: true,
            ...response
          },
        });
      }
      
      return true;
    } catch (error: unknown) {
      // Handle errors gracefully
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error during bucket listing:", errorObj.message);
      logger.debug("Error details:", errorObj.stack || "No stack trace available");
      
      // Provide user-friendly error messages
      let errorMessage = errorObj.message;
      
      if (errorMessage.includes("account not found") || errorMessage.includes("key not found")) {
        errorMessage = "Your account hasn't been initialized on Greenfield. Please transfer BNB from BSC to Greenfield first.";
      }
      
      callback?.({
        text: `Failed to list buckets: ${errorMessage}`,
        content: { 
          success: false,
          error: errorMessage,
          address: (content?.address as string) || initWalletProvider(runtime).getAddress()
        },
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "List all my buckets on Greenfield",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll list all your buckets on BNB Greenfield",
          actions: ["GET_BUCKETS_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me my Greenfield storage buckets",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll show you all your buckets on BNB Greenfield",
          actions: ["GET_BUCKETS_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What buckets do I have on Greenfield?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check what buckets you have on BNB Greenfield",
          actions: ["GET_BUCKETS_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
};
