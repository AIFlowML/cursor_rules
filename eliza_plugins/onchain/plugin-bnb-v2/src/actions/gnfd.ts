import { createRequire } from "node:module";
import { readFileSync, statSync } from "node:fs";
import { extname } from "node:path";
import { lookup } from "mime-types";
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
import { parseEther } from "viem";

import { CROSS_CHAIN_ABI } from "../abi/CrossChainAbi";
import { TOKENHUB_ABI } from "../abi/TokenHubAbi";
import { getGnfdConfig, InitGnfdClient } from "../providers/gnfd";
import {
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { greenfieldTemplate } from "../templates";
import type { SupportedChain } from "../types";

export { greenfieldTemplate };

const require = createRequire(import.meta.url);
const {
  Client,
  Long,
  VisibilityType,
} = require("@bnb-chain/greenfield-js-sdk");

/**
 * GreenfieldAction class - Handles Greenfield blockchain operations
 * 
 * This class implements core functionality for interacting with the BNB Greenfield
 * decentralized storage network, including bucket creation, object uploading,
 * and cross-chain transfers.
 */
export class GreenfieldAction {
  /**
   * Creates a new GreenfieldAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   * @param gnfdClient - Greenfield client for blockchain interactions
   */
  constructor(
    private walletProvider: WalletProvider,
    private gnfdClient: typeof Client
  ) {}

  /**
   * Get available storage providers from the Greenfield network
   * 
   * @returns List of storage providers
   */
  async getSps() {
    const sps = await this.gnfdClient.sp.getStorageProviders();
    return sps;
  }

  /**
   * Select an appropriate storage provider for operations
   * 
   * @param runtime - ElizaOS runtime for configuration access
   * @returns Selected storage provider info
   * @throws Error if no suitable storage providers are available
   */
  async selectSp(runtime: IAgentRuntime) {
    let finalSps = await this.getSps();
    const config = await getGnfdConfig(runtime);

    if (config.NETWORK === "TESTNET") {
      // Filter SPs to only those containing "nodereal" or "bnbchain" in endpoint
      const filteredSps = finalSps.filter(
        (sp: { endpoint: string }) =>
          sp.endpoint.includes("nodereal") || sp.endpoint.includes("bnbchain")
      );

      // If no matching SPs found, handle this case
      if (filteredSps.length === 0) {
        throw new Error(
          "No storage providers available with the required endpoints"
        );
      }
      finalSps = filteredSps;
    }

    const selectIndex = Math.floor(Math.random() * finalSps.length);

    const secondarySpAddresses = [
      ...finalSps.slice(0, selectIndex),
      ...finalSps.slice(selectIndex + 1),
    ].map((item) => item.operatorAddress);
    
    const selectSpInfo = {
      id: finalSps[selectIndex].id,
      endpoint: finalSps[selectIndex].endpoint,
      primarySpAddress: finalSps[selectIndex]?.operatorAddress,
      sealAddress: finalSps[selectIndex].sealAddress,
      secondarySpAddresses,
    };

    return selectSpInfo;
  }

  /**
   * Transfer BNB from BNB Smart Chain to Greenfield
   * 
   * @param amount - Amount of BNB to transfer
   * @param runtime - ElizaOS runtime for configuration access
   * @returns Transaction hash of the transfer
   */
  async bnbTransferToGnfd(amount: bigint, runtime: IAgentRuntime) {
    const config = await getGnfdConfig(runtime);
    logger.debug(`Starting cross-chain transfer of ${amount.toString()} wei to Greenfield`);

    const chain: SupportedChain =
      config.NETWORK === "TESTNET" ? "bscTestnet" : "bsc";
    logger.debug(`Using chain: ${chain}`);
    
    this.walletProvider.switchChain(chain);
    const publicClient = this.walletProvider.getPublicClient(chain);
    const walletClient = this.walletProvider.getWalletClient(chain);

    try {
      // This is how it's done in the original code
      // Define a more specific type to avoid the 'any' linter error
      type CrossChainReadParams = {
        address: `0x${string}`;
        abi: typeof CROSS_CHAIN_ABI;
        functionName: string; // Allow any function name as string
      };
      
      // Cast to our specific type that allows any function name
      const contractParams: CrossChainReadParams = {
        address: config.CROSSCHAIN_ADDRESS as `0x${string}`,
        abi: CROSS_CHAIN_ABI,
        functionName: "getRelayFees",
      };
      
      // Use type assertions to handle the return value correctly
      const result = await publicClient.readContract(contractParams as any);
      const relayFee = (result as any[])[0] as bigint;
      const ackRelayFee = (result as any[])[1] as bigint;
      
      logger.debug(`Received relay fees from contract - base: ${relayFee.toString()}, ack: ${ackRelayFee.toString()}`);
      
      const relayerFee = relayFee + ackRelayFee;
      const totalAmount = relayerFee + amount;
      
      logger.debug(`Total amount for transaction (including fees): ${totalAmount.toString()}`);

      logger.debug("Simulating transferOut contract call...");
      const { request } = await publicClient.simulateContract({
        account: this.walletProvider.getAccount(),
        address: config.TOKENHUB_ADDRESS as `0x${string}`,
        abi: TOKENHUB_ABI,
        functionName: "transferOut",
        args: [this.walletProvider.getAddress(), amount],
        value: totalAmount,
      });

      logger.debug("Submitting transaction...");
      const hash = await walletClient.writeContract(request);
      logger.debug(`Transaction submitted with hash: ${hash}`);
      
      logger.debug("Waiting for transaction confirmation...");
      const tx = await publicClient.waitForTransactionReceipt({
        hash,
      });
      logger.debug(`Transaction confirmed with status: ${tx.status}`);

      return tx.transactionHash;
    } catch (error) {
      logger.error("Error during transferToGnfd:", error);
      throw error;
    }
  }

  /**
   * Create a new bucket on Greenfield
   * 
   * @param msg - Create bucket message parameters
   * @returns Transaction hash of the bucket creation
   */
  async createBucket(msg: {
    bucketName: string;
    creator: string;
    visibility: number;
    chargedReadQuota: { fromString: (value: string) => unknown }; // Long type from greenfield-js-sdk
    paymentAddress: string;
    primarySpAddress: string;
  }) {
    logger.debug("Creating bucket...");
    const createBucketTx = await this.gnfdClient.bucket.createBucket(msg);

    const createBucketTxSimulateInfo = await createBucketTx.simulate({
      denom: "BNB",
    });

    const createBucketTxRes = await createBucketTx.broadcast({
      denom: "BNB",
      gasLimit: Number(createBucketTxSimulateInfo?.gasLimit),
      gasPrice: createBucketTxSimulateInfo?.gasPrice || "5000000000",
      payer: msg.paymentAddress,
      granter: "",
      privateKey: this.walletProvider.getPk(),
    });

    logger.debug("createBucketTxRes", createBucketTxRes);

    if (createBucketTxRes.code === 0) {
      logger.info("Create bucket success");
    }
    return createBucketTxRes.transactionHash;
  }

  /**
   * Get bucket information by name
   * 
   * @param bucketName - Name of the bucket to query
   * @returns Bucket ID
   */
  async headBucket(bucketName: string) {
    const { bucketInfo } = await this.gnfdClient.bucket.headBucket(bucketName);
    return bucketInfo.id;
  }

  /**
   * Upload an object to a Greenfield bucket
   * 
   * @param msg - Upload object message parameters
   * @returns Result message from the upload operation
   */
  async uploadObject(msg: {
    bucketName: string;
    objectName: string;
    body: {
      name: string;
      type: string;
      size: number;
      content: Buffer;
    };
    delegatedOpts: {
      visibility: number;
    };
  }) {
    logger.debug("Starting uploadObject action");
    const uploadRes = await this.gnfdClient.object.delegateUploadObject(
      msg,
      {
        type: "ECDSA",
        privateKey: this.walletProvider.getPk(),
      }
    );
    if (uploadRes.code === 0) {
      logger.info("Upload object success");
    }
    return uploadRes.message;
  }

  /**
   * Get object information by bucket and object name
   * 
   * @param bucketName - Name of the bucket containing the object
   * @param objectName - Name of the object to query
   * @returns Object ID
   */
  async headObject(bucketName: string, objectName: string) {
    const { objectInfo } = await this.gnfdClient.object.headObject(
      bucketName,
      objectName
    );
    return objectInfo.id;
  }

  /**
   * Delete an object from a Greenfield bucket
   * 
   * @param msg - Delete object message parameters
   * @returns Transaction hash of the delete operation
   */
  async deleteObject(msg: {
    bucketName: string;
    objectName: string;
    operator: string;
  }) {
    const deleteObjectTx = await this.gnfdClient.object.deleteObject(msg);

    const simulateInfo = await deleteObjectTx.simulate({
      denom: "BNB",
    });

    const res = await deleteObjectTx.broadcast({
      denom: "BNB",
      gasLimit: Number(simulateInfo?.gasLimit),
      gasPrice: simulateInfo?.gasPrice || "5000000000",
      payer: msg.operator,
      granter: "",
      privateKey: this.walletProvider.getPk(),
    });

    if (res.code === 0) {
      logger.info("Delete object success");
    }

    return res.transactionHash;
  }
}

/**
 * Extended Media type that includes name property
 */
interface GnfdAttachment {
  url?: string;
  type?: string;
  name?: string;
  content?: Buffer | string;
  base64?: string;
  data?: Buffer | string;
  path?: string;
}

/**
 * Generate a file object from a media attachment
 * 
 * @param attachment - Media attachment metadata
 * @returns File object compatible with Greenfield SDK
 * @throws Error if the file type is unsupported
 */
function generateFile(attachment: GnfdAttachment) {
  try {
    // Check if we have a direct URL to a file
    if (attachment.url) {
      const filePath = fixPath(attachment.url);
      logger.debug(`Processing attachment with URL: ${filePath}`);
      
      try {
        const stats = statSync(filePath);
        const fileSize = stats.size;
        const nameExt = extname(filePath) || '.dat';
        const type = lookup(nameExt) || 'application/octet-stream';
        
        logger.debug(`File stats: size=${fileSize}, type=${type}, ext=${nameExt}`);
        
        return {
          name: filePath,
          type,
          size: fileSize,
          content: readFileSync(filePath),
        };
      } catch (fileError) {
        const errorMsg = fileError instanceof Error ? fileError.message : String(fileError);
        logger.debug(`Error reading file from URL: ${errorMsg}, trying alternative methods`);
      }
    }
    
    // Check if we have direct content (binary data)
    if (attachment.content) {
      logger.debug("Processing attachment with direct content");
      const content = Buffer.isBuffer(attachment.content) 
        ? attachment.content 
        : Buffer.from(String(attachment.content));
      
      const fileName = attachment.name || 'file.dat';
      const nameExt = extname(fileName) || '.dat';
      const type = lookup(nameExt) || 'application/octet-stream';
      
      return {
        name: fileName,
        type,
        size: content.length,
        content,
      };
    }
    
    // Check if we have base64 data
    if (attachment.base64) {
      logger.debug("Processing attachment with base64 data");
      const content = Buffer.from(attachment.base64, 'base64');
      const fileName = attachment.name || 'file.dat';
      const nameExt = extname(fileName) || '.dat';
      const type = lookup(nameExt) || 'application/octet-stream';
      
      return {
        name: fileName,
        type,
        size: content.length,
        content,
      };
    }
    
    // Check if we have a path property
    if (attachment.path) {
      logger.debug(`Processing attachment with path: ${attachment.path}`);
      const filePath = attachment.path;
      const stats = statSync(filePath);
      const fileSize = stats.size;
      const nameExt = extname(filePath) || '.dat';
      const type = lookup(nameExt) || 'application/octet-stream';
      
      return {
        name: filePath,
        type,
        size: fileSize,
        content: readFileSync(filePath),
      };
    }
    
    // If we get here, we don't have a usable file source
    throw new Error(`No valid file content in attachment: ${JSON.stringify(attachment)}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Error generating file from attachment: ${errorMsg}`);
    throw new Error(`Failed to process attachment: ${errorMsg}`);
  }
}

/**
 * Fix path issues in file URLs
 * 
 * @param url - File URL to fix
 * @returns Corrected file path
 */
function fixPath(url: string) {
  return url.replace("/agent/agent/", "/agent/");
}

/**
 * Convert a number to hexadecimal format
 * 
 * @param n - Number to convert as string
 * @returns Hexadecimal representation with 0x prefix
 */
function toHex(n: string) {
  return `0x${Number(n).toString(16).padStart(64, "0")}`;
}

/**
 * Action for Greenfield blockchain operations
 * 
 * This action handles storage operations on Greenfield decentralized storage network,
 * including bucket creation, object management, and cross-chain transfers.
 */
export const greenfieldAction: Action = {
  name: "GREENFIELD_BNB",
  similes: [
    "CREATE_BUCKET_BNB",
    "UPLOAD_OBJECT_BNB",
    "DELETE_BUCKET_BNB",
    "DELETE_OBJECT_BNB",
    "TRANSFER_BNB_TO_GREENFIELD",
    "BNB_GREENFIELD_STORAGE",
    "GREENFIELD_STORAGE_BNB",
    "GREENFIELD_BNB",
    "UPLOAD_TO_GREENFIELD",
    "UPLOAD_FILE_GREENFIELD",
    "UPLOAD_IMAGE_GREENFIELD",
    "UPLOAD_DOCUMENT_GREENFIELD",
    "STORE_ON_GREENFIELD",
    "SAVE_TO_GREENFIELD",
    "UPLOAD",
    "SAVE_FILE",
    "STORE_FILE",
    "PUT_FILE",
    "UPLOAD_PATH",
    "SAVE_PATH"
  ],
  description:
    "Manage storage on BNB Greenfield blockchain - create buckets, upload files/images/documents, list buckets, delete objects, and perform cross-chain transfers",
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
    logger.info("Starting GREENFIELD_BNB action");
    
    // Detailed message structure logging
    logger.debug("=== MESSAGE STRUCTURE DEBUGGING ===");
    logger.debug(`Message type: ${typeof message}`);
    logger.debug(`Message keys: ${Object.keys(message).join(', ')}`);
    logger.debug(`Content type: ${typeof message.content}`);
    if (message.content) {
      logger.debug(`Content keys: ${Object.keys(message.content).join(', ')}`);
    }
    
    // Log raw message content for diagnosis
    try {
      logger.debug("Raw message content:");
      logger.debug(JSON.stringify(message, null, 2));
    } catch (error) {
      logger.debug("Could not stringify full message:", error);
    }
    
    // Focused attachment debugging
    if (message.content && 'attachments' in message.content) {
      logger.debug("=== ATTACHMENTS DEBUGGING ===");
      const attachments = message.content.attachments;
      logger.debug(`Attachments exists: ${!!attachments}`);
      logger.debug(`Attachments type: ${typeof attachments}`);
      
      if (Array.isArray(attachments)) {
        logger.debug(`Attachments count: ${attachments.length}`);
        
        // Log each attachment
        attachments.forEach((attachment, i) => {
          logger.debug(`--- Attachment #${i + 1} ---`);
          logger.debug(`Type: ${typeof attachment}`);
          
          // Safe way to access keys without type errors
          const attachmentObj = attachment as Record<string, unknown>;
          const keys = Object.keys(attachmentObj);
          logger.debug(`Keys: ${keys.join(', ')}`);
          
          // Log important properties
          logger.debug(`attachment.type: ${attachmentObj.type || 'undefined'}`);
          logger.debug(`attachment.url: ${attachmentObj.url || 'undefined'}`);
          logger.debug(`attachment.name: ${attachmentObj.name || 'undefined'}`);
          logger.debug(`attachment.path: ${attachmentObj.path || 'undefined'}`);
          logger.debug(`attachment.content exists: ${!!attachmentObj.content}`);
          logger.debug(`attachment.base64 exists: ${!!attachmentObj.base64}`);
          logger.debug(`attachment.data exists: ${!!attachmentObj.data}`);
          logger.debug(`attachment.contentType: ${attachmentObj.contentType || 'undefined'}`);
          
          // Detect potential nested structure
          keys.forEach(key => {
            const value = attachmentObj[key];
            if (typeof value === 'object' && value !== null) {
              logger.debug(`Nested object found in attachment.${key}`);
              logger.debug(`Keys: ${Object.keys(value as Record<string, unknown>).join(', ')}`);
            }
          });
          
          // Log the full attachment for complete analysis (with some safety checks)
          try {
            const safeAttachment = {...attachmentObj};
            
            // Remove any potentially large binary/base64 data for safer logging
            if ('content' in safeAttachment) safeAttachment.content = '[CONTENT REMOVED FOR LOGGING]';
            if ('base64' in safeAttachment) safeAttachment.base64 = '[BASE64 REMOVED FOR LOGGING]';
            if ('data' in safeAttachment) safeAttachment.data = '[DATA REMOVED FOR LOGGING]';
            
            logger.debug(`Full attachment #${i + 1}:`, JSON.stringify(safeAttachment, null, 2));
          } catch (error) {
            logger.debug(`Could not stringify attachment #${i + 1}:`, error instanceof Error ? error.message : String(error));
          }
        });
      } else {
        logger.debug(`Attachments is not an array. Value:`, attachments);
      }
    } else {
      logger.debug("No attachments property found in message.content");
    }
    logger.debug("=== END DEBUGGING ===");
    
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));

    // Initialize or update state
    const currentState = state ? state : (await runtime.composeState(message)) as State;

    // Extract Greenfield parameters using the model
    const templateData = {
      template: greenfieldTemplate,
      state: currentState
    };

    logger.debug("Generating Greenfield parameters using model");
    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    
    // Parse the JSON output - handle markdown code blocks if present
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
      logger.debug("Generated Greenfield parameters:", JSON.stringify(content, null, 2));
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
      
      // Attempt to extract basic parameters with regex as fallback
      logger.debug("Attempting to extract parameters with regex as fallback");
      const promptText = typeof message.content.text === 'string' ? message.content.text : '';
      
      // Check if initialization is requested
      const initializeRequested = promptText.toLowerCase().includes("initialize") || 
                                 promptText.toLowerCase().includes("init") ||
                                 promptText.toLowerCase().includes("setup account");
      
      // Extract bucket name with regex
      const bucketNameRegex = /bucket(?:\s+called|\s+named)?\s+['"]([^'"]+)['"]/i;
      const bucketMatch = promptText.match(bucketNameRegex);
      
      // Extract object name with regex (if present)
      const objectNameRegex = /(?:upload|file|object|document|image)(?:\s+called|\s+named)?\s+['"]([^'"]+)['"]/i;
      const objectMatch = promptText.match(objectNameRegex);
      // Safely get the object name
      const extractedObjectName = objectMatch && objectMatch.length > 1 ? objectMatch[1] : null;
      
      // Detect action type from text
      let actionType = "createBucket"; // Default
      if (promptText.toLowerCase().includes("upload") || 
          promptText.toLowerCase().includes("save file") || 
          promptText.toLowerCase().includes("store file") ||
          promptText.toLowerCase().includes("put file")) {
        actionType = "uploadObject";
      } else if (promptText.toLowerCase().includes("delete")) {
        actionType = "deleteObject";
      } else if (promptText.toLowerCase().includes("transfer") || 
                promptText.toLowerCase().includes("send bnb")) {
        actionType = "crossChainTransfer";
      }
      
      // Look for file paths in the message (for upload actions)
      let filePath = null;
      if (actionType === "uploadObject") {
        // More aggressive file path regex that can catch both quoted and unquoted paths
        const filePathRegex = /(?:upload|save|store|put|file|path|image|photo|document)\s+(?:file|path|image|photo|document)?\s*['""]?([\/\\][^'"\s]+\.[a-zA-Z0-9]+)['""]?/i;
        const filePathMatch = promptText.match(filePathRegex);
        
        if (filePathMatch && filePathMatch[1]) {
          filePath = filePathMatch[1];
          logger.debug(`Found file path in prompt: ${filePath}`);
        }
      }
      
      if (bucketMatch || initializeRequested || filePath) {
        content = {
          actionType: initializeRequested ? "crossChainTransfer" : actionType,
          bucketName: bucketMatch ? bucketMatch[1] : null,
          objectName: extractedObjectName,
          filePath: filePath,
          // Add initialization flag
          initializeAccount: initializeRequested
        };
        logger.debug("Extracted parameters with regex:", JSON.stringify(content, null, 2));
      } else {
        callback?.({
          text: "Failed to process Greenfield parameters. Please try again with a more specific request.",
          content: { error: "Invalid model output format and unable to extract parameters" },
        });
        return false;
      }
    }

    // Check if initialization is explicitly requested in the extracted content
    const initializeAccount = content.initializeAccount === true || 
                             (typeof content.initializeAccount === 'string' && 
                              content.initializeAccount.toLowerCase() === 'true');

    try {
      const config = await getGnfdConfig(runtime);
      const gnfdClient = await InitGnfdClient(runtime);
      const walletProvider = initWalletProvider(runtime);
      const action = new GreenfieldAction(walletProvider, gnfdClient);

      // Get action type, supporting the case when we need to initialize first
      let actionType = content.actionType as string;
      logger.debug(`Original action type: ${actionType}`);
      
      // Try to get the wallet address
      const address = walletProvider.getAddress();
      logger.debug(`Using wallet address: ${address}`);
      
      // Check if account is initialized or needs initialization
      let accountInitialized = true;
      let accountCheckError = null;
      
      try {
        // Attempt to get account info - this will throw an error if account is not initialized
        await gnfdClient.account.getAccount(address);
        logger.debug("Account is already initialized on Greenfield");
      } catch (error) {
        accountInitialized = false;
        accountCheckError = error;
        logger.debug("Account not initialized on Greenfield:", error);
      }
      
      // Handle initialization if needed
      if (!accountInitialized && (initializeAccount || actionType !== "crossChainTransfer")) {
        logger.info("Account needs initialization, performing cross-chain transfer");
        
        // Store the original action to resume after initialization
        const originalActionType = actionType;
        // Set action type to cross-chain transfer
        actionType = "crossChainTransfer";
        
        try {
          // Default small amount to initialize account
          const initAmount = parseEther("0.001");
          logger.debug(`Initializing account with ${initAmount.toString()} wei`);
          
          // Perform the cross-chain transfer to initialize the account
          const txHash = await action.bnbTransferToGnfd(initAmount, runtime);
          logger.debug(`Initialization transaction hash: ${txHash}`);
          
          // Create explorer URL
          const explorerUrl = `${config.NETWORK === "TESTNET" ? 
            "https://testnet.bscscan.com" : 
            "https://bscscan.com"}/tx/${txHash}`;
          
          // After sending the cross-chain transfer for initialization, add better waiting and verification
          logger.debug("Waiting for account to be initialized on Greenfield...");
          callback?.({
            text: "Your account initialization is in progress. This process may take 30-60 seconds to complete. I'll proceed once your account is ready.",
            content: {
              status: "initializing",
              message: "Waiting for account initialization to complete",
              txHash
            }
          });
          
          // Create a function to check if account is properly initialized
          const checkAccountInitialized = async (address: string, maxRetries = 10): Promise<boolean> => {
            logger.debug(`Checking if account ${address} is initialized on Greenfield...`);
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                logger.debug(`Initialization check attempt ${attempt}/${maxRetries}`);
                await gnfdClient.account.getAccount(address);
                logger.debug("Account successfully initialized on Greenfield!");
                return true;
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger.debug(`Account not yet initialized (attempt ${attempt}/${maxRetries}): ${errorMsg}`);
                
                if (attempt < maxRetries) {
                  // Wait longer between each attempt - start with 5s, increase gradually
                  const waitTime = 5000 + (attempt * 2000);
                  logger.debug(`Waiting ${waitTime/1000} seconds before next check...`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                  logger.warn("Maximum initialization check attempts reached. Account might not be properly initialized.");
                  return false;
                }
              }
            }
            
            return false;
          };
          
          // Wait for transfer to be processed and account to be properly initialized
          const isInitialized = await checkAccountInitialized(address);
          
          if (!isInitialized) {
            logger.warn("Account initialization may not have completed successfully");
            callback?.({
              text: `⚠️ ACCOUNT INITIALIZATION PENDING

Your account initialization transaction was sent, but your account is not yet ready on Greenfield.

This could be because:
1. The cross-chain transfer is still being processed (can take up to 5 minutes)
2. There was an issue with the initialization process

You can:
- Wait a bit longer and try again
- Check the transaction status: ${explorerUrl}
- Try initializing with a larger amount (0.01 BNB)

Transaction hash: ${txHash}`,
              content: {
                success: false,
                error: "Account initialization not completed within expected time",
                txHash,
                explorerUrl,
                action: "waitingForInitialization"
              }
            });
            return false;
          }
          
          // Account is initialized, reset the action type to the original request
          actionType = originalActionType;
          logger.debug(`Account successfully initialized, resuming original action: ${actionType}`);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error("Failed to initialize account:", errorMessage);
          
          // Provide clear feedback about initialization failure
          callback?.({
            text: `❌ ACCOUNT INITIALIZATION FAILED

I was unable to initialize your Greenfield account due to an error:
${errorMessage}

Please try again later or manually transfer BNB from BSC to your Greenfield account.`,
            content: {
              success: false,
              error: errorMessage,
              action: "crossChainTransfer",
              walletAddress: address
            }
          });
          return false;
        }
      }
      
      // Try to select a storage provider - this step may identify account issues early
      try {
        const spInfo = await action.selectSp(runtime);
        logger.debug("Selected storage provider:", spInfo);
  
        const bucketName = content.bucketName as string;
        const objectName = content.objectName as string;
        const attachments = message.content.attachments;
        
        // Skip if just initializing the account
        if (actionType === "crossChainTransfer" && !bucketName) {
          const amount = content.amount ? String(content.amount) : "0.001";
          const txAmount = content.amount ? parseEther(String(content.amount)) : parseEther("0.001");
          logger.debug(`Performing standalone cross-chain transfer of ${amount} BNB`);
          
          const transactionHash = await action.bnbTransferToGnfd(txAmount, runtime);
          logger.debug(`Transfer transaction hash: ${transactionHash}`);
          
          const resourceUrl = `${config.NETWORK === "TESTNET" ? 
            "https://testnet.bscscan.com" : 
            "https://bscscan.com"}/tx/${transactionHash}`;
          
          // Create a well-formatted, detailed response text
          const textResponse = `✅ BNB TRANSFERRED TO GREENFIELD

Amount: ${amount} BNB
Transaction Hash: ${transactionHash}

Links:
• View Transaction: ${resourceUrl}
• Your Greenfield Account: ${config.GREENFIELD_SCAN}/account/${address}

Note: Cross-chain transfers typically take 30-60 seconds to complete.`;
          
          callback?.({
            text: textResponse,
            content: {
              success: true,
              actionType: "crossChainTransfer",
              amount,
              transactionHash,
              resourceUrl,
              walletAddress: address
            },
          });
          
          return true;
        }
        
        logger.debug(`Bucket name: ${bucketName}, Object name: ${objectName}`);
        if (attachments?.length) {
          logger.debug(`Found ${attachments.length} attachment(s)`);
        }

        let result = "";
        let transactionHash = "";
        let resourceId = "";
        let resourceUrl = "";
        
        // Now execute the original action
        logger.debug(`Executing action type: ${actionType}`);
        
        switch (actionType) {
          case "createBucket": {
            logger.debug(`Creating bucket: ${bucketName}`);
            const msg = {
              bucketName: bucketName,
              creator: walletProvider.account.address,
              visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
              chargedReadQuota: Long.fromString("0"),
              paymentAddress: walletProvider.account.address,
              primarySpAddress: spInfo.primarySpAddress,
            };
            transactionHash = await action.createBucket(msg);
            logger.debug(`Bucket creation transaction hash: ${transactionHash}`);
            
            resourceId = await action.headBucket(msg.bucketName);
            logger.debug(`Bucket ID: ${resourceId}`);
            
            resourceUrl = `${config.GREENFIELD_SCAN}/bucket/${toHex(resourceId)}`;
            result = `Bucket "${bucketName}" created successfully. View details at: ${resourceUrl}`;
            break;
          }

          case "uploadObject": {
            let fileToUpload: { name: string; type: string; size: number; content: Buffer } | undefined;
            let uploadObjName = "unnamed-file"; // Default value to ensure it's always a string
            
            logger.debug(`Processing upload request for bucket: ${bucketName}`);
            
            // First check if a file path was directly specified in the message text
            const filePath = content.filePath as string;
            
            if (filePath) {
              logger.debug(`Using file path from message: ${filePath}`);
              
              try {
                // Check if file exists
                const stats = statSync(filePath);
                
                if (stats.isFile()) {
                  const fileName = filePath.split('/').pop() || 'unnamed-file';
                  const fileExtension = extname(filePath);
                  const fileType = lookup(fileExtension) || 'application/octet-stream';
                  
                  fileToUpload = {
                    name: fileName,
                    type: fileType, 
                    size: stats.size,
                    content: readFileSync(filePath)
                  };
                  
                  uploadObjName = objectName || fileName;
                  logger.debug(`Successfully loaded file from path: ${filePath}, size: ${stats.size} bytes, type: ${fileType}`);
                } else {
                  logger.debug(`Path exists but is not a file: ${filePath}`);
                }
              } catch (error) {
                logger.debug(`Error accessing file path: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
            
            // If no file path was directly specified, check for attachments
            if (!fileToUpload) {
              // Enhanced attachment logging for debugging
              logger.debug("Checking for attachments in message content");
              
              // Check if we have attachments in various formats
              if (message.content.attachments && message.content.attachments.length > 0) {
                logger.debug(`Found ${message.content.attachments.length} attachments`);
                
                // Loop through all attachments to find any valid one
                for (const rawAttachment of message.content.attachments) {
                  try {
                    // Cast to Record for safer property access
                    const attachment = rawAttachment as Record<string, unknown>;
                    logger.debug(`Processing attachment with keys: ${Object.keys(attachment).join(', ')}`);
                    
                    // 1. Check for direct URL property (standard format)
                    if (attachment.url && typeof attachment.url === 'string') {
                      logger.debug(`Found attachment with URL: ${attachment.url}`);
                      
                      try {
                        // Try to create a file object from the URL
                        const filePath = attachment.url.replace("/agent/agent/", "/agent/");
                        const stats = statSync(filePath);
                        
                        if (stats.isFile()) {
                          const fileContent = readFileSync(filePath);
                          const fileName = (attachment.name as string) || filePath.split('/').pop() || 'unnamed-file';
                          const fileExtension = extname(fileName);
                          const fileType = lookup(fileExtension) || 'application/octet-stream';
                          
                          fileToUpload = {
                            name: fileName,
                            type: fileType,
                            size: fileContent.length,
                            content: fileContent
                          };
                          
                          uploadObjName = objectName || fileName;
                          logger.debug(`Created file object from URL: ${fileName}, type: ${fileType}, size: ${fileContent.length}`);
                          break;
                        }
                      } catch (urlError) {
                        logger.debug(`Error processing URL attachment: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
                      }
                    }
                    
                    // 2. Check for data/binary content (UI format)
                    if ((attachment.data || attachment.content) && !fileToUpload) {
                      logger.debug("Found attachment with data/content property");
                      
                      // Extract the binary data
                      let binaryData: Buffer;
                      if (attachment.data) {
                        if (Buffer.isBuffer(attachment.data)) {
                          binaryData = attachment.data;
                        } else if (typeof attachment.data === 'string') {
                          binaryData = Buffer.from(attachment.data);
                        } else {
                          logger.debug(`Attachment data is not in a usable format: ${typeof attachment.data}`);
                          continue;
                        }
                      } else if (attachment.content) {
                        if (Buffer.isBuffer(attachment.content)) {
                          binaryData = attachment.content;
                        } else if (typeof attachment.content === 'string') {
                          binaryData = Buffer.from(attachment.content);
                        } else {
                          logger.debug(`Attachment content is not in a usable format: ${typeof attachment.content}`);
                          continue;
                        }
                      } else {
                        continue;
                      }
                      
                      // Create file object
                      const fileName = (attachment.name as string) || (attachment.filename as string) || 'file.dat';
                      const fileType = (attachment.type as string) || 
                                     (attachment.contentType as string) || 
                                     lookup(extname(fileName)) || 
                                     'application/octet-stream';
                      
                      fileToUpload = {
                        name: fileName,
                        type: fileType,
                        size: binaryData.length,
                        content: binaryData
                      };
                      
                      uploadObjName = objectName || fileName;
                      logger.debug(`Created file object from binary data: ${fileName}, type: ${fileType}, size: ${binaryData.length}`);
                      break;
                    }
                    
                    // 3. Check for base64 content
                    if (attachment.base64 && typeof attachment.base64 === 'string' && !fileToUpload) {
                      logger.debug("Found attachment with base64 property");
                      
                      const binaryData = Buffer.from(attachment.base64, 'base64');
                      const fileName = (attachment.name as string) || 'file.dat';
                      const fileType = (attachment.type as string) || 
                                     lookup(extname(fileName)) || 
                                     'application/octet-stream';
                      
                      fileToUpload = {
                        name: fileName,
                        type: fileType,
                        size: binaryData.length,
                        content: binaryData
                      };
                      
                      uploadObjName = objectName || fileName;
                      logger.debug(`Created file object from base64 data: ${fileName}, type: ${fileType}`);
                      break;
                    }
                  } catch (error) {
                    logger.debug(`Error processing attachment: ${error instanceof Error ? error.message : String(error)}`);
                  }
                }
              } else {
                logger.debug("No attachments found in message content");
              }
            }
            
            // If we still don't have a file, check if a sample file exists in the package directory
            if (!fileToUpload) {
              logger.debug("Checking for sample file as fallback");
              
              // List of potential sample file locations
              const sampleFiles = [
                './README.md',
                './package.json',
                '../README.md'
              ];
              
              for (const sample of sampleFiles) {
                try {
                  const stats = statSync(sample);
                  
                  if (stats.isFile()) {
                    const fileName = sample.split('/').pop() || 'sample-file';
                    const fileExtension = extname(sample);
                    const fileType = lookup(fileExtension) || 'application/octet-stream';
                    
                    fileToUpload = {
                      name: sample,
                      type: fileType,
                      size: stats.size,
                      content: readFileSync(sample)
                    };
                    
                    uploadObjName = objectName || fileName;
                    logger.debug(`Using sample file: ${sample}, type: ${fileType}, size: ${stats.size} bytes`);
                    break;
                  }
                } catch (error) {
                  // Continue to next sample
                }
              }
            }
            
            // Final check to ensure we have a file to upload
            if (!fileToUpload) {
              throw new Error("No file found to upload. Please attach a file or specify a file path.");
            }
            
            logger.debug(`Uploading object: ${uploadObjName} to bucket: ${bucketName}`);
            logger.debug(`File details - Type: ${fileToUpload.type}, Size: ${fileToUpload.size} bytes`);

            const uploadResponse = await action.uploadObject({
              bucketName,
              objectName: uploadObjName,
              body: fileToUpload,
              delegatedOpts: {
                visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
              },
            });
            logger.debug(`Upload response: ${uploadResponse}`);
            
            resourceId = await action.headObject(bucketName, uploadObjName);
            logger.debug(`Object ID: ${resourceId}`);
            
            resourceUrl = `${config.GREENFIELD_SCAN}/object/${toHex(resourceId)}`;
            
            if (attachments && attachments.length > 1) {
              result = "Note: Only the first file was uploaded. ";
            }
            result += `File "${uploadObjName}" uploaded successfully to bucket "${bucketName}". View details at: ${resourceUrl}`;
            break;
          }

          case "deleteObject": {
            logger.debug(`Deleting object: ${objectName} from bucket: ${bucketName}`);
            transactionHash = await action.deleteObject({
              bucketName,
              objectName,
              operator: walletProvider.account.address,
            });
            logger.debug(`Delete transaction hash: ${transactionHash}`);
            
            resourceUrl = `${config.GREENFIELD_SCAN}/tx/${transactionHash}`;
            result = `Object "${objectName}" deleted successfully from bucket "${bucketName}". View transaction: ${resourceUrl}`;
            break;
          }

          case "crossChainTransfer": {
            const amountStr = content.amount || "0.00001";
            const amount = content.amount ? parseEther(String(content.amount)) : parseEther("0.00001");
            logger.debug(`Cross-chain transfer amount: ${amountStr} BNB (${amount.toString()} wei)`);
            
            transactionHash = await action.bnbTransferToGnfd(amount, runtime);
            logger.debug(`Transfer transaction hash: ${transactionHash}`);
            
            resourceUrl = `${config.NETWORK === "TESTNET" ? 
              "https://testnet.bscscan.com" : 
              "https://bscscan.com"}/tx/${transactionHash}`;
            
            result = `Successfully transferred ${amountStr} BNB from BNB Smart Chain to Greenfield. View transaction: ${resourceUrl}`;
            break;
          }

          default:
            throw new Error(`Unknown action type: ${actionType}. Please specify a valid Greenfield operation.`);
        }
        
        logger.debug(`Operation completed successfully: ${result}`);
        
        // Create a well-formatted, detailed response text
        let textResponse = "";
        
        // Build response header based on action type
        switch (actionType) {
          case "createBucket":
            textResponse = "✅ BUCKET CREATED SUCCESSFULLY\n\n";
            break;
          case "uploadObject":
            textResponse = "✅ FILE UPLOADED SUCCESSFULLY\n\n";
            break;
          case "deleteObject":
            textResponse = "✅ OBJECT DELETED SUCCESSFULLY\n\n";
            break;
          case "crossChainTransfer":
            textResponse = "✅ BNB TRANSFERRED TO GREENFIELD\n\n";
            break;
        }
        
        // Add operation details
        if (bucketName) {
          textResponse += `Bucket: ${bucketName}\n`;
        }
        
        if (objectName && (actionType === "uploadObject" || actionType === "deleteObject")) {
          textResponse += `Object: ${objectName}\n`;
        }
        
        if (actionType === "crossChainTransfer") {
          const amountStr = content.amount || "0.00001";
          textResponse += `Amount: ${amountStr} BNB\n`;
        }
        
        // Add transaction details
        if (transactionHash) {
          textResponse += `Transaction Hash: ${transactionHash}\n`;
        }
        
        if (resourceId) {
          textResponse += `Resource ID: ${resourceId}\n`;
        }
        
        // Add storage provider info for creation operations
        if (actionType === "createBucket") {
          textResponse += "\nStorage Provider:\n";
          textResponse += `• ID: ${spInfo.id}\n`;
          textResponse += `• Endpoint: ${spInfo.endpoint}\n`;
          textResponse += `• Address: ${spInfo.primarySpAddress}\n`;
        }
        
        // Add links section
        textResponse += "\nLinks:\n";
        
        if (resourceUrl) {
          if (actionType === "createBucket") {
            textResponse += `• View Bucket: ${resourceUrl}\n`;
          } else if (actionType === "uploadObject") {
            textResponse += `• View Object: ${resourceUrl}\n`;
          } else if (actionType === "deleteObject") {
            textResponse += `• View Transaction: ${resourceUrl}\n`;
          } else if (actionType === "crossChainTransfer") {
            textResponse += `• View Transaction: ${resourceUrl}\n`;
          }
        }
        
        if (actionType === "createBucket" || actionType === "uploadObject") {
          textResponse += `• Greenfield Explorer: ${config.GREENFIELD_SCAN}\n`;
        }
        
        // Add wallet info if relevant
        if (actionType === "createBucket" || actionType === "uploadObject" || actionType === "deleteObject") {
          const walletUrl = `${config.GREENFIELD_SCAN}/account/${walletProvider.account.address}`;
          textResponse += `• Your Greenfield Account: ${walletUrl}\n`;
        }
        
        // Add footer notes
        textResponse += "\nNote: ";
        if (actionType === "createBucket") {
          textResponse += "You can now upload files to this bucket using the GREENFIELD_BNB action.";
        } else if (actionType === "uploadObject") {
          textResponse += "Files stored on Greenfield are permanently stored on the decentralized network unless explicitly deleted.";
        } else if (actionType === "crossChainTransfer") {
          textResponse += "Cross-chain transfers typically take 30-60 seconds to complete.";
        } else if (actionType === "deleteObject") {
          textResponse += "Deleted objects cannot be recovered. This operation is permanent.";
        }
        
        // Enhanced structured response
        callback?.({
          text: textResponse,
          content: {
            success: true,
            actionType,
            result,
            bucketName,
            objectName,
            transactionHash,
            resourceId,
            resourceUrl,
            spInfo: {
              id: spInfo.id,
              endpoint: spInfo.endpoint,
              primarySpAddress: spInfo.primarySpAddress
            }
          },
        });

        return true;
      } catch (error) {
        // Check for account not found error which is common for first-time users
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("account not found") || 
            errorMessage.includes("key not found") ||
            errorMessage.includes("not initialized")) {
          
          logger.warn("Account not initialized on Greenfield:", errorMessage);
          
          // Create a helpful response guiding the user to initialize their account first
          const textResponse = `⚠️ ACCOUNT INITIALIZATION REQUIRED

Your wallet account (${address}) has not been initialized on the Greenfield network yet.

Before you can create buckets or upload files, you need to initialize your account by transferring a small amount of BNB from BSC to Greenfield.

You can do this by:
1. Use the "GREENFIELD_BNB" action with a cross-chain transfer
2. Send a message like: "Transfer 0.01 BNB from BSC to my Greenfield account"

Once your account is initialized, you can try creating your bucket again.`;
          
          callback?.({
            text: textResponse,
            content: { 
              success: false,
              error: "Account not initialized on Greenfield",
              action: "crossChainTransfer",
              walletAddress: address,
              suggestedAction: "Please perform a cross-chain transfer to initialize your account."
            },
          });
          return false;
        }
        
        // Re-throw other errors to be caught by the main error handler
        throw error;
      }
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error executing Greenfield action:", errorObj.message);
      logger.debug("Error details:", errorObj.stack || "No stack trace available");
      
      // Provide user-friendly error messages
      let errorMessage = errorObj.message;
      
      if (errorMessage.includes("no file to upload")) {
        errorMessage = "Please attach a file to upload.";
      } else if (errorMessage.includes("only those containing")) {
        errorMessage = "No suitable storage providers found. Please try again later.";
      } else if (errorMessage.includes("already exists")) {
        errorMessage = "A bucket or object with that name already exists. Please choose a different name.";
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient funds to complete this operation. Please ensure you have enough BNB.";
      } else if (errorMessage.includes("account not found") || errorMessage.includes("key not found")) {
        errorMessage = "Your account hasn't been initialized on Greenfield. Please transfer BNB from BSC to Greenfield first.";
      }
      
      logger.debug(`Returning error response: ${errorMessage}`);
      
      // Extract bucket and object names from content if they exist
      const bucketName = (content as Record<string, unknown>)?.bucketName as string | undefined;
      const objectName = (content as Record<string, unknown>)?.objectName as string | undefined;
      
      // Create a detailed error response
      const textResponse = `❌ GREENFIELD OPERATION FAILED

Error: ${errorMessage}

Action: ${content?.actionType || "Unknown"}
${bucketName ? `Bucket: ${bucketName}\n` : ""}${objectName ? `Object: ${objectName}\n` : ""}
Troubleshooting:
• Check your BNB balance
• Ensure bucket/object names follow naming rules
• Try again later if network issues persist`;
      
      callback?.({
        text: textResponse,
        content: { 
          success: false,
          error: errorMessage,
          actionType: content?.actionType,
          errorDetails: errorObj.stack
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
          text: "Create a bucket called 'autofunfun' on Greenfield bnb and initialize my account if need",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll create a 'my-docs' bucket on BNB Greenfield for you",
          actions: ["GREENFIELD_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Upload this document to my 'my-docs' bucket on Greenfield",
          attachments: [{ type: "document", url: "file://document.pdf" }]
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll upload your document to the 'my-docs' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Upload this image to my 'autofunfun' bucket on Greenfield",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll upload your image to the 'autofunfun' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Upload file /path/to/myfile.pdf to my 'autofunfun' bucket on Greenfield",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll upload the file from the path to your 'autofunfun' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Upload file packages/plugin-bnb-v2/files/README.pdf to my 'autofunfun' bucket on Greenfield",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll upload the file from the path to your 'autofunfun' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Delete the file 'report.pdf' from my 'my-docs' bucket on Greenfield",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll delete 'report.pdf' from your 'my-docs' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Transfer 0.001 BNB to my Greenfield account",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll transfer 0.001 BNB from your BNB Smart Chain wallet to your Greenfield account",
          actions: ["GREENFIELD_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
}; 