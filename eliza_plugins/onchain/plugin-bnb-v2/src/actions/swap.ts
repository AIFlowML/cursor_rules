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
import { executeRoute, getRoutes } from "@lifi/sdk";
import { parseEther } from "viem";

import {
  bnbWalletProvider,
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { swapTemplate } from "../templates";
import type { SwapParams, SwapResponse, SupportedChain } from "../types";
import { EXPLORERS } from "../constants";

export { swapTemplate };

/**
 * SwapAction class - Handles token swaps on BNB Smart Chain
 * 
 * This class implements the core functionality for swapping tokens
 * on BNB Smart Chain, leveraging the LI.FI SDK for finding the best routes.
 */
export class SwapAction {
  /**
   * Creates a new SwapAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(private walletProvider: WalletProvider) {}

  /**
   * Execute a token swap with the provided parameters
   * 
   * @param params - Swap parameters including chain, from/to tokens, and amount
   * @returns Swap response with transaction details
   * @throws Error if swap fails
   */
  async swap(params: SwapParams): Promise<SwapResponse> {
    logger.debug("Starting swap with params:", JSON.stringify(params, null, 2));
    
    // Validate chain
    this.validateAndNormalizeParams(params);
    logger.debug("After validation, params:", JSON.stringify(params, null, 2));

    const fromAddress = this.walletProvider.getAddress();
    logger.debug(`From address: ${fromAddress}`);
    
    const chainId = this.walletProvider.getChainConfigs(params.chain).id;
    logger.debug(`Chain ID: ${chainId}`);

    // Configure LI.FI SDK
    logger.debug(`Configuring LI.FI SDK for chain: ${params.chain}`);
    this.walletProvider.configureLiFiSdk(params.chain);

    // Resolve token addresses if they're symbols
    let fromTokenAddress = params.fromToken;
    let toTokenAddress = params.toToken;
    
    // Handle fromToken
    if (!params.fromToken.startsWith('0x')) {
      try {
        logger.debug(`Resolving from token symbol: ${params.fromToken}`);
        fromTokenAddress = await this.walletProvider.getTokenAddress(
          params.chain,
          params.fromToken
        );
        logger.debug(`Resolved from token address: ${fromTokenAddress}`);
        
        // Special handling for native token
        if (params.fromToken.toUpperCase() === 'BNB') {
          logger.debug('Using special native token address for BNB');
          fromTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        }
      } catch (error) {
        logger.error(`Error resolving from token address for ${params.fromToken}:`, error);
        throw new Error(`Could not find token ${params.fromToken} on chain ${params.chain}. Please check the token symbol.`);
      }
    } else {
      logger.debug(`Using direct from token address: ${fromTokenAddress}`);
    }
    
    // Handle toToken
    if (!params.toToken.startsWith('0x')) {
      try {
        logger.debug(`Resolving to token symbol: ${params.toToken}`);
        toTokenAddress = await this.walletProvider.getTokenAddress(
          params.chain,
          params.toToken
        );
        logger.debug(`Resolved to token address: ${toTokenAddress}`);
        
        // Special handling for native token
        if (params.toToken.toUpperCase() === 'BNB') {
          logger.debug('Using special native token address for BNB');
          toTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        }
      } catch (error) {
        logger.error(`Error resolving to token address for ${params.toToken}:`, error);
        throw new Error(`Could not find token ${params.toToken} on chain ${params.chain}. Please check the token symbol.`);
      }
    } else {
      logger.debug(`Using direct to token address: ${toTokenAddress}`);
    }

    const resp: SwapResponse = {
      chain: params.chain,
      txHash: "0x",
      fromToken: params.fromToken,
      toToken: params.toToken,
      amount: params.amount,
    };

    logger.debug(`Getting routes from ${fromTokenAddress} to ${toTokenAddress}`);
    
    // Set a reasonable default slippage if not provided
    const slippage = params.slippage || 0.05; // Default 5%
    logger.debug(`Using slippage: ${slippage}`);
    
    try {
      const routes = await getRoutes({
        fromChainId: chainId,
        toChainId: chainId,
        fromTokenAddress: fromTokenAddress,
        toTokenAddress: toTokenAddress,
        fromAmount: parseEther(params.amount).toString(),
        fromAddress: fromAddress,
        options: {
          slippage: slippage,
          order: "RECOMMENDED",
        },
      });

      logger.debug(`Found ${routes.routes.length} routes`);
      
      if (!routes.routes.length) {
        throw new Error(`No routes found from ${params.fromToken} to ${params.toToken} with amount ${params.amount}`);
      }

      // Make sure routes[0] is defined before trying to execute it
      if (!routes.routes[0]) {
        throw new Error("No valid route found for swap");
      }

      logger.debug(`Executing route: ${JSON.stringify(routes.routes[0].steps, null, 2)}`);
      const execution = await executeRoute(routes.routes[0]);
      
      logger.debug(`Execution: ${JSON.stringify(execution.steps, null, 2)}`);
      
      const process =
        execution.steps[0]?.execution?.process[
          execution.steps[0]?.execution?.process.length - 1
        ];

      if (!process?.status || process.status === "FAILED") {
        throw new Error(`Transaction failed: ${process?.status || 'unknown error'}`);
      }

      resp.txHash = process.txHash as `0x${string}`;
      logger.debug(`Swap successful with tx hash: ${resp.txHash}`);
      
      return resp;
    } catch (error: unknown) {
      logger.error("Error during swap execution:", error);
      
      // Try to provide more specific error messages
      const errorObj = error as Error;
      const errorMessage = errorObj.message || String(error);
      
      if (errorMessage.includes("insufficient funds")) {
        logger.debug("Insufficient funds for swap");
        throw new Error(`Insufficient funds for swapping ${params.amount} ${params.fromToken}. Please check your balance.`);
      }
      
      if (errorMessage.includes("Cannot read properties")) {
        logger.error("SDK response parsing error");
        throw new Error("Error processing swap response. This might be due to rate limits or invalid token parameters.");
      }
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Validates and normalizes swap parameters
   * 
   * @param params - The parameters to validate and normalize
   * @throws Error if parameters are invalid
   */
  validateAndNormalizeParams(params: SwapParams): void {
    logger.debug(`Validating swap params: chain=${params.chain}, from=${params.fromToken}, to=${params.toToken}, amount=${params.amount}`);
    
    // Validate chain
    if (!params.chain) {
      logger.debug("No chain specified, defaulting to bsc");
      params.chain = "bsc";
    } else if (params.chain !== "bsc") {
      logger.error(`Unsupported chain: ${params.chain}`);
      throw new Error("Only BSC mainnet is supported for swaps");
    }
    
    // Validate token inputs
    if (!params.fromToken) {
      logger.error("From token not specified");
      throw new Error("From token is required for swap");
    }
    
    if (!params.toToken) {
      logger.error("To token not specified");
      throw new Error("To token is required for swap");
    }
    
    // Prevent swapping to the same token
    if (params.fromToken === params.toToken) {
      logger.error(`Cannot swap from and to the same token: ${params.fromToken}`);
      throw new Error(`Cannot swap from and to the same token: ${params.fromToken}`);
    }
    
    // Validate amount
    if (!params.amount) {
      logger.error("Amount not specified");
      throw new Error("Amount is required for swap");
    }
    
    try {
      const amountBigInt = parseEther(params.amount);
      if (amountBigInt <= 0n) {
        logger.error(`Invalid amount: ${params.amount} (must be greater than 0)`);
        throw new Error("Swap amount must be greater than 0");
      }
      logger.debug(`Amount parsed: ${amountBigInt.toString()} wei`);
    } catch (error) {
      logger.error(`Failed to parse amount: ${params.amount}`, error);
      throw new Error(`Invalid swap amount: ${params.amount}. Please provide a valid number.`);
    }
    
    // Validate slippage
    if (params.slippage !== undefined) {
      if (typeof params.slippage !== 'number') {
        logger.error(`Invalid slippage type: ${typeof params.slippage}`);
        throw new Error("Slippage must be a number");
      }
      
      if (params.slippage <= 0 || params.slippage > 1) {
        logger.error(`Invalid slippage value: ${params.slippage} (must be between 0 and 1)`);
        throw new Error("Slippage must be between 0 and 1 (e.g., 0.05 for 5%)");
      }
    } else {
      // Set default slippage
      params.slippage = 0.05;
      logger.debug(`Using default slippage: ${params.slippage}`);
    }
  }
}

/**
 * Action for swapping tokens on BNB Smart Chain networks
 * 
 * This action handles swapping tokens on BSC, finding the best route using the LI.FI SDK
 * and executing the swap transaction.
 */
export const swapAction: Action = {
  name: "SWAP_BNB",
  similes: ["TOKEN_SWAP_BNB", "EXCHANGE_TOKENS_BNB", "TRADE_TOKENS_BNB"],
  description: "Swap tokens on BNB Smart Chain (BSC) using the best available routes",
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
    logger.info("Executing SWAP_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));

    // Extract prompt text for token detection
    const promptText = typeof message.content.text === 'string' ? message.content.text.trim() : '';
    logger.debug(`Raw prompt text: "${promptText}"`);
    
    // Analyze prompt to detect tokens directly
    const promptLower = promptText.toLowerCase();
    
    // Look for swap patterns in the prompt
    const basicSwapRegex = /swap\s+([0-9.]+)\s+([a-zA-Z0-9]+)\s+(?:for|to)\s+([a-zA-Z0-9]+)/i;
    const advancedSwapRegex = /(?:swap|exchange|trade|convert)\s+([0-9.]+)\s+([a-zA-Z0-9]+)\s+(?:for|to|into)\s+([a-zA-Z0-9]+)/i;
    
    let directFromToken: string | null = null;
    let directToToken: string | null = null;
    let directAmount: string | null = null;
    
    // Try to match the swap pattern
    const match = promptText.match(basicSwapRegex) || promptText.match(advancedSwapRegex);
    if (match && match.length >= 4) {
      // Using non-null assertion (!) as we've already checked match exists and has sufficient length
      directAmount = match[1] || null;
      directFromToken = match[2] ? match[2].toUpperCase() : null;
      directToToken = match[3] ? match[3].toUpperCase() : null;
      logger.debug(`Directly extracted from prompt - Amount: ${directAmount}, From: ${directFromToken}, To: ${directToToken}`);
    }
    
    // Check for common token mentions
    const tokenMentions: Record<string, boolean> = {};
    const commonTokens = ['USDT', 'USDC', 'BNB', 'ETH', 'BTC', 'BUSD', 'DAI', 'WETC', 'WBNB', 'TRON', 'LINK', 'OM', 'UNI', 'PEPE', 'AAVE', 'ATOM'];
    
    for (const token of commonTokens) {
      // Check for case-insensitive mention, but as whole word
      const regex = new RegExp(`\\b${token}\\b`, 'i');
      if (regex.test(promptText)) {
        tokenMentions[token] = true;
        logger.debug(`Detected token in prompt: ${token}`);
      }
    }
    
    // Store prompt analysis results
    const promptAnalysis = {
      directFromToken,
      directToToken,
      directAmount,
      tokenMentions
    };
    
    logger.debug("Prompt analysis result:", promptAnalysis);

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
    }

    // Use runtime model to get swap parameters
    const swapPrompt = {
      template: swapTemplate,
      state: currentState
    };

    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(swapPrompt),
      responseFormat: { type: "json_object" }
    });
    
    // Parse the JSON output
    let content: Record<string, unknown> = {};
    try {
      content = typeof mlOutput === 'string' ? JSON.parse(mlOutput) : mlOutput as Record<string, unknown>;
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
    }
    
    logger.debug("Generated swap content:", JSON.stringify(content, null, 2));
    
    // Validate and normalize chain
    const chainValue = content.chain;
    const chain = typeof chainValue === 'string' ? chainValue.toLowerCase() : "bsc";
    logger.debug(`Chain parameter: ${chain}`);

    // PRIORITY ORDER FOR TOKEN DETERMINATION:
    // 1. Direct match from prompt text (most reliable)
    // 2. Tokens specified in model-generated content
    // 3. Fallback based on token mentions
    
    // Determine input token (from token)
    let fromToken: string;
    if (directFromToken) {
      fromToken = directFromToken;
      logger.debug(`Using from token directly extracted from prompt: ${fromToken}`);
    } else if (content.inputToken && typeof content.inputToken === 'string') {
      fromToken = content.inputToken;
      logger.debug(`Using from token from generated content: ${fromToken}`);
    } else if (tokenMentions?.BNB) {
      fromToken = 'BNB';
      logger.debug("Defaulting to BNB as from token based on mention");
    } else {
      fromToken = 'BNB'; // Default
      logger.debug("No from token detected, defaulting to BNB");
    }
    
    // Determine output token (to token)
    let toToken = 'USDC'; // Default initialization
    if (directToToken) {
      toToken = directToToken;
      logger.debug(`Using to token directly extracted from prompt: ${toToken}`);
    } else if (content.outputToken && typeof content.outputToken === 'string') {
      toToken = content.outputToken;
      logger.debug(`Using to token from generated content: ${toToken}`);
    } else {
      // Select a token different from fromToken
      let tokenFound = false;
      for (const token of ['USDC', 'USDT', 'BUSD']) {
        if (token !== fromToken && tokenMentions?.[token]) {
          toToken = token;
          logger.debug(`Using ${token} as to token based on mention`);
          tokenFound = true;
          break;
        }
      }
      
      if (!tokenFound) {
        toToken = fromToken === 'BNB' ? 'USDC' : 'BNB';
        logger.debug(`No to token detected, defaulting to ${toToken}`);
      }
    }
    
    // Determine amount
    let amount: string;
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
    
    // Validate slippage
    let slippage = content.slippage as number | undefined;
    if (typeof slippage !== 'number' || slippage <= 0 || slippage > 1) {
      slippage = 0.05; // Default 5%
      logger.debug(`Invalid or missing slippage, using default: ${slippage}`);
    } else {
      logger.debug(`Using slippage from content: ${slippage}`);
    }

    const walletProvider = initWalletProvider(runtime);
    const action = new SwapAction(walletProvider);
    const swapOptions: SwapParams = {
      chain: chain as SupportedChain,
      fromToken: fromToken,
      toToken: toToken,
      amount: amount,
      slippage: slippage,
    };
    
    logger.debug("Final swap options:", JSON.stringify(swapOptions, null, 2));
    
    try {
      logger.debug("Calling swap with params:", JSON.stringify(swapOptions, null, 2));
      const swapResp = await action.swap(swapOptions);
      
      // Get block explorer URLs
      const explorerInfo = swapOptions.chain === 'bsctestnet' as SupportedChain ? EXPLORERS.BSC_TESTNET : 
                          swapOptions.chain === 'opbnb' as SupportedChain ? EXPLORERS.OPBNB : EXPLORERS.BSC;
      
      const txExplorerUrl = `${explorerInfo.url}/tx/${swapResp.txHash}`;
      const walletAddress = walletProvider.getAddress();
      const walletExplorerUrl = `${explorerInfo.url}/address/${walletAddress}`;
      
      logger.debug(`Transaction explorer URL: ${txExplorerUrl}`);
      logger.debug(`Wallet explorer URL: ${walletExplorerUrl}`);
      
      // Get gas information if available from the executed route
      let gasPrice = "Unknown";
      let gasLimit = "Unknown";
      let gasCostBNB = "Unknown";
      let gasCostUSD = "Unknown";
      
      try {
        // This information might not always be available depending on the execution response
        const gasCosts = swapResp.executionDetails?.gasCosts;
        if (gasCosts && gasCosts.length > 0) {
          const gasDetails = gasCosts[0];
          if (gasDetails) {
            gasPrice = gasDetails.price ? `${Number(gasDetails.price) / 1e9} Gwei` : "Unknown";
            gasLimit = gasDetails.limit || "Unknown";
            gasCostBNB = gasDetails.amount ? `${Number(gasDetails.amount) / 1e18} BNB` : "Unknown";
            gasCostUSD = gasDetails.amountUSD || "Unknown";
            
            logger.debug(`Gas details found - Price: ${gasPrice}, Limit: ${gasLimit}, Cost: ${gasCostBNB} BNB (${gasCostUSD} USD)`);
          } else {
            logger.debug("Gas details array exists but first entry is undefined");
          }
        } else {
          logger.debug("No detailed gas information available in swap response");
        }
      } catch (error) {
        logger.debug("Error extracting gas details:", error instanceof Error ? error.message : String(error));
      }
      
      callback?.({
        text: `Successfully swapped ${swapResp.amount} ${swapResp.fromToken} to ${swapResp.toToken}
Transaction Hash: ${swapResp.txHash}
View transaction: ${txExplorerUrl}
View wallet: ${walletExplorerUrl}
${gasPrice !== "Unknown" ? `\nGas used: ${gasPrice} (limit: ${gasLimit})` : ""}
${gasCostBNB !== "Unknown" ? `Gas cost: ${gasCostBNB} (${gasCostUSD} USD)` : ""}`,
        content: { 
          ...swapResp,
          txExplorerUrl,
          walletExplorerUrl,
          gasDetails: {
            gasPrice,
            gasLimit,
            gasCostBNB,
            gasCostUSD
          }
        },
      });
      return true;
    } catch (error: unknown) {
      const errorObj = error as Error;
      logger.error("Error during swap:", errorObj.message || String(error));
      
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
        if (errorMessage.includes("No routes found")) {
          errorMessage = `No swap route found from ${swapOptions.fromToken} to ${swapOptions.toToken}. Please check that both tokens exist and have liquidity.`;
        } else if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for the swap. Please check your balance and try with a smaller amount.";
        } else if (errorMessage.includes("high slippage")) {
          errorMessage = "Swap failed due to high price impact. Try reducing the amount or using a different token pair.";
        }
      }
      
      callback?.({
        text: `Swap failed: ${errorMessage}`,
        content: { 
          error: errorMessage,
          fromToken: swapOptions.fromToken,
          toToken: swapOptions.toToken
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
          text: "Swap 0.001 BNB for USDC on BSC",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you swap 0.001 BNB for USDC on BSC",
          actions: ["SWAP_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Buy some token of 0x1234 using 0.001 USDC on BSC. The slippage should be no more than 5%",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you swap 0.001 USDC for token 0x1234 on BSC",
          actions: ["SWAP_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
}; 