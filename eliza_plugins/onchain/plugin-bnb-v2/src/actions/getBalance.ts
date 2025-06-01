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
import { getToken } from "@lifi/sdk";
import { type Address, erc20Abi, formatEther, formatUnits } from "viem";

import {
  bnbWalletProvider,
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { getBalanceTemplate } from "../templates";
import type {
  GetBalanceParams,
  GetBalanceResponse,
  SupportedChain,
} from "../types";
import { EXPLORERS } from "../constants";

export { getBalanceTemplate };

/**
 * GetBalanceAction class - Handles token balance queries on BNB Smart Chain networks
 * 
 * This class implements the core functionality to retrieve balances of native
 * and ERC20 tokens from BNB Smart Chain and opBNB networks.
 */
export class GetBalanceAction {
  /**
   * Creates a new GetBalanceAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(private walletProvider: WalletProvider) {}

  /**
   * Get token balance for the specified address and chain
   * 
   * @param params - Parameters including chain, address, and token
   * @returns Balance response with token and amount
   * @throws Error if balance retrieval fails
   */
  async getBalance(params: GetBalanceParams): Promise<GetBalanceResponse> {
    logger.debug("Get balance params:", JSON.stringify(params, null, 2));
    await this.validateAndNormalizeParams(params);
    logger.debug("Normalized get balance params:", JSON.stringify(params, null, 2));

    const { chain, address, token } = params;
    if (!address) {
      throw new Error("Address is required for getting balance");
    }

    this.walletProvider.switchChain(chain);
    const nativeSymbol = this.walletProvider.getChainConfigs(chain).nativeCurrency.symbol;
    const chainId = this.walletProvider.getChainConfigs(chain).id;

    let queryNativeToken = false;
    if (
      !token ||
      token === "" ||
      token.toLowerCase() === "bnb" ||
      token.toLowerCase() === "tbnb"
    ) {
      queryNativeToken = true;
    }

    const resp: GetBalanceResponse = {
      chain,
      address,
    };

    // If ERC20 token is requested
    if (!queryNativeToken) {
      let amount: string;
      if (token.startsWith("0x")) {
        amount = await this.getERC20TokenBalance(
          chain,
          address,
          token as `0x${string}`
        );
      } else {
        if (chainId !== 56) {
          throw new Error(
            "Only BSC mainnet is supported for querying balance by token symbol"
          );
        }

        this.walletProvider.configureLiFiSdk(chain);
        const tokenInfo = await getToken(chainId, token);
        amount = await this.getERC20TokenBalance(
          chain,
          address,
          tokenInfo.address as `0x${string}`
        );
      }

      resp.balance = { token, amount };
    } else {
      // If native token is requested
      const nativeBalanceWei = await this.walletProvider
        .getPublicClient(chain)
        .getBalance({ address });
      resp.balance = {
        token: nativeSymbol,
        amount: formatEther(nativeBalanceWei),
      };
    }

    return resp;
  }

  /**
   * Get balance of a specific ERC20 token
   * 
   * @param chain - The blockchain network to query
   * @param address - The address to check balance for
   * @param tokenAddress - The ERC20 token contract address
   * @returns Formatted token balance with proper decimals
   */
  async getERC20TokenBalance(
    chain: SupportedChain,
    address: Address,
    tokenAddress: Address
  ): Promise<string> {
    const publicClient = this.walletProvider.getPublicClient(chain);

    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });

    const decimals = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    });

    return formatUnits(balance, decimals);
  }

  /**
   * Validates and normalizes the balance query parameters
   * 
   * @param params - Parameters to validate and normalize
   * @throws Error if validation fails
   */
  async validateAndNormalizeParams(params: GetBalanceParams): Promise<void> {
    try {
      // If no chain specified, default to BSC
      if (!params.chain) {
        params.chain = "bsc";
        logger.debug("No chain specified, defaulting to BSC mainnet");
      }
      
      // If no address provided, use the wallet's own address
      if (!params.address) {
        params.address = this.walletProvider.getAddress();
        logger.debug(`No address provided, using wallet address: ${params.address}`);
        return;
      }
      
      // Convert address to string for string comparisons
      const addressStr = String(params.address);
      
      // If address is null or invalid strings, use wallet address
      if (addressStr === 'null' || addressStr === 'undefined') {
        params.address = this.walletProvider.getAddress();
        logger.debug(`Invalid address string provided, using wallet address: ${params.address}`);
        return;
      }
      
      // If address already looks like a valid hex address, use it directly
      if (addressStr.startsWith("0x") && addressStr.length === 42) {
        logger.debug(`Using valid hex address: ${params.address}`);
        return;
      }
      
      // Skip web3 name resolution for common token names that might have been
      // mistakenly parsed as addresses
      const commonTokens = ['USDT', 'USDC', 'BNB', 'ETH', 'BUSD', 'WBNB', 'CAKE'];
      if (commonTokens.includes(addressStr.toUpperCase())) {
        logger.debug(`Address looks like a token symbol: ${params.address}, using wallet address instead`);
        params.address = this.walletProvider.getAddress();
        return;
      }
      
      // Try to resolve as web3 name
      logger.debug(`Attempting to resolve address as Web3Name: ${params.address}`);
      const resolvedAddress = await this.walletProvider.resolveWeb3Name(params.address);
      if (resolvedAddress) {
        logger.debug(`Resolved Web3Name to address: ${resolvedAddress}`);
        params.address = resolvedAddress as Address;
        return;
      }
      
      // If we can't resolve, but it looks like a potential wallet address, try to use it
      if (addressStr.startsWith("0x")) {
        logger.warn(`Address "${params.address}" doesn't look like a standard Ethereum address but will be used as is`);
        return;
      }
      
      // If we get here, we couldn't parse the address at all
      // Fall back to the wallet's address
      logger.warn(`Could not resolve address: ${params.address}, falling back to wallet address`);
      params.address = this.walletProvider.getAddress();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error validating address: ${errorMessage}`);
      // Fall back to wallet's own address if there's an error
      params.address = this.walletProvider.getAddress();
    }
  }
}

/**
 * Action for querying token balances on BNB Smart Chain networks
 * 
 * This action handles retrieving native BNB and ERC20 token balances
 * on BSC and opBNB networks for the specified address.
 */
export const getBalanceAction: Action = {
  name: "GET_BALANCE_BNB",
  similes: ["CHECK_BALANCE_BNB", "TOKEN_BALANCE_BNB", "VIEW_BALANCE_BNB"],
  description: "Get balance of a token or native BNB for a given address on BNB Smart Chain or opBNB networks",
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
    logger.info("Executing GET_BALANCE_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    logger.debug("Message source:", message.content.source);

    // Validate message source - Allow both "direct" and "client_chat:user" sources
    if (!(message.content.source === "direct" || message.content.source === "client_chat:user")) {
      logger.warn("Balance query rejected: invalid source:", message.content.source);
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Balance query not allowed" },
      });
      return false;
    }
    logger.debug("Source validation passed");

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

    // Extract balance query parameters using the model
    const templateData = {
      template: getBalanceTemplate,
      state: currentState
    };

    logger.debug("Sending template data to model:", JSON.stringify(templateData, null, 2));
    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    
    logger.debug("Raw model output:", mlOutput);
    
    // Parse the JSON output
    let content: Record<string, unknown> = {};
    try {
      // Handle JSON wrapped in markdown code blocks
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
      logger.debug("Successfully parsed model output:", JSON.stringify(content, null, 2));
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", error instanceof Error ? error.message : String(error));
      logger.error("Raw output that failed parsing:", mlOutput);
      
      // Create a fallback content object
      content = {
        chain: "bsc", // Default to bsc chain
        token: "BNB"  // Default to BNB token
      };
      logger.debug("Using fallback content:", JSON.stringify(content, null, 2));
    }

    // Initialize wallet provider and action handler
    const walletProvider = initWalletProvider(runtime);
    const action = new GetBalanceAction(walletProvider);
    
    // Prepare balance query parameters
    const getBalanceParams: GetBalanceParams = {
      chain: content.chain as SupportedChain || "bsc",
      address: content.address as Address || undefined, // Let validateAndNormalizeParams handle null/undefined
      token: content.token as string || "BNB",
    };

    logger.debug("Balance query parameters:", JSON.stringify(getBalanceParams, null, 2));

    try {
      // Execute balance query
      logger.debug(`Querying balance on ${getBalanceParams.chain} for token ${getBalanceParams.token || "native BNB"}`);
      const balanceResponse = await action.getBalance(getBalanceParams);
      logger.debug("Balance response:", JSON.stringify(balanceResponse, null, 2));
      
      // Format success response
      if (callback) {
        let responseText = `No balance found for ${balanceResponse.address} on ${balanceResponse.chain}`;
        
        if (balanceResponse.balance) {
          // Get block explorer URL for the address
          const explorerInfo = balanceResponse.chain === 'bsctestnet' as SupportedChain ? EXPLORERS.BSC_TESTNET : 
                              balanceResponse.chain === 'opbnb' as SupportedChain ? EXPLORERS.OPBNB : EXPLORERS.BSC;
          
          const walletExplorerUrl = `${explorerInfo.url}/address/${balanceResponse.address}`;
          logger.debug(`Wallet explorer URL: ${walletExplorerUrl}`);
          
          responseText = `Balance of ${balanceResponse.address} on ${balanceResponse.chain}:
${balanceResponse.balance.token}: ${balanceResponse.balance.amount}

Check the wallet on block explorer: ${walletExplorerUrl}`;
        
          callback({
            text: responseText,
            content: { 
              success: true,
              ...balanceResponse,
              walletExplorerUrl: walletExplorerUrl
            },
          });
        } else {
          callback({
            text: responseText,
            content: { 
              success: true,
              ...balanceResponse
            },
          });
        }
      }
      
      return true;
    } catch (error: unknown) {
      // Handle errors gracefully
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error during balance query:", errorObj.message);
      
      // Provide more user-friendly error messages
      let errorMessage = errorObj.message;
      
      if (errorMessage.includes("getTldInfo")) {
        errorMessage = `Could not find token "${getBalanceParams.token}" on ${getBalanceParams.chain}. Please check the token symbol or address.`;
      } else if (errorMessage.includes("No URL was provided")) {
        errorMessage = "Network connection issue. Please try again later.";
      } else if (errorMessage.includes("Only BSC mainnet is supported")) {
        errorMessage = "Only BSC mainnet supports looking up tokens by symbol. Please try using a token address instead.";
      } else if (errorMessage.includes("Invalid address")) {
        errorMessage = "The address provided is invalid. Please provide a valid wallet address.";
      } else if (errorMessage.includes("Cannot read properties")) {
        errorMessage = "There was an issue processing your request. Please check your inputs and try again.";
      }
      
      // Get wallet address for explorer link
      const walletAddress = walletProvider.getAddress();
      const explorerInfo = getBalanceParams.chain === 'bsctestnet' as SupportedChain ? EXPLORERS.BSC_TESTNET : 
                          getBalanceParams.chain === 'opbnb' as SupportedChain ? EXPLORERS.OPBNB : EXPLORERS.BSC;
      const walletExplorerUrl = `${explorerInfo.url}/address/${walletAddress}`;
      
      callback?.({
        text: `Failed to get balance: ${errorMessage}
        
You can check your wallet at: ${walletExplorerUrl}`,
        content: { 
          success: false,
          error: errorMessage,
          chain: getBalanceParams.chain,
          token: getBalanceParams.token,
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
          text: "Check my BNB balance",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check your BNB balance on BSC",
          actions: ["GET_BALANCE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What's my USDC balance?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check your USDC balance on BSC",
          actions: ["GET_BALANCE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me how much 0x8731d54E9D02c286767d56ac03e8037C07e01e98 has in their wallet",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check the BNB balance for that address on BSC",
          actions: ["GET_BALANCE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Check CAKE token balance of this address: 0x1234567890AbCdEf1234567890AbCdEf12345678",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll look up the CAKE token balance for that address on BSC",
          actions: ["GET_BALANCE_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
}; 