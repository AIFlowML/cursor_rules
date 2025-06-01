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
import type { Hex, Address } from "viem";
import WebSocket, { type ClientOptions } from "ws";

import {
  bnbWalletProvider,
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { faucetTemplate } from "../templates";
import type { FaucetResponse, FaucetParams } from "../types";
import { EXPLORERS } from "../constants";

export { faucetTemplate };

/**
 * FaucetAction class - Handles retrieving test tokens from the BSC Testnet faucet
 * 
 * This class implements the core functionality for requesting test tokens through
 * the BSC Testnet faucet WebSocket API.
 */
export class FaucetAction {
  /**
   * List of supported test tokens available from the faucet
   */
  private readonly SUPPORTED_TOKENS: string[] = [
    "BNB",
    "BTC",
    "BUSD",
    "DAI",
    "ETH",
    "USDC",
  ] as const;

  /**
   * WebSocket URL for the BSC Testnet faucet API
   */
  private readonly FAUCET_URL = "wss://testnet.bnbchain.org/faucet-smart/api";

  /**
   * Creates a new FaucetAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(private walletProvider: WalletProvider) {}

  /**
   * Request test tokens from the BSC Testnet faucet
   * 
   * @param params - Parameters for the faucet request including token and recipient address
   * @returns Promise resolving to faucet response with transaction details
   * @throws Error if faucet request fails
   */
  async faucet(params: FaucetParams): Promise<FaucetResponse> {
    logger.debug("Faucet params:", JSON.stringify(params, null, 2));
    
    try {
      await this.validateAndNormalizeParams(params);
      logger.debug("Normalized faucet params:", JSON.stringify(params, null, 2));
      
      // After validation, we know these values exist
      if (!params.token) {
        params.token = "BNB";
        logger.debug("No token specified, defaulting to BNB");
      }
      
      if (!params.toAddress) {
        params.toAddress = this.walletProvider.getAddress();
        logger.debug(`No address specified, using wallet address: ${params.toAddress}`);
      }

      const resp: FaucetResponse = {
        token: params.token,
        recipient: params.toAddress,
        txHash: "0x" as Hex,
      };

      const options: ClientOptions = {
        headers: {
          Connection: "Upgrade",
          Upgrade: "websocket",
        },
      };

      const ws = new WebSocket(this.FAUCET_URL, options);

      try {
        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          ws.once("open", () => resolve());
          ws.once("error", reject);
        });

        // Send the message
        const message = {
          tier: 0,
          url: params.toAddress,
          symbol: params.token,
          captcha: "noCaptchaToken",
        };
        logger.debug(`Sending faucet request: ${JSON.stringify(message, null, 2)}`);
        ws.send(JSON.stringify(message));

        // Wait for response with transaction hash
        const txHash = await new Promise<Hex>((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error("Faucet request timeout"));
          }, 15000);

          ws.on("message", (data) => {
            const response = JSON.parse(data.toString());
            logger.debug(`Faucet response: ${JSON.stringify(response, null, 2)}`);

            // First response: funding request accepted
            if (response.success) {
              logger.debug("Faucet request accepted");
              return;
            }

            // Second response: transaction details
            if (response.requests?.length > 0) {
              const hash = response.requests[0].tx.hash;
              if (hash) {
                clearTimeout(timeout);
                logger.debug(`Faucet transaction hash received: ${hash}`);
                
                // Ensure the hash is properly formatted with 0x prefix for Hex type
                const formattedHash = (hash.startsWith('0x') ? hash : `0x${hash}`) as Hex;
                resolve(formattedHash);
              }
            }

            // Handle error case
            if (response.error) {
              clearTimeout(timeout);
              logger.error(`Faucet error: ${response.error}`);
              reject(new Error(response.error));
            }
          });

          ws.on("error", (error) => {
            clearTimeout(timeout);
            logger.error(`WebSocket error: ${error.message}`);
            reject(
              new Error(`WebSocket error occurred: ${error.message}`)
            );
          });
        });

        resp.txHash = txHash;
        logger.debug(`Faucet success: ${params.token} to ${params.toAddress}, tx: ${txHash}`);
        return resp;
      } finally {
        ws.close();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Faucet error: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Validates and normalizes faucet parameters
   * 
   * @param params - Parameters to validate and normalize
   * @throws Error if validation fails
   */
  async validateAndNormalizeParams(params: FaucetParams): Promise<void> {
    logger.debug("Validating faucet params:", JSON.stringify(params, null, 2));
    
    try {
      // Token validation
      if (!params.token) {
        params.token = "BNB";
        logger.debug("No token specified, defaulting to BNB");
      }
      
      if (!this.SUPPORTED_TOKENS.includes(params.token)) {
        throw new Error(`Unsupported token: ${params.token}. Supported tokens are: ${this.SUPPORTED_TOKENS.join(', ')}`);
      }
      
      // Address validation
      if (!params.toAddress) {
        // Use wallet's own address if none provided
        params.toAddress = this.walletProvider.getAddress();
        logger.debug(`No address provided, using wallet address: ${params.toAddress}`);
        return;
      }
      
      // If the address is already in the correct format, use it directly
      if (typeof params.toAddress === 'string' && params.toAddress.startsWith("0x") && params.toAddress.length === 42) {
        logger.debug(`Using provided hex address: ${params.toAddress}`);
        return;
      }
      
      // Otherwise try to format it
      try {
        params.toAddress = await this.walletProvider.formatAddress(params.toAddress);
        logger.debug(`Successfully formatted address to: ${params.toAddress}`);
      } catch (error) {
        logger.error(`Error formatting address: ${error instanceof Error ? error.message : String(error)}`);
        // Fall back to wallet's own address if formatting fails
        params.toAddress = this.walletProvider.getAddress();
        logger.debug(`Falling back to wallet address: ${params.toAddress}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error in validateAndNormalizeParams: ${errorMessage}`);
      throw error;
    }
    
    logger.debug("Normalized faucet params:", JSON.stringify(params, null, 2));
  }
}

/**
 * Action for requesting test tokens from the BSC Testnet faucet
 * 
 * This action handles requests for test tokens (BNB, BUSD, DAI, USDC, etc.) 
 * from the BSC Testnet faucet to facilitate testing on the testnet.
 */
export const faucetAction: Action = {
  name: "FAUCET_BNB",
  similes: ["GET_TEST_TOKENS_BNB", "TEST_TOKENS_BNB", "TESTNET_TOKENS_BNB"],
  description: "Get test tokens from the BSC Testnet faucet (BNB, BUSD, DAI, USDC, etc.)",
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
    logger.info("Executing FAUCET_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));

    // Initialize or update state
    const currentState = state ? state : (await runtime.composeState(message)) as State;

    try {
      // Only create walletInfo if state exists
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(runtime, message, currentState);
        logger.debug("Wallet info:", JSON.stringify(state.walletInfo, null, 2));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
      callback?.({
        text: `Unable to access wallet: ${errorMessage}`,
        content: { error: errorMessage },
      });
      return false;
    }

    // Extract faucet parameters using the model
    const templateData = {
      template: faucetTemplate,
      state: currentState
    };

    // Log what we're sending to the model
    logger.debug("Template data sent to model:", JSON.stringify(templateData, null, 2));

    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    
    // Log the raw model output
    logger.debug("Raw model output:", mlOutput);

    // Parse the JSON output, handling possible markdown formatting
    let content: Record<string, unknown> = {};
    try {
      // Extract JSON if the model returned markdown-formatted JSON
      let jsonStr = mlOutput;
      if (typeof mlOutput === 'string') {
        // Check if the output is wrapped in markdown code blocks
        const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = mlOutput.match(jsonRegex);
        
        if (match?.[1]) {
          // Extract the JSON string from markdown code block
          jsonStr = match[1];
          logger.debug("Extracted JSON from markdown:", jsonStr);
        }
        
        // Now parse the JSON
        content = JSON.parse(jsonStr);
      } else {
        // If it's already an object, use it directly
        content = mlOutput as Record<string, unknown>;
      }
      
      logger.debug("Parsed faucet content:", JSON.stringify(content, null, 2));
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", error instanceof Error ? error.message : String(error));
      logger.error("Raw output that failed parsing:", mlOutput);
      callback?.({
        text: "Failed to process faucet request parameters. Please try again with a clearer request.",
        content: { error: "Invalid model output format" },
      });
      return false;
    }

    // Initialize wallet provider and action handler
    const walletProvider = initWalletProvider(runtime);
    const action = new FaucetAction(walletProvider);
    
    // Prepare faucet parameters with default values
    const faucetParams: FaucetParams = {
      token: typeof content.token === 'string' ? content.token : "BNB",
      toAddress: typeof content.toAddress === 'string' && content.toAddress ? 
                content.toAddress as Address : 
                walletProvider.getAddress(),
    };

    logger.debug("Final faucet parameters:", JSON.stringify(faucetParams, null, 2));

    try {
      // Execute faucet request
      logger.debug(`Requesting ${faucetParams.token} tokens for address ${faucetParams.toAddress}`);
      const faucetResponse = await action.faucet(faucetParams);
      
      // Get the block explorer URL for the transaction
      const blockExplorerUrl = `${EXPLORERS.BSC_TESTNET.url}/tx/${faucetResponse.txHash}`;
      logger.debug(`Block explorer URL: ${blockExplorerUrl}`);
      
      // Format success response with block explorer link
      callback?.({
        text: `Successfully requested ${faucetResponse.token} tokens from the BSC Testnet faucet.
Transaction hash: ${faucetResponse.txHash}
Tokens will be sent to: ${faucetResponse.recipient}
Check on block explorer: ${blockExplorerUrl}`,
        content: {
          success: true,
          token: faucetResponse.token,
          recipient: faucetResponse.recipient,
          txHash: faucetResponse.txHash,
          chain: "bscTestnet", 
          blockExplorerUrl: blockExplorerUrl
        },
      });
      
      return true;
    } catch (error: unknown) {
      // Handle errors gracefully
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error during faucet request:", errorObj.message);
      
      // Provide more user-friendly error messages
      let errorMessage = errorObj.message;
      
      if (errorMessage.includes("Invalid address")) {
        errorMessage = "Failed to validate address. Please provide a valid BSC address.";
      } else if (errorMessage.includes("Unsupported token")) {
        // Keep the original message as it's already user-friendly
      } else if (errorMessage.includes("WebSocket")) {
        errorMessage = "Connection to the faucet service failed. The service may be down or experiencing issues. Please try again later.";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "The faucet request timed out. Please try again later.";
      }
      
      callback?.({
        text: `Failed to get test tokens: ${errorMessage}`,
        content: { 
          success: false,
          error: errorMessage,
          requestedToken: faucetParams.token,
          requestedAddress: faucetParams.toAddress 
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
          text: "Get some USDC from the testnet faucet",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll request some test USDC tokens from the BSC Testnet faucet for you",
          actions: ["FAUCET_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need some test BNB for development",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you get some test BNB tokens from the BSC Testnet faucet",
          actions: ["FAUCET_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you send some testnet tokens to 0x1234567890AbCdEf1234567890AbCdEf12345678?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll request test BNB tokens from the faucet to be sent to that address",
          actions: ["FAUCET_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
}; 