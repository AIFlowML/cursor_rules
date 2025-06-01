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
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
  erc20Abi,
  type Hex,
} from "viem";

import {
  bnbWalletProvider,
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { transferTemplate } from "../templates";
import type { TransferParams, TransferResponse, SupportedChain } from "../types";
import { EXPLORERS } from "../constants";

export { transferTemplate };

/**
 * TransferAction class - Handles token transfers on BNB Smart Chain
 * 
 * This class implements the core functionality for transferring tokens
 * on BNB Smart Chain networks, handling both native BNB and ERC20 token transfers.
 */
export class TransferAction {
  private readonly TRANSFER_GAS = 21000n;
  private readonly DEFAULT_GAS_PRICE = 3000000000n; // 3 Gwei

  /**
   * Creates a new TransferAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(private walletProvider: WalletProvider) {}

  /**
   * Execute a token transfer with the provided parameters
   * 
   * @param params - Transfer parameters including chain, token, amount, and recipient
   * @returns Transfer response with transaction details
   * @throws Error if transfer fails
   */
  async transfer(params: TransferParams): Promise<TransferResponse> {
    logger.debug("Starting transfer with params:", JSON.stringify(params, null, 2));
    
    // Debug the chain validation
    logger.debug(`Chain before validation: ${params.chain}`);
    logger.debug("Available chains:", Object.keys(this.walletProvider.chains));
    
    // Check if the chain is supported
    if (!this.walletProvider.chains[params.chain]) {
      logger.error(`Chain '${params.chain}' is not supported. Available chains: ${Object.keys(this.walletProvider.chains).join(', ')}`);
      throw new Error(`Chain '${params.chain}' is not supported. Please use one of: ${Object.keys(this.walletProvider.chains).join(', ')}`);
    }
    
    // Handle data parameter - make sure it's not a string "null"
    // This must happen before validation to avoid type errors
    let dataParam: Hex | undefined = undefined;
    if (params.data && typeof params.data === 'string' && params.data.startsWith('0x')) {
      dataParam = params.data as Hex;
      logger.debug(`Using data parameter: ${dataParam}`);
    } else if (params.data) {
      logger.debug(`Ignoring invalid data parameter: ${params.data}`);
    }
    
    logger.debug("About to validate and normalize params");
    await this.validateAndNormalizeParams(params);
    logger.debug("After address validation, params:", JSON.stringify(params, null, 2));

    const fromAddress = this.walletProvider.getAddress();
    logger.debug(`From address: ${fromAddress}`);

    logger.debug(`Switching to chain: ${params.chain}`);
    this.walletProvider.switchChain(params.chain);

    const nativeToken = this.walletProvider.chains[params.chain]?.nativeCurrency?.symbol || "BNB";
    logger.debug(`Native token for chain ${params.chain}: ${nativeToken}`);

    // CRITICAL: Ensure token is never null before proceeding
    if (!params.token) {
      params.token = nativeToken;
      logger.debug(`Setting null token to native token: ${nativeToken}`);
    } else if (params.token.toLowerCase() === nativeToken.toLowerCase()) {
      // Standardize the token case if it matches the native token
      params.token = nativeToken;
      logger.debug(`Standardized token case to match native token: ${nativeToken}`);
    }
    
    logger.debug(`Final transfer token: ${params.token}`);

    const resp: TransferResponse = {
      chain: params.chain,
      txHash: "0x",
      recipient: params.toAddress,
      amount: "",
      token: params.token,
    };

    // Log current wallet balance before attempting transfer
    try {
      const publicClient = this.walletProvider.getPublicClient(params.chain);
      const balance = await publicClient.getBalance({
        address: fromAddress,
      });
      logger.debug(`Current wallet balance: ${formatEther(balance)} ${nativeToken}`);
    } catch (error) {
      logger.error("Failed to get wallet balance:", error instanceof Error ? error.message : String(error));
    }

    if (!params.token || params.token === "null" || params.token === nativeToken) {
      logger.debug("Entering native token transfer branch:", nativeToken);
      // Native token transfer
      const options: { gas?: bigint; gasPrice?: bigint; data?: Hex } = {
        data: dataParam,
      };
      let value: bigint;
      if (!params.amount) {
        // Transfer all balance minus gas
        logger.debug("No amount specified, transferring all balance minus gas");
        const publicClient = this.walletProvider.getPublicClient(
          params.chain
        );
        const balance = await publicClient.getBalance({
          address: fromAddress,
        });
        logger.debug(`Wallet balance for transfer: ${formatEther(balance)} ${nativeToken}`);

        value = balance - this.DEFAULT_GAS_PRICE * 21000n;
        logger.debug(`Calculated transfer amount: ${formatEther(value)} ${nativeToken} (balance minus gas)`);
        options.gas = this.TRANSFER_GAS;
        options.gasPrice = this.DEFAULT_GAS_PRICE;
        logger.debug(`Set gas options - gas: ${options.gas}, gasPrice: ${options.gasPrice}`);
      } else {
        logger.debug(`Using specified amount: ${params.amount} ${nativeToken}`);
        try {
          value = parseEther(params.amount);
          logger.debug(`Parsed amount to wei: ${value}`);
        } catch (error) {
          logger.error(`Error parsing amount "${params.amount}":`, error instanceof Error ? error.message : String(error));
          throw new Error(`Invalid amount format: ${params.amount}. Please provide a valid number.`);
        }
      }

      resp.amount = formatEther(value);
      logger.debug(`About to execute native token transfer: ${resp.amount} ${nativeToken} to ${params.toAddress}`);
      
      try {
        resp.txHash = await this.walletProvider.transfer(
          params.chain,
          params.toAddress,
          value,
          options
        );
        logger.debug(`Native token transfer successful, txHash: ${resp.txHash}`);
      } catch (error) {
        logger.error("Native token transfer failed:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    } else {
      // ERC20 token transfer
      logger.debug("Entering ERC20 token transfer branch for token:", params.token);
      let tokenAddress = params.token;
      logger.debug(`Token before address resolution: ${params.token}`);
      
      // Special case: If token is BNB (the native token), handle it separately
      // This avoids the LI.FI lookup which fails with null token
      if (params.token === "BNB" || params.token === "bnb") {
        logger.debug("Detected native token (BNB) passed to ERC20 handling branch - switching to native token handling");
        
        // Update response token to make sure it's consistent
        resp.token = nativeToken;
        
        // Switch to native token transfer
        const options: { gas?: bigint; gasPrice?: bigint; data?: Hex } = {
          data: dataParam,
        };
        let value: bigint;
        if (!params.amount) {
          // Transfer all balance minus gas
          logger.debug("No amount specified for BNB, transferring all balance minus gas");
          const publicClient = this.walletProvider.getPublicClient(
            params.chain
          );
          const balance = await publicClient.getBalance({
            address: fromAddress,
          });
          logger.debug(`Wallet balance for BNB transfer: ${formatEther(balance)} ${nativeToken}`);

          value = balance - this.DEFAULT_GAS_PRICE * 21000n;
          logger.debug(`Calculated BNB transfer amount: ${formatEther(value)} (balance minus gas)`);
          options.gas = this.TRANSFER_GAS;
          options.gasPrice = this.DEFAULT_GAS_PRICE;
        } else {
          logger.debug(`Using specified amount for BNB transfer: ${params.amount}`);
          try {
            value = parseEther(params.amount);
            logger.debug(`Parsed BNB amount to wei: ${value}`);
          } catch (error) {
            logger.error(`Error parsing BNB amount "${params.amount}":`, error instanceof Error ? error.message : String(error));
            throw new Error(`Invalid amount format: ${params.amount}. Please provide a valid number.`);
          }
        }

        resp.amount = formatEther(value);
        logger.debug(`About to execute BNB transfer: ${resp.amount} BNB to ${params.toAddress}`);
        
        try {
          resp.txHash = await this.walletProvider.transfer(
            params.chain,
            params.toAddress,
            value,
            options
          );
          logger.debug(`BNB transfer successful, txHash: ${resp.txHash}`);
        } catch (error) {
          logger.error("BNB transfer failed:", error instanceof Error ? error.message : String(error));
          throw error;
        }
        
        // Skip remaining ERC20 handling
        logger.debug("Native BNB transfer completed via transfer branch");
        return resp; // Return early to skip the rest of the ERC20 handling
      }
      
      if (!params.token.startsWith("0x")) {
        try {
          logger.debug(`Attempting to resolve token symbol: ${params.token} on chain ${params.chain}`);
          // Configure the LI.FI SDK for token lookup
          logger.debug("Configuring LI.FI SDK for token lookup");
          this.walletProvider.configureLiFiSdk(params.chain);
          
          logger.debug(`Calling getTokenAddress for token symbol: ${params.token}`);
          tokenAddress = await this.walletProvider.getTokenAddress(
            params.chain,
            params.token
          );
          
          logger.debug(`Resolved token address: ${tokenAddress} for ${params.token}`);
          
          // If token address doesn't start with 0x after resolution, it might have failed
          if (!tokenAddress || !tokenAddress.startsWith("0x")) {
            logger.error(`Failed to resolve token to proper address: ${tokenAddress}`);
            throw new Error(`Could not resolve token symbol ${params.token} to a valid address`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Error resolving token address for ${params.token}:`, error);
          throw new Error(`Could not find token ${params.token} on chain ${params.chain}. Please check the token symbol or use the contract address.`);
        }
      } else {
        logger.debug(`Using token address directly: ${tokenAddress}`);
      }
      
      logger.debug(`Final token address for ERC20 transfer: ${tokenAddress}`);

      const publicClient = this.walletProvider.getPublicClient(
        params.chain
      );
      
      logger.debug(`Getting token decimals for ${tokenAddress}`);
      let decimals: number;
      try {
        decimals = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        });
        logger.debug(`Token decimals: ${decimals}`);
      } catch (error) {
        logger.error("Failed to get token decimals:", error instanceof Error ? error.message : String(error));
        throw new Error(`Failed to get decimals for token at address ${tokenAddress}. The contract might not be an ERC20 token.`);
      }

      let value: bigint;
      if (!params.amount) {
        logger.debug("No amount specified, checking token balance");
        try {
          value = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [fromAddress],
          });
          logger.debug(`Token balance: ${formatUnits(value, decimals)} ${params.token}`);
        } catch (error) {
          logger.error("Failed to get token balance:", error instanceof Error ? error.message : String(error));
          throw new Error(`Failed to get balance for token at address ${tokenAddress}. The contract might not be an ERC20 token.`);
        }
      } else {
        logger.debug(`Using specified amount for token transfer: ${params.amount}`);
        try {
          value = parseUnits(params.amount, decimals);
          logger.debug(`Parsed token amount: ${value} (${formatUnits(value, decimals)} in decimals)`);
        } catch (error) {
          logger.error(`Error parsing token amount "${params.amount}":`, error instanceof Error ? error.message : String(error));
          throw new Error(`Invalid amount format: ${params.amount}. Please provide a valid number.`);
        }
      }

      resp.amount = formatUnits(value, decimals);
      logger.debug(`About to execute ERC20 transfer: ${resp.amount} ${params.token} to ${params.toAddress}`);
      
      try {
        resp.txHash = await this.walletProvider.transferERC20(
          params.chain,
          tokenAddress as `0x${string}`,
          params.toAddress,
          value
        );
        logger.debug(`ERC20 transfer successful, txHash: ${resp.txHash}`);
      } catch (error) {
        logger.error("ERC20 transfer failed:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    }

    if (!resp.txHash || resp.txHash === "0x") {
      logger.error("Transaction hash is empty or null");
      throw new Error("Get transaction hash failed");
    }

    // wait for the transaction to be confirmed
    logger.debug(`Waiting for transaction confirmation: ${resp.txHash}`);
    const publicClient = this.walletProvider.getPublicClient(params.chain);
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: resp.txHash,
      });
      logger.debug(`Transaction confirmed, status: ${receipt.status}, block: ${receipt.blockNumber}`);
    } catch (error) {
      logger.error("Error waiting for transaction confirmation:", error instanceof Error ? error.message : String(error));
      // Still return response even if we couldn't wait for confirmation
      logger.debug("Returning transfer response despite confirmation error");
    }

    return resp;
  }

  /**
   * Validates and normalizes transfer parameters
   * 
   * @param params - The parameters to validate and normalize
   * @throws Error if parameters are invalid
   */
  async validateAndNormalizeParams(params: TransferParams): Promise<void> {
    logger.debug("Starting parameter validation and normalization");
    
    if (!params.toAddress) {
      logger.error("No toAddress provided in params");
      throw new Error("To address is required");
    }
    
    logger.debug(`Formatting address: ${params.toAddress}`);
    try {
      params.toAddress = await this.walletProvider.formatAddress(
        params.toAddress
      );
      logger.debug(`Address formatted successfully: ${params.toAddress}`);
    } catch (error) {
      logger.error("Error formatting address:", error instanceof Error ? error.message : String(error));
      throw new Error(`Invalid address format: ${params.toAddress}`);
    }

    // Proper type handling for data field
    if (params.data !== undefined) {
      // Store the original value to check for "null" string
      const dataValue = params.data as unknown as string;
      logger.debug(`Processing data field, original value: ${dataValue}`);
      
      // Check if it's the "null" string
      if (dataValue === "null") {
        logger.debug('Data field is "null" string, converting to "0x"');
        params.data = "0x" as `0x${string}`;
      } else if (dataValue !== "0x" && !dataValue.startsWith("0x")) {
        // If it's not already "0x" prefix, add it
        logger.debug(`Adding "0x" prefix to data: ${dataValue}`);
        try {
          params.data = `0x${dataValue}` as `0x${string}`;
        } catch (error) {
          logger.error(`Error formatting data field: ${error instanceof Error ? error.message : String(error)}`);
          // Default to "0x" if we can't format it
          params.data = "0x" as `0x${string}`;
        }
      } else {
        logger.debug(`Using data as-is: ${dataValue}`);
      }
    } else {
      logger.debug("No data field provided in params");
      // Ensure data field is at least defined with a default value
      params.data = "0x" as `0x${string}`;
    }
    
    logger.debug("Final data field:", params.data);
    logger.debug("Parameter validation and normalization completed successfully");
  }
}

/**
 * Action for transferring tokens on BNB Smart Chain networks
 * 
 * This action handles transfers of BNB and ERC20 tokens on BSC and opBNB networks.
 */
export const transferAction: Action = {
  name: "TRANSFER_BNB",
  similes: ["SEND_TOKENS_BNB", "TOKEN_TRANSFER_BNB", "MOVE_TOKENS_BNB", "PAY_BNB"],
  description: "Transfers native BNB or ERC20 tokens on BNB Smart Chain (BSC) or opBNB networks",
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
    logger.info("Executing TRANSFER_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    logger.debug("Message source:", message.content.source);

    // Extract prompt text if available to help with token detection
    const promptText = typeof message.content.text === 'string' ? message.content.text.trim() : '';
    logger.debug(`Raw prompt text: "${promptText}"`);
    
    // Pre-analyze the prompt for token indicators - more aggressive token detection
    const promptLower = promptText.toLowerCase();
    
    // Direct BNB token detection - look for explicit mentions of BNB
    const containsBnb = promptLower.includes('bnb') || 
                        promptLower.includes('binance coin') || 
                        promptLower.includes('binance smart chain');
    
    // Direct token detection from prompt format like "Transfer 0.0001 BNB to 0x123..."
    let directTokenMatch: string | null = null;
    const transferRegex = /transfer\s+([0-9.]+)\s+([a-zA-Z0-9]+)\s+to\s+(0x[a-fA-F0-9]{40})/i;
    const match = promptText.match(transferRegex);
    
    if (match && match.length >= 3 && match[2]) {
      const amount = match[1];
      const tokenSymbol = match[2];
      const toAddress = match[3];
      directTokenMatch = tokenSymbol.toUpperCase();
      logger.debug(`Directly extracted from prompt - Amount: ${amount}, Token: ${directTokenMatch}, To: ${toAddress}`);
    }
    
    if (containsBnb) {
      logger.debug(`BNB transfer detected in prompt text: "${promptText}"`);
    }
    
    // Store this information for later use
    const promptAnalysis = {
      containsBnb,
      directTokenMatch
    };
    
    logger.debug("Prompt analysis result:", promptAnalysis);

    // Validate transfer - IMPORTANT: Check for both "direct" and "client_chat:user" as valid sources
    logger.debug("Validating message source:", message.content.source);
    if (!(message.content.source === "direct" || message.content.source === "client_chat:user")) {
      logger.warn("Transfer rejected: invalid source:", message.content.source);
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Transfer not allowed" },
      });
      return false;
    }
    logger.debug("Source validation passed");

    // Initialize or update state
    logger.debug("Initializing state");
    const currentState = state ? state : (await runtime.composeState(message)) as State;
    
    try {
      // Only create walletInfo if state exists
      if (state) {
        logger.debug("Getting wallet info from provider");
        state.walletInfo = await bnbWalletProvider.get(
          runtime,
          message,
          currentState
        );
        logger.debug("Wallet info retrieved:", state.walletInfo);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
    }

    // Log available settings
    logger.debug("Available runtime settings:");
    const bscProviderUrl = runtime.getSetting("BSC_PROVIDER_URL");
    const bscTestnetProviderUrl = runtime.getSetting("BSC_TESTNET_PROVIDER_URL");
    const bnbPrivateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    logger.debug(`BSC_PROVIDER_URL: ${bscProviderUrl ? "set" : "not set"}`);
    logger.debug(`BSC_TESTNET_PROVIDER_URL: ${bscTestnetProviderUrl ? "set" : "not set"}`);
    logger.debug(`BNB_PRIVATE_KEY: ${bnbPrivateKey ? `set (starts with ${bnbPrivateKey.substring(0, 6)}...)` : "not set"}`);

    // Generate transfer content - manually extract from runtime model output
    logger.debug("Creating transfer prompt");
    const transferPrompt = {
      template: transferTemplate,
      state: currentState
    };

    // Log what we're sending to the model
    logger.debug("Template data sent to model:", JSON.stringify(transferPrompt, null, 2));

    // Use runtime model to get transfer parameters
    logger.debug("Calling useModel to generate transfer parameters");
    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(transferPrompt),
      responseFormat: { type: "json_object" }
    });
    
    // Log the raw model output for debugging
    logger.debug("Raw model output:", mlOutput);
    
    // Parse the JSON output
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
      logger.debug("Successfully parsed model output");
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", error instanceof Error ? error.message : String(error));
      logger.error("Raw output that failed parsing:", mlOutput);
      
      // Use direct extraction from the prompt as a fallback
      logger.debug("Using direct extraction from prompt as fallback");
      content = {};
      
      // Set content values directly from prompt analysis if available
      if (match) {
        content.amount = match[1] || ""; // Amount
        content.token = match[2] || "BNB"; // Token
        content.toAddress = match[3] || ""; // Address
        logger.debug("Set content from regex extraction:", content);
      }
    }
    
    logger.debug("Generated transfer content:", JSON.stringify(content, null, 2));
    
    // Normalize chain from content
    const chainValue = content.chain;
    const chain = typeof chainValue === 'string' ? chainValue.toLowerCase() : "bsc";
    logger.debug(`Chain parameter: ${chain}`);
    
    // Check if content has a token field
    const tokenValue = content.token;
    let token: string;
    
    // 1. First priority: Use directly extracted token from prompt if available
    if (directTokenMatch) {
      token = directTokenMatch;
      logger.debug(`Using token directly extracted from prompt: ${token}`);
    }
    // 2. Second priority: Use token from content if available
    else if (tokenValue && typeof tokenValue === 'string') {
      token = tokenValue;
      logger.debug(`Using token from generated content: ${token}`);
    }
    // 3. Third priority: Detected BNB in prompt
    else if (containsBnb) {
      token = "BNB";
      logger.debug("Using BNB as detected in prompt");
    }
    // 4. Default fallback
    else {
      token = "BNB"; // Default to native token
      logger.debug("No token detected, defaulting to native token BNB");
    }
    
    // Final validation - never allow null/undefined as token value
    if (!token) {
      token = "BNB";
      logger.debug("Final safeguard: ensuring token is not null/undefined");
    }
    
    logger.debug(`Final token parameter: ${token}`);

    logger.debug("Initializing wallet provider");
    const walletProvider = initWalletProvider(runtime);
    logger.debug("Wallet address:", walletProvider.getAddress());
    
    const action = new TransferAction(walletProvider);
    logger.debug("TransferAction instance created");
    
    // Process data field to avoid passing "null" string
    let dataParam: Hex | undefined = undefined;
    const dataValue = content.data;
    if (dataValue && typeof dataValue === 'string') {
      if (dataValue.startsWith('0x') && dataValue !== '0x') {
        // Ensure it's a proper Hex type by creating a new string with the 0x prefix
        dataParam = dataValue as `0x${string}`;
        logger.debug(`Using valid hex data: ${dataParam}`);
      } else {
        logger.debug(`Invalid data format or value: ${dataValue}, ignoring`);
      }
    }

    // Ensure toAddress is properly formatted
    let toAddress = "";
    if (typeof content.toAddress === 'string') {
      toAddress = content.toAddress;
    } else if (match?.[3]) {
      // Use address extracted from prompt if available
      toAddress = match[3];
      logger.debug(`Using address extracted from prompt: ${toAddress}`);
    }
    
    // Ensure amount is properly formatted
    let amount = "";
    if (content.amount && (typeof content.amount === 'string' || typeof content.amount === 'number')) {
      amount = String(content.amount);
    } else if (match?.[1]) {
      // Use amount extracted from prompt if available
      amount = match[1];
      logger.debug(`Using amount extracted from prompt: ${amount}`);
    }
    
    const paramOptions: TransferParams = {
      chain: chain as SupportedChain,
      token: token,
      amount: amount,
      toAddress: toAddress as `0x${string}`,
      data: dataParam,
    };
    
    logger.debug("Transfer params before action:", JSON.stringify(paramOptions, null, 2));

    try {
      logger.debug("Calling transfer with params:", JSON.stringify(paramOptions, null, 2));
      
      // Log the wallet initialization process
      logger.debug("Wallet provider initialized, address:", walletProvider.getAddress());
      
      // About to call the transfer method
      logger.debug("About to call TransferAction.transfer() method...");
      const transferResp = await action.transfer(paramOptions);
      logger.debug("Transfer method completed successfully, response:", JSON.stringify(transferResp, null, 2));
      
      // Get the block explorer URL for the transaction based on the chain
      const explorerInfo = chain === 'bsctestnet' ? EXPLORERS.BSC_TESTNET : 
                           chain === 'opbnb' ? EXPLORERS.OPBNB : EXPLORERS.BSC;
      
      const blockExplorerUrl = `${explorerInfo.url}/tx/${transferResp.txHash}`;
      const walletExplorerUrl = `${explorerInfo.url}/address/${transferResp.recipient}`;
      logger.debug(`Block explorer URL: ${blockExplorerUrl}`);
      logger.debug(`Wallet explorer URL: ${walletExplorerUrl}`);
      
      callback?.({
        text: `Successfully transferred ${transferResp.amount} ${transferResp.token} to ${transferResp.recipient}
Transaction Hash: ${transferResp.txHash}
Check on block explorer: ${blockExplorerUrl}
Check the wallet: ${walletExplorerUrl}`,
        content: { 
          ...transferResp,
          blockExplorerUrl: blockExplorerUrl,
          walletExplorerUrl: walletExplorerUrl
        },
      });

      return true;
    } catch (error: unknown) {
      const errorObj = error as Error;
      logger.error("Error during transfer:", errorObj.message || String(error));
      
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
      
      // Enhanced error diagnosis
      let errorMessage = errorObj.message || String(error);
      
      // Check for LI.FI SDK errors
      if (typeof errorMessage === 'string' && errorMessage.includes("LI.FI SDK")) {
        logger.error("LI.FI SDK error detected");
        
        if (errorMessage.includes("Request failed with status code 404") && 
          errorMessage.includes("Could not find token")) {
          // Extract the token that couldn't be found from the error message
          const tokenMatch = errorMessage.match(/Could not find token (.*?) on chain/);
          const tokenValue = tokenMatch ? tokenMatch[1] : paramOptions.token;
          
          errorMessage = `Could not find the token '${tokenValue}' on ${paramOptions.chain}. 
          Please check the token symbol or address and try again.`;
          
          logger.error("Token not found:", tokenValue);
          logger.debug("Original token from params:", paramOptions.token);
          
          // Suggest a solution
          if (tokenValue === "null" || tokenValue === "undefined" || !tokenValue) {
            errorMessage += " For BNB transfers, please explicitly specify 'BNB' as the token.";
          }
        } else if (errorMessage.includes("400 Bad Request") && errorMessage.includes("chain must be")) {
          errorMessage = `Chain validation error: '${paramOptions.chain}' is not a valid chain for the LI.FI SDK. 
          Please use 'bsc' for BSC mainnet.`;
        }
      }
      
      // Check for other common errors
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for the transaction. Please check your balance and try again with a smaller amount.";
        } else if (errorMessage.includes("transaction underpriced")) {
          errorMessage = "Transaction underpriced. Please try again with a higher gas price.";
        }
      }
      
      // Add block explorer link to view wallet address
      const explorerInfo = chain === 'bsctestnet' ? EXPLORERS.BSC_TESTNET : 
                         chain === 'opbnb' ? EXPLORERS.OPBNB : EXPLORERS.BSC;
      const walletExplorerUrl = `${explorerInfo.url}/address/${walletProvider.getAddress()}`;
      
      callback?.({
        text: `Transfer failed: ${errorMessage}
You can check your wallet balance at: ${walletExplorerUrl}`,
        content: { 
          error: errorMessage,
          walletExplorerUrl: walletExplorerUrl
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
          text: "Transfer 0.001 BNB to 0xC9904881242cF8A1e105E800A9CF6fF4Ec0289f0",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you transfer 0.001 BNB to 0x2CE4EaF47CACFbC6590686f8f7521e0385822334 on BSC",
          actions: ["TRANSFER_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Transfer 1 USDT to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you transfer 1 USDT to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on BSC",
          actions: ["TRANSFER_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
};
