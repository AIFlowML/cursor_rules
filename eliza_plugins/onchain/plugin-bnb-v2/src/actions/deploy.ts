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
import solc from "solc";
import { type Abi, type Address, parseUnits } from "viem";

import {
  bnbWalletProvider,
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { ercContractTemplate } from "../templates";
import type {
  IDeployERC1155Params,
  IDeployERC721Params,
  IDeployERC20Params,
  SupportedChain,
} from "../types";
import { compileSolidity } from "../utils/contracts";
import { EXPLORERS } from "../constants";

export { ercContractTemplate };

/**
 * DeployAction class - Handles token contract deployments on BNB Smart Chain networks
 * 
 * This class implements the core functionality for deploying ERC20, ERC721, and ERC1155
 * smart contracts to BNB Smart Chain (BSC) and opBNB networks.
 */
export class DeployAction {
  /**
   * Creates a new DeployAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(private walletProvider: WalletProvider) {}

  /**
   * Compiles a Solidity contract
   * 
   * @param contractName - Name of the contract to compile
   * @param source - Solidity source code
   * @returns The compiled contract ABI and bytecode
   * @throws Error if compilation fails
   */
  async compileSolidity(contractName: string, source: string) {
    logger.debug(`Compiling Solidity contract: ${contractName}`);
    logger.debug(`Source code length: ${source.length} characters`);
    
    const solName = `${contractName}.sol`;
    const input = {
      language: "Solidity",
      sources: {
        [solName]: {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };
    logger.debug("Preparing to compile contract...");
    logger.debug(`Solc version: ${typeof solc === 'function' ? 'function' : typeof solc === 'object' ? 'object' : 'unknown'}`);
    logger.debug(`Solc properties: ${Object.keys(solc).join(', ')}`);
    
    try {
      // Use solc properly as an object with compile method
      logger.debug("Calling solc.compile method...");
      // @ts-expect-error solc.compile exists at runtime though TypeScript doesn't see it
      const outputString = solc.compile(JSON.stringify(input));
      logger.debug(`Compilation output string length: ${outputString ? outputString.length : 'null or undefined'}`);
      
      logger.debug("Parsing compilation output as JSON...");
      const output = JSON.parse(outputString);
      logger.debug("Compilation completed, checking for errors...");

      // Check compile error
      if (output.errors) {
        logger.debug(`Found ${output.errors.length} compilation messages`);
        const errors = output.errors;
        const hasError = errors.some((error: { type: string }) => error.type === "Error");
        
        if (hasError) {
          logger.error("Compilation errors:", JSON.stringify(errors, null, 2));
          const errorMessages = errors.map((e: { formattedMessage?: string; message?: string }) => 
            e.formattedMessage || e.message
          ).join("\n");
          throw new Error(`Contract compilation failed: ${errorMessages}`);
        }
        
        // Just warnings
        logger.warn("Compilation warnings:", JSON.stringify(errors, null, 2));
      } else {
        logger.debug("No compilation errors or warnings found");
      }

      logger.debug(`Checking for contract in output at ${solName}.${contractName}`);
      const contract = output.contracts[solName][contractName];

      if (!contract) {
        logger.error(`Compilation result is empty for ${contractName}`);
        logger.error(`Available contracts: ${Object.keys(output.contracts).join(', ')}`);
        logger.error(`Available items in ${solName}: ${output.contracts[solName] ? Object.keys(output.contracts[solName]).join(', ') : 'none'}`);
        throw new Error(`Compilation result is empty for ${contractName}`);
      }

      logger.debug(`Contract ${contractName} compiled successfully`);
      logger.debug(`ABI items count: ${contract.abi ? contract.abi.length : 'null'}`);
      logger.debug(`Bytecode length: ${contract.evm.bytecode.object ? contract.evm.bytecode.object.length : 'null'}`);
      
      return {
        abi: contract.abi as Abi,
        bytecode: contract.evm.bytecode.object,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error compiling contract ${contractName}:`, errorMessage);
      if (error instanceof Error && error.stack) {
        logger.error(`Error stack trace: ${error.stack}`);
      }
      logger.error(`Error type: ${error instanceof Error ? 'Error object' : typeof error}`);
      throw new Error(`Failed to compile contract: ${errorMessage}`);
    }
  }

  /**
   * Deploys an ERC20 token contract
   * 
   * @param deployTokenParams - Parameters for the ERC20 token deployment
   * @returns Object containing the deployed contract address
   * @throws Error if deployment fails
   */
  async deployERC20(deployTokenParams: IDeployERC20Params) {
    logger.debug("Deploying ERC20 token with params:", JSON.stringify(deployTokenParams, null, 2));

    // Validate parameters
    const { name, symbol, decimals, totalSupply, chain } = deployTokenParams;
    
    if (!name || name === "") {
      logger.error("Token name is required");
      throw new Error("Token name is required");
    }
    if (!symbol || symbol === "") {
      logger.error("Token symbol is required");
      throw new Error("Token symbol is required");
    }
    if (!decimals || decimals === 0) {
      logger.error("Token decimals is required");
      throw new Error("Token decimals is required");
    }
    if (!totalSupply || totalSupply === "") {
      logger.error("Token total supply is required");
      throw new Error("Token total supply is required");
    }
    
    logger.debug(`Deploying ERC20 token: ${name} (${symbol}) with ${decimals} decimals and total supply ${totalSupply}`);

    try {
      logger.debug(`Converting total supply ${totalSupply} to wei with ${decimals} decimals`);
      const totalSupplyWithDecimals = parseUnits(totalSupply, decimals);
      logger.debug(`Total supply in wei: ${totalSupplyWithDecimals.toString()}`);
      
      const args = [name, symbol, decimals, totalSupplyWithDecimals];
      // Safe logging with BigInt values
      logger.debug("Contract constructor arguments:", 
        args.map(arg => typeof arg === 'bigint' ? arg.toString() : arg)
      );
      
      logger.debug(`Deploying ERC20 contract on chain ${chain}...`);
      const contractAddress = await this.deployContract(
        chain,
        "ERC20Contract",
        args
      );

      if (!contractAddress) {
        logger.error("Failed to deploy ERC20 contract - no address returned");
        throw new Error("Failed to deploy ERC20 contract");
      }
      
      logger.debug(`ERC20 contract deployed successfully at address: ${contractAddress}`);
      return {
        address: contractAddress,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Deploy ERC20 failed:", errorMessage);
      throw error;
    }
  }

  /**
   * Deploys an ERC721 NFT contract
   * 
   * @param deployNftParams - Parameters for the ERC721 NFT deployment
   * @returns Object containing the deployed contract address
   * @throws Error if deployment fails
   */
  async deployERC721(deployNftParams: IDeployERC721Params) {
    logger.debug("Deploying ERC721 NFT with params:", JSON.stringify(deployNftParams, null, 2));

    // Validate parameters
    const { baseURI, name, symbol, chain } = deployNftParams;
    
    if (!name || name === "") {
      logger.error("NFT name is required");
      throw new Error("NFT name is required");
    }
    if (!symbol || symbol === "") {
      logger.error("NFT symbol is required");
      throw new Error("NFT symbol is required");
    }
    if (!baseURI || baseURI === "") {
      logger.error("NFT baseURI is required");
      throw new Error("NFT baseURI is required");
    }
    
    logger.debug(`Deploying ERC721 NFT: ${name} (${symbol}) with baseURI ${baseURI}`);
    
    try {
      const args = [name, symbol, baseURI];
      logger.debug("Contract constructor arguments:", args);
      
      logger.debug(`Deploying ERC721 contract on chain ${chain}...`);
      const contractAddress = await this.deployContract(
        chain,
        "ERC721Contract",
        args
      );

      if (!contractAddress) {
        logger.error("Failed to deploy ERC721 contract - no address returned");
        throw new Error("Failed to deploy ERC721 contract");
      }
      
      logger.debug(`ERC721 contract deployed successfully at address: ${contractAddress}`);
      return {
        address: contractAddress,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Deploy ERC721 failed:", errorMessage);
      throw error;
    }
  }

  /**
   * Deploys an ERC1155 multi-token contract
   * 
   * @param deploy1155Params - Parameters for the ERC1155 token deployment
   * @returns Object containing the deployed contract address
   * @throws Error if deployment fails
   */
  async deployERC1155(deploy1155Params: IDeployERC1155Params) {
    logger.debug("Deploying ERC1155 token with params:", JSON.stringify(deploy1155Params, null, 2));

    // Validate parameters
    const { baseURI, name, chain } = deploy1155Params;
    
    if (!name || name === "") {
      logger.error("Token name is required");
      throw new Error("Token name is required");
    }
    if (!baseURI || baseURI === "") {
      logger.error("Token baseURI is required");
      throw new Error("Token baseURI is required");
    }
    
    logger.debug(`Deploying ERC1155 token: ${name} with baseURI ${baseURI}`);
    
    try {
      const args = [name, baseURI];
      logger.debug("Contract constructor arguments:", args);
      
      logger.debug(`Deploying ERC1155 contract on chain ${chain}...`);
      const contractAddress = await this.deployContract(
        chain,
        "ERC1155Contract",
        args
      );

      if (!contractAddress) {
        logger.error("Failed to deploy ERC1155 contract - no address returned");
        throw new Error("Failed to deploy ERC1155 contract");
      }
      
      logger.debug(`ERC1155 contract deployed successfully at address: ${contractAddress}`);
      return {
        address: contractAddress,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Deploy ERC1155 failed:", errorMessage);
      throw error;
    }
  }

  /**
   * Core contract deployment method used by all token types
   * 
   * @param chain - The blockchain network to deploy to
   * @param contractName - The name of the contract template to use
   * @param args - Constructor arguments for the contract
   * @returns The deployed contract address or null/undefined if deployment fails
   * @throws Error if deployment fails
   */
  async deployContract(
    chain: SupportedChain,
    contractName: string,
    args: unknown[]
  ): Promise<Address | null | undefined> {
    logger.debug(`Starting contract deployment process for ${contractName} on chain ${chain}`);
    // Handle BigInt values for logging by converting to string
    const safeArgs = args.map(arg => 
      typeof arg === 'bigint' ? arg.toString() : arg
    );
    logger.debug("Constructor arguments:", safeArgs);
    
    try {
      logger.debug(`Compiling ${contractName}...`);
      logger.debug("Current working directory:", process.cwd());
      
      // Get the compiled contract
      const { abi, bytecode } = await compileSolidity(contractName);
      
      if (!abi) {
        logger.error(`No ABI found for ${contractName}`);
        throw new Error(`Compilation failed: No ABI found for ${contractName}`);
      }
      
      if (!bytecode) {
        logger.error("No bytecode found for ${contractName}");
        throw new Error("Bytecode is empty after compilation");
      }
      
      logger.debug(`Compilation successful, bytecode length: ${bytecode.length}`);
      logger.debug(`Switching to chain ${chain} for deployment`);
      this.walletProvider.switchChain(chain);

      const chainConfig = this.walletProvider.getChainConfigs(chain);
      logger.debug(`Using chain config: ${chainConfig.name} (ID: ${chainConfig.id})`);
      
      const walletClient = this.walletProvider.getWalletClient(chain);
      const account = this.walletProvider.getAccount();
      logger.debug(`Deploying from account: ${account.address}`);
      
      // Calculate approximate gas before deployment
      const publicClient = this.walletProvider.getPublicClient(chain);
      
      logger.debug("Submitting deployment transaction...");
      logger.debug("Bytecode type:", typeof bytecode);
      logger.debug(`Bytecode starts with: ${bytecode.substring(0, 20)}...`);
      
      // Submit the deployment transaction
      const hash = await walletClient.deployContract({
        account,
        abi,
        bytecode: bytecode as `0x${string}`,
        args,
        chain: chainConfig,
      });

      logger.debug(`Deployment transaction submitted with hash: ${hash}`);
      logger.debug("Waiting for deployment transaction confirmation...");
      
      // Wait for the transaction to be confirmed
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });
      
      if (receipt.status === "success") {
        logger.debug(`Contract deployed successfully at address: ${receipt.contractAddress}`);
        // Convert BigInt values to strings for logging
        const safeReceipt = {
          ...receipt,
          gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : undefined,
          effectiveGasPrice: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : undefined
        };
        logger.debug("Transaction details: gas used", safeReceipt.gasUsed, "effective gas price", safeReceipt.effectiveGasPrice);
        
        // Return the contract address
        return receipt.contractAddress;
      }
      
      // If we get here, the status was not "success"
      logger.error(`Deployment transaction failed with status: ${receipt.status}`);
      // Use a safe version of the receipt for logging
      const safeReceipt = JSON.stringify(receipt, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      );
      logger.error("Transaction receipt:", safeReceipt);
      throw new Error("Contract deployment transaction failed");
    } catch (error: unknown) {
      logger.error(`Error deploying contract ${contractName}:`, error);
      
      // Handle BigInt values when logging error details
      let errorDetails: string | undefined;
      try {
        // Use a typed replacer function to handle BigInt values
        errorDetails = JSON.stringify(error, (key: string, value: unknown) => 
          typeof value === 'bigint' ? value.toString() : value
        );
        logger.error("Error details:", errorDetails);
      } catch (e) {
        logger.error("Error could not be stringified, logging properties individually");
        if (error && typeof error === 'object') {
          for (const key in error) {
            try {
              const value: unknown = (error as Record<string, unknown>)[key];
              logger.error(`${key}:`, typeof value === 'bigint' ? value.toString() : value);
            } catch (innerError) {
              logger.error(`${key}: [Error accessing property]`);
            }
          }
        }
      }
      
      // Provide more informative error messages
      if (error instanceof Error) {
        logger.error("Error stack:", error.stack || 'No stack trace available');
        
        if (error.message.includes("insufficient funds")) {
          throw new Error("Insufficient funds to deploy the contract. Please check your balance.");
        }
        if (error.message.includes("user rejected")) {
          throw new Error("Transaction rejected by user.");
        }
        if (error.message.includes("cannot serialize BigInt")) {
          // Specific handling for BigInt serialization errors
          throw new Error("Error processing large numbers in deployment. This is a technical issue being addressed.");
        }
      }
      
      // Rethrow the error to be caught by the calling function
      throw error;
    }
  }
}

/**
 * Action for deploying token contracts on BNB Smart Chain networks
 * 
 * This action handles the deployment of ERC20, ERC721, and ERC1155 token contracts
 * on BNB Smart Chain (BSC) and opBNB networks.
 */
export const deployAction: Action = {
  name: "DEPLOY_BNB",
  similes: [
    "DEPLOY_TOKEN_BNB", 
    "CREATE_TOKEN_BNB", 
    "DEPLOY_NFT_BNB",
    "DEPLOY_ERC20_BNB",
    "DEPLOY_ERC721_BNB",
    "DEPLOY_ERC1155_BNB"
  ],
  description: "Deploys ERC20, ERC721, or ERC1155 contracts on BNB Smart Chain or opBNB",
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
    logger.info("Executing DEPLOY_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));

    // Extract prompt text for contract deployment analysis
    const promptText = typeof message.content.text === 'string' ? message.content.text.trim() : '';
    logger.debug(`Raw prompt text: "${promptText}"`);
    
    // Analyze prompt to detect contract type and parameters
    const promptLower = promptText.toLowerCase();
    
    // Regular expressions for contract parameter detection
    const erc20Regex = /(?:deploy|create)\s+(?:an?\s+)?(?:erc20|token)(?:\s+token)?\s+(?:with|having|named)?\s+(?:name\s+['"]?([^'"]+)['"]?|['"]?([^'"]+)['"]?\s+token)/i;
    const erc721Regex = /(?:deploy|create)\s+(?:an?\s+)?(?:erc721|nft)(?:\s+token)?\s+(?:with|having|named)?\s+(?:name\s+['"]?([^'"]+)['"]?|['"]?([^'"]+)['"]?\s+nft)/i;
    const erc1155Regex = /(?:deploy|create)\s+(?:an?\s+)?(?:erc1155|multi-token)(?:\s+token)?\s+(?:with|having|named)?\s+(?:name\s+['"]?([^'"]+)['"]?|['"]?([^'"]+)['"]?\s+token)/i;
    
    const symbolRegex = /symbol\s+['"]?([^'"]+)['"]?/i;
    const decimalsRegex = /decimals\s+([0-9]+)/i;
    const totalSupplyRegex = /(?:total\s+supply|supply)\s+([0-9]+(?:\.[0-9]+)?(?:\s*[kmbt])?)/i;
    const baseURIRegex = /(?:base\s*uri|baseuri|uri)\s+['"]?(https?:\/\/[^'"]+)['"]?/i;
    
    // Detect contract type
    let directContractType: string | null = null;
    let directName: string | null = null;
    let directSymbol: string | null = null;
    let directDecimals: number | null = null;
    let directTotalSupply: string | null = null;
    let directBaseURI: string | null = null;
    let directChain: SupportedChain | null = null;
    
    // Check for ERC20 pattern
    let match = promptText.match(erc20Regex);
    if (match) {
      directContractType = "erc20";
      directName = match[1] || match[2] || null;
      logger.debug(`Detected ERC20 token deployment with name: ${directName}`);
    }
    
    // Check for ERC721 pattern
    if (!directContractType) {
      match = promptText.match(erc721Regex);
      if (match) {
        directContractType = "erc721";
        directName = match[1] || match[2] || null;
        logger.debug(`Detected ERC721 NFT deployment with name: ${directName}`);
      }
    }
    
    // Check for ERC1155 pattern
    if (!directContractType) {
      match = promptText.match(erc1155Regex);
      if (match) {
        directContractType = "erc1155";
        directName = match[1] || match[2] || null;
        logger.debug(`Detected ERC1155 token deployment with name: ${directName}`);
      }
    }
    
    // Check for common keywords if no type detected yet
    if (!directContractType) {
      if (promptLower.includes("erc20") || promptLower.includes("fungible token")) {
        directContractType = "erc20";
        logger.debug("Detected ERC20 token deployment from keywords");
      } else if (promptLower.includes("erc721") || promptLower.includes("nft") || promptLower.includes("non-fungible")) {
        directContractType = "erc721";
        logger.debug("Detected ERC721 token deployment from keywords");
      } else if (promptLower.includes("erc1155") || promptLower.includes("multi") || promptLower.includes("1155")) {
        directContractType = "erc1155";
        logger.debug("Detected ERC1155 token deployment from keywords");
      }
    }
    
    // Extract symbol
    match = promptText.match(symbolRegex);
    if (match && match.length >= 2) {
      directSymbol = match[1]?.trim() || "";
      logger.debug(`Extracted token symbol: ${directSymbol}`);
    }
    
    // Extract decimals
    match = promptText.match(decimalsRegex);
    if (match && match.length >= 2) {
      directDecimals = Number.parseInt(match[1] ?? "0", 10);
      logger.debug(`Extracted token decimals: ${directDecimals}`);
    }
    
    // Extract total supply
    match = promptText.match(totalSupplyRegex);
    if (match && match.length >= 2) {
      directTotalSupply = match[1]?.trim() || "";
      // Convert shorthand notations (K, M, B, T) to full numbers
      if (directTotalSupply.endsWith('k') || directTotalSupply.endsWith('K')) {
        directTotalSupply = (Number.parseFloat(directTotalSupply) * 1000).toString();
      } else if (directTotalSupply.endsWith('m') || directTotalSupply.endsWith('M')) {
        directTotalSupply = (Number.parseFloat(directTotalSupply) * 1000000).toString();
      } else if (directTotalSupply.endsWith('b') || directTotalSupply.endsWith('B')) {
        directTotalSupply = (Number.parseFloat(directTotalSupply) * 1000000000).toString();
      } else if (directTotalSupply.endsWith('t') || directTotalSupply.endsWith('T')) {
        directTotalSupply = (Number.parseFloat(directTotalSupply) * 1000000000000).toString();
      }
      logger.debug(`Extracted token total supply: ${directTotalSupply}`);
    }
    
    // Extract baseURI
    match = promptText.match(baseURIRegex);
    if (match && match.length >= 2) {
      directBaseURI = match[1]?.trim() || "";
      logger.debug(`Extracted token baseURI: ${directBaseURI}`);
    }
    
    // Detect chain
    if (promptLower.includes("bsc") || promptLower.includes("binance")) {
      directChain = "bsc";
      logger.debug("Detected BSC chain from prompt");
    } else if (promptLower.includes("opbnb") || promptLower.includes("op bnb")) {
      directChain = "opBNB";
      logger.debug("Detected opBNB chain from prompt");
    }
    
    // Store prompt analysis results
    const promptAnalysis = {
      directContractType,
      directName,
      directSymbol,
      directDecimals,
      directTotalSupply,
      directBaseURI,
      directChain
    };
    
    logger.debug("Prompt analysis result:", promptAnalysis);

    // Initialize or update state
    const currentState = state ? state : (await runtime.composeState(message)) as State;

    try {
      // Only create walletInfo if state exists
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(runtime, message, currentState);
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

    // Use runtime model to extract contract parameters
    const templateData = {
      template: ercContractTemplate,
      state: currentState
    };

    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    
    // Parse the JSON output
    let content: Record<string, unknown> = {};
    try {
      content = typeof mlOutput === 'string' ? JSON.parse(mlOutput) : mlOutput as Record<string, unknown>;
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
    }
    
    logger.debug("Generated contract content:", JSON.stringify(content, null, 2));

    // PRIORITY ORDER FOR CONTRACT PARAMETERS:
    // 1. Direct match from prompt text (most reliable)
    // 2. Parameters specified in model-generated content
    // 3. Default values where appropriate
    
    // Determine contract type
    let contractType: string;
    if (directContractType) {
      contractType = directContractType;
      logger.debug(`Using contract type directly extracted from prompt: ${contractType}`);
    } else if (content.contractType && typeof content.contractType === 'string') {
      contractType = content.contractType.toLowerCase();
      logger.debug(`Using contract type from generated content: ${contractType}`);
    } else {
      contractType = "erc20"; // Default
      logger.debug(`No contract type detected, defaulting to ${contractType}`);
    }
    
    // Determine chain
    let chain: SupportedChain = "bsc"; // Default
    if (directChain) {
      chain = directChain;
      logger.debug(`Using chain directly extracted from prompt: ${chain}`);
    } else if (content.chain && typeof content.chain === 'string') {
      chain = content.chain as SupportedChain;
      logger.debug(`Using chain from generated content: ${chain}`);
    } else {
      logger.debug(`No chain detected, defaulting to ${chain}`);
    }
    
    // Initialize wallet provider and action handler
    logger.debug("Initializing wallet provider...");
    const walletProvider = initWalletProvider(runtime);
    const action = new DeployAction(walletProvider);
    
    try {
      logger.debug(`Starting deployment process for ${contractType.toUpperCase()} contract on ${chain}...`);
      let result: { address: Address } | undefined;
      
      switch (contractType.toLowerCase()) {
        case "erc20": {
          // Determine ERC20 specific parameters with null coalescing to ensure non-undefined values
          const name = directName || (content?.name as string) || "DefaultToken";
          const symbol = directSymbol || (content?.symbol as string) || "DTK";
          const decimals = directDecimals || (content?.decimals as number) || 18;
          const totalSupply = directTotalSupply || (content?.totalSupply as string) || "1000000";
          
          logger.debug(`Deploying ERC20 with params: name=${name}, symbol=${symbol}, decimals=${decimals}, totalSupply=${totalSupply}`);
          
          result = await action.deployERC20({
            chain,
            decimals,
            symbol,
            name,
            totalSupply,
          });
          break;
        }
        case "erc721": {
          // Determine ERC721 specific parameters with null coalescing to ensure non-undefined values
          const nftName = directName || (content?.name as string) || "DefaultNFT";
          const nftSymbol = directSymbol || (content?.symbol as string) || "DNFT";
          const nftBaseURI = directBaseURI || (content?.baseURI as string) || "https://example.com/token/";
          
          logger.debug(`Deploying ERC721 with params: name=${nftName}, symbol=${nftSymbol}, baseURI=${nftBaseURI}`);
          
          result = await action.deployERC721({
            chain,
            name: nftName,
            symbol: nftSymbol,
            baseURI: nftBaseURI,
          });
          break;
        }
        case "erc1155": {
          // Determine ERC1155 specific parameters with null coalescing to ensure non-undefined values
          const multiName = directName || (content?.name as string) || "DefaultMultiToken";
          const multiBaseURI = directBaseURI || (content?.baseURI as string) || "https://example.com/multi-token/";
          
          logger.debug(`Deploying ERC1155 with params: name=${multiName}, baseURI=${multiBaseURI}`);
          
          result = await action.deployERC1155({
            chain,
            name: multiName,
            baseURI: multiBaseURI,
          });
          break;
        }
        default:
          logger.error(`Unsupported contract type: ${contractType}`);
          throw new Error(`Unsupported contract type: ${contractType}. Supported types are: erc20, erc721, erc1155`);
      }

      if (result?.address) {
        logger.debug(`Contract deployed successfully at address: ${result.address}`);
        
        // Get explorer URL for the deployed contract
        const explorer = EXPLORERS[chain.toUpperCase() as keyof typeof EXPLORERS];
        const contractExplorerUrl = explorer ? `${explorer.url}/address/${result.address}` : null;
        
        // Prepare user-friendly response with contract type and chain info
        const contractTypeName = contractType.toUpperCase();
        const chainName = chain === "bsc" ? "Binance Smart Chain" : "opBNB";
        
        // Create enhanced response with additional information
        const textResponse = `Successfully deployed ${contractTypeName} contract on ${chainName} at address: ${result.address}${
          contractExplorerUrl ? `\n\nView contract: ${contractExplorerUrl}` : ""
        }\n\nYou can now interact with this contract using other BNB actions!`;
        
        callback?.({
          text: textResponse,
          content: { 
            ...result,
            contractType,
            chain,
            contractExplorerUrl
          },
        });
        
        return true;
      } 
      
      logger.error("Contract deployment failed - no address returned");
      callback?.({
        text: "Contract deployment failed",
        content: { error: "No contract address returned" },
      });
      return false;
      
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error during contract deployment:", errorObj.message);
      
      // Provide more user-friendly error messages
      let errorMessage = errorObj.message;
      
      if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for contract deployment. Please check your wallet balance.";
      } else if (errorMessage.includes("user rejected")) {
        errorMessage = "Transaction was rejected. Please try again if you want to proceed with the deployment.";
      } else if (errorMessage.includes("compilation failed")) {
        errorMessage = "Contract compilation failed. This might be due to syntax errors in the contract code.";
      }
      
      callback?.({
        text: `Deployment failed: ${errorMessage}`,
        content: { 
          error: errorMessage,
          contractType 
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
          text: "Deploy an ERC20 token with name 'autofun10', symbol 'AFUND', decimals 18, total supply 10000",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you deploy an ERC20 token on BNB Smart Chain",
          actions: ["DEPLOY_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Deploy an ERC721 NFT contract with name 'MyNFT', symbol 'MNFT', baseURI 'https://my-nft-base-uri.com'",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you deploy an ERC721 NFT on BNB Smart Chain",
          actions: ["DEPLOY_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Deploy an ERC1155 contract with name 'My1155', baseURI 'https://my-1155-base-uri.com'",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you deploy an ERC1155 token on BNB Smart Chain",
          actions: ["DEPLOY_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
}; 