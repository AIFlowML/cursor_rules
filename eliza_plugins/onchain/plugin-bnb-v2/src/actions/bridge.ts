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
import { 
  parseEther, 
  getContract, 
  parseUnits, 
  erc20Abi,
  type Address,
  type PublicClient,
  type WalletClient,
  type Chain,
} from "viem";

import {
  bnbWalletProvider,
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { bridgeTemplate } from "../templates";
import {
  L1StandardBridgeAbi,
  L2StandardBridgeAbi,
  type BridgeParams,
  type BridgeResponse,
  type SupportedChain,
} from "../types";
import { EXPLORERS } from "../constants";

export { bridgeTemplate };

/**
 * Utility function to convert null or empty string to undefined
 * 
 * @param value - Value to check and convert
 * @returns The original value or undefined if it's null or empty string
 */
function convertNullStringToUndefined<T>(value: T | string | undefined | null): T | undefined {
  if (value === null || value === "") return undefined;
  return value as T | undefined;
}

/**
 * BridgeAction class - Handles token bridging between BNB Smart Chain and opBNB
 * 
 * This class implements the core functionality for bridging tokens
 * between BNB Smart Chain and opBNB using the standard bridge contracts.
 */
export class BridgeAction {
  private readonly L1_BRIDGE_ADDRESS =
    "0xF05F0e4362859c3331Cb9395CBC201E3Fa6757Ea" as const;
  private readonly L2_BRIDGE_ADDRESS =
    "0x4000698e3De52120DE28181BaACda82B21568416" as const;
  private readonly LEGACY_ERC20_ETH =
    "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000" as const;

  /**
   * Creates a new BridgeAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(private walletProvider: WalletProvider) {}

  /**
   * Execute a token bridge with the provided parameters
   * 
   * @param params - Bridge parameters including fromChain, toChain, token, and amount
   * @returns Bridge response with transaction details
   * @throws Error if bridge operation fails
   */
  async bridge(params: BridgeParams): Promise<BridgeResponse> {
    logger.debug("Starting bridge with params:", JSON.stringify(params, null, 2));
    
    // Validate and normalize parameters
    await this.validateAndNormalizeParams(params);
    logger.debug("After validation, bridge params:", JSON.stringify(params, null, 2));

    // Check if this is a native token bridge
    const nativeTokenBridge = 
      (params.fromToken === undefined) || 
      (typeof params.fromToken === 'string' && params.fromToken.toUpperCase() === "BNB");
    
    // Check if this is a self-bridge (no separate recipient)
    const selfBridge = params.toAddress === undefined;
    
    // Get account and address
    const account = this.walletProvider.getAccount();
    const fromAddress = this.walletProvider.getAddress();
    logger.debug(`From address: ${fromAddress}`);
    
    // Prepare response object
    const resp: BridgeResponse = {
      fromChain: params.fromChain,
      toChain: params.toChain,
      fromToken: nativeTokenBridge ? "BNB" : (params.fromToken as string) || "",
      toToken: nativeTokenBridge ? "BNB" : (params.toToken as string) || "",
      amount: params.amount,
      txHash: "0x",
      recipient: params.toAddress || fromAddress,
    };
    
    logger.debug("Bridge response initialized:", JSON.stringify(resp, null, 2));
    
    try {
      // Switch to source chain
      logger.debug(`Switching to source chain: ${params.fromChain}`);
      this.walletProvider.switchChain(params.fromChain);
      
      const publicClient = this.walletProvider.getPublicClient(params.fromChain);
      const walletClient = this.walletProvider.getWalletClient(params.fromChain);
      const chain = this.walletProvider.getChainConfigs(params.fromChain);
      
      // Calculate amount based on decimals
      let amount: bigint;
      
      // For native token, use parseEther
      if (nativeTokenBridge) {
        amount = parseEther(params.amount);
        logger.debug(`Native token bridge, amount: ${amount}`);
      } else {
        // For ERC20, get decimals first
        logger.debug(`Reading decimals for token: ${params.fromToken}`);
        const decimals = await publicClient.readContract({
          address: params.fromToken as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        });
        
        amount = parseUnits(params.amount, decimals);
        logger.debug(`ERC20 token bridge, amount: ${amount} with ${decimals} decimals`);
      }

      // Handle BSC to opBNB bridging
      if (params.fromChain === "bsc" && params.toChain === "opBNB") {
        logger.debug("Bridging from L1 (BSC) to L2 (opBNB)");
        logger.debug(`Using L1 bridge contract: ${this.L1_BRIDGE_ADDRESS}`);
        
        // Create contract instances
        const l1BridgeContractConfig = {
          address: this.L1_BRIDGE_ADDRESS as `0x${string}`,
          abi: L1StandardBridgeAbi,
        };
        
        // Use getContract for contract interactions
        const l1Contract = getContract({
          ...l1BridgeContractConfig,
          client: { public: publicClient, wallet: walletClient },
        });

        // Check ERC20 allowance if not native token
        if (!nativeTokenBridge) {
          logger.debug("Checking ERC20 allowance for L1 bridge");
          const allowance = await this.walletProvider.checkERC20Allowance(
            params.fromChain,
            params.fromToken as `0x${string}`,
            fromAddress,
            this.L1_BRIDGE_ADDRESS
          );
          
          logger.debug(`Current allowance: ${allowance}`);
          
          if (allowance < amount) {
            const neededAllowance = amount - allowance;
            logger.debug(`Increasing allowance by ${neededAllowance}`);
            
            const txHash = await this.walletProvider.approveERC20(
              params.fromChain,
              params.fromToken as `0x${string}`,
              this.L1_BRIDGE_ADDRESS,
              amount
            );
            logger.debug(`Approval transaction submitted with hash: ${txHash}`);
            
            await publicClient.waitForTransactionReceipt({
              hash: txHash,
            });
            logger.debug("Approval transaction confirmed");
          } else {
            logger.debug("Sufficient allowance already granted");
          }
        }

        // Execute the appropriate bridge function based on parameters
        if (selfBridge && nativeTokenBridge) {
          logger.debug("Self bridge with native token - using depositETH");
          const args = [1, "0x"] as const;
          
          logger.debug(`Simulating depositETH with value: ${amount}`);
          await publicClient.simulateContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositETH",
            args,
            account,
            value: amount,
          });
          
          logger.debug("Executing depositETH transaction");
          resp.txHash = await walletClient.writeContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositETH",
            args,
            value: amount,
            chain,
            account,
          });
        } else if (selfBridge && !nativeTokenBridge) {
          logger.debug("Self bridge with ERC20 token - using depositERC20");
          logger.debug(`From token: ${params.fromToken}, To token: ${params.toToken}`);
          
          const args = [
            params.fromToken as `0x${string}`,
            params.toToken as `0x${string}`,
            amount,
            1,
            "0x",
          ] as const;
          
          logger.debug("Simulating depositERC20");
          await publicClient.simulateContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositERC20",
            args,
            account,
          });
          
          logger.debug("Executing depositERC20 transaction");
          resp.txHash = await walletClient.writeContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositERC20",
            args,
            chain,
            account,
          });
        } else if (!selfBridge && nativeTokenBridge) {
          logger.debug("Bridge to another address with native token - using depositETHTo");
          logger.debug(`Recipient address: ${params.toAddress}`);
          
          const args = [params.toAddress as `0x${string}`, 1, "0x"] as const;
          
          logger.debug(`Simulating depositETHTo with value: ${amount}`);
          await publicClient.simulateContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositETHTo",
            args,
            account,
            value: amount,
          });
          
          logger.debug("Executing depositETHTo transaction");
          resp.txHash = await walletClient.writeContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositETHTo",
            args,
            value: amount,
            chain,
            account,
          });
        } else {
          logger.debug("Bridge to another address with ERC20 token - using depositERC20To");
          logger.debug(`From token: ${params.fromToken}, To token: ${params.toToken}`);
          logger.debug(`Recipient address: ${params.toAddress}`);
          
          const args = [
            params.fromToken as `0x${string}`,
            params.toToken as `0x${string}`,
            params.toAddress as `0x${string}`,
            amount,
            1,
            "0x",
          ] as const;
          
          logger.debug("Simulating depositERC20To");
          await publicClient.simulateContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositERC20To",
            args,
            account,
          });
          
          logger.debug("Executing depositERC20To transaction");
          resp.txHash = await walletClient.writeContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositERC20To",
            args,
              chain,
            account,
          });
        }
      }
      // Handle opBNB to BSC bridging
      else if (params.fromChain === "opBNB" && params.toChain === "bsc") {
        logger.debug("Bridging from L2 (opBNB) to L1 (BSC)");
        logger.debug(`Using L2 bridge contract: ${this.L2_BRIDGE_ADDRESS}`);
        
        // Create contract instances
        const l2BridgeContractConfig = {
          address: this.L2_BRIDGE_ADDRESS as `0x${string}`,
          abi: L2StandardBridgeAbi,
        };
        
        // Use getContract for contract interactions
        const l2Contract = getContract({
          ...l2BridgeContractConfig,
          client: { public: publicClient, wallet: walletClient },
        });

        // Get delegation fee
        logger.debug("Reading delegation fee from bridge contract");
        const delegationFee = await publicClient.readContract({
          address: this.L2_BRIDGE_ADDRESS as `0x${string}`,
          abi: L2StandardBridgeAbi,
          functionName: "delegationFee",
        }) as bigint;
        logger.debug(`Delegation fee: ${delegationFee}`);

        // Check ERC20 allowance if not native token
        if (!nativeTokenBridge) {
          logger.debug("Checking ERC20 allowance for L2 bridge");
          const allowance = await this.walletProvider.checkERC20Allowance(
            params.fromChain,
            params.fromToken as `0x${string}`,
            fromAddress,
            this.L2_BRIDGE_ADDRESS
          );
          
          logger.debug(`Current allowance: ${allowance}`);
          
          if (allowance < amount) {
            const neededAllowance = amount - allowance;
            logger.debug(`Increasing allowance by ${neededAllowance}`);
            
            const txHash = await this.walletProvider.approveERC20(
              params.fromChain,
              params.fromToken as `0x${string}`,
              this.L2_BRIDGE_ADDRESS,
              amount
            );
            logger.debug(`Approval transaction submitted with hash: ${txHash}`);
            
            await publicClient.waitForTransactionReceipt({
              hash: txHash,
            });
            logger.debug("Approval transaction confirmed");
          } else {
            logger.debug("Sufficient allowance already granted");
          }
        }

        // Execute the appropriate bridge function based on parameters
        if (nativeTokenBridge) {
          logger.debug("Using withdraw for native token");
          const args = [this.LEGACY_ERC20_ETH, amount, 1, "0x"] as const;
          const value = amount + delegationFee;
          
          logger.debug(`Simulating withdraw with value: ${value}`);
          await publicClient.simulateContract({
            address: l2Contract.address,
            abi: l2Contract.abi,
            functionName: "withdraw",
            args,
            account,
            value,
          });
          
          logger.debug("Executing withdraw transaction");
          resp.txHash = await walletClient.writeContract({
            address: l2Contract.address,
            abi: l2Contract.abi,
            functionName: "withdraw",
            args,
            value,
            chain,
            account,
          });
        } else {
          logger.debug("Using withdraw for non-native token");
          const args = [
            params.fromToken as `0x${string}`,
            amount,
            1,
            "0x",
          ] as const;
          const value = delegationFee;
          
          logger.debug(`Simulating withdraw with delegationFee: ${value}`);
          await publicClient.simulateContract({
            address: l2Contract.address,
            abi: l2Contract.abi,
            functionName: "withdraw",
            args,
            account,
            value,
          });
          
          logger.debug("Executing withdraw transaction");
          resp.txHash = await walletClient.writeContract({
            address: l2Contract.address,
            abi: l2Contract.abi,
            functionName: "withdraw",
            args,
            value,
            chain,
            account,
          });
        }
      }
      
      logger.debug(`Bridge operation successful, txHash: ${resp.txHash}`);
      return resp;
    } catch (error: unknown) {
      logger.error("Error executing bridge operation:", error);
      
      // Enhance error message based on common bridge errors
      const errorObj = error as Error;
      const errorMessage = errorObj.message || String(error);
      
      if (errorMessage.includes("insufficient funds")) {
        throw new Error(`Insufficient funds to bridge ${params.amount} ${resp.fromToken}. Please check your balance.`);
      }
      
      if (errorMessage.includes("user rejected")) {
        throw new Error("Transaction rejected by user.");
      }
      
      if (errorMessage.includes("execution reverted")) {
        throw new Error("Bridge transaction reverted. This could be due to contract restrictions or incorrect parameters.");
      }
      
      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Validates and normalizes bridge parameters
   * 
   * @param params - The parameters to validate and normalize
   * @throws Error if parameters are invalid
   */
  async validateAndNormalizeParams(params: BridgeParams) {
    logger.debug("Validating bridge params:", JSON.stringify(params, null, 2));
    
    // Validate chains
    if (!params.fromChain) {
      logger.debug("No source chain specified, defaulting to bsc");
      params.fromChain = "bsc";
    }

    if (!params.toChain) {
      logger.debug("No destination chain specified");
      throw new Error("Destination chain is required for bridging");
    }

    // Only support BSC ⇔ opBNB bridges
    const isSupported = 
      (params.fromChain === "bsc" && params.toChain === "opBNB") || 
      (params.fromChain === "opBNB" && params.toChain === "bsc");
      
    if (!isSupported) {
      logger.error(`Unsupported bridge direction: ${params.fromChain} to ${params.toChain}`);
      throw new Error("Unsupported bridge direction. Currently only supporting: BSC ↔ opBNB");
    }
    
    // Validate amount
    if (!params.amount) {
      logger.error("No amount specified for bridging");
      throw new Error("Amount is required for bridging");
    }
    
    try {
      const amountValue = Number.parseFloat(params.amount);
      if (Number.isNaN(amountValue) || amountValue <= 0) {
        logger.error(`Invalid amount: ${params.amount}`);
        throw new Error(`Invalid amount: ${params.amount}. Please provide a positive number.`);
      }
      logger.debug(`Amount validation passed: ${params.amount}`);
    } catch (error) {
      logger.error(`Failed to parse amount: ${params.amount}`, error);
      throw new Error(`Invalid amount format: ${params.amount}. Please provide a valid number.`);
    }
    
    // From BSC to opBNB with ERC20 tokens requires destination token address
    if (params.fromChain === "bsc" && params.toChain === "opBNB" && params.fromToken) {
      // Native token doesn't need a destination token
      const isBnbToken = typeof params.fromToken === 'string' && params.fromToken.toUpperCase() === "BNB";
      
      if (!isBnbToken) {
        if (!params.toToken) {
          logger.error("Missing destination token address for ERC20 bridge");
          throw new Error("When bridging ERC20 tokens from BSC to opBNB, the token address on opBNB is required");
        }
        
        // Ensure toToken is a valid address if specified
        if (typeof params.toToken === "string" && !params.toToken.startsWith("0x")) {
          logger.error(`Invalid token address format: ${params.toToken}`);
          throw new Error(`Invalid token address: ${params.toToken}. Please provide a 0x-prefixed address.`);
        }
      }
    }
    
    // Handle BNB symbol to undefined for native token transfer
    if (typeof params.fromToken === 'string' && params.fromToken.toUpperCase() === "BNB") {
      logger.debug("Native token BNB specified, setting fromToken to undefined");
      params.fromToken = undefined;
    }
    
    // If toAddress specified, validate it's a valid address
    if (params.toAddress) {
      if (!params.toAddress.startsWith("0x") || params.toAddress.length !== 42) {
        logger.error(`Invalid address format: ${params.toAddress}`);
        throw new Error(`Invalid destination address: ${params.toAddress}. Please provide a valid 0x-prefixed address.`);
      }
    }
    
    logger.debug("Validation passed for bridge params");
  }
}

/**
 * Action for bridging tokens between BNB Smart Chain and opBNB
 * 
 * This action handles bridging of BNB and ERC20 tokens between
 * BNB Smart Chain (BSC) and opBNB networks using the standard bridges.
 */
export const bridgeAction: Action = {
  name: "BRIDGE_BNB",
  similes: [
    "CROSS_CHAIN_BNB", 
    "TRANSFER_CROSS_CHAIN_BNB", 
    "MOVE_CROSS_CHAIN_BNB",
    "L1_L2_TRANSFER_BNB"
  ],
  description: "Bridge tokens between BNB Smart Chain (BSC) and opBNB networks",
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
    logger.info("Executing BRIDGE_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));

    // Extract prompt text for bridge action analysis
    const promptText = typeof message.content.text === 'string' ? message.content.text.trim() : '';
    logger.debug(`Raw prompt text: "${promptText}"`);
    
    // Analyze prompt to detect bridge parameters directly
    const promptLower = promptText.toLowerCase();
    
    // Look for bridge patterns in the prompt
    const bridgeRegex = /(?:bridge|send|transfer|move)\s+([0-9.]+)\s+(?:bnb|token|([a-zA-Z0-9]+))\s+(?:from)?\s+(?:bsc|binance|opbnb|l1|l2)\s+(?:to)\s+(?:bsc|binance|opbnb|l1|l2)(?:\s+(?:to|address)\s+(0x[a-fA-F0-9]{40}))?/i;
    
    // Variables to store extracted information
    let directAmount: string | null = null;
    let directFromToken: string | null = null;
    const directToToken: string | null = null;
    let directFromChain: string | null = null;
    let directToChain: string | null = null;
    let directToAddress: string | null = null;
    
    // Try to match bridge pattern
    const match = promptText.match(bridgeRegex);
    if (match) {
      directAmount = match[1] || null;
      directFromToken = match[2] || null;
      directToAddress = match[3] || null;
      logger.debug(`Directly extracted amount: ${directAmount}, token: ${directFromToken}, to address: ${directToAddress}`);
    }
    
    // Detect chains based on keywords
    if (promptLower.includes("bsc to opbnb") || 
       promptLower.includes("binance to opbnb") || 
       promptLower.includes("l1 to l2")) {
      directFromChain = "bsc";
      directToChain = "opBNB";
      logger.debug("Detected BSC to opBNB direction from keywords");
    } else if (promptLower.includes("opbnb to bsc") || 
              promptLower.includes("opbnb to binance") || 
              promptLower.includes("l2 to l1")) {
      directFromChain = "opBNB";
      directToChain = "bsc";
      logger.debug("Detected opBNB to BSC direction from keywords");
    }
    
    // Initialize or update state
    const currentState = state ? state : (await runtime.composeState(message)) as State;
    
    try {
      // Only create walletInfo if state exists
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(
          runtime,
          message,
          currentState
        );
        logger.debug("Wallet info:", state.walletInfo);
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

    // Use runtime model to get bridge parameters
    const bridgePrompt = {
      template: bridgeTemplate,
      state: currentState
    };

    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(bridgePrompt),
      responseFormat: { type: "json_object" }
    });
    
    // Parse the JSON output
    let content: Record<string, unknown> = {};
    try {
      content = typeof mlOutput === 'string' ? JSON.parse(mlOutput) : mlOutput as Record<string, unknown>;
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
    }
    
    logger.debug("Generated bridge content:", JSON.stringify(content, null, 2));
    
    // PRIORITY ORDER FOR PARAMETER DETERMINATION:
    // 1. Direct match from prompt text (most reliable)
    // 2. Parameters specified in model-generated content
    
    let fromChain: SupportedChain;
    let toChain: SupportedChain;
    let fromToken: string | undefined;
    let toToken: string | undefined;
    let amount: string;
    let toAddress: `0x${string}` | undefined;
    
    // Determine fromChain
    if (directFromChain) {
      fromChain = directFromChain as SupportedChain;
      logger.debug(`Using from chain directly extracted from prompt: ${fromChain}`);
    } else if (content.fromChain && typeof content.fromChain === 'string') {
      fromChain = content.fromChain as SupportedChain;
      logger.debug(`Using from chain from generated content: ${fromChain}`);
    } else {
      fromChain = "bsc"; // Default
      logger.debug(`No from chain detected, defaulting to ${fromChain}`);
    }
    
    // Determine toChain
    if (directToChain) {
      toChain = directToChain as SupportedChain;
      logger.debug(`Using to chain directly extracted from prompt: ${toChain}`);
    } else if (content.toChain && typeof content.toChain === 'string') {
      toChain = content.toChain as SupportedChain;
      logger.debug(`Using to chain from generated content: ${toChain}`);
    } else {
      toChain = fromChain === "bsc" ? "opBNB" : "bsc"; // Default to opposite chain
      logger.debug(`No to chain detected, defaulting to ${toChain}`);
    }
    
    // Determine fromToken (can be undefined for native BNB)
    if (directFromToken) {
      fromToken = directFromToken.toUpperCase();
      logger.debug(`Using from token directly extracted from prompt: ${fromToken}`);
    } else if (content.fromToken) {
      fromToken = convertNullStringToUndefined(content.fromToken as string);
      if (fromToken) {
        logger.debug(`Using from token from generated content: ${fromToken}`);
      } else {
        logger.debug("Content contained null/invalid fromToken, using undefined (native BNB)");
      }
    }
    
    // Determine toToken (only needed for ERC20 tokens from BSC to opBNB)
    if (content.toToken) {
      toToken = convertNullStringToUndefined(content.toToken as string);
      if (toToken) {
        logger.debug(`Using to token from generated content: ${toToken}`);
      } else {
        logger.debug("Content contained null/invalid toToken, using undefined");
      }
    }
    
    // For ERC20 tokens from BSC to opBNB, toToken is required
    if (fromChain === "bsc" && fromToken && fromToken !== "BNB" && !toToken) {
      logger.error("Missing destination token address for ERC20 bridge");
      callback?.({
        text: "Cannot bridge ERC20 token from BSC to opBNB without destination token address. Please provide the token address on opBNB.",
        content: { error: "Missing destination token address" },
      });
      return false;
    }
    
    // Determine toAddress (optional)
    if (directToAddress?.startsWith("0x")) {
      toAddress = directToAddress as `0x${string}`;
      logger.debug(`Using to address directly extracted from prompt: ${toAddress}`);
    } else if (content.toAddress) {
      const addressValue = convertNullStringToUndefined(content.toAddress as string);
      if (addressValue?.startsWith("0x")) {
        toAddress = addressValue as `0x${string}`;
        logger.debug(`Using to address from generated content: ${toAddress}`);
      } else {
        logger.debug("Content contained null/invalid toAddress, using undefined");
      }
    }
    
    // Determine amount
    if (directAmount) {
      amount = directAmount;
      logger.debug(`Using amount directly extracted from prompt: ${amount}`);
    } else if (content.amount && 
      (typeof content.amount === 'string' || typeof content.amount === 'number')) {
      amount = String(content.amount);
      logger.debug(`Using amount from generated content: ${amount}`);
    } else {
      amount = "0.001"; // Default small amount
      logger.debug(`No amount detected, defaulting to ${amount}`);
    }

    const walletProvider = initWalletProvider(runtime);
    const action = new BridgeAction(walletProvider);
    
    // Convert token strings to Address type if they start with 0x
    let fromTokenAddress: `0x${string}` | undefined = undefined;
    if (fromToken?.startsWith("0x")) {
      fromTokenAddress = fromToken as `0x${string}`;
    }
    
    let toTokenAddress: `0x${string}` | undefined = undefined;
    if (toToken?.startsWith("0x")) {
      toTokenAddress = toToken as `0x${string}`;
    }
    
    const bridgeParams: BridgeParams = {
      fromChain,
      toChain,
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      amount,
      toAddress,
    };
    
    logger.debug("Final bridge params:", JSON.stringify(bridgeParams, null, 2));
    
    try {
      logger.debug("Calling bridge with params:", JSON.stringify(bridgeParams, null, 2));
      const bridgeResp = await action.bridge(bridgeParams);
      
      // Get explorer URLs for the source chain
      const explorer = EXPLORERS[bridgeResp.fromChain.toUpperCase() as keyof typeof EXPLORERS];
      const txExplorerUrl = explorer && bridgeResp.txHash 
        ? `${explorer.url}/tx/${bridgeResp.txHash}` 
        : null;
      const walletExplorerUrl = explorer && bridgeResp.recipient
        ? `${explorer.url}/address/${bridgeResp.recipient}`
        : null;
      
      // Create enhanced response with additional information
      const textResponse = `Successfully bridged ${bridgeResp.amount} ${bridgeResp.fromToken} from ${bridgeResp.fromChain} to ${bridgeResp.toChain}\nTransaction Hash: ${bridgeResp.txHash}${
        txExplorerUrl ? `\n\nView transaction: ${txExplorerUrl}` : ""
      }${walletExplorerUrl ? `\nView wallet: ${walletExplorerUrl}` : ""}\n\nNote: Bridge transactions may take 10-20 minutes to complete.`;
      
      callback?.({
        text: textResponse,
        content: { 
          ...bridgeResp,
          txExplorerUrl,
          walletExplorerUrl
        },
      });
      return true;
    } catch (error: unknown) {
      const errorObj = error as Error;
      logger.error("Error during bridge:", errorObj.message || String(error));
      
      // Log the entire error object for diagnosis
      try {
        logger.error("Full error details:", JSON.stringify(error, null, 2));
      } catch (e) {
        logger.error("Error object not serializable, logging properties individually:");
        if (errorObj && typeof errorObj === 'object') {
          // Convert to unknown first, then to a safer type for indexing
          const errorAsRecord = Object.entries(errorObj as unknown as Record<string, unknown>)
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {} as Record<string, unknown>);
            
          for (const [key, value] of Object.entries(errorAsRecord)) {
            try {
              logger.error(`${key}:`, value);
            } catch (e) {
              logger.error(`${key}: [Error serializing property]`);
            }
          }
        }
      }
      
      // Provide more user-friendly error messages
      let errorMessage = errorObj.message || String(error);
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for the bridge operation. Please check your balance and try with a smaller amount.";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transaction was rejected. Please try again if you want to proceed with the bridge operation.";
        } else if (errorMessage.includes("token address on opBNB is required")) {
          errorMessage = "When bridging ERC20 tokens from BSC to opBNB, you must specify the token address on opBNB.";
        } else if (errorMessage.includes("Unsupported bridge direction")) {
          errorMessage = "Only bridges between BSC and opBNB are supported. Valid directions are BSC→opBNB and opBNB→BSC.";
        }
      }
      
      callback?.({
        text: `Bridge failed: ${errorMessage}`,
        content: { error: errorMessage },
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Bridge 0.001 BNB from BSC to opBNB",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you bridge 0.001 BNB from BSC to opBNB",
          actions: ["BRIDGE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Send 0.001 BNB from opBNB back to BSC",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you bridge 0.001 BNB from opBNB to BSC",
          actions: ["BRIDGE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Bridge ERC20 token 0x1234... from BSC to opBNB. The destination token address is 0x5678...",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you bridge your ERC20 token from BSC to opBNB",
          actions: ["BRIDGE_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
}; 