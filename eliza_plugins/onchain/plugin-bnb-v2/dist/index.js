import { elizaLogger, logger, ModelType } from '@elizaos/core';
import dotenv from 'dotenv';
import { createConfig, EVM, getToken, getRoutes, executeRoute } from '@lifi/sdk';
import { createPublicClient, createWalletClient, http, erc20Abi, formatUnits, parseEther, formatEther, parseUnits, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as viemChains from 'viem/chains';
import { createWeb3Name } from '@web3-name-sdk/core';
import WebSocket from 'ws';
import solc2 from 'solc';
import fs, { statSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path, { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup } from 'mime-types';
import { createRequire as createRequire$1 } from 'module';
import { z } from 'zod';

// src/index.ts
var WalletProvider = class _WalletProvider {
  currentChain = "bsc";
  chains = { bsc: viemChains.bsc };
  account;
  privateKey;
  constructor(privateKey, chains) {
    this.privateKey = privateKey;
    this.setAccount(privateKey);
    this.setChains(chains);
    if (chains && Object.keys(chains).length > 0) {
      this.setCurrentChain(Object.keys(chains)[0]);
    }
  }
  getAccount() {
    return this.account;
  }
  getPk() {
    return this.privateKey;
  }
  getAddress() {
    return this.account.address;
  }
  getCurrentChain() {
    return this.chains[this.currentChain];
  }
  getPublicClient(chainName) {
    const transport = this.createHttpTransport(chainName);
    const publicClient = createPublicClient({
      chain: this.chains[chainName],
      transport
    });
    return publicClient;
  }
  getWalletClient(chainName) {
    const transport = this.createHttpTransport(chainName);
    const walletClient = createWalletClient({
      chain: this.chains[chainName],
      transport,
      account: this.account
    });
    return walletClient;
  }
  getChainConfigs(chainName) {
    const chain = viemChains[chainName];
    if (!chain?.id) {
      throw new Error("Invalid chain name");
    }
    return chain;
  }
  configureLiFiSdk(chainName) {
    const chains = Object.values(this.chains);
    const walletClient = this.getWalletClient(chainName);
    createConfig({
      integrator: "eliza",
      providers: [
        EVM({
          getWalletClient: async () => walletClient,
          switchChain: async (chainId) => createWalletClient({
            account: this.account,
            chain: chains.find(
              (chain) => chain.id === chainId
            ),
            transport: http()
          })
        })
      ]
    });
  }
  async formatAddress(address) {
    if (address === null || address === void 0) {
      elizaLogger.debug("Address is null or undefined, using wallet's own address");
      return this.getAddress();
    }
    if (typeof address === "string" && address.trim().length === 0) {
      elizaLogger.debug("Address is empty string, using wallet's own address");
      return this.getAddress();
    }
    const addressStr = String(address).trim();
    if (addressStr.startsWith("0x") && addressStr.length === 42) {
      elizaLogger.debug(`Using valid hex address: ${addressStr}`);
      return addressStr;
    }
    const commonTokens = ["USDT", "USDC", "BNB", "ETC", "WETC", "BUSD", "WBNB", "TRON", "LINK", "OM", "UNI", "PEPE", "AAVE", "ATOM"];
    if (commonTokens.includes(addressStr.toUpperCase())) {
      elizaLogger.debug(`Value appears to be a token symbol, not an address: ${addressStr}. Using wallet's own address.`);
      return this.getAddress();
    }
    try {
      elizaLogger.debug(`Attempting to resolve as Web3Name: ${addressStr}`);
      const resolvedAddress = await this.resolveWeb3Name(addressStr);
      if (resolvedAddress) {
        elizaLogger.debug(`Resolved Web3Name to address: ${resolvedAddress}`);
        return resolvedAddress;
      }
    } catch (error) {
      elizaLogger.debug(`Failed to resolve Web3Name '${addressStr}': ${error.message}. Will try other methods.`);
    }
    if (addressStr.startsWith("0x")) {
      elizaLogger.debug(`Address "${addressStr}" doesn't look like a standard Ethereum address but will be used as is`);
      return addressStr;
    }
    elizaLogger.debug(`Could not resolve address '${addressStr}'. Using wallet's own address.`);
    return this.getAddress();
  }
  async resolveWeb3Name(name) {
    if (name === null || name === void 0 || name === "null") {
      elizaLogger.debug(`Web3Name resolution skipped for null/undefined value`);
      return null;
    }
    const nameStr = String(name).trim();
    if (nameStr.length === 0) {
      elizaLogger.debug(`Web3Name resolution skipped for empty string`);
      return null;
    }
    if (nameStr.startsWith("0x") && nameStr.length === 42) {
      elizaLogger.debug(`Value is already a valid address: ${nameStr}`);
      return nameStr;
    }
    const commonTokens = ["USDT", "USDC", "BNB", "ETH", "BTC", "BUSD", "DAI", "WETC", "WBNB", "TRON", "LINK", "OM", "UNI", "PEPE", "AAVE", "ATOM"];
    if (commonTokens.includes(nameStr.toUpperCase())) {
      elizaLogger.debug(`Skipping Web3Name resolution for common token: ${nameStr}`);
      return null;
    }
    try {
      const chain = this.getCurrentChain();
      const rpcUrl = chain.rpcUrls.custom?.http[0] || chain.rpcUrls.default.http[0];
      elizaLogger.debug(`Resolving Web3Name: ${nameStr} using chain ${chain.name} and RPC: ${rpcUrl}`);
      const nameService = createWeb3Name({
        rpcUrl
      });
      const result = await Promise.race([
        nameService.getAddress(nameStr),
        new Promise(
          (resolve) => setTimeout(() => {
            elizaLogger.debug(`Web3Name resolution timeout for ${nameStr}`);
            resolve(null);
          }, 5e3)
          // 5 second timeout
        )
      ]);
      if (result) {
        elizaLogger.debug(`Web3Name resolved: ${nameStr} \u2192 ${result}`);
        return result;
      } else {
        elizaLogger.debug(`Web3Name not resolved: ${nameStr}`);
        return null;
      }
    } catch (error) {
      elizaLogger.debug(`Error resolving Web3Name ${nameStr}: ${error.message}`);
      return null;
    }
  }
  async checkERC20Allowance(chain, token, owner, spender) {
    const publicClient = this.getPublicClient(chain);
    return await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender]
    });
  }
  async approveERC20(chain, token, spender, amount) {
    const publicClient = this.getPublicClient(chain);
    const walletClient = this.getWalletClient(chain);
    const { request } = await publicClient.simulateContract({
      account: this.account,
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount]
    });
    return await walletClient.writeContract(request);
  }
  async transfer(chain, toAddress, amount, options) {
    const walletClient = this.getWalletClient(chain);
    return await walletClient.sendTransaction({
      account: this.account,
      to: toAddress,
      value: amount,
      chain: this.getChainConfigs(chain),
      ...options
    });
  }
  async transferERC20(chain, tokenAddress, toAddress, amount, options) {
    const publicClient = this.getPublicClient(chain);
    const walletClient = this.getWalletClient(chain);
    const { request } = await publicClient.simulateContract({
      account: this.account,
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [toAddress, amount],
      ...options
    });
    return await walletClient.writeContract(request);
  }
  async getBalance() {
    const client = this.getPublicClient(this.currentChain);
    const balance = await client.getBalance({
      address: this.account.address
    });
    return formatUnits(balance, 18);
  }
  async getTokenAddress(chainName, tokenSymbol) {
    const token = await getToken(
      this.getChainConfigs(chainName).id,
      tokenSymbol
    );
    return token.address;
  }
  /**
   * Gets testnet token address from predefined mapping
   * This is a custom method for testnet tokens since the regular token lookup
   * doesn't work on testnets.
   */
  getTestnetTokenAddress(tokenSymbol) {
    const TESTNET_TOKEN_ADDRESSES = {
      "BNB": "0x64544969ed7EBf5f083679233325356EbE738930",
      "BUSD": "0x48D87A2d14De41E2308A764905B93E05c9377cE1",
      "DAI": "0x46B48c1Ef4B5F15B7DdC415290CEC2f774cD1021",
      "ETH": "0x635780E5D02Ab29d7aE14d266936A38d3D5B0CC5",
      "USDC": "0x053Fc65249dF91a02Ddb294A081f774615aB45F4"
    };
    const normalizedSymbol = tokenSymbol.toUpperCase();
    if (TESTNET_TOKEN_ADDRESSES[normalizedSymbol]) {
      elizaLogger.debug(`Found testnet token address for ${normalizedSymbol}: ${TESTNET_TOKEN_ADDRESSES[normalizedSymbol]}`);
      return TESTNET_TOKEN_ADDRESSES[normalizedSymbol];
    }
    elizaLogger.debug(`No testnet address found for token ${normalizedSymbol}`);
    return null;
  }
  addChain(chain) {
    this.setChains(chain);
  }
  switchChain(chainName, customRpcUrl) {
    if (!this.chains[chainName]) {
      const chain = _WalletProvider.genChainFromName(
        chainName,
        customRpcUrl
      );
      this.addChain({ [chainName]: chain });
    }
    this.setCurrentChain(chainName);
  }
  setAccount = (pk) => {
    this.account = privateKeyToAccount(pk);
  };
  setChains = (chains) => {
    if (!chains) {
      return;
    }
    for (const chain of Object.keys(chains)) {
      this.chains[chain] = chains[chain];
    }
  };
  setCurrentChain = (chain) => {
    this.currentChain = chain;
  };
  createHttpTransport = (chainName) => {
    const chain = this.chains[chainName];
    if (chain.rpcUrls.custom) {
      return http(chain.rpcUrls.custom.http[0]);
    }
    return http(chain.rpcUrls.default.http[0]);
  };
  static genChainFromName(chainName, customRpcUrl) {
    const baseChain = viemChains[chainName];
    if (!baseChain?.id) {
      throw new Error("Invalid chain name");
    }
    const viemChain = customRpcUrl ? {
      ...baseChain,
      rpcUrls: {
        ...baseChain.rpcUrls,
        custom: {
          http: [customRpcUrl]
        }
      }
    } : baseChain;
    return viemChain;
  }
};
var genChainsFromRuntime = (runtime) => {
  const chainNames = ["bsc", "bscTestnet", "opBNB", "opBNBTestnet"];
  const chains = {};
  for (const chainName of chainNames) {
    const chain = WalletProvider.genChainFromName(chainName);
    chains[chainName] = chain;
  }
  const mainnet_rpcurl = runtime.getSetting("BSC_PROVIDER_URL");
  if (mainnet_rpcurl) {
    const chain = WalletProvider.genChainFromName("bsc", mainnet_rpcurl);
    chains["bsc"] = chain;
  }
  const testnet_rpcurl = runtime.getSetting("BSC_TESTNET_PROVIDER_URL");
  if (testnet_rpcurl) {
    const chain = WalletProvider.genChainFromName("bscTestnet", testnet_rpcurl);
    chains["bscTestnet"] = chain;
  }
  const opbnb_rpcurl = runtime.getSetting("OPBNB_PROVIDER_URL");
  if (opbnb_rpcurl) {
    const chain = WalletProvider.genChainFromName("opBNB", opbnb_rpcurl);
    chains["opBNB"] = chain;
  }
  return chains;
};
var initWalletProvider = (runtime) => {
  const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
  if (!privateKey) {
    throw new Error("BNB_PRIVATE_KEY is missing");
  }
  const chains = genChainsFromRuntime(runtime);
  return new WalletProvider(privateKey, chains);
};
var bnbWalletProvider = {
  async get(runtime, _message, _state) {
    try {
      const walletProvider = initWalletProvider(runtime);
      const address = walletProvider.getAddress();
      const balance = await walletProvider.getBalance();
      const chain = walletProvider.getCurrentChain();
      return `BNB chain Wallet Address: ${address}
Balance: ${balance} ${chain.nativeCurrency.symbol}
Chain ID: ${chain.id}, Name: ${chain.name}`;
    } catch (error) {
      console.error("Error in BNB chain wallet provider:", error);
      return null;
    }
  }
};

// src/templates/index.ts
var getBalanceTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested check balance:
- Chain to execute on. Must be one of ["bsc", "bscTestnet", "opBNB", "opBNBTestnet"]. Default is "bsc".
- Address to check balance for. Optional, must be a valid Ethereum address starting with "0x" or a web3 domain name. If not provided, use the BNB chain Wallet Address.
- Token symbol or address. Could be a token symbol or address. If the address is provided, it must be a valid Ethereum address starting with "0x". Default is "BNB".
If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "address": string | null,
    "token": string
}
\`\`\`
`;
var transferTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Chain to execute on. Must be one of ["bsc", "bscTestnet", "opBNB", "opBNBTestnet"]. Default is "bsc".
- Token symbol or address(string starting with "0x"). Optional.
- Amount to transfer. Optional. Must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1").
- Recipient address. Must be a valid Ethereum address starting with "0x" or a web3 domain name.
- Data. Optional, data to be included in the transaction.
If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "token": string | null,
    "amount": string | null,
    "toAddress": string,
    "data": string | null
}
\`\`\`
`;
var swapTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token swap:
- Chain to execute on. Must be one of ["bsc", "bscTestnet", "opBNB", "opBNBTestnet"]. Default is "bsc".
- Input token symbol or address(string starting with "0x").
- Output token symbol or address(string starting with "0x").
- Amount to swap. Must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1").
- Slippage. Optional, expressed as decimal proportion, 0.03 represents 3%.
If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "inputToken": string | null,
    "outputToken": string | null,
    "amount": string | null,
    "slippage": number | null
}
\`\`\`
`;
var bridgeTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token bridge:
- From chain. Must be one of ["bsc", "opBNB"].
- To chain. Must be one of ["bsc", "opBNB"].
- From token address. Optional, must be a valid Ethereum address starting with "0x".
- To token address. Optional, must be a valid Ethereum address starting with "0x".
- Amount to bridge. Must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1").
- To address. Optional, must be a valid Ethereum address starting with "0x" or a web3 domain name.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "fromChain": "bsc" | "opBNB",
    "toChain": "bsc" | "opBNB",
    "fromToken": string | null,
    "toToken": string | null,
    "amount": string,
    "toAddress": string | null
}
\`\`\`
`;
var stakeTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested stake action:
- Chain to execute on. Must be one of ["bsc", "bscTestnet", "opBNB", "opBNBTestnet"]. Default is "bsc".
- Action to execute. Must be one of ["deposit", "withdraw", "claim"].
- Amount to execute. Optional, must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1"). If the action is "deposit" or "withdraw", amount is required.
If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "action": "deposit" | "withdraw" | "claim",
    "amount": string | null,
}
\`\`\`
`;
var faucetTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested faucet request:
- Token. Token to request. Could be one of ["BNB", "BTC", "BUSD", "DAI", "ETH", "USDC"]. Optional.
- Recipient address. Optional, must be a valid Ethereum address starting with "0x" or a web3 domain name. If not provided, use the BNB chain Wallet Address.
If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "token": string | null,
    "toAddress": string | null
}
\`\`\`
`;
var ercContractTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

When user wants to deploy any type of token contract (ERC20/721/1155), this will trigger the DEPLOY_TOKEN action.

Extract the following details for deploying a token contract:
- Chain to execute on. Must be one of ["bsc", "bscTestnet", "opBNB", "opBNBTestnet"]. Default is "bsc".
- contractType: The type of token contract to deploy
  - For ERC20: Extract name, symbol, decimals, totalSupply
  - For ERC721: Extract name, symbol, baseURI
  - For ERC1155: Extract name, baseURI
- name: The name of the token.
- symbol: The token symbol (only for ERC20/721).
- decimals: Token decimals (only for ERC20). Default is 18.
- totalSupply: Total supply with decimals (only for ERC20). Default is "1000000000000000000".
- baseURI: Base URI for token metadata (only for ERC721/1155).
If any field is not provided, use the default value. If no default value is provided, use empty string.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "contractType": "ERC20" | "ERC721" | "ERC1155",
    "name": string,
    "symbol": string | null,
    "decimals": number | null,
    "totalSupply": string | null,
    "baseURI": string | null
}
\`\`\`
`;
var greenfieldTemplate = `Given the recent messages and wallet information below(only including 'Greenfield' keyword):

{{recentMessages}}

{{walletInfo}}

Extract the following details for Greenfield operations:
- The type of operation to perform (e.g., "createBucket", "uploadObject", "deleteObject", "crossChainTransfer")
- The name of the bucket to operate
- The name of the object for upload operations
- Bucket visibility setting ("private" or "public")
- BNB transfer to greenfield token amount.

Required Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "actionType": "createBucket" | "uploadObject" | "deleteObject" | "crossChainTransfer",
    "bucketName": string,
    "objectName": string,
    "visibility": "private" | "public",
    "amount": number
}
\`\`\`
`;
var getBucketTemplate = {
  name: "getBucket",
  description: "Get a list of all Greenfield buckets owned by an address",
  inputVariables: ["chain"],
  outputFormat: {
    address: "string",
    includeDetails: "boolean"
  },
  examples: [
    {
      input: "List all my buckets on Greenfield",
      output: {
        address: null,
        includeDetails: true
      }
    },
    {
      input: "Show me my Greenfield buckets",
      output: {
        address: null,
        includeDetails: true
      }
    },
    {
      input: "What buckets do I have on the Greenfield network?",
      output: {
        address: null,
        includeDetails: true
      }
    },
    {
      input: "List all buckets for address 0x1234567890abcdef1234567890abcdef12345678",
      output: {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        includeDetails: true
      }
    }
  ]
};

// src/constants.ts
var API_CONFIG = {
  DEFAULT_BSC_PROVIDER_URL: "https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3",
  DEFAULT_BSC_TESTNET_PROVIDER_URL: "https://data-seed-prebsc-2-s3.bnbchain.org:8545",
  DEFAULT_OPBNB_PROVIDER_URL: "https://opbnb-mainnet-rpc.bnbchain.org",
  // Required environment variables
  REQUIRED_ENV_VARS: [
    "BNB_PRIVATE_KEY",
    "BNB_PUBLIC_KEY"
  ]
};
var EXPLORERS = {
  BSC: {
    name: "BscScan",
    url: "https://bscscan.com",
    apiUrl: "https://api.bscscan.com/api"
  },
  BSC_TESTNET: {
    name: "BscScan Testnet",
    url: "https://testnet.bscscan.com",
    apiUrl: "https://api-testnet.bscscan.com/api"
  },
  OPBNB: {
    name: "opBNB Explorer",
    url: "https://opbnb.bscscan.com",
    apiUrl: "https://api-opbnb.bscscan.com/api"
  }
};

// src/actions/swap.ts
var SwapAction = class {
  /**
   * Creates a new SwapAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  /**
   * Execute a token swap with the provided parameters
   * 
   * @param params - Swap parameters including chain, from/to tokens, and amount
   * @returns Swap response with transaction details
   * @throws Error if swap fails
   */
  async swap(params) {
    logger.debug("Starting swap with params:", JSON.stringify(params, null, 2));
    this.validateAndNormalizeParams(params);
    logger.debug("After validation, params:", JSON.stringify(params, null, 2));
    const fromAddress = this.walletProvider.getAddress();
    logger.debug(`From address: ${fromAddress}`);
    const chainId = this.walletProvider.getChainConfigs(params.chain).id;
    logger.debug(`Chain ID: ${chainId}`);
    logger.debug(`Configuring LI.FI SDK for chain: ${params.chain}`);
    this.walletProvider.configureLiFiSdk(params.chain);
    let fromTokenAddress = params.fromToken;
    let toTokenAddress = params.toToken;
    if (!params.fromToken.startsWith("0x")) {
      try {
        logger.debug(`Resolving from token symbol: ${params.fromToken}`);
        fromTokenAddress = await this.walletProvider.getTokenAddress(
          params.chain,
          params.fromToken
        );
        logger.debug(`Resolved from token address: ${fromTokenAddress}`);
        if (params.fromToken.toUpperCase() === "BNB") {
          logger.debug("Using special native token address for BNB");
          fromTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        }
      } catch (error) {
        logger.error(`Error resolving from token address for ${params.fromToken}:`, error);
        throw new Error(`Could not find token ${params.fromToken} on chain ${params.chain}. Please check the token symbol.`);
      }
    } else {
      logger.debug(`Using direct from token address: ${fromTokenAddress}`);
    }
    if (!params.toToken.startsWith("0x")) {
      try {
        logger.debug(`Resolving to token symbol: ${params.toToken}`);
        toTokenAddress = await this.walletProvider.getTokenAddress(
          params.chain,
          params.toToken
        );
        logger.debug(`Resolved to token address: ${toTokenAddress}`);
        if (params.toToken.toUpperCase() === "BNB") {
          logger.debug("Using special native token address for BNB");
          toTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        }
      } catch (error) {
        logger.error(`Error resolving to token address for ${params.toToken}:`, error);
        throw new Error(`Could not find token ${params.toToken} on chain ${params.chain}. Please check the token symbol.`);
      }
    } else {
      logger.debug(`Using direct to token address: ${toTokenAddress}`);
    }
    const resp = {
      chain: params.chain,
      txHash: "0x",
      fromToken: params.fromToken,
      toToken: params.toToken,
      amount: params.amount
    };
    logger.debug(`Getting routes from ${fromTokenAddress} to ${toTokenAddress}`);
    const slippage = params.slippage || 0.05;
    logger.debug(`Using slippage: ${slippage}`);
    try {
      const routes = await getRoutes({
        fromChainId: chainId,
        toChainId: chainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount: parseEther(params.amount).toString(),
        fromAddress,
        options: {
          slippage,
          order: "RECOMMENDED"
        }
      });
      logger.debug(`Found ${routes.routes.length} routes`);
      if (!routes.routes.length) {
        throw new Error(`No routes found from ${params.fromToken} to ${params.toToken} with amount ${params.amount}`);
      }
      if (!routes.routes[0]) {
        throw new Error("No valid route found for swap");
      }
      logger.debug(`Executing route: ${JSON.stringify(routes.routes[0].steps, null, 2)}`);
      const execution = await executeRoute(routes.routes[0]);
      logger.debug(`Execution: ${JSON.stringify(execution.steps, null, 2)}`);
      const process2 = execution.steps[0]?.execution?.process[execution.steps[0]?.execution?.process.length - 1];
      if (!process2?.status || process2.status === "FAILED") {
        throw new Error(`Transaction failed: ${process2?.status || "unknown error"}`);
      }
      resp.txHash = process2.txHash;
      logger.debug(`Swap successful with tx hash: ${resp.txHash}`);
      return resp;
    } catch (error) {
      logger.error("Error during swap execution:", error);
      const errorObj = error;
      const errorMessage = errorObj.message || String(error);
      if (errorMessage.includes("insufficient funds")) {
        logger.debug("Insufficient funds for swap");
        throw new Error(`Insufficient funds for swapping ${params.amount} ${params.fromToken}. Please check your balance.`);
      }
      if (errorMessage.includes("Cannot read properties")) {
        logger.error("SDK response parsing error");
        throw new Error("Error processing swap response. This might be due to rate limits or invalid token parameters.");
      }
      throw error;
    }
  }
  /**
   * Validates and normalizes swap parameters
   * 
   * @param params - The parameters to validate and normalize
   * @throws Error if parameters are invalid
   */
  validateAndNormalizeParams(params) {
    logger.debug(`Validating swap params: chain=${params.chain}, from=${params.fromToken}, to=${params.toToken}, amount=${params.amount}`);
    if (!params.chain) {
      logger.debug("No chain specified, defaulting to bsc");
      params.chain = "bsc";
    } else if (params.chain !== "bsc") {
      logger.error(`Unsupported chain: ${params.chain}`);
      throw new Error("Only BSC mainnet is supported for swaps");
    }
    if (!params.fromToken) {
      logger.error("From token not specified");
      throw new Error("From token is required for swap");
    }
    if (!params.toToken) {
      logger.error("To token not specified");
      throw new Error("To token is required for swap");
    }
    if (params.fromToken === params.toToken) {
      logger.error(`Cannot swap from and to the same token: ${params.fromToken}`);
      throw new Error(`Cannot swap from and to the same token: ${params.fromToken}`);
    }
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
    if (params.slippage !== void 0) {
      if (typeof params.slippage !== "number") {
        logger.error(`Invalid slippage type: ${typeof params.slippage}`);
        throw new Error("Slippage must be a number");
      }
      if (params.slippage <= 0 || params.slippage > 1) {
        logger.error(`Invalid slippage value: ${params.slippage} (must be between 0 and 1)`);
        throw new Error("Slippage must be between 0 and 1 (e.g., 0.05 for 5%)");
      }
    } else {
      params.slippage = 0.05;
      logger.debug(`Using default slippage: ${params.slippage}`);
    }
  }
};
var swapAction = {
  name: "SWAP_BNB",
  similes: ["TOKEN_SWAP_BNB", "EXCHANGE_TOKENS_BNB", "TRADE_TOKENS_BNB"],
  description: "Swap tokens on BNB Smart Chain (BSC) using the best available routes",
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Executing SWAP_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    const promptText = typeof message.content.text === "string" ? message.content.text.trim() : "";
    logger.debug(`Raw prompt text: "${promptText}"`);
    promptText.toLowerCase();
    const basicSwapRegex = /swap\s+([0-9.]+)\s+([a-zA-Z0-9]+)\s+(?:for|to)\s+([a-zA-Z0-9]+)/i;
    const advancedSwapRegex = /(?:swap|exchange|trade|convert)\s+([0-9.]+)\s+([a-zA-Z0-9]+)\s+(?:for|to|into)\s+([a-zA-Z0-9]+)/i;
    let directFromToken = null;
    let directToToken = null;
    let directAmount = null;
    const match = promptText.match(basicSwapRegex) || promptText.match(advancedSwapRegex);
    if (match && match.length >= 4) {
      directAmount = match[1] || null;
      directFromToken = match[2] ? match[2].toUpperCase() : null;
      directToToken = match[3] ? match[3].toUpperCase() : null;
      logger.debug(`Directly extracted from prompt - Amount: ${directAmount}, From: ${directFromToken}, To: ${directToToken}`);
    }
    const tokenMentions = {};
    const commonTokens = ["USDT", "USDC", "BNB", "ETH", "BTC", "BUSD", "DAI", "WETC", "WBNB", "TRON", "LINK", "OM", "UNI", "PEPE", "AAVE", "ATOM"];
    for (const token of commonTokens) {
      const regex = new RegExp(`\\b${token}\\b`, "i");
      if (regex.test(promptText)) {
        tokenMentions[token] = true;
        logger.debug(`Detected token in prompt: ${token}`);
      }
    }
    const promptAnalysis = {
      directFromToken,
      directToToken,
      directAmount,
      tokenMentions
    };
    logger.debug("Prompt analysis result:", promptAnalysis);
    const currentState = state ? state : await runtime.composeState(message);
    try {
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(
          runtime,
          message,
          currentState
        );
        logger.debug("Wallet info:", state.walletInfo);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
    }
    const swapPrompt = {
      template: swapTemplate,
      state: currentState
    };
    const mlOutput = await runtime.useModel(ModelType.LARGE, {
      prompt: JSON.stringify(swapPrompt),
      responseFormat: { type: "json_object" }
    });
    let content = {};
    try {
      content = typeof mlOutput === "string" ? JSON.parse(mlOutput) : mlOutput;
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
    }
    logger.debug("Generated swap content:", JSON.stringify(content, null, 2));
    const chainValue = content.chain;
    const chain = typeof chainValue === "string" ? chainValue.toLowerCase() : "bsc";
    logger.debug(`Chain parameter: ${chain}`);
    let fromToken;
    if (directFromToken) {
      fromToken = directFromToken;
      logger.debug(`Using from token directly extracted from prompt: ${fromToken}`);
    } else if (content.inputToken && typeof content.inputToken === "string") {
      fromToken = content.inputToken;
      logger.debug(`Using from token from generated content: ${fromToken}`);
    } else if (tokenMentions?.BNB) {
      fromToken = "BNB";
      logger.debug("Defaulting to BNB as from token based on mention");
    } else {
      fromToken = "BNB";
      logger.debug("No from token detected, defaulting to BNB");
    }
    let toToken = "USDC";
    if (directToToken) {
      toToken = directToToken;
      logger.debug(`Using to token directly extracted from prompt: ${toToken}`);
    } else if (content.outputToken && typeof content.outputToken === "string") {
      toToken = content.outputToken;
      logger.debug(`Using to token from generated content: ${toToken}`);
    } else {
      let tokenFound = false;
      for (const token of ["USDC", "USDT", "BUSD"]) {
        if (token !== fromToken && tokenMentions?.[token]) {
          toToken = token;
          logger.debug(`Using ${token} as to token based on mention`);
          tokenFound = true;
          break;
        }
      }
      if (!tokenFound) {
        toToken = fromToken === "BNB" ? "USDC" : "BNB";
        logger.debug(`No to token detected, defaulting to ${toToken}`);
      }
    }
    let amount;
    if (directAmount) {
      amount = directAmount;
      logger.debug(`Using amount directly extracted from prompt: ${amount}`);
    } else if (content.amount && (typeof content.amount === "string" || typeof content.amount === "number")) {
      amount = String(content.amount);
      logger.debug(`Using amount from generated content: ${amount}`);
    } else {
      amount = "0.001";
      logger.debug(`No amount detected, defaulting to ${amount}`);
    }
    let slippage = content.slippage;
    if (typeof slippage !== "number" || slippage <= 0 || slippage > 1) {
      slippage = 0.05;
      logger.debug(`Invalid or missing slippage, using default: ${slippage}`);
    } else {
      logger.debug(`Using slippage from content: ${slippage}`);
    }
    const walletProvider = initWalletProvider(runtime);
    const action = new SwapAction(walletProvider);
    const swapOptions = {
      chain,
      fromToken,
      toToken,
      amount,
      slippage
    };
    logger.debug("Final swap options:", JSON.stringify(swapOptions, null, 2));
    try {
      logger.debug("Calling swap with params:", JSON.stringify(swapOptions, null, 2));
      const swapResp = await action.swap(swapOptions);
      const explorerInfo = swapOptions.chain === "bsctestnet" ? EXPLORERS.BSC_TESTNET : swapOptions.chain === "opbnb" ? EXPLORERS.OPBNB : EXPLORERS.BSC;
      const txExplorerUrl = `${explorerInfo.url}/tx/${swapResp.txHash}`;
      const walletAddress = walletProvider.getAddress();
      const walletExplorerUrl = `${explorerInfo.url}/address/${walletAddress}`;
      logger.debug(`Transaction explorer URL: ${txExplorerUrl}`);
      logger.debug(`Wallet explorer URL: ${walletExplorerUrl}`);
      let gasPrice = "Unknown";
      let gasLimit = "Unknown";
      let gasCostBNB = "Unknown";
      let gasCostUSD = "Unknown";
      try {
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
${gasPrice !== "Unknown" ? `
Gas used: ${gasPrice} (limit: ${gasLimit})` : ""}
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
        }
      });
      return true;
    } catch (error) {
      const errorObj = error;
      logger.error("Error during swap:", errorObj.message || String(error));
      try {
        logger.error("Full error details:", JSON.stringify(error, null, 2));
      } catch (e) {
        logger.error("Error object not serializable, logging properties individually:");
        if (errorObj && typeof errorObj === "object") {
          const errorAsRecord = Object.entries(errorObj).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
          for (const [key, value] of Object.entries(errorAsRecord)) {
            try {
              logger.error(`${key}:`, value);
            } catch (e2) {
              logger.error(`${key}: [Error serializing property]`);
            }
          }
        }
      }
      let errorMessage = errorObj.message || String(error);
      if (typeof errorMessage === "string") {
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
        }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Swap 0.001 BNB for USDC on BSC"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you swap 0.001 BNB for USDC on BSC",
          actions: ["SWAP_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Buy some token of 0x1234 using 0.001 USDC on BSC. The slippage should be no more than 5%"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you swap 0.001 USDC for token 0x1234 on BSC",
          actions: ["SWAP_BNB"]
        }
      }
    ]
  ]
};
var TransferAction = class {
  // 3 Gwei
  /**
   * Creates a new TransferAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  TRANSFER_GAS = 21000n;
  DEFAULT_GAS_PRICE = 3000000000n;
  /**
   * Execute a token transfer with the provided parameters
   * 
   * @param params - Transfer parameters including chain, token, amount, and recipient
   * @returns Transfer response with transaction details
   * @throws Error if transfer fails
   */
  async transfer(params) {
    logger.debug("Starting transfer with params:", JSON.stringify(params, null, 2));
    logger.debug(`Chain before validation: ${params.chain}`);
    logger.debug("Available chains:", Object.keys(this.walletProvider.chains));
    if (!this.walletProvider.chains[params.chain]) {
      logger.error(`Chain '${params.chain}' is not supported. Available chains: ${Object.keys(this.walletProvider.chains).join(", ")}`);
      throw new Error(`Chain '${params.chain}' is not supported. Please use one of: ${Object.keys(this.walletProvider.chains).join(", ")}`);
    }
    let dataParam = void 0;
    if (params.data && typeof params.data === "string" && params.data.startsWith("0x")) {
      dataParam = params.data;
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
    if (!params.token) {
      params.token = nativeToken;
      logger.debug(`Setting null token to native token: ${nativeToken}`);
    } else if (params.token.toLowerCase() === nativeToken.toLowerCase()) {
      params.token = nativeToken;
      logger.debug(`Standardized token case to match native token: ${nativeToken}`);
    }
    logger.debug(`Final transfer token: ${params.token}`);
    const resp = {
      chain: params.chain,
      txHash: "0x",
      recipient: params.toAddress,
      amount: "",
      token: params.token
    };
    try {
      const publicClient2 = this.walletProvider.getPublicClient(params.chain);
      const balance = await publicClient2.getBalance({
        address: fromAddress
      });
      logger.debug(`Current wallet balance: ${formatEther(balance)} ${nativeToken}`);
    } catch (error) {
      logger.error("Failed to get wallet balance:", error instanceof Error ? error.message : String(error));
    }
    if (!params.token || params.token === "null" || params.token === nativeToken) {
      logger.debug("Entering native token transfer branch:", nativeToken);
      const options = {
        data: dataParam
      };
      let value;
      if (!params.amount) {
        logger.debug("No amount specified, transferring all balance minus gas");
        const publicClient2 = this.walletProvider.getPublicClient(
          params.chain
        );
        const balance = await publicClient2.getBalance({
          address: fromAddress
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
      logger.debug("Entering ERC20 token transfer branch for token:", params.token);
      let tokenAddress = params.token;
      logger.debug(`Token before address resolution: ${params.token}`);
      if (params.token === "BNB" || params.token === "bnb") {
        logger.debug("Detected native token (BNB) passed to ERC20 handling branch - switching to native token handling");
        resp.token = nativeToken;
        const options = {
          data: dataParam
        };
        let value2;
        if (!params.amount) {
          logger.debug("No amount specified for BNB, transferring all balance minus gas");
          const publicClient3 = this.walletProvider.getPublicClient(
            params.chain
          );
          const balance = await publicClient3.getBalance({
            address: fromAddress
          });
          logger.debug(`Wallet balance for BNB transfer: ${formatEther(balance)} ${nativeToken}`);
          value2 = balance - this.DEFAULT_GAS_PRICE * 21000n;
          logger.debug(`Calculated BNB transfer amount: ${formatEther(value2)} (balance minus gas)`);
          options.gas = this.TRANSFER_GAS;
          options.gasPrice = this.DEFAULT_GAS_PRICE;
        } else {
          logger.debug(`Using specified amount for BNB transfer: ${params.amount}`);
          try {
            value2 = parseEther(params.amount);
            logger.debug(`Parsed BNB amount to wei: ${value2}`);
          } catch (error) {
            logger.error(`Error parsing BNB amount "${params.amount}":`, error instanceof Error ? error.message : String(error));
            throw new Error(`Invalid amount format: ${params.amount}. Please provide a valid number.`);
          }
        }
        resp.amount = formatEther(value2);
        logger.debug(`About to execute BNB transfer: ${resp.amount} BNB to ${params.toAddress}`);
        try {
          resp.txHash = await this.walletProvider.transfer(
            params.chain,
            params.toAddress,
            value2,
            options
          );
          logger.debug(`BNB transfer successful, txHash: ${resp.txHash}`);
        } catch (error) {
          logger.error("BNB transfer failed:", error instanceof Error ? error.message : String(error));
          throw error;
        }
        logger.debug("Native BNB transfer completed via transfer branch");
        return resp;
      }
      if (!params.token.startsWith("0x")) {
        try {
          logger.debug(`Attempting to resolve token symbol: ${params.token} on chain ${params.chain}`);
          logger.debug("Configuring LI.FI SDK for token lookup");
          this.walletProvider.configureLiFiSdk(params.chain);
          logger.debug(`Calling getTokenAddress for token symbol: ${params.token}`);
          tokenAddress = await this.walletProvider.getTokenAddress(
            params.chain,
            params.token
          );
          logger.debug(`Resolved token address: ${tokenAddress} for ${params.token}`);
          if (!tokenAddress || !tokenAddress.startsWith("0x")) {
            logger.error(`Failed to resolve token to proper address: ${tokenAddress}`);
            throw new Error(`Could not resolve token symbol ${params.token} to a valid address`);
          }
        } catch (error) {
          error instanceof Error ? error.message : String(error);
          logger.error(`Error resolving token address for ${params.token}:`, error);
          throw new Error(`Could not find token ${params.token} on chain ${params.chain}. Please check the token symbol or use the contract address.`);
        }
      } else {
        logger.debug(`Using token address directly: ${tokenAddress}`);
      }
      logger.debug(`Final token address for ERC20 transfer: ${tokenAddress}`);
      const publicClient2 = this.walletProvider.getPublicClient(
        params.chain
      );
      logger.debug(`Getting token decimals for ${tokenAddress}`);
      let decimals;
      try {
        decimals = await publicClient2.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "decimals"
        });
        logger.debug(`Token decimals: ${decimals}`);
      } catch (error) {
        logger.error("Failed to get token decimals:", error instanceof Error ? error.message : String(error));
        throw new Error(`Failed to get decimals for token at address ${tokenAddress}. The contract might not be an ERC20 token.`);
      }
      let value;
      if (!params.amount) {
        logger.debug("No amount specified, checking token balance");
        try {
          value = await publicClient2.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [fromAddress]
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
          tokenAddress,
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
    logger.debug(`Waiting for transaction confirmation: ${resp.txHash}`);
    const publicClient = this.walletProvider.getPublicClient(params.chain);
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: resp.txHash
      });
      logger.debug(`Transaction confirmed, status: ${receipt.status}, block: ${receipt.blockNumber}`);
    } catch (error) {
      logger.error("Error waiting for transaction confirmation:", error instanceof Error ? error.message : String(error));
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
  async validateAndNormalizeParams(params) {
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
    if (params.data !== void 0) {
      const dataValue = params.data;
      logger.debug(`Processing data field, original value: ${dataValue}`);
      if (dataValue === "null") {
        logger.debug('Data field is "null" string, converting to "0x"');
        params.data = "0x";
      } else if (dataValue !== "0x" && !dataValue.startsWith("0x")) {
        logger.debug(`Adding "0x" prefix to data: ${dataValue}`);
        try {
          params.data = `0x${dataValue}`;
        } catch (error) {
          logger.error(`Error formatting data field: ${error instanceof Error ? error.message : String(error)}`);
          params.data = "0x";
        }
      } else {
        logger.debug(`Using data as-is: ${dataValue}`);
      }
    } else {
      logger.debug("No data field provided in params");
      params.data = "0x";
    }
    logger.debug("Final data field:", params.data);
    logger.debug("Parameter validation and normalization completed successfully");
  }
};
var transferAction = {
  name: "TRANSFER_BNB",
  similes: ["SEND_TOKENS_BNB", "TOKEN_TRANSFER_BNB", "MOVE_TOKENS_BNB", "PAY_BNB"],
  description: "Transfers native BNB or ERC20 tokens on BNB Smart Chain (BSC) or opBNB networks",
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Executing TRANSFER_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    logger.debug("Message source:", message.content.source);
    const promptText = typeof message.content.text === "string" ? message.content.text.trim() : "";
    logger.debug(`Raw prompt text: "${promptText}"`);
    const promptLower = promptText.toLowerCase();
    const containsBnb = promptLower.includes("bnb") || promptLower.includes("binance coin") || promptLower.includes("binance smart chain");
    let directTokenMatch = null;
    const transferRegex = /transfer\s+([0-9.]+)\s+([a-zA-Z0-9]+)\s+to\s+(0x[a-fA-F0-9]{40})/i;
    const match = promptText.match(transferRegex);
    if (match && match.length >= 3 && match[2]) {
      const amount2 = match[1];
      const tokenSymbol = match[2];
      const toAddress2 = match[3];
      directTokenMatch = tokenSymbol.toUpperCase();
      logger.debug(`Directly extracted from prompt - Amount: ${amount2}, Token: ${directTokenMatch}, To: ${toAddress2}`);
    }
    if (containsBnb) {
      logger.debug(`BNB transfer detected in prompt text: "${promptText}"`);
    }
    const promptAnalysis = {
      containsBnb,
      directTokenMatch
    };
    logger.debug("Prompt analysis result:", promptAnalysis);
    logger.debug("Validating message source:", message.content.source);
    if (!(message.content.source === "direct" || message.content.source === "client_chat:user")) {
      logger.warn("Transfer rejected: invalid source:", message.content.source);
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Transfer not allowed" }
      });
      return false;
    }
    logger.debug("Source validation passed");
    logger.debug("Initializing state");
    const currentState = state ? state : await runtime.composeState(message);
    try {
      if (state) {
        logger.debug("Getting wallet info from provider");
        state.walletInfo = await bnbWalletProvider.get(
          runtime,
          message,
          currentState
        );
        logger.debug("Wallet info retrieved:", state.walletInfo);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
    }
    logger.debug("Available runtime settings:");
    const bscProviderUrl = runtime.getSetting("BSC_PROVIDER_URL");
    const bscTestnetProviderUrl = runtime.getSetting("BSC_TESTNET_PROVIDER_URL");
    const bnbPrivateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    logger.debug(`BSC_PROVIDER_URL: ${bscProviderUrl ? "set" : "not set"}`);
    logger.debug(`BSC_TESTNET_PROVIDER_URL: ${bscTestnetProviderUrl ? "set" : "not set"}`);
    logger.debug(`BNB_PRIVATE_KEY: ${bnbPrivateKey ? `set (starts with ${bnbPrivateKey.substring(0, 6)}...)` : "not set"}`);
    logger.debug("Creating transfer prompt");
    const transferPrompt = {
      template: transferTemplate,
      state: currentState
    };
    logger.debug("Template data sent to model:", JSON.stringify(transferPrompt, null, 2));
    logger.debug("Calling useModel to generate transfer parameters");
    const mlOutput = await runtime.useModel(ModelType.LARGE, {
      prompt: JSON.stringify(transferPrompt),
      responseFormat: { type: "json_object" }
    });
    logger.debug("Raw model output:", mlOutput);
    let content = {};
    try {
      let jsonStr = mlOutput;
      if (typeof mlOutput === "string") {
        const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match2 = mlOutput.match(jsonRegex);
        if (match2?.[1]) {
          jsonStr = match2[1];
          logger.debug("Extracted JSON from markdown:", jsonStr);
        }
        content = JSON.parse(jsonStr);
      } else {
        content = mlOutput;
      }
      logger.debug("Successfully parsed model output");
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", error instanceof Error ? error.message : String(error));
      logger.error("Raw output that failed parsing:", mlOutput);
      logger.debug("Using direct extraction from prompt as fallback");
      content = {};
      if (match) {
        content.amount = match[1] || "";
        content.token = match[2] || "BNB";
        content.toAddress = match[3] || "";
        logger.debug("Set content from regex extraction:", content);
      }
    }
    logger.debug("Generated transfer content:", JSON.stringify(content, null, 2));
    const chainValue = content.chain;
    const chain = typeof chainValue === "string" ? chainValue.toLowerCase() : "bsc";
    logger.debug(`Chain parameter: ${chain}`);
    const tokenValue = content.token;
    let token;
    if (directTokenMatch) {
      token = directTokenMatch;
      logger.debug(`Using token directly extracted from prompt: ${token}`);
    } else if (tokenValue && typeof tokenValue === "string") {
      token = tokenValue;
      logger.debug(`Using token from generated content: ${token}`);
    } else if (containsBnb) {
      token = "BNB";
      logger.debug("Using BNB as detected in prompt");
    } else {
      token = "BNB";
      logger.debug("No token detected, defaulting to native token BNB");
    }
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
    let dataParam = void 0;
    const dataValue = content.data;
    if (dataValue && typeof dataValue === "string") {
      if (dataValue.startsWith("0x") && dataValue !== "0x") {
        dataParam = dataValue;
        logger.debug(`Using valid hex data: ${dataParam}`);
      } else {
        logger.debug(`Invalid data format or value: ${dataValue}, ignoring`);
      }
    }
    let toAddress = "";
    if (typeof content.toAddress === "string") {
      toAddress = content.toAddress;
    } else if (match?.[3]) {
      toAddress = match[3];
      logger.debug(`Using address extracted from prompt: ${toAddress}`);
    }
    let amount = "";
    if (content.amount && (typeof content.amount === "string" || typeof content.amount === "number")) {
      amount = String(content.amount);
    } else if (match?.[1]) {
      amount = match[1];
      logger.debug(`Using amount extracted from prompt: ${amount}`);
    }
    const paramOptions = {
      chain,
      token,
      amount,
      toAddress,
      data: dataParam
    };
    logger.debug("Transfer params before action:", JSON.stringify(paramOptions, null, 2));
    try {
      logger.debug("Calling transfer with params:", JSON.stringify(paramOptions, null, 2));
      logger.debug("Wallet provider initialized, address:", walletProvider.getAddress());
      logger.debug("About to call TransferAction.transfer() method...");
      const transferResp = await action.transfer(paramOptions);
      logger.debug("Transfer method completed successfully, response:", JSON.stringify(transferResp, null, 2));
      const explorerInfo = chain === "bsctestnet" ? EXPLORERS.BSC_TESTNET : chain === "opbnb" ? EXPLORERS.OPBNB : EXPLORERS.BSC;
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
          blockExplorerUrl,
          walletExplorerUrl
        }
      });
      return true;
    } catch (error) {
      const errorObj = error;
      logger.error("Error during transfer:", errorObj.message || String(error));
      try {
        logger.error("Full error details:", JSON.stringify(error, null, 2));
      } catch (e) {
        logger.error("Error object not serializable, logging properties individually:");
        if (errorObj && typeof errorObj === "object") {
          const errorAsRecord = Object.entries(errorObj).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
          for (const [key, value] of Object.entries(errorAsRecord)) {
            try {
              logger.error(`${key}:`, value);
            } catch (e2) {
              logger.error(`${key}: [Error serializing property]`);
            }
          }
        }
      }
      let errorMessage = errorObj.message || String(error);
      if (typeof errorMessage === "string" && errorMessage.includes("LI.FI SDK")) {
        logger.error("LI.FI SDK error detected");
        if (errorMessage.includes("Request failed with status code 404") && errorMessage.includes("Could not find token")) {
          const tokenMatch = errorMessage.match(/Could not find token (.*?) on chain/);
          const tokenValue2 = tokenMatch ? tokenMatch[1] : paramOptions.token;
          errorMessage = `Could not find the token '${tokenValue2}' on ${paramOptions.chain}. 
          Please check the token symbol or address and try again.`;
          logger.error("Token not found:", tokenValue2);
          logger.debug("Original token from params:", paramOptions.token);
          if (tokenValue2 === "null" || tokenValue2 === "undefined" || !tokenValue2) {
            errorMessage += " For BNB transfers, please explicitly specify 'BNB' as the token.";
          }
        } else if (errorMessage.includes("400 Bad Request") && errorMessage.includes("chain must be")) {
          errorMessage = `Chain validation error: '${paramOptions.chain}' is not a valid chain for the LI.FI SDK. 
          Please use 'bsc' for BSC mainnet.`;
        }
      }
      if (typeof errorMessage === "string") {
        if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for the transaction. Please check your balance and try again with a smaller amount.";
        } else if (errorMessage.includes("transaction underpriced")) {
          errorMessage = "Transaction underpriced. Please try again with a higher gas price.";
        }
      }
      const explorerInfo = chain === "bsctestnet" ? EXPLORERS.BSC_TESTNET : chain === "opbnb" ? EXPLORERS.OPBNB : EXPLORERS.BSC;
      const walletExplorerUrl = `${explorerInfo.url}/address/${walletProvider.getAddress()}`;
      callback?.({
        text: `Transfer failed: ${errorMessage}
You can check your wallet balance at: ${walletExplorerUrl}`,
        content: {
          error: errorMessage,
          walletExplorerUrl
        }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Transfer 0.001 BNB to 0xC9904881242cF8A1e105E800A9CF6fF4Ec0289f0"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you transfer 0.001 BNB to 0x2CE4EaF47CACFbC6590686f8f7521e0385822334 on BSC",
          actions: ["TRANSFER_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Transfer 1 USDT to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you transfer 1 USDT to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on BSC",
          actions: ["TRANSFER_BNB"]
        }
      }
    ]
  ]
};
var GetBalanceAction = class {
  /**
   * Creates a new GetBalanceAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  /**
   * Get token balance for the specified address and chain
   * 
   * @param params - Parameters including chain, address, and token
   * @returns Balance response with token and amount
   * @throws Error if balance retrieval fails
   */
  async getBalance(params) {
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
    if (!token || token === "" || token.toLowerCase() === "bnb" || token.toLowerCase() === "tbnb") {
      queryNativeToken = true;
    }
    const resp = {
      chain,
      address
    };
    if (!queryNativeToken) {
      let amount;
      if (token.startsWith("0x")) {
        amount = await this.getERC20TokenBalance(
          chain,
          address,
          token
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
          tokenInfo.address
        );
      }
      resp.balance = { token, amount };
    } else {
      const nativeBalanceWei = await this.walletProvider.getPublicClient(chain).getBalance({ address });
      resp.balance = {
        token: nativeSymbol,
        amount: formatEther(nativeBalanceWei)
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
  async getERC20TokenBalance(chain, address, tokenAddress) {
    const publicClient = this.walletProvider.getPublicClient(chain);
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address]
    });
    const decimals = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals"
    });
    return formatUnits(balance, decimals);
  }
  /**
   * Validates and normalizes the balance query parameters
   * 
   * @param params - Parameters to validate and normalize
   * @throws Error if validation fails
   */
  async validateAndNormalizeParams(params) {
    try {
      if (!params.chain) {
        params.chain = "bsc";
        logger.debug("No chain specified, defaulting to BSC mainnet");
      }
      if (!params.address) {
        params.address = this.walletProvider.getAddress();
        logger.debug(`No address provided, using wallet address: ${params.address}`);
        return;
      }
      const addressStr = String(params.address);
      if (addressStr === "null" || addressStr === "undefined") {
        params.address = this.walletProvider.getAddress();
        logger.debug(`Invalid address string provided, using wallet address: ${params.address}`);
        return;
      }
      if (addressStr.startsWith("0x") && addressStr.length === 42) {
        logger.debug(`Using valid hex address: ${params.address}`);
        return;
      }
      const commonTokens = ["USDT", "USDC", "BNB", "ETH", "BUSD", "WBNB", "CAKE"];
      if (commonTokens.includes(addressStr.toUpperCase())) {
        logger.debug(`Address looks like a token symbol: ${params.address}, using wallet address instead`);
        params.address = this.walletProvider.getAddress();
        return;
      }
      logger.debug(`Attempting to resolve address as Web3Name: ${params.address}`);
      const resolvedAddress = await this.walletProvider.resolveWeb3Name(params.address);
      if (resolvedAddress) {
        logger.debug(`Resolved Web3Name to address: ${resolvedAddress}`);
        params.address = resolvedAddress;
        return;
      }
      if (addressStr.startsWith("0x")) {
        logger.warn(`Address "${params.address}" doesn't look like a standard Ethereum address but will be used as is`);
        return;
      }
      logger.warn(`Could not resolve address: ${params.address}, falling back to wallet address`);
      params.address = this.walletProvider.getAddress();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error validating address: ${errorMessage}`);
      params.address = this.walletProvider.getAddress();
    }
  }
};
var getBalanceAction = {
  name: "GET_BALANCE_BNB",
  similes: ["CHECK_BALANCE_BNB", "TOKEN_BALANCE_BNB", "VIEW_BALANCE_BNB"],
  description: "Get balance of a token or native BNB for a given address on BNB Smart Chain or opBNB networks",
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Executing GET_BALANCE_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    logger.debug("Message source:", message.content.source);
    if (!(message.content.source === "direct" || message.content.source === "client_chat:user")) {
      logger.warn("Balance query rejected: invalid source:", message.content.source);
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Balance query not allowed" }
      });
      return false;
    }
    logger.debug("Source validation passed");
    const currentState = state ? state : await runtime.composeState(message);
    try {
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(runtime, message, currentState);
        logger.debug("Wallet info:", JSON.stringify(state.walletInfo, null, 2));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
      callback?.({
        text: `Unable to access wallet: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
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
    let content = {};
    try {
      let jsonStr = mlOutput;
      if (typeof mlOutput === "string") {
        const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = mlOutput.match(jsonRegex);
        if (match?.[1]) {
          jsonStr = match[1];
          logger.debug("Extracted JSON from markdown:", jsonStr);
        }
        content = JSON.parse(jsonStr);
      } else {
        content = mlOutput;
      }
      logger.debug("Successfully parsed model output:", JSON.stringify(content, null, 2));
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", error instanceof Error ? error.message : String(error));
      logger.error("Raw output that failed parsing:", mlOutput);
      content = {
        chain: "bsc",
        // Default to bsc chain
        token: "BNB"
        // Default to BNB token
      };
      logger.debug("Using fallback content:", JSON.stringify(content, null, 2));
    }
    const walletProvider = initWalletProvider(runtime);
    const action = new GetBalanceAction(walletProvider);
    const getBalanceParams = {
      chain: content.chain || "bsc",
      address: content.address || void 0,
      // Let validateAndNormalizeParams handle null/undefined
      token: content.token || "BNB"
    };
    logger.debug("Balance query parameters:", JSON.stringify(getBalanceParams, null, 2));
    try {
      logger.debug(`Querying balance on ${getBalanceParams.chain} for token ${getBalanceParams.token || "native BNB"}`);
      const balanceResponse = await action.getBalance(getBalanceParams);
      logger.debug("Balance response:", JSON.stringify(balanceResponse, null, 2));
      if (callback) {
        let responseText = `No balance found for ${balanceResponse.address} on ${balanceResponse.chain}`;
        if (balanceResponse.balance) {
          const explorerInfo = balanceResponse.chain === "bsctestnet" ? EXPLORERS.BSC_TESTNET : balanceResponse.chain === "opbnb" ? EXPLORERS.OPBNB : EXPLORERS.BSC;
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
              walletExplorerUrl
            }
          });
        } else {
          callback({
            text: responseText,
            content: {
              success: true,
              ...balanceResponse
            }
          });
        }
      }
      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error during balance query:", errorObj.message);
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
      const walletAddress = walletProvider.getAddress();
      const explorerInfo = getBalanceParams.chain === "bsctestnet" ? EXPLORERS.BSC_TESTNET : getBalanceParams.chain === "opbnb" ? EXPLORERS.OPBNB : EXPLORERS.BSC;
      const walletExplorerUrl = `${explorerInfo.url}/address/${walletAddress}`;
      callback?.({
        text: `Failed to get balance: ${errorMessage}
        
You can check your wallet at: ${walletExplorerUrl}`,
        content: {
          success: false,
          error: errorMessage,
          chain: getBalanceParams.chain,
          token: getBalanceParams.token,
          walletExplorerUrl
        }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Check my BNB balance"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check your BNB balance on BSC",
          actions: ["GET_BALANCE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What's my USDC balance?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check your USDC balance on BSC",
          actions: ["GET_BALANCE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me how much 0x8731d54E9D02c286767d56ac03e8037C07e01e98 has in their wallet"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll check the BNB balance for that address on BSC",
          actions: ["GET_BALANCE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Check CAKE token balance of this address: 0x1234567890AbCdEf1234567890AbCdEf12345678"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll look up the CAKE token balance for that address on BSC",
          actions: ["GET_BALANCE_BNB"]
        }
      }
    ]
  ]
};

// src/types/index.ts
var L1StandardBridgeAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "receive",
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "MESSENGER",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract CrossDomainMessenger"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "OTHER_BRIDGE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract StandardBridge"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "bridgeERC20",
    inputs: [
      {
        name: "_localToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_remoteToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_minGasLimit",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "bridgeERC20To",
    inputs: [
      {
        name: "_localToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_remoteToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_to",
        type: "address",
        internalType: "address"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_minGasLimit",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "bridgeETH",
    inputs: [
      {
        name: "_minGasLimit",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "bridgeETHTo",
    inputs: [
      {
        name: "_to",
        type: "address",
        internalType: "address"
      },
      {
        name: "_minGasLimit",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "depositERC20",
    inputs: [
      {
        name: "_l1Token",
        type: "address",
        internalType: "address"
      },
      {
        name: "_l2Token",
        type: "address",
        internalType: "address"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_minGasLimit",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "depositERC20To",
    inputs: [
      {
        name: "_l1Token",
        type: "address",
        internalType: "address"
      },
      {
        name: "_l2Token",
        type: "address",
        internalType: "address"
      },
      {
        name: "_to",
        type: "address",
        internalType: "address"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_minGasLimit",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "depositETH",
    inputs: [
      {
        name: "_minGasLimit",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "depositETHTo",
    inputs: [
      {
        name: "_to",
        type: "address",
        internalType: "address"
      },
      {
        name: "_minGasLimit",
        type: "uint32",
        internalType: "uint32"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "deposits",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      },
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "finalizeBridgeERC20",
    inputs: [
      {
        name: "_localToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_remoteToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_from",
        type: "address",
        internalType: "address"
      },
      {
        name: "_to",
        type: "address",
        internalType: "address"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "finalizeBridgeETH",
    inputs: [
      {
        name: "_from",
        type: "address",
        internalType: "address"
      },
      {
        name: "_to",
        type: "address",
        internalType: "address"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "finalizeERC20Withdrawal",
    inputs: [
      {
        name: "_l1Token",
        type: "address",
        internalType: "address"
      },
      {
        name: "_l2Token",
        type: "address",
        internalType: "address"
      },
      {
        name: "_from",
        type: "address",
        internalType: "address"
      },
      {
        name: "_to",
        type: "address",
        internalType: "address"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "finalizeETHWithdrawal",
    inputs: [
      {
        name: "_from",
        type: "address",
        internalType: "address"
      },
      {
        name: "_to",
        type: "address",
        internalType: "address"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_extraData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "_messenger",
        type: "address",
        internalType: "contract CrossDomainMessenger"
      },
      {
        name: "_superchainConfig",
        type: "address",
        internalType: "contract SuperchainConfig"
      },
      {
        name: "_systemConfig",
        type: "address",
        internalType: "contract SystemConfig"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "l2TokenBridge",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "messenger",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract CrossDomainMessenger"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "otherBridge",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract StandardBridge"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "superchainConfig",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract SuperchainConfig"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "systemConfig",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract SystemConfig"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "version",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "ERC20BridgeFinalized",
    inputs: [
      {
        name: "localToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "remoteToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ERC20BridgeInitiated",
    inputs: [
      {
        name: "localToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "remoteToken",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ERC20DepositInitiated",
    inputs: [
      {
        name: "l1Token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "l2Token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ERC20WithdrawalFinalized",
    inputs: [
      {
        name: "l1Token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "l2Token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ETHBridgeFinalized",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ETHBridgeInitiated",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ETHDepositInitiated",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ETHWithdrawalFinalized",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint8",
        indexed: false,
        internalType: "uint8"
      }
    ],
    anonymous: false
  }
];
var L2StandardBridgeAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_owner",
        type: "address",
        internalType: "address payable"
      },
      {
        name: "_delegationFee",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    name: "AddressEmptyCode",
    type: "error",
    inputs: [{ name: "target", type: "address", internalType: "address" }]
  },
  {
    name: "AddressInsufficientBalance",
    type: "error",
    inputs: [{ name: "account", type: "address", internalType: "address" }]
  },
  { name: "FailedInnerCall", type: "error", inputs: [] },
  {
    name: "OwnableInvalidOwner",
    type: "error",
    inputs: [{ name: "owner", type: "address", internalType: "address" }]
  },
  {
    name: "OwnableUnauthorizedAccount",
    type: "error",
    inputs: [{ name: "account", type: "address", internalType: "address" }]
  },
  {
    name: "SafeERC20FailedOperation",
    type: "error",
    inputs: [{ name: "token", type: "address", internalType: "address" }]
  },
  {
    name: "OwnershipTransferred",
    type: "event",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false,
    signature: "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0"
  },
  {
    name: "SetDelegationFee",
    type: "event",
    inputs: [
      {
        name: "_delegationFee",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false,
    signature: "0x0322f3257c2afe5fe8da7ab561f0d3384148487412fe2751678f2188731c0815"
  },
  {
    name: "WithdrawTo",
    type: "event",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "l2Token",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "to",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "minGasLimit",
        type: "uint32",
        indexed: false,
        internalType: "uint32"
      },
      {
        name: "extraData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false,
    signature: "0x56f66275d9ebc94b7d6895aa0d96a3783550d0183ba106408d387d19f2e877f1"
  },
  {
    name: "L2_STANDARD_BRIDGE",
    type: "function",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        value: "0x4200000000000000000000000000000000000010",
        internalType: "contract IL2StandardBridge"
      }
    ],
    constant: true,
    signature: "0x21d12763",
    stateMutability: "view"
  },
  {
    name: "L2_STANDARD_BRIDGE_ADDRESS",
    type: "function",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        value: "0x4200000000000000000000000000000000000010",
        internalType: "address"
      }
    ],
    constant: true,
    signature: "0x2cb7cb06",
    stateMutability: "view"
  },
  {
    name: "delegationFee",
    type: "function",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        value: "2000000000000000",
        internalType: "uint256"
      }
    ],
    constant: true,
    signature: "0xc5f0a58f",
    stateMutability: "view"
  },
  {
    name: "owner",
    type: "function",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        value: "0xCe4750fDc02A07Eb0d99cA798CD5c170D8F8410A",
        internalType: "address"
      }
    ],
    constant: true,
    signature: "0x8da5cb5b",
    stateMutability: "view"
  },
  {
    name: "renounceOwnership",
    type: "function",
    inputs: [],
    outputs: [],
    signature: "0x715018a6",
    stateMutability: "nonpayable"
  },
  {
    name: "setDelegationFee",
    type: "function",
    inputs: [
      {
        name: "_delegationFee",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    signature: "0x55bfc81c",
    stateMutability: "nonpayable"
  },
  {
    name: "transferOwnership",
    type: "function",
    inputs: [
      { name: "newOwner", type: "address", internalType: "address" }
    ],
    outputs: [],
    signature: "0xf2fde38b",
    stateMutability: "nonpayable"
  },
  {
    name: "withdraw",
    type: "function",
    inputs: [
      { name: "_l2Token", type: "address", internalType: "address" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
      { name: "_minGasLimit", type: "uint32", internalType: "uint32" },
      { name: "_extraData", type: "bytes", internalType: "bytes" }
    ],
    outputs: [],
    payable: true,
    signature: "0x32b7006d",
    stateMutability: "payable"
  },
  {
    name: "withdrawFee",
    type: "function",
    inputs: [
      { name: "_recipient", type: "address", internalType: "address" }
    ],
    outputs: [],
    signature: "0x1ac3ddeb",
    stateMutability: "nonpayable"
  },
  {
    name: "withdrawFeeToL1",
    type: "function",
    inputs: [
      { name: "_recipient", type: "address", internalType: "address" },
      { name: "_minGasLimit", type: "uint32", internalType: "uint32" },
      { name: "_extraData", type: "bytes", internalType: "bytes" }
    ],
    outputs: [],
    signature: "0x244cafe0",
    stateMutability: "nonpayable"
  },
  {
    name: "withdrawTo",
    type: "function",
    inputs: [
      { name: "_l2Token", type: "address", internalType: "address" },
      { name: "_to", type: "address", internalType: "address" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
      { name: "_minGasLimit", type: "uint32", internalType: "uint32" },
      { name: "_extraData", type: "bytes", internalType: "bytes" }
    ],
    outputs: [],
    payable: true,
    signature: "0xa3a79548",
    stateMutability: "payable"
  }
];
var ListaDaoAbi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_account",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "ClaimAllWithdrawals",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_uuid",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "ClaimUndelegated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_validator",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_uuid",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "ClaimUndelegatedFrom",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_account",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_idx",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "ClaimWithdrawal",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "Delegate",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "_validator",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "_delegateVotePower",
        type: "bool"
      }
    ],
    name: "DelegateTo",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "_delegateTo",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_votesChange",
        type: "uint256"
      }
    ],
    name: "DelegateVoteTo",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "_src",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "Deposit",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "DisableValidator",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8"
      }
    ],
    name: "Initialized",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "Paused",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "ProposeManager",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "_src",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "_dest",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "ReDelegate",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_rewardsId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "Redelegate",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "RemoveValidator",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_account",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amountInSlisBnb",
        type: "uint256"
      }
    ],
    name: "RequestWithdraw",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "RewardsCompounded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32"
      }
    ],
    name: "RoleAdminChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address"
      }
    ],
    name: "RoleGranted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address"
      }
    ],
    name: "RoleRevoked",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_annualRate",
        type: "uint256"
      }
    ],
    name: "SetAnnualRate",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "SetBSCValidator",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "SetManager",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_minBnb",
        type: "uint256"
      }
    ],
    name: "SetMinBnb",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "SetRedirectAddress",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "SetReserveAmount",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "SetRevenuePool",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_synFee",
        type: "uint256"
      }
    ],
    name: "SetSynFee",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_validator",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "_credit",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "toRemove",
        type: "bool"
      }
    ],
    name: "SyncCreditContract",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_nextUndelegatedRequestIndex",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_bnbAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_shares",
        type: "uint256"
      }
    ],
    name: "Undelegate",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_operator",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_bnbAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_shares",
        type: "uint256"
      }
    ],
    name: "UndelegateFrom",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "UndelegateReserve",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "Unpaused",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "WhitelistValidator",
    type: "event"
  },
  {
    inputs: [],
    name: "BOT",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "GUARDIAN",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TEN_DECIMALS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "acceptNewManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "amountToDelegate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "annualRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "_bnbAmount", type: "uint256" }
    ],
    name: "binarySearchCoveredMaxIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_validator", type: "address" }
    ],
    name: "claimUndelegated",
    outputs: [
      { internalType: "uint256", name: "_uuid", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_idx", type: "uint256" }],
    name: "claimWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_idx", type: "uint256" }
    ],
    name: "claimWithdrawFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "compoundRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_operator", type: "address" },
      { internalType: "uint256", name: "_bnbAmount", type: "uint256" }
    ],
    name: "convertBnbToShares",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "convertBnbToSnBnb",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_operator", type: "address" },
      { internalType: "uint256", name: "_shares", type: "uint256" }
    ],
    name: "convertSharesToBnb",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amountInSlisBnb",
        type: "uint256"
      }
    ],
    name: "convertSnBnbToBnb",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "creditContracts",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "creditStates",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_validator", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    name: "delegateTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "delegateVotePower",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_delegateTo", type: "address" }
    ],
    name: "delegateVoteTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "depositReserve",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "disableValidator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getAmountToUndelegate",
    outputs: [
      {
        internalType: "uint256",
        name: "_amountToUndelegate",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_uuid", type: "uint256" }],
    name: "getBotUndelegateRequest",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "amountInSnBnb",
            type: "uint256"
          }
        ],
        internalType: "struct IStakeManager.BotUndelegateRequest",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_validator", type: "address" }
    ],
    name: "getClaimableAmount",
    outputs: [
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getContracts",
    outputs: [
      { internalType: "address", name: "_manager", type: "address" },
      { internalType: "address", name: "_slisBnb", type: "address" },
      { internalType: "address", name: "_bscValidator", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_validator", type: "address" }
    ],
    name: "getDelegated",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "getRedelegateFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
    name: "getRoleAdmin",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getSlisBnbWithdrawLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "_slisBnbWithdrawLimit",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getTotalBnbInValidators",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getTotalPooledBnb",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_idx", type: "uint256" }
    ],
    name: "getUserRequestStatus",
    outputs: [
      { internalType: "bool", name: "_isClaimable", type: "bool" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "getUserWithdrawalRequests",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "uuid", type: "uint256" },
          {
            internalType: "uint256",
            name: "amountInSnBnb",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256"
          }
        ],
        internalType: "struct IStakeManager.WithdrawalRequest[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_slisBnb", type: "address" },
      { internalType: "address", name: "_admin", type: "address" },
      { internalType: "address", name: "_manager", type: "address" },
      { internalType: "address", name: "_bot", type: "address" },
      { internalType: "uint256", name: "_synFee", type: "uint256" },
      { internalType: "address", name: "_revenuePool", type: "address" },
      { internalType: "address", name: "_validator", type: "address" }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "minBnb",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "nextConfirmedRequestUUID",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "placeholder",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "proposeNewManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "srcValidator", type: "address" },
      { internalType: "address", name: "dstValidator", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    name: "redelegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "redirectAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "removeValidator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "requestIndexMap",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "requestUUID",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amountInSlisBnb",
        type: "uint256"
      }
    ],
    name: "requestWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "reserveAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "revenuePool",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "revokeBotRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "_annualRate", type: "uint256" }
    ],
    name: "setAnnualRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "setBSCValidator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "setBotRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "setMinBnb",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "setRedirectAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "setReserveAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "setRevenuePool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_synFee", type: "uint256" }],
    name: "setSynFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes4", name: "interfaceId", type: "bytes4" }
    ],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "synFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "togglePause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "toggleVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "totalDelegated",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalReserveAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "unbondingBnb",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "undelegate",
    outputs: [
      { internalType: "uint256", name: "_uuid", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_operator", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    name: "undelegateFrom",
    outputs: [
      {
        internalType: "uint256",
        name: "_actualBnbAmount",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "undelegatedQuota",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "validators",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" }
    ],
    name: "whitelistValidator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdrawReserve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { stateMutability: "payable", type: "receive" }
];

// src/actions/bridge.ts
function convertNullStringToUndefined(value) {
  if (value === null || value === "") return void 0;
  return value;
}
var BridgeAction = class {
  /**
   * Creates a new BridgeAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  L1_BRIDGE_ADDRESS = "0xF05F0e4362859c3331Cb9395CBC201E3Fa6757Ea";
  L2_BRIDGE_ADDRESS = "0x4000698e3De52120DE28181BaACda82B21568416";
  LEGACY_ERC20_ETH = "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000";
  /**
   * Execute a token bridge with the provided parameters
   * 
   * @param params - Bridge parameters including fromChain, toChain, token, and amount
   * @returns Bridge response with transaction details
   * @throws Error if bridge operation fails
   */
  async bridge(params) {
    logger.debug("Starting bridge with params:", JSON.stringify(params, null, 2));
    await this.validateAndNormalizeParams(params);
    logger.debug("After validation, bridge params:", JSON.stringify(params, null, 2));
    const nativeTokenBridge = params.fromToken === void 0 || typeof params.fromToken === "string" && params.fromToken.toUpperCase() === "BNB";
    const selfBridge = params.toAddress === void 0;
    const account = this.walletProvider.getAccount();
    const fromAddress = this.walletProvider.getAddress();
    logger.debug(`From address: ${fromAddress}`);
    const resp = {
      fromChain: params.fromChain,
      toChain: params.toChain,
      fromToken: nativeTokenBridge ? "BNB" : params.fromToken || "",
      toToken: nativeTokenBridge ? "BNB" : params.toToken || "",
      amount: params.amount,
      txHash: "0x",
      recipient: params.toAddress || fromAddress
    };
    logger.debug("Bridge response initialized:", JSON.stringify(resp, null, 2));
    try {
      logger.debug(`Switching to source chain: ${params.fromChain}`);
      this.walletProvider.switchChain(params.fromChain);
      const publicClient = this.walletProvider.getPublicClient(params.fromChain);
      const walletClient = this.walletProvider.getWalletClient(params.fromChain);
      const chain = this.walletProvider.getChainConfigs(params.fromChain);
      let amount;
      if (nativeTokenBridge) {
        amount = parseEther(params.amount);
        logger.debug(`Native token bridge, amount: ${amount}`);
      } else {
        logger.debug(`Reading decimals for token: ${params.fromToken}`);
        const decimals = await publicClient.readContract({
          address: params.fromToken,
          abi: erc20Abi,
          functionName: "decimals"
        });
        amount = parseUnits(params.amount, decimals);
        logger.debug(`ERC20 token bridge, amount: ${amount} with ${decimals} decimals`);
      }
      if (params.fromChain === "bsc" && params.toChain === "opBNB") {
        logger.debug("Bridging from L1 (BSC) to L2 (opBNB)");
        logger.debug(`Using L1 bridge contract: ${this.L1_BRIDGE_ADDRESS}`);
        const l1BridgeContractConfig = {
          address: this.L1_BRIDGE_ADDRESS,
          abi: L1StandardBridgeAbi
        };
        const l1Contract = getContract({
          ...l1BridgeContractConfig,
          client: { public: publicClient, wallet: walletClient }
        });
        if (!nativeTokenBridge) {
          logger.debug("Checking ERC20 allowance for L1 bridge");
          const allowance = await this.walletProvider.checkERC20Allowance(
            params.fromChain,
            params.fromToken,
            fromAddress,
            this.L1_BRIDGE_ADDRESS
          );
          logger.debug(`Current allowance: ${allowance}`);
          if (allowance < amount) {
            const neededAllowance = amount - allowance;
            logger.debug(`Increasing allowance by ${neededAllowance}`);
            const txHash = await this.walletProvider.approveERC20(
              params.fromChain,
              params.fromToken,
              this.L1_BRIDGE_ADDRESS,
              amount
            );
            logger.debug(`Approval transaction submitted with hash: ${txHash}`);
            await publicClient.waitForTransactionReceipt({
              hash: txHash
            });
            logger.debug("Approval transaction confirmed");
          } else {
            logger.debug("Sufficient allowance already granted");
          }
        }
        if (selfBridge && nativeTokenBridge) {
          logger.debug("Self bridge with native token - using depositETH");
          const args = [1, "0x"];
          logger.debug(`Simulating depositETH with value: ${amount}`);
          await publicClient.simulateContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositETH",
            args,
            account,
            value: amount
          });
          logger.debug("Executing depositETH transaction");
          resp.txHash = await walletClient.writeContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositETH",
            args,
            value: amount,
            chain,
            account
          });
        } else if (selfBridge && !nativeTokenBridge) {
          logger.debug("Self bridge with ERC20 token - using depositERC20");
          logger.debug(`From token: ${params.fromToken}, To token: ${params.toToken}`);
          const args = [
            params.fromToken,
            params.toToken,
            amount,
            1,
            "0x"
          ];
          logger.debug("Simulating depositERC20");
          await publicClient.simulateContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositERC20",
            args,
            account
          });
          logger.debug("Executing depositERC20 transaction");
          resp.txHash = await walletClient.writeContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositERC20",
            args,
            chain,
            account
          });
        } else if (!selfBridge && nativeTokenBridge) {
          logger.debug("Bridge to another address with native token - using depositETHTo");
          logger.debug(`Recipient address: ${params.toAddress}`);
          const args = [params.toAddress, 1, "0x"];
          logger.debug(`Simulating depositETHTo with value: ${amount}`);
          await publicClient.simulateContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositETHTo",
            args,
            account,
            value: amount
          });
          logger.debug("Executing depositETHTo transaction");
          resp.txHash = await walletClient.writeContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositETHTo",
            args,
            value: amount,
            chain,
            account
          });
        } else {
          logger.debug("Bridge to another address with ERC20 token - using depositERC20To");
          logger.debug(`From token: ${params.fromToken}, To token: ${params.toToken}`);
          logger.debug(`Recipient address: ${params.toAddress}`);
          const args = [
            params.fromToken,
            params.toToken,
            params.toAddress,
            amount,
            1,
            "0x"
          ];
          logger.debug("Simulating depositERC20To");
          await publicClient.simulateContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositERC20To",
            args,
            account
          });
          logger.debug("Executing depositERC20To transaction");
          resp.txHash = await walletClient.writeContract({
            address: l1Contract.address,
            abi: l1Contract.abi,
            functionName: "depositERC20To",
            args,
            chain,
            account
          });
        }
      } else if (params.fromChain === "opBNB" && params.toChain === "bsc") {
        logger.debug("Bridging from L2 (opBNB) to L1 (BSC)");
        logger.debug(`Using L2 bridge contract: ${this.L2_BRIDGE_ADDRESS}`);
        const l2BridgeContractConfig = {
          address: this.L2_BRIDGE_ADDRESS,
          abi: L2StandardBridgeAbi
        };
        const l2Contract = getContract({
          ...l2BridgeContractConfig,
          client: { public: publicClient, wallet: walletClient }
        });
        logger.debug("Reading delegation fee from bridge contract");
        const delegationFee = await publicClient.readContract({
          address: this.L2_BRIDGE_ADDRESS,
          abi: L2StandardBridgeAbi,
          functionName: "delegationFee"
        });
        logger.debug(`Delegation fee: ${delegationFee}`);
        if (!nativeTokenBridge) {
          logger.debug("Checking ERC20 allowance for L2 bridge");
          const allowance = await this.walletProvider.checkERC20Allowance(
            params.fromChain,
            params.fromToken,
            fromAddress,
            this.L2_BRIDGE_ADDRESS
          );
          logger.debug(`Current allowance: ${allowance}`);
          if (allowance < amount) {
            const neededAllowance = amount - allowance;
            logger.debug(`Increasing allowance by ${neededAllowance}`);
            const txHash = await this.walletProvider.approveERC20(
              params.fromChain,
              params.fromToken,
              this.L2_BRIDGE_ADDRESS,
              amount
            );
            logger.debug(`Approval transaction submitted with hash: ${txHash}`);
            await publicClient.waitForTransactionReceipt({
              hash: txHash
            });
            logger.debug("Approval transaction confirmed");
          } else {
            logger.debug("Sufficient allowance already granted");
          }
        }
        if (nativeTokenBridge) {
          logger.debug("Using withdraw for native token");
          const args = [this.LEGACY_ERC20_ETH, amount, 1, "0x"];
          const value = amount + delegationFee;
          logger.debug(`Simulating withdraw with value: ${value}`);
          await publicClient.simulateContract({
            address: l2Contract.address,
            abi: l2Contract.abi,
            functionName: "withdraw",
            args,
            account,
            value
          });
          logger.debug("Executing withdraw transaction");
          resp.txHash = await walletClient.writeContract({
            address: l2Contract.address,
            abi: l2Contract.abi,
            functionName: "withdraw",
            args,
            value,
            chain,
            account
          });
        } else {
          logger.debug("Using withdraw for non-native token");
          const args = [
            params.fromToken,
            amount,
            1,
            "0x"
          ];
          const value = delegationFee;
          logger.debug(`Simulating withdraw with delegationFee: ${value}`);
          await publicClient.simulateContract({
            address: l2Contract.address,
            abi: l2Contract.abi,
            functionName: "withdraw",
            args,
            account,
            value
          });
          logger.debug("Executing withdraw transaction");
          resp.txHash = await walletClient.writeContract({
            address: l2Contract.address,
            abi: l2Contract.abi,
            functionName: "withdraw",
            args,
            value,
            chain,
            account
          });
        }
      }
      logger.debug(`Bridge operation successful, txHash: ${resp.txHash}`);
      return resp;
    } catch (error) {
      logger.error("Error executing bridge operation:", error);
      const errorObj = error;
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
      throw error;
    }
  }
  /**
   * Validates and normalizes bridge parameters
   * 
   * @param params - The parameters to validate and normalize
   * @throws Error if parameters are invalid
   */
  async validateAndNormalizeParams(params) {
    logger.debug("Validating bridge params:", JSON.stringify(params, null, 2));
    if (!params.fromChain) {
      logger.debug("No source chain specified, defaulting to bsc");
      params.fromChain = "bsc";
    }
    if (!params.toChain) {
      logger.debug("No destination chain specified");
      throw new Error("Destination chain is required for bridging");
    }
    const isSupported = params.fromChain === "bsc" && params.toChain === "opBNB" || params.fromChain === "opBNB" && params.toChain === "bsc";
    if (!isSupported) {
      logger.error(`Unsupported bridge direction: ${params.fromChain} to ${params.toChain}`);
      throw new Error("Unsupported bridge direction. Currently only supporting: BSC \u2194 opBNB");
    }
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
    if (params.fromChain === "bsc" && params.toChain === "opBNB" && params.fromToken) {
      const isBnbToken = typeof params.fromToken === "string" && params.fromToken.toUpperCase() === "BNB";
      if (!isBnbToken) {
        if (!params.toToken) {
          logger.error("Missing destination token address for ERC20 bridge");
          throw new Error("When bridging ERC20 tokens from BSC to opBNB, the token address on opBNB is required");
        }
        if (typeof params.toToken === "string" && !params.toToken.startsWith("0x")) {
          logger.error(`Invalid token address format: ${params.toToken}`);
          throw new Error(`Invalid token address: ${params.toToken}. Please provide a 0x-prefixed address.`);
        }
      }
    }
    if (typeof params.fromToken === "string" && params.fromToken.toUpperCase() === "BNB") {
      logger.debug("Native token BNB specified, setting fromToken to undefined");
      params.fromToken = void 0;
    }
    if (params.toAddress) {
      if (!params.toAddress.startsWith("0x") || params.toAddress.length !== 42) {
        logger.error(`Invalid address format: ${params.toAddress}`);
        throw new Error(`Invalid destination address: ${params.toAddress}. Please provide a valid 0x-prefixed address.`);
      }
    }
    logger.debug("Validation passed for bridge params");
  }
};
var bridgeAction = {
  name: "BRIDGE_BNB",
  similes: [
    "CROSS_CHAIN_BNB",
    "TRANSFER_CROSS_CHAIN_BNB",
    "MOVE_CROSS_CHAIN_BNB",
    "L1_L2_TRANSFER_BNB"
  ],
  description: "Bridge tokens between BNB Smart Chain (BSC) and opBNB networks",
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Executing BRIDGE_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    const promptText = typeof message.content.text === "string" ? message.content.text.trim() : "";
    logger.debug(`Raw prompt text: "${promptText}"`);
    const promptLower = promptText.toLowerCase();
    const bridgeRegex = /(?:bridge|send|transfer|move)\s+([0-9.]+)\s+(?:bnb|token|([a-zA-Z0-9]+))\s+(?:from)?\s+(?:bsc|binance|opbnb|l1|l2)\s+(?:to)\s+(?:bsc|binance|opbnb|l1|l2)(?:\s+(?:to|address)\s+(0x[a-fA-F0-9]{40}))?/i;
    let directAmount = null;
    let directFromToken = null;
    let directFromChain = null;
    let directToChain = null;
    let directToAddress = null;
    const match = promptText.match(bridgeRegex);
    if (match) {
      directAmount = match[1] || null;
      directFromToken = match[2] || null;
      directToAddress = match[3] || null;
      logger.debug(`Directly extracted amount: ${directAmount}, token: ${directFromToken}, to address: ${directToAddress}`);
    }
    if (promptLower.includes("bsc to opbnb") || promptLower.includes("binance to opbnb") || promptLower.includes("l1 to l2")) {
      directFromChain = "bsc";
      directToChain = "opBNB";
      logger.debug("Detected BSC to opBNB direction from keywords");
    } else if (promptLower.includes("opbnb to bsc") || promptLower.includes("opbnb to binance") || promptLower.includes("l2 to l1")) {
      directFromChain = "opBNB";
      directToChain = "bsc";
      logger.debug("Detected opBNB to BSC direction from keywords");
    }
    const currentState = state ? state : await runtime.composeState(message);
    try {
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(
          runtime,
          message,
          currentState
        );
        logger.debug("Wallet info:", state.walletInfo);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
      callback?.({
        text: `Unable to access wallet: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
    const bridgePrompt = {
      template: bridgeTemplate,
      state: currentState
    };
    const mlOutput = await runtime.useModel(ModelType.LARGE, {
      prompt: JSON.stringify(bridgePrompt),
      responseFormat: { type: "json_object" }
    });
    let content = {};
    try {
      content = typeof mlOutput === "string" ? JSON.parse(mlOutput) : mlOutput;
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
    }
    logger.debug("Generated bridge content:", JSON.stringify(content, null, 2));
    let fromChain;
    let toChain;
    let fromToken;
    let toToken;
    let amount;
    let toAddress;
    if (directFromChain) {
      fromChain = directFromChain;
      logger.debug(`Using from chain directly extracted from prompt: ${fromChain}`);
    } else if (content.fromChain && typeof content.fromChain === "string") {
      fromChain = content.fromChain;
      logger.debug(`Using from chain from generated content: ${fromChain}`);
    } else {
      fromChain = "bsc";
      logger.debug(`No from chain detected, defaulting to ${fromChain}`);
    }
    if (directToChain) {
      toChain = directToChain;
      logger.debug(`Using to chain directly extracted from prompt: ${toChain}`);
    } else if (content.toChain && typeof content.toChain === "string") {
      toChain = content.toChain;
      logger.debug(`Using to chain from generated content: ${toChain}`);
    } else {
      toChain = fromChain === "bsc" ? "opBNB" : "bsc";
      logger.debug(`No to chain detected, defaulting to ${toChain}`);
    }
    if (directFromToken) {
      fromToken = directFromToken.toUpperCase();
      logger.debug(`Using from token directly extracted from prompt: ${fromToken}`);
    } else if (content.fromToken) {
      fromToken = convertNullStringToUndefined(content.fromToken);
      if (fromToken) {
        logger.debug(`Using from token from generated content: ${fromToken}`);
      } else {
        logger.debug("Content contained null/invalid fromToken, using undefined (native BNB)");
      }
    }
    if (content.toToken) {
      toToken = convertNullStringToUndefined(content.toToken);
      if (toToken) {
        logger.debug(`Using to token from generated content: ${toToken}`);
      } else {
        logger.debug("Content contained null/invalid toToken, using undefined");
      }
    }
    if (fromChain === "bsc" && fromToken && fromToken !== "BNB" && !toToken) {
      logger.error("Missing destination token address for ERC20 bridge");
      callback?.({
        text: "Cannot bridge ERC20 token from BSC to opBNB without destination token address. Please provide the token address on opBNB.",
        content: { error: "Missing destination token address" }
      });
      return false;
    }
    if (directToAddress?.startsWith("0x")) {
      toAddress = directToAddress;
      logger.debug(`Using to address directly extracted from prompt: ${toAddress}`);
    } else if (content.toAddress) {
      const addressValue = convertNullStringToUndefined(content.toAddress);
      if (addressValue?.startsWith("0x")) {
        toAddress = addressValue;
        logger.debug(`Using to address from generated content: ${toAddress}`);
      } else {
        logger.debug("Content contained null/invalid toAddress, using undefined");
      }
    }
    if (directAmount) {
      amount = directAmount;
      logger.debug(`Using amount directly extracted from prompt: ${amount}`);
    } else if (content.amount && (typeof content.amount === "string" || typeof content.amount === "number")) {
      amount = String(content.amount);
      logger.debug(`Using amount from generated content: ${amount}`);
    } else {
      amount = "0.001";
      logger.debug(`No amount detected, defaulting to ${amount}`);
    }
    const walletProvider = initWalletProvider(runtime);
    const action = new BridgeAction(walletProvider);
    let fromTokenAddress = void 0;
    if (fromToken?.startsWith("0x")) {
      fromTokenAddress = fromToken;
    }
    let toTokenAddress = void 0;
    if (toToken?.startsWith("0x")) {
      toTokenAddress = toToken;
    }
    const bridgeParams = {
      fromChain,
      toChain,
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      amount,
      toAddress
    };
    logger.debug("Final bridge params:", JSON.stringify(bridgeParams, null, 2));
    try {
      logger.debug("Calling bridge with params:", JSON.stringify(bridgeParams, null, 2));
      const bridgeResp = await action.bridge(bridgeParams);
      const explorer = EXPLORERS[bridgeResp.fromChain.toUpperCase()];
      const txExplorerUrl = explorer && bridgeResp.txHash ? `${explorer.url}/tx/${bridgeResp.txHash}` : null;
      const walletExplorerUrl = explorer && bridgeResp.recipient ? `${explorer.url}/address/${bridgeResp.recipient}` : null;
      const textResponse = `Successfully bridged ${bridgeResp.amount} ${bridgeResp.fromToken} from ${bridgeResp.fromChain} to ${bridgeResp.toChain}
Transaction Hash: ${bridgeResp.txHash}${txExplorerUrl ? `

View transaction: ${txExplorerUrl}` : ""}${walletExplorerUrl ? `
View wallet: ${walletExplorerUrl}` : ""}

Note: Bridge transactions may take 10-20 minutes to complete.`;
      callback?.({
        text: textResponse,
        content: {
          ...bridgeResp,
          txExplorerUrl,
          walletExplorerUrl
        }
      });
      return true;
    } catch (error) {
      const errorObj = error;
      logger.error("Error during bridge:", errorObj.message || String(error));
      try {
        logger.error("Full error details:", JSON.stringify(error, null, 2));
      } catch (e) {
        logger.error("Error object not serializable, logging properties individually:");
        if (errorObj && typeof errorObj === "object") {
          const errorAsRecord = Object.entries(errorObj).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
          for (const [key, value] of Object.entries(errorAsRecord)) {
            try {
              logger.error(`${key}:`, value);
            } catch (e2) {
              logger.error(`${key}: [Error serializing property]`);
            }
          }
        }
      }
      let errorMessage = errorObj.message || String(error);
      if (typeof errorMessage === "string") {
        if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for the bridge operation. Please check your balance and try with a smaller amount.";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transaction was rejected. Please try again if you want to proceed with the bridge operation.";
        } else if (errorMessage.includes("token address on opBNB is required")) {
          errorMessage = "When bridging ERC20 tokens from BSC to opBNB, you must specify the token address on opBNB.";
        } else if (errorMessage.includes("Unsupported bridge direction")) {
          errorMessage = "Only bridges between BSC and opBNB are supported. Valid directions are BSC\u2192opBNB and opBNB\u2192BSC.";
        }
      }
      callback?.({
        text: `Bridge failed: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Bridge 0.001 BNB from BSC to opBNB"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you bridge 0.001 BNB from BSC to opBNB",
          actions: ["BRIDGE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Send 0.001 BNB from opBNB back to BSC"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you bridge 0.001 BNB from opBNB to BSC",
          actions: ["BRIDGE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Bridge ERC20 token 0x1234... from BSC to opBNB. The destination token address is 0x5678..."
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you bridge your ERC20 token from BSC to opBNB",
          actions: ["BRIDGE_BNB"]
        }
      }
    ]
  ]
};
var StakeAction = class {
  /**
   * Creates a new StakeAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  LISTA_DAO = "0x1adB950d8bB3dA4bE104211D5AB038628e477fE6";
  SLIS_BNB = "0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B";
  /**
   * Execute a staking operation with the provided parameters
   * 
   * @param params - Stake parameters including chain, action, and optional amount
   * @returns Stake response with operation result
   * @throws Error if stake operation fails
   */
  async stake(params) {
    logger.debug("Starting stake action with params:", JSON.stringify(params, null, 2));
    this.validateStakeParams(params);
    logger.debug("After validation, stake params:", JSON.stringify(params, null, 2));
    logger.debug("Switching to BSC chain for staking");
    this.walletProvider.switchChain("bsc");
    logger.debug(`Using Lista DAO contract: ${this.LISTA_DAO}`);
    logger.debug(`Using slisBNB token contract: ${this.SLIS_BNB}`);
    const walletAddress = this.walletProvider.getAddress();
    logger.debug(`Wallet address: ${walletAddress}`);
    logger.debug(`Executing stake action: ${params.action}`);
    const actions = {
      deposit: async () => {
        if (!params.amount) {
          throw new Error("Amount is required for deposit");
        }
        logger.debug(`Depositing ${params.amount} BNB to Lista DAO`);
        return await this.doDeposit(params.amount);
      },
      withdraw: async () => {
        logger.debug(`Withdrawing ${params.amount || "all"} slisBNB from Lista DAO`);
        return await this.doWithdraw(params.amount);
      },
      claim: async () => {
        logger.debug("Claiming unlocked BNB from Lista DAO");
        return await this.doClaim();
      }
    };
    try {
      const resp = await actions[params.action]();
      logger.debug(`Stake action completed successfully: ${resp}`);
      const txHash = resp.includes("Transaction Hash:") ? resp.match(/Transaction Hash: (0x[a-fA-F0-9]{64})/)?.[1] : void 0;
      return {
        response: resp,
        txHash,
        action: params.action,
        amount: params.amount
      };
    } catch (error) {
      logger.error(`Error executing stake action ${params.action}:`, error);
      throw error;
    }
  }
  /**
   * Validates and normalizes stake parameters
   * 
   * @param params - The parameters to validate and normalize
   * @throws Error if parameters are invalid
   */
  validateStakeParams(params) {
    logger.debug(`Validating stake params: chain=${params.chain}, action=${params.action}, amount=${params.amount}`);
    if (!params.chain) {
      logger.debug("No chain specified, defaulting to bsc");
      params.chain = "bsc";
    } else if (params.chain !== "bsc") {
      logger.error(`Unsupported chain for staking: ${params.chain}`);
      throw new Error("Only BSC mainnet is supported for staking");
    }
    if (!params.action) {
      logger.error("No action specified for staking");
      throw new Error("Action is required for staking. Use 'deposit', 'withdraw', or 'claim'");
    }
    const validActions = ["deposit", "withdraw", "claim"];
    if (!validActions.includes(params.action)) {
      logger.error(`Invalid staking action: ${params.action}`);
      throw new Error(`Invalid staking action: ${params.action}. Valid actions are: ${validActions.join(", ")}`);
    }
    if (params.action === "deposit" && !params.amount) {
      logger.error("Amount is required for deposit");
      throw new Error("Amount is required for deposit");
    }
    if (params.action === "withdraw" && !params.amount) {
      logger.debug("No amount specified for withdraw, will withdraw all slisBNB");
    }
    if (params.amount) {
      try {
        const amountValue = Number.parseFloat(params.amount);
        if (Number.isNaN(amountValue) || amountValue <= 0) {
          logger.error(`Invalid amount: ${params.amount} (must be a positive number)`);
          throw new Error(`Invalid amount: ${params.amount}. Please provide a positive number.`);
        }
        logger.debug(`Amount validation passed: ${params.amount}`);
      } catch (error) {
        logger.error(`Failed to parse amount: ${params.amount}`, error);
        throw new Error(`Invalid amount format: ${params.amount}. Please provide a valid number.`);
      }
    }
  }
  /**
   * Deposits BNB into Lista DAO
   * 
   * @param amount - Amount of BNB to deposit
   * @returns Success message with transaction details
   * @throws Error if deposit fails
   */
  async doDeposit(amount) {
    logger.debug(`Starting deposit of ${amount} BNB to Lista DAO`);
    const publicClient = this.walletProvider.getPublicClient("bsc");
    const walletClient = this.walletProvider.getWalletClient("bsc");
    const account = walletClient.account;
    if (!account) {
      logger.error("Wallet account not found");
      throw new Error("Wallet account not found");
    }
    logger.debug(`Using account address: ${account.address}`);
    logger.debug(`Preparing to deposit ${amount} BNB with parseEther value: ${parseEther(amount)}`);
    try {
      logger.debug("Simulating deposit transaction");
      const { request } = await publicClient.simulateContract({
        account: this.walletProvider.getAccount(),
        address: this.LISTA_DAO,
        abi: ListaDaoAbi,
        functionName: "deposit",
        value: parseEther(amount)
      });
      logger.debug("Executing deposit transaction");
      const txHash = await walletClient.writeContract(request);
      logger.debug(`Deposit transaction submitted with hash: ${txHash}`);
      logger.debug("Waiting for transaction confirmation");
      await publicClient.waitForTransactionReceipt({
        hash: txHash
      });
      logger.debug(`Transaction confirmed: ${txHash}`);
      logger.debug("Checking updated slisBNB balance");
      const slisBNBBalance = await publicClient.readContract({
        address: this.SLIS_BNB,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address]
      });
      const formattedBalance = formatEther(slisBNBBalance);
      logger.debug(`Updated slisBNB balance: ${formattedBalance}`);
      return `Successfully deposited ${amount} BNB. You now hold ${formattedBalance} slisBNB. 
Transaction Hash: ${txHash}`;
    } catch (error) {
      logger.error("Error during deposit operation:", error);
      const errorObj = error;
      const errorMessage = errorObj.message || String(error);
      if (errorMessage.includes("insufficient funds")) {
        throw new Error(`Insufficient funds to deposit ${amount} BNB. Please check your balance.`);
      }
      if (errorMessage.includes("user rejected")) {
        throw new Error("Transaction rejected by user.");
      }
      throw error;
    }
  }
  /**
   * Withdraws slisBNB from Lista DAO
   * 
   * @param amount - Optional amount of slisBNB to withdraw (if undefined, withdraws all)
   * @returns Success message with transaction details
   * @throws Error if withdrawal fails
   */
  async doWithdraw(amount) {
    logger.debug(`Starting withdraw of ${amount || "all"} slisBNB from Lista DAO`);
    const publicClient = this.walletProvider.getPublicClient("bsc");
    const walletClient = this.walletProvider.getWalletClient("bsc");
    const account = walletClient.account;
    if (!account) {
      logger.error("Wallet account not found");
      throw new Error("Wallet account not found");
    }
    logger.debug(`Using account address: ${account.address}`);
    try {
      let amountToWithdraw;
      if (!amount) {
        logger.debug("No amount specified, checking total slisBNB balance");
        amountToWithdraw = await publicClient.readContract({
          address: this.SLIS_BNB,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [account.address]
        });
        logger.debug(`Total slisBNB balance to withdraw: ${formatEther(amountToWithdraw)}`);
      } else {
        amountToWithdraw = parseEther(amount);
        logger.debug(`Withdrawing specific amount: ${amount} slisBNB (${amountToWithdraw} wei)`);
      }
      if (amountToWithdraw <= 0n) {
        logger.error(`No slisBNB to withdraw (amount: ${formatEther(amountToWithdraw)})`);
        throw new Error("No slisBNB tokens available to withdraw");
      }
      logger.debug("Checking slisBNB allowance for Lista DAO contract");
      const allowance = await this.walletProvider.checkERC20Allowance(
        "bsc",
        this.SLIS_BNB,
        account.address,
        this.LISTA_DAO
      );
      logger.debug(`Current allowance: ${formatEther(allowance)}`);
      if (allowance < amountToWithdraw) {
        const neededAllowance = amountToWithdraw - allowance;
        logger.debug(`Increasing slisBNB allowance by ${formatEther(neededAllowance)}`);
        const txHash2 = await this.walletProvider.approveERC20(
          "bsc",
          this.SLIS_BNB,
          this.LISTA_DAO,
          amountToWithdraw
        );
        logger.debug(`Allowance approval transaction submitted with hash: ${txHash2}`);
        await publicClient.waitForTransactionReceipt({
          hash: txHash2
        });
        logger.debug("Allowance approval transaction confirmed");
      } else {
        logger.debug("Sufficient allowance already granted");
      }
      logger.debug("Simulating withdraw request transaction");
      const { request } = await publicClient.simulateContract({
        account: this.walletProvider.getAccount(),
        address: this.LISTA_DAO,
        abi: ListaDaoAbi,
        functionName: "requestWithdraw",
        args: [amountToWithdraw]
      });
      logger.debug("Executing withdraw request transaction");
      const txHash = await walletClient.writeContract(request);
      logger.debug(`Withdraw request transaction submitted with hash: ${txHash}`);
      logger.debug("Waiting for transaction confirmation");
      await publicClient.waitForTransactionReceipt({
        hash: txHash
      });
      logger.debug(`Transaction confirmed: ${txHash}`);
      logger.debug("Checking remaining slisBNB balance");
      const slisBNBBalance = await publicClient.readContract({
        address: this.SLIS_BNB,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address]
      });
      const formattedBalance = formatEther(slisBNBBalance);
      logger.debug(`Remaining slisBNB balance: ${formattedBalance}`);
      return `Successfully requested withdrawal of ${amount || formatEther(amountToWithdraw)} slisBNB. You have ${formattedBalance} slisBNB left. 
You can claim your BNB in 7-14 days using the 'claim' action.
Transaction Hash: ${txHash}`;
    } catch (error) {
      logger.error("Error during withdraw operation:", error);
      const errorObj = error;
      const errorMessage = errorObj.message || String(error);
      if (errorMessage.includes("insufficient funds") || errorMessage.includes("insufficient balance")) {
        throw new Error("Insufficient slisBNB balance to withdraw. Please check your balance.");
      }
      if (errorMessage.includes("user rejected")) {
        throw new Error("Transaction rejected by user.");
      }
      throw error;
    }
  }
  /**
   * Claims unlocked BNB from previous withdrawals
   * 
   * @returns Success message with amount claimed
   * @throws Error if claim fails
   */
  async doClaim() {
    logger.debug("Starting claim operation for unlocked BNB from Lista DAO");
    const publicClient = this.walletProvider.getPublicClient("bsc");
    const walletClient = this.walletProvider.getWalletClient("bsc");
    const account = walletClient.account;
    if (!account) {
      logger.error("Wallet account not found");
      throw new Error("Wallet account not found");
    }
    logger.debug(`Using account address: ${account.address}`);
    try {
      logger.debug("Fetching user withdrawal requests");
      const requests = await publicClient.readContract({
        address: this.LISTA_DAO,
        abi: ListaDaoAbi,
        functionName: "getUserWithdrawalRequests",
        args: [account.address]
      });
      logger.debug(`Found ${requests.length} withdrawal requests`);
      if (requests.length === 0) {
        logger.warn("No withdrawal requests found for claiming");
        return `No withdrawal requests found to claim. You need to request a withdrawal first using the 'withdraw' action.`;
      }
      let totalClaimed = 0n;
      let claimedCount = 0;
      let lastTxHash = "";
      for (let idx = 0; idx < requests.length; idx++) {
        logger.debug(`Checking request #${idx} status`);
        const [isClaimable, amount] = await publicClient.readContract({
          address: this.LISTA_DAO,
          abi: ListaDaoAbi,
          functionName: "getUserRequestStatus",
          args: [account.address, BigInt(idx)]
        });
        if (isClaimable) {
          logger.debug(`Request #${idx} is claimable, amount: ${formatEther(amount)} BNB`);
          logger.debug(`Simulating claim transaction for request #${idx}`);
          const { request } = await publicClient.simulateContract({
            account: this.walletProvider.getAccount(),
            address: this.LISTA_DAO,
            abi: ListaDaoAbi,
            functionName: "claimWithdraw",
            args: [BigInt(idx)]
          });
          logger.debug(`Executing claim transaction for request #${idx}`);
          const txHash = await walletClient.writeContract(request);
          logger.debug(`Claim transaction submitted with hash: ${txHash}`);
          logger.debug("Waiting for transaction confirmation");
          await publicClient.waitForTransactionReceipt({
            hash: txHash
          });
          logger.debug(`Transaction confirmed: ${txHash}`);
          totalClaimed += amount;
          claimedCount++;
          lastTxHash = txHash;
        } else {
          logger.debug(`Request #${idx} is not claimable yet, skipping`);
          break;
        }
      }
      const formattedTotal = formatEther(totalClaimed);
      logger.debug(`Total claimed: ${formattedTotal} BNB from ${claimedCount} requests`);
      if (claimedCount === 0) {
        return "No claimable withdrawals found. Withdrawal requests typically need 7-14 days to become claimable.";
      }
      return `Successfully claimed ${formattedTotal} BNB from ${claimedCount} withdrawal request(s).
Transaction Hash: ${lastTxHash}`;
    } catch (error) {
      logger.error("Error during claim operation:", error);
      const errorObj = error;
      const errorMessage = errorObj.message || String(error);
      if (errorMessage.includes("user rejected")) {
        throw new Error("Transaction rejected by user.");
      }
      throw error;
    }
  }
};
var stakeAction = {
  name: "STAKE_BNB",
  similes: [
    "DELEGATE_BNB",
    "DEPOSIT_BNB",
    "UNDELEGATE_BNB",
    "UNSTAKE_BNB",
    "WITHDRAW_BNB",
    "CLAIM_BNB"
  ],
  description: "Stake BNB, withdraw staked tokens, or claim rewards from Lista DAO on BNB Smart Chain",
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Executing STAKE_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    const promptText = typeof message.content.text === "string" ? message.content.text.trim() : "";
    logger.debug(`Raw prompt text: "${promptText}"`);
    const promptLower = promptText.toLowerCase();
    const stakeRegex = /(?:stake|deposit)\s+([0-9.]+)\s+(?:bnb|slisBNB)\s+(?:on|in|to|at)?(?:\s+lista\s+dao)?(?:\s+on)?\s+(?:bsc|binance)/i;
    const withdrawRegex = /(?:withdraw|unstake|undelegate)\s+([0-9.]+)\s+(?:bnb|slisBNB)\s+(?:from|on)?\s+(?:lista\s+dao)?(?:\s+on)?\s+(?:bsc|binance)/i;
    const claimRegex = /claim\s+(?:bnb|unlocked\s+bnb|rewards?)(?:\s+from)?\s+(?:lista\s+dao)?(?:\s+on)?\s+(?:bsc|binance)/i;
    let directAction = null;
    let directAmount = null;
    let match = promptText.match(stakeRegex);
    if (match && match.length >= 2) {
      directAction = "deposit";
      directAmount = match[1] || null;
      logger.debug(`Directly extracted deposit action - Amount: ${directAmount}`);
    } else {
      match = promptText.match(withdrawRegex);
      if (match && match.length >= 2) {
        directAction = "withdraw";
        directAmount = match[1] || null;
        logger.debug(`Directly extracted withdraw action - Amount: ${directAmount}`);
      } else {
        match = promptText.match(claimRegex);
        if (match) {
          directAction = "claim";
          logger.debug("Directly extracted claim action");
        }
      }
    }
    if (!directAction) {
      if (promptLower.includes("stake") || promptLower.includes("deposit")) {
        directAction = "deposit";
        logger.debug("Detected stake/deposit action from keywords");
      } else if (promptLower.includes("withdraw") || promptLower.includes("unstake") || promptLower.includes("undelegate")) {
        directAction = "withdraw";
        logger.debug("Detected withdraw/unstake action from keywords");
      } else if (promptLower.includes("claim")) {
        directAction = "claim";
        logger.debug("Detected claim action from keywords");
      }
    }
    if (!directAmount && directAction !== "claim") {
      const amountRegex = /([0-9]+(?:\.[0-9]+)?)/;
      const amountMatch = promptText.match(amountRegex);
      if (amountMatch && amountMatch.length >= 2) {
        directAmount = amountMatch[1] || null;
        logger.debug(`Extracted amount from prompt: ${directAmount}`);
      }
    }
    const promptAnalysis = {
      directAction,
      directAmount,
      containsBNB: promptLower.includes("bnb"),
      containsListaDAO: promptLower.includes("lista") || promptLower.includes("dao"),
      containsBSC: promptLower.includes("bsc") || promptLower.includes("binance")
    };
    logger.debug("Prompt analysis result:", promptAnalysis);
    if (!(message.content.source === "direct" || message.content.source === "client_chat:user")) {
      logger.warn("Stake rejected: invalid source:", message.content.source);
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Stake not allowed" }
      });
      return false;
    }
    logger.debug("Source validation passed");
    const currentState = state ? state : await runtime.composeState(message);
    try {
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(
          runtime,
          message,
          currentState
        );
        logger.debug("Wallet info:", state.walletInfo);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
      callback?.({
        text: `Unable to access wallet: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
    const stakePrompt = {
      template: stakeTemplate,
      state: currentState
    };
    const mlOutput = await runtime.useModel(ModelType.LARGE, {
      prompt: JSON.stringify(stakePrompt),
      responseFormat: { type: "json_object" }
    });
    let content = {};
    try {
      content = typeof mlOutput === "string" ? JSON.parse(mlOutput) : mlOutput;
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
    }
    logger.debug("Generated stake content:", JSON.stringify(content, null, 2));
    let stakeAction2;
    let amount;
    if (directAction) {
      stakeAction2 = directAction;
      logger.debug(`Using action directly extracted from prompt: ${stakeAction2}`);
    } else if (content.action && typeof content.action === "string") {
      stakeAction2 = content.action;
      logger.debug(`Using action from generated content: ${stakeAction2}`);
    } else {
      stakeAction2 = "deposit";
      logger.debug("No action detected, defaulting to deposit");
    }
    if (stakeAction2 !== "claim") {
      if (directAmount) {
        amount = directAmount;
        logger.debug(`Using amount directly extracted from prompt: ${amount}`);
      } else if (content.amount && (typeof content.amount === "string" || typeof content.amount === "number")) {
        amount = String(content.amount);
        logger.debug(`Using amount from generated content: ${amount}`);
      } else if (stakeAction2 === "deposit") {
        amount = "0.001";
        logger.debug(`No amount detected for deposit, defaulting to ${amount}`);
      }
    }
    const walletProvider = initWalletProvider(runtime);
    const action = new StakeAction(walletProvider);
    const paramOptions = {
      chain: "bsc",
      // Only BSC is supported for staking
      action: stakeAction2,
      amount
    };
    logger.debug("Final stake options:", JSON.stringify(paramOptions, null, 2));
    try {
      logger.debug("Calling stake with params:", JSON.stringify(paramOptions, null, 2));
      const stakeResp = await action.stake(paramOptions);
      let txExplorerUrl = void 0;
      let walletExplorerUrl = void 0;
      if (stakeResp.txHash) {
        const explorerInfo = EXPLORERS.BSC;
        txExplorerUrl = `${explorerInfo.url}/tx/${stakeResp.txHash}`;
        walletExplorerUrl = `${explorerInfo.url}/address/${walletProvider.getAddress()}`;
        logger.debug(`Transaction explorer URL: ${txExplorerUrl}`);
        logger.debug(`Wallet explorer URL: ${walletExplorerUrl}`);
      }
      const textResponse = `${stakeResp.response}${txExplorerUrl ? `

View transaction: ${txExplorerUrl}` : ""}${walletExplorerUrl ? `
View wallet: ${walletExplorerUrl}` : ""}`;
      callback?.({
        text: textResponse,
        content: {
          ...stakeResp,
          txExplorerUrl,
          walletExplorerUrl
        }
      });
      return true;
    } catch (error) {
      const errorObj = error;
      logger.error("Error during stake:", errorObj.message || String(error));
      try {
        logger.error("Full error details:", JSON.stringify(error, null, 2));
      } catch (e) {
        logger.error("Error object not serializable, logging properties individually:");
        if (errorObj && typeof errorObj === "object") {
          const errorAsRecord = Object.entries(errorObj).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
          for (const [key, value] of Object.entries(errorAsRecord)) {
            try {
              logger.error(`${key}:`, value);
            } catch (e2) {
              logger.error(`${key}: [Error serializing property]`);
            }
          }
        }
      }
      let errorMessage = errorObj.message || String(error);
      if (typeof errorMessage === "string") {
        if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for the stake operation. Please check your balance and try with a smaller amount.";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transaction was rejected. Please try again if you want to proceed with the stake operation.";
        } else if (errorMessage.includes("No withdrawal requests")) {
          errorMessage = "No withdrawal requests found to claim. You need to request a withdrawal first using the 'withdraw' action.";
        }
      }
      callback?.({
        text: `Stake failed: ${errorMessage}`,
        content: {
          error: errorMessage,
          action: paramOptions.action,
          amount: paramOptions.amount
        }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Stake 0.001 BNB on BSC"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you stake 0.001 BNB to Lista DAO on BSC",
          actions: ["STAKE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Deposit 0.001 BNB to Lista DAO"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you deposit 0.001 BNB to Lista DAO on BSC",
          actions: ["STAKE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Undelegate 0.001 slisBNB on BSC"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you undelegate 0.001 slisBNB from Lista DAO on BSC",
          actions: ["STAKE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Withdraw 0.001 slisBNB from Lista DAO"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you withdraw 0.001 slisBNB from Lista DAO on BSC",
          actions: ["STAKE_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Claim unlocked BNB from Lista DAO"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you claim unlocked BNB from Lista DAO on BSC",
          actions: ["STAKE_BNB"]
        }
      }
    ]
  ]
};
var FaucetAction = class {
  /**
   * Creates a new FaucetAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  /**
   * List of supported test tokens available from the faucet
   */
  SUPPORTED_TOKENS = [
    "BNB",
    "BTC",
    "BUSD",
    "DAI",
    "ETH",
    "USDC"
  ];
  /**
   * WebSocket URL for the BSC Testnet faucet API
   */
  FAUCET_URL = "wss://testnet.bnbchain.org/faucet-smart/api";
  /**
   * Request test tokens from the BSC Testnet faucet
   * 
   * @param params - Parameters for the faucet request including token and recipient address
   * @returns Promise resolving to faucet response with transaction details
   * @throws Error if faucet request fails
   */
  async faucet(params) {
    logger.debug("Faucet params:", JSON.stringify(params, null, 2));
    try {
      await this.validateAndNormalizeParams(params);
      logger.debug("Normalized faucet params:", JSON.stringify(params, null, 2));
      if (!params.token) {
        params.token = "BNB";
        logger.debug("No token specified, defaulting to BNB");
      }
      if (!params.toAddress) {
        params.toAddress = this.walletProvider.getAddress();
        logger.debug(`No address specified, using wallet address: ${params.toAddress}`);
      }
      const resp = {
        token: params.token,
        recipient: params.toAddress,
        txHash: "0x"
      };
      const options = {
        headers: {
          Connection: "Upgrade",
          Upgrade: "websocket"
        }
      };
      const ws = new WebSocket(this.FAUCET_URL, options);
      try {
        await new Promise((resolve, reject) => {
          ws.once("open", () => resolve());
          ws.once("error", reject);
        });
        const message = {
          tier: 0,
          url: params.toAddress,
          symbol: params.token,
          captcha: "noCaptchaToken"
        };
        logger.debug(`Sending faucet request: ${JSON.stringify(message, null, 2)}`);
        ws.send(JSON.stringify(message));
        const txHash = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error("Faucet request timeout"));
          }, 15e3);
          ws.on("message", (data) => {
            const response = JSON.parse(data.toString());
            logger.debug(`Faucet response: ${JSON.stringify(response, null, 2)}`);
            if (response.success) {
              logger.debug("Faucet request accepted");
              return;
            }
            if (response.requests?.length > 0) {
              const hash = response.requests[0].tx.hash;
              if (hash) {
                clearTimeout(timeout);
                logger.debug(`Faucet transaction hash received: ${hash}`);
                const formattedHash = hash.startsWith("0x") ? hash : `0x${hash}`;
                resolve(formattedHash);
              }
            }
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
    } catch (error) {
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
  async validateAndNormalizeParams(params) {
    logger.debug("Validating faucet params:", JSON.stringify(params, null, 2));
    try {
      if (!params.token) {
        params.token = "BNB";
        logger.debug("No token specified, defaulting to BNB");
      }
      if (!this.SUPPORTED_TOKENS.includes(params.token)) {
        throw new Error(`Unsupported token: ${params.token}. Supported tokens are: ${this.SUPPORTED_TOKENS.join(", ")}`);
      }
      if (!params.toAddress) {
        params.toAddress = this.walletProvider.getAddress();
        logger.debug(`No address provided, using wallet address: ${params.toAddress}`);
        return;
      }
      if (typeof params.toAddress === "string" && params.toAddress.startsWith("0x") && params.toAddress.length === 42) {
        logger.debug(`Using provided hex address: ${params.toAddress}`);
        return;
      }
      try {
        params.toAddress = await this.walletProvider.formatAddress(params.toAddress);
        logger.debug(`Successfully formatted address to: ${params.toAddress}`);
      } catch (error) {
        logger.error(`Error formatting address: ${error instanceof Error ? error.message : String(error)}`);
        params.toAddress = this.walletProvider.getAddress();
        logger.debug(`Falling back to wallet address: ${params.toAddress}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error in validateAndNormalizeParams: ${errorMessage}`);
      throw error;
    }
    logger.debug("Normalized faucet params:", JSON.stringify(params, null, 2));
  }
};
var faucetAction = {
  name: "FAUCET_BNB",
  similes: ["GET_TEST_TOKENS_BNB", "TEST_TOKENS_BNB", "TESTNET_TOKENS_BNB"],
  description: "Get test tokens from the BSC Testnet faucet (BNB, BUSD, DAI, USDC, etc.)",
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Executing FAUCET_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    const currentState = state ? state : await runtime.composeState(message);
    try {
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(runtime, message, currentState);
        logger.debug("Wallet info:", JSON.stringify(state.walletInfo, null, 2));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
      callback?.({
        text: `Unable to access wallet: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
    const templateData = {
      template: faucetTemplate,
      state: currentState
    };
    logger.debug("Template data sent to model:", JSON.stringify(templateData, null, 2));
    const mlOutput = await runtime.useModel(ModelType.LARGE, {
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    logger.debug("Raw model output:", mlOutput);
    let content = {};
    try {
      let jsonStr = mlOutput;
      if (typeof mlOutput === "string") {
        const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = mlOutput.match(jsonRegex);
        if (match?.[1]) {
          jsonStr = match[1];
          logger.debug("Extracted JSON from markdown:", jsonStr);
        }
        content = JSON.parse(jsonStr);
      } else {
        content = mlOutput;
      }
      logger.debug("Parsed faucet content:", JSON.stringify(content, null, 2));
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", error instanceof Error ? error.message : String(error));
      logger.error("Raw output that failed parsing:", mlOutput);
      callback?.({
        text: "Failed to process faucet request parameters. Please try again with a clearer request.",
        content: { error: "Invalid model output format" }
      });
      return false;
    }
    const walletProvider = initWalletProvider(runtime);
    const action = new FaucetAction(walletProvider);
    const faucetParams = {
      token: typeof content.token === "string" ? content.token : "BNB",
      toAddress: typeof content.toAddress === "string" && content.toAddress ? content.toAddress : walletProvider.getAddress()
    };
    logger.debug("Final faucet parameters:", JSON.stringify(faucetParams, null, 2));
    try {
      logger.debug(`Requesting ${faucetParams.token} tokens for address ${faucetParams.toAddress}`);
      const faucetResponse = await action.faucet(faucetParams);
      const blockExplorerUrl = `${EXPLORERS.BSC_TESTNET.url}/tx/${faucetResponse.txHash}`;
      logger.debug(`Block explorer URL: ${blockExplorerUrl}`);
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
          blockExplorerUrl
        }
      });
      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error during faucet request:", errorObj.message);
      let errorMessage = errorObj.message;
      if (errorMessage.includes("Invalid address")) {
        errorMessage = "Failed to validate address. Please provide a valid BSC address.";
      } else if (errorMessage.includes("Unsupported token")) ; else if (errorMessage.includes("WebSocket")) {
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
        }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Get some USDC from the testnet faucet"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll request some test USDC tokens from the BSC Testnet faucet for you",
          actions: ["FAUCET_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need some test BNB for development"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you get some test BNB tokens from the BSC Testnet faucet",
          actions: ["FAUCET_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you send some testnet tokens to 0x1234567890AbCdEf1234567890AbCdEf12345678?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll request test BNB tokens from the faucet to be sent to that address",
          actions: ["FAUCET_BNB"]
        }
      }
    ]
  ]
};
var require2 = createRequire(import.meta.url);
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var baseDir = path.resolve(__dirname, "../../plugin-bnb/src/contracts");
function getContractSource(contractPath) {
  logger.debug(`Reading contract source from ${contractPath}`);
  return fs.readFileSync(contractPath, "utf8");
}
function findImports(importPath) {
  try {
    logger.debug(`Resolving import: ${importPath}`);
    if (importPath.startsWith("@openzeppelin/")) {
      const modPath = require2.resolve(importPath);
      return { contents: fs.readFileSync(modPath, "utf8") };
    }
    const localPath = path.resolve("./contracts", importPath);
    if (fs.existsSync(localPath)) {
      return { contents: fs.readFileSync(localPath, "utf8") };
    }
    return { error: "File not found" };
  } catch {
    return { error: `File not found: ${importPath}` };
  }
}
async function compileSolidity(contractFileName) {
  const contractPath = path.join(baseDir, `${contractFileName}.sol`);
  logger.debug(`Compiling contract from path: ${contractPath}`);
  const source = getContractSource(contractPath);
  const input = {
    language: "Solidity",
    sources: {
      [contractFileName]: {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["*"]
        }
      }
    }
  };
  logger.debug("Compiling contract...");
  try {
    const outputString = solc2.compile(JSON.stringify(input), { import: findImports });
    const output = JSON.parse(outputString);
    if (output.errors) {
      const hasError = output.errors.some(
        (error) => error.type === "Error"
      );
      if (hasError) {
        throw new Error(
          `Compilation errors: ${JSON.stringify(output.errors, null, 2)}`
        );
      }
      logger.warn("Compilation warnings:", output.errors);
    }
    const contractName = path.basename(contractFileName, ".sol");
    const contract = output.contracts?.[contractFileName]?.[contractName];
    if (!contract) {
      throw new Error("Contract compilation result is empty");
    }
    logger.debug("Contract compiled successfully");
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Compilation failed:", error.message);
    } else {
      logger.error("Compilation failed with unknown error");
    }
    throw error;
  }
}

// src/actions/deploy.ts
var DeployAction = class {
  /**
   * Creates a new DeployAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  /**
   * Compiles a Solidity contract
   * 
   * @param contractName - Name of the contract to compile
   * @param source - Solidity source code
   * @returns The compiled contract ABI and bytecode
   * @throws Error if compilation fails
   */
  async compileSolidity(contractName, source) {
    logger.debug(`Compiling Solidity contract: ${contractName}`);
    logger.debug(`Source code length: ${source.length} characters`);
    const solName = `${contractName}.sol`;
    const input = {
      language: "Solidity",
      sources: {
        [solName]: {
          content: source
        }
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"]
          }
        }
      }
    };
    logger.debug("Preparing to compile contract...");
    logger.debug(`Solc version: ${typeof solc2 === "function" ? "function" : typeof solc2 === "object" ? "object" : "unknown"}`);
    logger.debug(`Solc properties: ${Object.keys(solc2).join(", ")}`);
    try {
      logger.debug("Calling solc.compile method...");
      const outputString = solc2.compile(JSON.stringify(input));
      logger.debug(`Compilation output string length: ${outputString ? outputString.length : "null or undefined"}`);
      logger.debug("Parsing compilation output as JSON...");
      const output = JSON.parse(outputString);
      logger.debug("Compilation completed, checking for errors...");
      if (output.errors) {
        logger.debug(`Found ${output.errors.length} compilation messages`);
        const errors = output.errors;
        const hasError = errors.some((error) => error.type === "Error");
        if (hasError) {
          logger.error("Compilation errors:", JSON.stringify(errors, null, 2));
          const errorMessages = errors.map(
            (e) => e.formattedMessage || e.message
          ).join("\n");
          throw new Error(`Contract compilation failed: ${errorMessages}`);
        }
        logger.warn("Compilation warnings:", JSON.stringify(errors, null, 2));
      } else {
        logger.debug("No compilation errors or warnings found");
      }
      logger.debug(`Checking for contract in output at ${solName}.${contractName}`);
      const contract = output.contracts[solName][contractName];
      if (!contract) {
        logger.error(`Compilation result is empty for ${contractName}`);
        logger.error(`Available contracts: ${Object.keys(output.contracts).join(", ")}`);
        logger.error(`Available items in ${solName}: ${output.contracts[solName] ? Object.keys(output.contracts[solName]).join(", ") : "none"}`);
        throw new Error(`Compilation result is empty for ${contractName}`);
      }
      logger.debug(`Contract ${contractName} compiled successfully`);
      logger.debug(`ABI items count: ${contract.abi ? contract.abi.length : "null"}`);
      logger.debug(`Bytecode length: ${contract.evm.bytecode.object ? contract.evm.bytecode.object.length : "null"}`);
      return {
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error compiling contract ${contractName}:`, errorMessage);
      if (error instanceof Error && error.stack) {
        logger.error(`Error stack trace: ${error.stack}`);
      }
      logger.error(`Error type: ${error instanceof Error ? "Error object" : typeof error}`);
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
  async deployERC20(deployTokenParams) {
    logger.debug("Deploying ERC20 token with params:", JSON.stringify(deployTokenParams, null, 2));
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
      logger.debug(
        "Contract constructor arguments:",
        args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg)
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
        address: contractAddress
      };
    } catch (error) {
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
  async deployERC721(deployNftParams) {
    logger.debug("Deploying ERC721 NFT with params:", JSON.stringify(deployNftParams, null, 2));
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
        address: contractAddress
      };
    } catch (error) {
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
  async deployERC1155(deploy1155Params) {
    logger.debug("Deploying ERC1155 token with params:", JSON.stringify(deploy1155Params, null, 2));
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
        address: contractAddress
      };
    } catch (error) {
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
  async deployContract(chain, contractName, args) {
    logger.debug(`Starting contract deployment process for ${contractName} on chain ${chain}`);
    const safeArgs = args.map(
      (arg) => typeof arg === "bigint" ? arg.toString() : arg
    );
    logger.debug("Constructor arguments:", safeArgs);
    try {
      logger.debug(`Compiling ${contractName}...`);
      logger.debug("Current working directory:", process.cwd());
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
      const publicClient = this.walletProvider.getPublicClient(chain);
      logger.debug("Submitting deployment transaction...");
      logger.debug("Bytecode type:", typeof bytecode);
      logger.debug(`Bytecode starts with: ${bytecode.substring(0, 20)}...`);
      const hash = await walletClient.deployContract({
        account,
        abi,
        bytecode,
        args,
        chain: chainConfig
      });
      logger.debug(`Deployment transaction submitted with hash: ${hash}`);
      logger.debug("Waiting for deployment transaction confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash
      });
      if (receipt.status === "success") {
        logger.debug(`Contract deployed successfully at address: ${receipt.contractAddress}`);
        const safeReceipt2 = {
          ...receipt,
          gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : void 0,
          effectiveGasPrice: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : void 0
        };
        logger.debug("Transaction details: gas used", safeReceipt2.gasUsed, "effective gas price", safeReceipt2.effectiveGasPrice);
        return receipt.contractAddress;
      }
      logger.error(`Deployment transaction failed with status: ${receipt.status}`);
      const safeReceipt = JSON.stringify(
        receipt,
        (key, value) => typeof value === "bigint" ? value.toString() : value
      );
      logger.error("Transaction receipt:", safeReceipt);
      throw new Error("Contract deployment transaction failed");
    } catch (error) {
      logger.error(`Error deploying contract ${contractName}:`, error);
      let errorDetails;
      try {
        errorDetails = JSON.stringify(
          error,
          (key, value) => typeof value === "bigint" ? value.toString() : value
        );
        logger.error("Error details:", errorDetails);
      } catch (e) {
        logger.error("Error could not be stringified, logging properties individually");
        if (error && typeof error === "object") {
          for (const key in error) {
            try {
              const value = error[key];
              logger.error(`${key}:`, typeof value === "bigint" ? value.toString() : value);
            } catch (innerError) {
              logger.error(`${key}: [Error accessing property]`);
            }
          }
        }
      }
      if (error instanceof Error) {
        logger.error("Error stack:", error.stack || "No stack trace available");
        if (error.message.includes("insufficient funds")) {
          throw new Error("Insufficient funds to deploy the contract. Please check your balance.");
        }
        if (error.message.includes("user rejected")) {
          throw new Error("Transaction rejected by user.");
        }
        if (error.message.includes("cannot serialize BigInt")) {
          throw new Error("Error processing large numbers in deployment. This is a technical issue being addressed.");
        }
      }
      throw error;
    }
  }
};
var deployAction = {
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
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Executing DEPLOY_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    const promptText = typeof message.content.text === "string" ? message.content.text.trim() : "";
    logger.debug(`Raw prompt text: "${promptText}"`);
    const promptLower = promptText.toLowerCase();
    const erc20Regex = /(?:deploy|create)\s+(?:an?\s+)?(?:erc20|token)(?:\s+token)?\s+(?:with|having|named)?\s+(?:name\s+['"]?([^'"]+)['"]?|['"]?([^'"]+)['"]?\s+token)/i;
    const erc721Regex = /(?:deploy|create)\s+(?:an?\s+)?(?:erc721|nft)(?:\s+token)?\s+(?:with|having|named)?\s+(?:name\s+['"]?([^'"]+)['"]?|['"]?([^'"]+)['"]?\s+nft)/i;
    const erc1155Regex = /(?:deploy|create)\s+(?:an?\s+)?(?:erc1155|multi-token)(?:\s+token)?\s+(?:with|having|named)?\s+(?:name\s+['"]?([^'"]+)['"]?|['"]?([^'"]+)['"]?\s+token)/i;
    const symbolRegex = /symbol\s+['"]?([^'"]+)['"]?/i;
    const decimalsRegex = /decimals\s+([0-9]+)/i;
    const totalSupplyRegex = /(?:total\s+supply|supply)\s+([0-9]+(?:\.[0-9]+)?(?:\s*[kmbt])?)/i;
    const baseURIRegex = /(?:base\s*uri|baseuri|uri)\s+['"]?(https?:\/\/[^'"]+)['"]?/i;
    let directContractType = null;
    let directName = null;
    let directSymbol = null;
    let directDecimals = null;
    let directTotalSupply = null;
    let directBaseURI = null;
    let directChain = null;
    let match = promptText.match(erc20Regex);
    if (match) {
      directContractType = "erc20";
      directName = match[1] || match[2] || null;
      logger.debug(`Detected ERC20 token deployment with name: ${directName}`);
    }
    if (!directContractType) {
      match = promptText.match(erc721Regex);
      if (match) {
        directContractType = "erc721";
        directName = match[1] || match[2] || null;
        logger.debug(`Detected ERC721 NFT deployment with name: ${directName}`);
      }
    }
    if (!directContractType) {
      match = promptText.match(erc1155Regex);
      if (match) {
        directContractType = "erc1155";
        directName = match[1] || match[2] || null;
        logger.debug(`Detected ERC1155 token deployment with name: ${directName}`);
      }
    }
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
    match = promptText.match(symbolRegex);
    if (match && match.length >= 2) {
      directSymbol = match[1]?.trim() || "";
      logger.debug(`Extracted token symbol: ${directSymbol}`);
    }
    match = promptText.match(decimalsRegex);
    if (match && match.length >= 2) {
      directDecimals = Number.parseInt(match[1] ?? "0", 10);
      logger.debug(`Extracted token decimals: ${directDecimals}`);
    }
    match = promptText.match(totalSupplyRegex);
    if (match && match.length >= 2) {
      directTotalSupply = match[1]?.trim() || "";
      if (directTotalSupply.endsWith("k") || directTotalSupply.endsWith("K")) {
        directTotalSupply = (Number.parseFloat(directTotalSupply) * 1e3).toString();
      } else if (directTotalSupply.endsWith("m") || directTotalSupply.endsWith("M")) {
        directTotalSupply = (Number.parseFloat(directTotalSupply) * 1e6).toString();
      } else if (directTotalSupply.endsWith("b") || directTotalSupply.endsWith("B")) {
        directTotalSupply = (Number.parseFloat(directTotalSupply) * 1e9).toString();
      } else if (directTotalSupply.endsWith("t") || directTotalSupply.endsWith("T")) {
        directTotalSupply = (Number.parseFloat(directTotalSupply) * 1e12).toString();
      }
      logger.debug(`Extracted token total supply: ${directTotalSupply}`);
    }
    match = promptText.match(baseURIRegex);
    if (match && match.length >= 2) {
      directBaseURI = match[1]?.trim() || "";
      logger.debug(`Extracted token baseURI: ${directBaseURI}`);
    }
    if (promptLower.includes("bsc") || promptLower.includes("binance")) {
      directChain = "bsc";
      logger.debug("Detected BSC chain from prompt");
    } else if (promptLower.includes("opbnb") || promptLower.includes("op bnb")) {
      directChain = "opBNB";
      logger.debug("Detected opBNB chain from prompt");
    }
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
    const currentState = state ? state : await runtime.composeState(message);
    try {
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(runtime, message, currentState);
        logger.debug("Wallet info:", state.walletInfo);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
      callback?.({
        text: `Unable to access wallet: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
    const templateData = {
      template: ercContractTemplate,
      state: currentState
    };
    const mlOutput = await runtime.useModel(ModelType.LARGE, {
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    let content = {};
    try {
      content = typeof mlOutput === "string" ? JSON.parse(mlOutput) : mlOutput;
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
    }
    logger.debug("Generated contract content:", JSON.stringify(content, null, 2));
    let contractType;
    if (directContractType) {
      contractType = directContractType;
      logger.debug(`Using contract type directly extracted from prompt: ${contractType}`);
    } else if (content.contractType && typeof content.contractType === "string") {
      contractType = content.contractType.toLowerCase();
      logger.debug(`Using contract type from generated content: ${contractType}`);
    } else {
      contractType = "erc20";
      logger.debug(`No contract type detected, defaulting to ${contractType}`);
    }
    let chain = "bsc";
    if (directChain) {
      chain = directChain;
      logger.debug(`Using chain directly extracted from prompt: ${chain}`);
    } else if (content.chain && typeof content.chain === "string") {
      chain = content.chain;
      logger.debug(`Using chain from generated content: ${chain}`);
    } else {
      logger.debug(`No chain detected, defaulting to ${chain}`);
    }
    logger.debug("Initializing wallet provider...");
    const walletProvider = initWalletProvider(runtime);
    const action = new DeployAction(walletProvider);
    try {
      logger.debug(`Starting deployment process for ${contractType.toUpperCase()} contract on ${chain}...`);
      let result;
      switch (contractType.toLowerCase()) {
        case "erc20": {
          const name = directName || content?.name || "DefaultToken";
          const symbol = directSymbol || content?.symbol || "DTK";
          const decimals = directDecimals || content?.decimals || 18;
          const totalSupply = directTotalSupply || content?.totalSupply || "1000000";
          logger.debug(`Deploying ERC20 with params: name=${name}, symbol=${symbol}, decimals=${decimals}, totalSupply=${totalSupply}`);
          result = await action.deployERC20({
            chain,
            decimals,
            symbol,
            name,
            totalSupply
          });
          break;
        }
        case "erc721": {
          const nftName = directName || content?.name || "DefaultNFT";
          const nftSymbol = directSymbol || content?.symbol || "DNFT";
          const nftBaseURI = directBaseURI || content?.baseURI || "https://example.com/token/";
          logger.debug(`Deploying ERC721 with params: name=${nftName}, symbol=${nftSymbol}, baseURI=${nftBaseURI}`);
          result = await action.deployERC721({
            chain,
            name: nftName,
            symbol: nftSymbol,
            baseURI: nftBaseURI
          });
          break;
        }
        case "erc1155": {
          const multiName = directName || content?.name || "DefaultMultiToken";
          const multiBaseURI = directBaseURI || content?.baseURI || "https://example.com/multi-token/";
          logger.debug(`Deploying ERC1155 with params: name=${multiName}, baseURI=${multiBaseURI}`);
          result = await action.deployERC1155({
            chain,
            name: multiName,
            baseURI: multiBaseURI
          });
          break;
        }
        default:
          logger.error(`Unsupported contract type: ${contractType}`);
          throw new Error(`Unsupported contract type: ${contractType}. Supported types are: erc20, erc721, erc1155`);
      }
      if (result?.address) {
        logger.debug(`Contract deployed successfully at address: ${result.address}`);
        const explorer = EXPLORERS[chain.toUpperCase()];
        const contractExplorerUrl = explorer ? `${explorer.url}/address/${result.address}` : null;
        const contractTypeName = contractType.toUpperCase();
        const chainName = chain === "bsc" ? "Binance Smart Chain" : "opBNB";
        const textResponse = `Successfully deployed ${contractTypeName} contract on ${chainName} at address: ${result.address}${contractExplorerUrl ? `

View contract: ${contractExplorerUrl}` : ""}

You can now interact with this contract using other BNB actions!`;
        callback?.({
          text: textResponse,
          content: {
            ...result,
            contractType,
            chain,
            contractExplorerUrl
          }
        });
        return true;
      }
      logger.error("Contract deployment failed - no address returned");
      callback?.({
        text: "Contract deployment failed",
        content: { error: "No contract address returned" }
      });
      return false;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error during contract deployment:", errorObj.message);
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
        }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Deploy an ERC20 token with name 'autofun10', symbol 'AFUND', decimals 18, total supply 10000"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you deploy an ERC20 token on BNB Smart Chain",
          actions: ["DEPLOY_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Deploy an ERC721 NFT contract with name 'MyNFT', symbol 'MNFT', baseURI 'https://my-nft-base-uri.com'"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you deploy an ERC721 NFT on BNB Smart Chain",
          actions: ["DEPLOY_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Deploy an ERC1155 contract with name 'My1155', baseURI 'https://my-1155-base-uri.com'"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you deploy an ERC1155 token on BNB Smart Chain",
          actions: ["DEPLOY_BNB"]
        }
      }
    ]
  ]
};

// src/abi/CrossChainAbi.ts
var CROSS_CHAIN_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        indexed: true,
        internalType: "address",
        name: "contractAddr",
        type: "address"
      }
    ],
    name: "AddChannel",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint32",
        name: "srcChainId",
        type: "uint32"
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "dstChainId",
        type: "uint32"
      },
      {
        indexed: true,
        internalType: "uint64",
        name: "oracleSequence",
        type: "uint64"
      },
      {
        indexed: true,
        internalType: "uint64",
        name: "packageSequence",
        type: "uint64"
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "payload",
        type: "bytes"
      }
    ],
    name: "CrossChainPackage",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isEnable",
        type: "bool"
      }
    ],
    name: "EnableOrDisableChannel",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8"
      }
    ],
    name: "Initialized",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "value",
        type: "bytes"
      }
    ],
    name: "ParamChange",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "proposalTypeHash",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "address",
        name: "proposer",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "quorum",
        type: "uint128"
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "expiredAt",
        type: "uint128"
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "contentHash",
        type: "bytes32"
      }
    ],
    name: "ProposalSubmitted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "packageType",
        type: "uint8"
      },
      {
        indexed: true,
        internalType: "uint64",
        name: "packageSequence",
        type: "uint64"
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      }
    ],
    name: "ReceivedPackage",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "executor",
        type: "address"
      }
    ],
    name: "Reopened",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "executor",
        type: "address"
      }
    ],
    name: "Suspended",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "contractAddr",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "lowLevelData",
        type: "bytes"
      }
    ],
    name: "UnexpectedFailureAssertionInPackageHandler",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "contractAddr",
        type: "address"
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string"
      }
    ],
    name: "UnexpectedRevertInPackageHandler",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint64",
        name: "packageSequence",
        type: "uint64"
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "payload",
        type: "bytes"
      }
    ],
    name: "UnsupportedPackage",
    type: "event"
  },
  {
    inputs: [],
    name: "ACK_PACKAGE",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "CANCEL_TRANSFER_PROPOSAL",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "CODE_OK",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "CROSS_CHAIN",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "EMERGENCY_PROPOSAL_EXPIRE_PERIOD",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "EMPTY_CONTENT_HASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "ERROR_FAIL_DECODE",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "FAIL_ACK_PACKAGE",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "GOV_CHANNELID",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "GOV_HUB",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "IN_TURN_RELAYER_VALIDITY_PERIOD",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "LIGHT_CLIENT",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "OUT_TURN_RELAYER_BACKOFF_PERIOD",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "PROXY_ADMIN",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "RELAYER_HUB",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "REOPEN_PROPOSAL",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "SUSPEND_PROPOSAL",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "SYN_PACKAGE",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TOKEN_HUB",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TRANSFER_IN_CHANNEL_ID",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TRANSFER_OUT_CHANNEL_ID",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "batchSizeForOracle",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "callbackGasPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "attacker",
        type: "address"
      }
    ],
    name: "cancelTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "chainId",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    name: "channelHandlerMap",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    name: "channelReceiveSequenceMap",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    name: "channelSendSequenceMap",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    name: "emergencyProposals",
    outputs: [
      {
        internalType: "uint16",
        name: "quorum",
        type: "uint16"
      },
      {
        internalType: "uint128",
        name: "expiredAt",
        type: "uint128"
      },
      {
        internalType: "bytes32",
        name: "contentHash",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "packageType",
        type: "uint8"
      },
      {
        internalType: "uint256",
        name: "_relayFee",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_ackRelayFee",
        type: "uint256"
      },
      {
        internalType: "bytes",
        name: "msgBytes",
        type: "bytes"
      }
    ],
    name: "encodePayload",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getRelayFees",
    outputs: [
      {
        internalType: "uint256",
        name: "_relayFee",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_minAckRelayFee",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "gnfdChainId",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_payload",
        type: "bytes"
      },
      {
        internalType: "bytes",
        name: "_blsSignature",
        type: "bytes"
      },
      {
        internalType: "uint256",
        name: "_validatorsBitSet",
        type: "uint256"
      }
    ],
    name: "handlePackage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "_gnfdChainId",
        type: "uint16"
      }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "isSuspended",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "minAckRelayFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "oracleSequence",
    outputs: [
      {
        internalType: "int64",
        name: "",
        type: "int64"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "previousTxHeight",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    name: "quorumMap",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      },
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    name: "registeredContractChannelMap",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "relayFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "reopen",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        internalType: "bytes",
        name: "msgBytes",
        type: "bytes"
      },
      {
        internalType: "uint256",
        name: "_relayFee",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_ackRelayFee",
        type: "uint256"
      }
    ],
    name: "sendSynPackage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "suspend",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "txCounter",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "key",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "value",
        type: "bytes"
      }
    ],
    name: "updateParam",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "upgradeInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "version",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "name",
        type: "string"
      },
      {
        internalType: "string",
        name: "description",
        type: "string"
      }
    ],
    stateMutability: "pure",
    type: "function"
  }
];

// src/abi/TokenHubAbi.ts
var TOKENHUB_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8"
      }
    ],
    name: "Initialized",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "value",
        type: "bytes"
      }
    ],
    name: "ParamChange",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "ReceiveTransferIn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "refundAddr",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "status",
        type: "uint32"
      }
    ],
    name: "RefundFailure",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "refundAddr",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "status",
        type: "uint32"
      }
    ],
    name: "RefundSuccess",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "RewardTo",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "refundAddr",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "TransferInSuccess",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "senderAddr",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "relayFee",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "ackRelayFee",
        type: "uint256"
      }
    ],
    name: "TransferOutSuccess",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "msgBytes",
        type: "bytes"
      }
    ],
    name: "UnexpectedPackage",
    type: "event"
  },
  {
    inputs: [],
    name: "APP_CHANNELID",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "CODE_OK",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "CROSS_CHAIN",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "ERROR_FAIL_DECODE",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "GOV_CHANNELID",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "GOV_HUB",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "LIGHT_CLIENT",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MAX_GAS_FOR_TRANSFER_BNB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "PROXY_ADMIN",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "RELAYER_HUB",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "REWARD_UPPER_LIMIT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TOKEN_HUB",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TRANSFER_IN_CHANNELID",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TRANSFER_IN_FAILURE_INSUFFICIENT_BALANCE",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TRANSFER_IN_FAILURE_NON_PAYABLE_RECIPIENT",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TRANSFER_IN_FAILURE_UNKNOWN",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TRANSFER_IN_SUCCESS",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "TRANSFER_OUT_CHANNELID",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "claimRelayFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "govHub",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        internalType: "bytes",
        name: "msgBytes",
        type: "bytes"
      }
    ],
    name: "handleAckPackage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        internalType: "bytes",
        name: "msgBytes",
        type: "bytes"
      }
    ],
    name: "handleFailAckPackage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "channelId",
        type: "uint8"
      },
      {
        internalType: "bytes",
        name: "msgBytes",
        type: "bytes"
      }
    ],
    name: "handleSynPackage",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "transferOut",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    stateMutability: "payable",
    type: "receive"
  }
];
var require3 = createRequire$1(import.meta.url);
var { Client } = require3("@bnb-chain/greenfield-js-sdk");
var getGnfdConfig = async (runtime) => {
  const network = runtime.getSetting("GREENFIELD_NETWORK");
  const config = network === "TESTNET" ? CONFIG["TESTNET"] : CONFIG["MAINNET"];
  return config;
};
var InitGnfdClient = async (runtime) => {
  const config = await getGnfdConfig(runtime);
  if (!config.GREENFIELD_CHAIN_ID || !config.GREENFIELD_RPC_URL) {
    throw new Error("Creating greenfield client params is error");
  }
  const client = Client.create(
    config.GREENFIELD_RPC_URL,
    config.GREENFIELD_CHAIN_ID
  );
  return client;
};
var CONFIG = {
  MAINNET: {
    NETWORK: "MAINNET",
    TOKENHUB_ADDRESS: "0xeA97dF87E6c7F68C9f95A69dA79E19B834823F25",
    CROSSCHAIN_ADDRESS: "0x77e719b714be09F70D484AB81F70D02B0E182f7d",
    GREENFIELD_RPC_URL: "https://greenfield-chain.bnbchain.org",
    GREENFIELD_CHAIN_ID: "1017",
    GREENFIELD_SCAN: "https://greenfieldscan.com"
  },
  TESTNET: {
    NETWORK: "TESTNET",
    TOKENHUB_ADDRESS: "0xED8e5C546F84442219A5a987EE1D820698528E04",
    CROSSCHAIN_ADDRESS: "0xa5B2c9194131A4E0BFaCbF9E5D6722c873159cb7",
    GREENFIELD_RPC_URL: "https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org",
    GREENFIELD_CHAIN_ID: "5600",
    GREENFIELD_SCAN: "https://testnet.greenfieldscan.com"
  }
};

// src/actions/gnfd.ts
var require4 = createRequire(import.meta.url);
var {
  Client: Client2,
  Long,
  VisibilityType
} = require4("@bnb-chain/greenfield-js-sdk");
var GreenfieldAction = class {
  /**
   * Creates a new GreenfieldAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   * @param gnfdClient - Greenfield client for blockchain interactions
   */
  constructor(walletProvider, gnfdClient) {
    this.walletProvider = walletProvider;
    this.gnfdClient = gnfdClient;
  }
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
  async selectSp(runtime) {
    let finalSps = await this.getSps();
    const config = await getGnfdConfig(runtime);
    if (config.NETWORK === "TESTNET") {
      const filteredSps = finalSps.filter(
        (sp) => sp.endpoint.includes("nodereal") || sp.endpoint.includes("bnbchain")
      );
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
      ...finalSps.slice(selectIndex + 1)
    ].map((item) => item.operatorAddress);
    const selectSpInfo = {
      id: finalSps[selectIndex].id,
      endpoint: finalSps[selectIndex].endpoint,
      primarySpAddress: finalSps[selectIndex]?.operatorAddress,
      sealAddress: finalSps[selectIndex].sealAddress,
      secondarySpAddresses
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
  async bnbTransferToGnfd(amount, runtime) {
    const config = await getGnfdConfig(runtime);
    logger.debug(`Starting cross-chain transfer of ${amount.toString()} wei to Greenfield`);
    const chain = config.NETWORK === "TESTNET" ? "bscTestnet" : "bsc";
    logger.debug(`Using chain: ${chain}`);
    this.walletProvider.switchChain(chain);
    const publicClient = this.walletProvider.getPublicClient(chain);
    const walletClient = this.walletProvider.getWalletClient(chain);
    try {
      const contractParams = {
        address: config.CROSSCHAIN_ADDRESS,
        abi: CROSS_CHAIN_ABI,
        functionName: "getRelayFees"
      };
      const result = await publicClient.readContract(contractParams);
      const relayFee = result[0];
      const ackRelayFee = result[1];
      logger.debug(`Received relay fees from contract - base: ${relayFee.toString()}, ack: ${ackRelayFee.toString()}`);
      const relayerFee = relayFee + ackRelayFee;
      const totalAmount = relayerFee + amount;
      logger.debug(`Total amount for transaction (including fees): ${totalAmount.toString()}`);
      logger.debug("Simulating transferOut contract call...");
      const { request } = await publicClient.simulateContract({
        account: this.walletProvider.getAccount(),
        address: config.TOKENHUB_ADDRESS,
        abi: TOKENHUB_ABI,
        functionName: "transferOut",
        args: [this.walletProvider.getAddress(), amount],
        value: totalAmount
      });
      logger.debug("Submitting transaction...");
      const hash = await walletClient.writeContract(request);
      logger.debug(`Transaction submitted with hash: ${hash}`);
      logger.debug("Waiting for transaction confirmation...");
      const tx = await publicClient.waitForTransactionReceipt({
        hash
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
  async createBucket(msg) {
    logger.debug("Creating bucket...");
    const createBucketTx = await this.gnfdClient.bucket.createBucket(msg);
    const createBucketTxSimulateInfo = await createBucketTx.simulate({
      denom: "BNB"
    });
    const createBucketTxRes = await createBucketTx.broadcast({
      denom: "BNB",
      gasLimit: Number(createBucketTxSimulateInfo?.gasLimit),
      gasPrice: createBucketTxSimulateInfo?.gasPrice || "5000000000",
      payer: msg.paymentAddress,
      granter: "",
      privateKey: this.walletProvider.getPk()
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
  async headBucket(bucketName) {
    const { bucketInfo } = await this.gnfdClient.bucket.headBucket(bucketName);
    return bucketInfo.id;
  }
  /**
   * Upload an object to a Greenfield bucket
   * 
   * @param msg - Upload object message parameters
   * @returns Result message from the upload operation
   */
  async uploadObject(msg) {
    logger.debug("Starting uploadObject action");
    const uploadRes = await this.gnfdClient.object.delegateUploadObject(
      msg,
      {
        type: "ECDSA",
        privateKey: this.walletProvider.getPk()
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
  async headObject(bucketName, objectName) {
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
  async deleteObject(msg) {
    const deleteObjectTx = await this.gnfdClient.object.deleteObject(msg);
    const simulateInfo = await deleteObjectTx.simulate({
      denom: "BNB"
    });
    const res = await deleteObjectTx.broadcast({
      denom: "BNB",
      gasLimit: Number(simulateInfo?.gasLimit),
      gasPrice: simulateInfo?.gasPrice || "5000000000",
      payer: msg.operator,
      granter: "",
      privateKey: this.walletProvider.getPk()
    });
    if (res.code === 0) {
      logger.info("Delete object success");
    }
    return res.transactionHash;
  }
};
function toHex(n) {
  return `0x${Number(n).toString(16).padStart(64, "0")}`;
}
var greenfieldAction = {
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
  description: "Manage storage on BNB Greenfield blockchain - create buckets, upload files/images/documents, list buckets, delete objects, and perform cross-chain transfers",
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Starting GREENFIELD_BNB action");
    logger.debug("=== MESSAGE STRUCTURE DEBUGGING ===");
    logger.debug(`Message type: ${typeof message}`);
    logger.debug(`Message keys: ${Object.keys(message).join(", ")}`);
    logger.debug(`Content type: ${typeof message.content}`);
    if (message.content) {
      logger.debug(`Content keys: ${Object.keys(message.content).join(", ")}`);
    }
    try {
      logger.debug("Raw message content:");
      logger.debug(JSON.stringify(message, null, 2));
    } catch (error) {
      logger.debug("Could not stringify full message:", error);
    }
    if (message.content && "attachments" in message.content) {
      logger.debug("=== ATTACHMENTS DEBUGGING ===");
      const attachments = message.content.attachments;
      logger.debug(`Attachments exists: ${!!attachments}`);
      logger.debug(`Attachments type: ${typeof attachments}`);
      if (Array.isArray(attachments)) {
        logger.debug(`Attachments count: ${attachments.length}`);
        attachments.forEach((attachment, i) => {
          logger.debug(`--- Attachment #${i + 1} ---`);
          logger.debug(`Type: ${typeof attachment}`);
          const attachmentObj = attachment;
          const keys = Object.keys(attachmentObj);
          logger.debug(`Keys: ${keys.join(", ")}`);
          logger.debug(`attachment.type: ${attachmentObj.type || "undefined"}`);
          logger.debug(`attachment.url: ${attachmentObj.url || "undefined"}`);
          logger.debug(`attachment.name: ${attachmentObj.name || "undefined"}`);
          logger.debug(`attachment.path: ${attachmentObj.path || "undefined"}`);
          logger.debug(`attachment.content exists: ${!!attachmentObj.content}`);
          logger.debug(`attachment.base64 exists: ${!!attachmentObj.base64}`);
          logger.debug(`attachment.data exists: ${!!attachmentObj.data}`);
          logger.debug(`attachment.contentType: ${attachmentObj.contentType || "undefined"}`);
          keys.forEach((key) => {
            const value = attachmentObj[key];
            if (typeof value === "object" && value !== null) {
              logger.debug(`Nested object found in attachment.${key}`);
              logger.debug(`Keys: ${Object.keys(value).join(", ")}`);
            }
          });
          try {
            const safeAttachment = { ...attachmentObj };
            if ("content" in safeAttachment) safeAttachment.content = "[CONTENT REMOVED FOR LOGGING]";
            if ("base64" in safeAttachment) safeAttachment.base64 = "[BASE64 REMOVED FOR LOGGING]";
            if ("data" in safeAttachment) safeAttachment.data = "[DATA REMOVED FOR LOGGING]";
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
    const currentState = state ? state : await runtime.composeState(message);
    const templateData = {
      template: greenfieldTemplate,
      state: currentState
    };
    logger.debug("Generating Greenfield parameters using model");
    const mlOutput = await runtime.useModel(ModelType.LARGE, {
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    let content;
    try {
      let jsonString = typeof mlOutput === "string" ? mlOutput : JSON.stringify(mlOutput);
      if (typeof jsonString === "string") {
        const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = jsonString.match(jsonRegex);
        if (match?.[1]) {
          jsonString = match[1];
          logger.debug("Extracted JSON from markdown code block");
        }
        jsonString = jsonString.trim();
      }
      content = JSON.parse(jsonString);
      logger.debug("Generated Greenfield parameters:", JSON.stringify(content, null, 2));
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
      logger.debug("Attempting to extract parameters with regex as fallback");
      const promptText = typeof message.content.text === "string" ? message.content.text : "";
      const initializeRequested = promptText.toLowerCase().includes("initialize") || promptText.toLowerCase().includes("init") || promptText.toLowerCase().includes("setup account");
      const bucketNameRegex = /bucket(?:\s+called|\s+named)?\s+['"]([^'"]+)['"]/i;
      const bucketMatch = promptText.match(bucketNameRegex);
      const objectNameRegex = /(?:upload|file|object|document|image)(?:\s+called|\s+named)?\s+['"]([^'"]+)['"]/i;
      const objectMatch = promptText.match(objectNameRegex);
      const extractedObjectName = objectMatch && objectMatch.length > 1 ? objectMatch[1] : null;
      let actionType = "createBucket";
      if (promptText.toLowerCase().includes("upload") || promptText.toLowerCase().includes("save file") || promptText.toLowerCase().includes("store file") || promptText.toLowerCase().includes("put file")) {
        actionType = "uploadObject";
      } else if (promptText.toLowerCase().includes("delete")) {
        actionType = "deleteObject";
      } else if (promptText.toLowerCase().includes("transfer") || promptText.toLowerCase().includes("send bnb")) {
        actionType = "crossChainTransfer";
      }
      let filePath = null;
      if (actionType === "uploadObject") {
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
          filePath,
          // Add initialization flag
          initializeAccount: initializeRequested
        };
        logger.debug("Extracted parameters with regex:", JSON.stringify(content, null, 2));
      } else {
        callback?.({
          text: "Failed to process Greenfield parameters. Please try again with a more specific request.",
          content: { error: "Invalid model output format and unable to extract parameters" }
        });
        return false;
      }
    }
    const initializeAccount = content.initializeAccount === true || typeof content.initializeAccount === "string" && content.initializeAccount.toLowerCase() === "true";
    try {
      const config = await getGnfdConfig(runtime);
      const gnfdClient = await InitGnfdClient(runtime);
      const walletProvider = initWalletProvider(runtime);
      const action = new GreenfieldAction(walletProvider, gnfdClient);
      let actionType = content.actionType;
      logger.debug(`Original action type: ${actionType}`);
      const address = walletProvider.getAddress();
      logger.debug(`Using wallet address: ${address}`);
      let accountInitialized = true;
      let accountCheckError = null;
      try {
        await gnfdClient.account.getAccount(address);
        logger.debug("Account is already initialized on Greenfield");
      } catch (error) {
        accountInitialized = false;
        accountCheckError = error;
        logger.debug("Account not initialized on Greenfield:", error);
      }
      if (!accountInitialized && (initializeAccount || actionType !== "crossChainTransfer")) {
        logger.info("Account needs initialization, performing cross-chain transfer");
        const originalActionType = actionType;
        actionType = "crossChainTransfer";
        try {
          const initAmount = parseEther("0.001");
          logger.debug(`Initializing account with ${initAmount.toString()} wei`);
          const txHash = await action.bnbTransferToGnfd(initAmount, runtime);
          logger.debug(`Initialization transaction hash: ${txHash}`);
          const explorerUrl = `${config.NETWORK === "TESTNET" ? "https://testnet.bscscan.com" : "https://bscscan.com"}/tx/${txHash}`;
          logger.debug("Waiting for account to be initialized on Greenfield...");
          callback?.({
            text: "Your account initialization is in progress. This process may take 30-60 seconds to complete. I'll proceed once your account is ready.",
            content: {
              status: "initializing",
              message: "Waiting for account initialization to complete",
              txHash
            }
          });
          const checkAccountInitialized = async (address2, maxRetries = 10) => {
            logger.debug(`Checking if account ${address2} is initialized on Greenfield...`);
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                logger.debug(`Initialization check attempt ${attempt}/${maxRetries}`);
                await gnfdClient.account.getAccount(address2);
                logger.debug("Account successfully initialized on Greenfield!");
                return true;
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger.debug(`Account not yet initialized (attempt ${attempt}/${maxRetries}): ${errorMsg}`);
                if (attempt < maxRetries) {
                  const waitTime = 5e3 + attempt * 2e3;
                  logger.debug(`Waiting ${waitTime / 1e3} seconds before next check...`);
                  await new Promise((resolve) => setTimeout(resolve, waitTime));
                } else {
                  logger.warn("Maximum initialization check attempts reached. Account might not be properly initialized.");
                  return false;
                }
              }
            }
            return false;
          };
          const isInitialized = await checkAccountInitialized(address);
          if (!isInitialized) {
            logger.warn("Account initialization may not have completed successfully");
            callback?.({
              text: `\u26A0\uFE0F ACCOUNT INITIALIZATION PENDING

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
          actionType = originalActionType;
          logger.debug(`Account successfully initialized, resuming original action: ${actionType}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error("Failed to initialize account:", errorMessage);
          callback?.({
            text: `\u274C ACCOUNT INITIALIZATION FAILED

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
      try {
        const spInfo = await action.selectSp(runtime);
        logger.debug("Selected storage provider:", spInfo);
        const bucketName = content.bucketName;
        const objectName = content.objectName;
        const attachments = message.content.attachments;
        if (actionType === "crossChainTransfer" && !bucketName) {
          const amount = content.amount ? String(content.amount) : "0.001";
          const txAmount = content.amount ? parseEther(String(content.amount)) : parseEther("0.001");
          logger.debug(`Performing standalone cross-chain transfer of ${amount} BNB`);
          const transactionHash2 = await action.bnbTransferToGnfd(txAmount, runtime);
          logger.debug(`Transfer transaction hash: ${transactionHash2}`);
          const resourceUrl2 = `${config.NETWORK === "TESTNET" ? "https://testnet.bscscan.com" : "https://bscscan.com"}/tx/${transactionHash2}`;
          const textResponse2 = `\u2705 BNB TRANSFERRED TO GREENFIELD

Amount: ${amount} BNB
Transaction Hash: ${transactionHash2}

Links:
\u2022 View Transaction: ${resourceUrl2}
\u2022 Your Greenfield Account: ${config.GREENFIELD_SCAN}/account/${address}

Note: Cross-chain transfers typically take 30-60 seconds to complete.`;
          callback?.({
            text: textResponse2,
            content: {
              success: true,
              actionType: "crossChainTransfer",
              amount,
              transactionHash: transactionHash2,
              resourceUrl: resourceUrl2,
              walletAddress: address
            }
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
        logger.debug(`Executing action type: ${actionType}`);
        switch (actionType) {
          case "createBucket": {
            logger.debug(`Creating bucket: ${bucketName}`);
            const msg = {
              bucketName,
              creator: walletProvider.account.address,
              visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
              chargedReadQuota: Long.fromString("0"),
              paymentAddress: walletProvider.account.address,
              primarySpAddress: spInfo.primarySpAddress
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
            let fileToUpload;
            let uploadObjName = "unnamed-file";
            logger.debug(`Processing upload request for bucket: ${bucketName}`);
            const filePath = content.filePath;
            if (filePath) {
              logger.debug(`Using file path from message: ${filePath}`);
              try {
                const stats = statSync(filePath);
                if (stats.isFile()) {
                  const fileName = filePath.split("/").pop() || "unnamed-file";
                  const fileExtension = extname(filePath);
                  const fileType = lookup(fileExtension) || "application/octet-stream";
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
            if (!fileToUpload) {
              logger.debug("Checking for attachments in message content");
              if (message.content.attachments && message.content.attachments.length > 0) {
                logger.debug(`Found ${message.content.attachments.length} attachments`);
                for (const rawAttachment of message.content.attachments) {
                  try {
                    const attachment = rawAttachment;
                    logger.debug(`Processing attachment with keys: ${Object.keys(attachment).join(", ")}`);
                    if (attachment.url && typeof attachment.url === "string") {
                      logger.debug(`Found attachment with URL: ${attachment.url}`);
                      try {
                        const filePath2 = attachment.url.replace("/agent/agent/", "/agent/");
                        const stats = statSync(filePath2);
                        if (stats.isFile()) {
                          const fileContent = readFileSync(filePath2);
                          const fileName = attachment.name || filePath2.split("/").pop() || "unnamed-file";
                          const fileExtension = extname(fileName);
                          const fileType = lookup(fileExtension) || "application/octet-stream";
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
                    if ((attachment.data || attachment.content) && !fileToUpload) {
                      logger.debug("Found attachment with data/content property");
                      let binaryData;
                      if (attachment.data) {
                        if (Buffer.isBuffer(attachment.data)) {
                          binaryData = attachment.data;
                        } else if (typeof attachment.data === "string") {
                          binaryData = Buffer.from(attachment.data);
                        } else {
                          logger.debug(`Attachment data is not in a usable format: ${typeof attachment.data}`);
                          continue;
                        }
                      } else if (attachment.content) {
                        if (Buffer.isBuffer(attachment.content)) {
                          binaryData = attachment.content;
                        } else if (typeof attachment.content === "string") {
                          binaryData = Buffer.from(attachment.content);
                        } else {
                          logger.debug(`Attachment content is not in a usable format: ${typeof attachment.content}`);
                          continue;
                        }
                      } else {
                        continue;
                      }
                      const fileName = attachment.name || attachment.filename || "file.dat";
                      const fileType = attachment.type || attachment.contentType || lookup(extname(fileName)) || "application/octet-stream";
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
                    if (attachment.base64 && typeof attachment.base64 === "string" && !fileToUpload) {
                      logger.debug("Found attachment with base64 property");
                      const binaryData = Buffer.from(attachment.base64, "base64");
                      const fileName = attachment.name || "file.dat";
                      const fileType = attachment.type || lookup(extname(fileName)) || "application/octet-stream";
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
            if (!fileToUpload) {
              logger.debug("Checking for sample file as fallback");
              const sampleFiles = [
                "./README.md",
                "./package.json",
                "../README.md"
              ];
              for (const sample of sampleFiles) {
                try {
                  const stats = statSync(sample);
                  if (stats.isFile()) {
                    const fileName = sample.split("/").pop() || "sample-file";
                    const fileExtension = extname(sample);
                    const fileType = lookup(fileExtension) || "application/octet-stream";
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
                }
              }
            }
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
                visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ
              }
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
              operator: walletProvider.account.address
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
            resourceUrl = `${config.NETWORK === "TESTNET" ? "https://testnet.bscscan.com" : "https://bscscan.com"}/tx/${transactionHash}`;
            result = `Successfully transferred ${amountStr} BNB from BNB Smart Chain to Greenfield. View transaction: ${resourceUrl}`;
            break;
          }
          default:
            throw new Error(`Unknown action type: ${actionType}. Please specify a valid Greenfield operation.`);
        }
        logger.debug(`Operation completed successfully: ${result}`);
        let textResponse = "";
        switch (actionType) {
          case "createBucket":
            textResponse = "\u2705 BUCKET CREATED SUCCESSFULLY\n\n";
            break;
          case "uploadObject":
            textResponse = "\u2705 FILE UPLOADED SUCCESSFULLY\n\n";
            break;
          case "deleteObject":
            textResponse = "\u2705 OBJECT DELETED SUCCESSFULLY\n\n";
            break;
          case "crossChainTransfer":
            textResponse = "\u2705 BNB TRANSFERRED TO GREENFIELD\n\n";
            break;
        }
        if (bucketName) {
          textResponse += `Bucket: ${bucketName}
`;
        }
        if (objectName && (actionType === "uploadObject" || actionType === "deleteObject")) {
          textResponse += `Object: ${objectName}
`;
        }
        if (actionType === "crossChainTransfer") {
          const amountStr = content.amount || "0.00001";
          textResponse += `Amount: ${amountStr} BNB
`;
        }
        if (transactionHash) {
          textResponse += `Transaction Hash: ${transactionHash}
`;
        }
        if (resourceId) {
          textResponse += `Resource ID: ${resourceId}
`;
        }
        if (actionType === "createBucket") {
          textResponse += "\nStorage Provider:\n";
          textResponse += `\u2022 ID: ${spInfo.id}
`;
          textResponse += `\u2022 Endpoint: ${spInfo.endpoint}
`;
          textResponse += `\u2022 Address: ${spInfo.primarySpAddress}
`;
        }
        textResponse += "\nLinks:\n";
        if (resourceUrl) {
          if (actionType === "createBucket") {
            textResponse += `\u2022 View Bucket: ${resourceUrl}
`;
          } else if (actionType === "uploadObject") {
            textResponse += `\u2022 View Object: ${resourceUrl}
`;
          } else if (actionType === "deleteObject") {
            textResponse += `\u2022 View Transaction: ${resourceUrl}
`;
          } else if (actionType === "crossChainTransfer") {
            textResponse += `\u2022 View Transaction: ${resourceUrl}
`;
          }
        }
        if (actionType === "createBucket" || actionType === "uploadObject") {
          textResponse += `\u2022 Greenfield Explorer: ${config.GREENFIELD_SCAN}
`;
        }
        if (actionType === "createBucket" || actionType === "uploadObject" || actionType === "deleteObject") {
          const walletUrl = `${config.GREENFIELD_SCAN}/account/${walletProvider.account.address}`;
          textResponse += `\u2022 Your Greenfield Account: ${walletUrl}
`;
        }
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
          }
        });
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("account not found") || errorMessage.includes("key not found") || errorMessage.includes("not initialized")) {
          logger.warn("Account not initialized on Greenfield:", errorMessage);
          const textResponse = `\u26A0\uFE0F ACCOUNT INITIALIZATION REQUIRED

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
            }
          });
          return false;
        }
        throw error;
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error executing Greenfield action:", errorObj.message);
      logger.debug("Error details:", errorObj.stack || "No stack trace available");
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
      const bucketName = content?.bucketName;
      const objectName = content?.objectName;
      const textResponse = `\u274C GREENFIELD OPERATION FAILED

Error: ${errorMessage}

Action: ${content?.actionType || "Unknown"}
${bucketName ? `Bucket: ${bucketName}
` : ""}${objectName ? `Object: ${objectName}
` : ""}
Troubleshooting:
\u2022 Check your BNB balance
\u2022 Ensure bucket/object names follow naming rules
\u2022 Try again later if network issues persist`;
      callback?.({
        text: textResponse,
        content: {
          success: false,
          error: errorMessage,
          actionType: content?.actionType,
          errorDetails: errorObj.stack
        }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Create a bucket called 'autofunfun' on Greenfield bnb and initialize my account if need"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll create a 'my-docs' bucket on BNB Greenfield for you",
          actions: ["GREENFIELD_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Upload this document to my 'my-docs' bucket on Greenfield",
          attachments: [{ type: "document", url: "file://document.pdf" }]
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll upload your document to the 'my-docs' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Upload this image to my 'autofunfun' bucket on Greenfield"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll upload your image to the 'autofunfun' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Upload file /path/to/myfile.pdf to my 'autofunfun' bucket on Greenfield"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll upload the file from the path to your 'autofunfun' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Upload file packages/plugin-bnb-v2/files/README.pdf to my 'autofunfun' bucket on Greenfield"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll upload the file from the path to your 'autofunfun' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Delete the file 'report.pdf' from my 'my-docs' bucket on Greenfield"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll delete 'report.pdf' from your 'my-docs' bucket on BNB Greenfield",
          actions: ["GREENFIELD_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Transfer 0.001 BNB to my Greenfield account"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll transfer 0.001 BNB from your BNB Smart Chain wallet to your Greenfield account",
          actions: ["GREENFIELD_BNB"]
        }
      }
    ]
  ]
};
var require5 = createRequire(import.meta.url);
var {
  Client: Client3
} = require5("@bnb-chain/greenfield-js-sdk");
var GetBucketAction = class {
  /**
   * Creates a new GetBucketAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   * @param gnfdClient - Greenfield client for blockchain interactions
   */
  constructor(walletProvider, gnfdClient) {
    this.walletProvider = walletProvider;
    this.gnfdClient = gnfdClient;
  }
  /**
   * Check if an account is initialized on Greenfield
   * 
   * @param address - The wallet address to check
   * @returns True if the account is initialized, false otherwise
   */
  async isAccountInitialized(address) {
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
  async listBuckets(address) {
    try {
      logger.debug(`Listing buckets for address: ${address}`);
      if (!this.gnfdClient) {
        logger.error("gnfdClient is undefined or null");
        throw new Error("gnfdClient is not initialized");
      }
      try {
        logger.debug("Trying SDK methods for bucket listing");
        if (this.gnfdClient.bucket) {
          const bucketMethods = Object.keys(this.gnfdClient.bucket);
          logger.debug(`Available methods on bucket: ${bucketMethods.join(", ")}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Error with SDK methods: ${msg}`);
      }
      const endpoints = [
        "https://greenfield-sp.bnbchain.org",
        // Mainnet suggested by user
        "https://greenfield-sp.nodereal.io",
        // Generic mainnet endpoint
        "https://greenfield-sp.ninicoin.io",
        // Generic mainnet endpoint
        "https://greenfield-sp.bnbchain.org",
        // Alternative mainnet endpoint
        "https://gnfd-testnet-sp1.bnbchain.org",
        // Testnet SP1
        "https://gnfd-testnet-sp2.bnbchain.org"
        // Testnet SP2
      ];
      for (const endpoint of endpoints) {
        try {
          logger.debug(`Trying SP endpoint: ${endpoint}`);
          const response = await fetch(`${endpoint}/?include-removed=false`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Gnfd-User-Address": address
            }
          });
          if (response.ok) {
            const responseText = await response.text();
            logger.debug(`API response from ${endpoint}: ${responseText.substring(0, 500)}...`);
            try {
              const buckets = [];
              const bucketMatches = responseText.match(/<Buckets>[\s\S]*?<\/Buckets>/g) || [];
              if (bucketMatches.length > 0) {
                logger.debug(`Found ${bucketMatches.length} buckets in XML response (Buckets format)`);
                for (const bucketXml of bucketMatches) {
                  const bucketName = this.extractXmlValue(bucketXml, "BucketName");
                  const id = this.extractXmlValue(bucketXml, "Id");
                  const visibility = this.extractXmlValue(bucketXml, "Visibility");
                  const owner = this.extractXmlValue(bucketXml, "Owner");
                  const createAt = this.extractXmlValue(bucketXml, "CreateAt");
                  const paymentAddress = this.extractXmlValue(bucketXml, "PaymentAddress");
                  const spAddress = this.extractXmlValue(bucketXml, "PrimarySpId");
                  if (bucketName && id) {
                    buckets.push({
                      id,
                      bucketName,
                      visibility: this.getVisibilityString(Number(visibility) || 0),
                      owner: owner || address,
                      createAt: createAt ? new Date(Number(createAt) * 1e3).toISOString() : "",
                      paymentAddress: paymentAddress || "",
                      spInfo: {
                        address: spAddress || "",
                        endpoint: ""
                      }
                    });
                  }
                }
              }
              const bucketEntryMatches = responseText.match(/<BucketEntry>[\s\S]*?<\/BucketEntry>/g) || [];
              if (bucketEntryMatches.length > 0) {
                logger.debug(`Found ${bucketEntryMatches.length} buckets in XML response (BucketEntry format)`);
                for (const bucketXml of bucketEntryMatches) {
                  const valueMatch = bucketXml.match(/<Value>([\s\S]*?)<\/Value>/);
                  const valueSection = valueMatch?.[1] || "";
                  const id = this.extractXmlValue(bucketXml, "Id");
                  if (valueSection) {
                    const bucketInfo = this.extractXmlValue(valueSection, "BucketInfo");
                    const bucketName = this.extractXmlValue(bucketInfo, "BucketName");
                    const visibility = this.extractXmlValue(bucketInfo, "Visibility");
                    const owner = this.extractXmlValue(bucketInfo, "Owner");
                    const createAt = this.extractXmlValue(bucketInfo, "CreateAt");
                    const paymentAddress = this.extractXmlValue(bucketInfo, "PaymentAddress");
                    if (bucketName && id) {
                      buckets.push({
                        id,
                        bucketName,
                        visibility: this.getVisibilityString(Number(visibility) || 0),
                        owner: owner || address,
                        createAt: createAt ? new Date(Number(createAt) * 1e3).toISOString() : "",
                        paymentAddress: paymentAddress || "",
                        spInfo: { address: "", endpoint: "" }
                      });
                    }
                  } else if (id) {
                    buckets.push({
                      id,
                      bucketName: `bucket-${id}`,
                      visibility: "unknown",
                      owner: address,
                      createAt: "",
                      paymentAddress: "",
                      spInfo: { address: "", endpoint: "" }
                    });
                  }
                }
              }
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
  extractXmlValue(xml, tagName) {
    const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`);
    const match = xml.match(regex);
    return match?.[1] || "";
  }
  /**
   * Convert visibility numeric value to human-readable string
   */
  getVisibilityString(visibility) {
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
};
var getBucketAction = {
  name: "GET_BUCKETS_BNB",
  similes: ["LIST_BUCKETS_BNB", "SHOW_BUCKETS_BNB", "VIEW_BUCKETS_BNB", "GREENFIELD_BUCKETS_BNB"],
  description: "List all buckets owned by an address on BNB Greenfield",
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options = {}, callback) => {
    logger.info("Executing GET_BUCKETS_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));
    logger.debug("Message source:", message.content.source);
    if (!(message.content.source === "direct" || message.content.source === "client_chat:user")) {
      logger.warn("Bucket listing rejected: invalid source:", message.content.source);
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Bucket listing not allowed" }
      });
      return false;
    }
    logger.debug("Source validation passed");
    const currentState = state ? state : await runtime.composeState(message);
    const templateData = {
      template: getBucketTemplate,
      state: currentState
    };
    logger.debug("Generating bucket listing parameters using model");
    const mlOutput = await runtime.useModel(ModelType.LARGE, {
      prompt: JSON.stringify(templateData),
      responseFormat: { type: "json_object" }
    });
    let content;
    try {
      let jsonString = typeof mlOutput === "string" ? mlOutput : JSON.stringify(mlOutput);
      if (typeof jsonString === "string") {
        const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const match = jsonString.match(jsonRegex);
        if (match?.[1]) {
          jsonString = match[1];
          logger.debug("Extracted JSON from markdown code block");
        }
        jsonString = jsonString.trim();
      }
      content = JSON.parse(jsonString);
      logger.debug("Generated bucket listing parameters:", JSON.stringify(content, null, 2));
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
      content = { address: null, includeDetails: true };
      logger.debug("Using default parameters");
    }
    try {
      const config = await getGnfdConfig(runtime);
      const gnfdClient = await InitGnfdClient(runtime);
      const walletProvider = initWalletProvider(runtime);
      const action = new GetBucketAction(walletProvider, gnfdClient);
      const queryAddress = content.address || walletProvider.getAddress();
      logger.debug(`Using address for bucket listing: ${queryAddress}`);
      const isInitialized = await action.isAccountInitialized(queryAddress);
      const explorerUrl = `${config.GREENFIELD_SCAN}/account/${queryAddress}`;
      const response = {
        address: queryAddress,
        isInitialized,
        buckets: [],
        explorerUrl
      };
      if (isInitialized) {
        logger.debug("Account is initialized, listing buckets");
        response.buckets = await action.listBuckets(queryAddress);
      } else {
        logger.debug("Account is not initialized, skipping bucket listing");
      }
      if (callback) {
        let responseText = "";
        if (!isInitialized) {
          responseText = `\u{1F6AB} ACCOUNT NOT INITIALIZED

Your wallet address (${queryAddress}) is not initialized on the Greenfield network.

Before you can create or view buckets, you need to initialize your account by sending BNB from BSC to Greenfield. 

You can do this by:
1. Use the "GREENFIELD_BNB" action with a cross-chain transfer
2. Send a message like: "Transfer 0.01 BNB from BSC to my Greenfield account"

View your account: ${explorerUrl}`;
        } else if (response.buckets.length === 0) {
          responseText = `\u{1F4C2} NO BUCKETS FOUND

Your wallet (${queryAddress}) is initialized on Greenfield, but you don't have any buckets yet.

You can create a bucket using the "GREENFIELD_BNB" action by saying:
"Create a bucket called 'my-first-bucket' on Greenfield"

View your account: ${explorerUrl}`;
        } else {
          const bucketList = response.buckets.map((bucket, index) => {
            const bucketUrl = `${config.GREENFIELD_SCAN}/bucket/${bucket.id}`;
            return `${index + 1}. "${bucket.bucketName}" (${bucket.visibility})
   \u2022 ID: ${bucket.id}
   \u2022 Created: ${bucket.createAt ? new Date(bucket.createAt).toLocaleString() : "Unknown"}
   \u2022 View: ${bucketUrl}`;
          }).join("\n\n");
          responseText = `\u{1F4C2} YOUR GREENFIELD BUCKETS (${response.buckets.length})

${bucketList}

Account: ${queryAddress}
View on Explorer: ${explorerUrl}`;
        }
        callback({
          text: responseText,
          content: {
            success: true,
            ...response
          }
        });
      }
      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error during bucket listing:", errorObj.message);
      logger.debug("Error details:", errorObj.stack || "No stack trace available");
      let errorMessage = errorObj.message;
      if (errorMessage.includes("account not found") || errorMessage.includes("key not found")) {
        errorMessage = "Your account hasn't been initialized on Greenfield. Please transfer BNB from BSC to Greenfield first.";
      }
      callback?.({
        text: `Failed to list buckets: ${errorMessage}`,
        content: {
          success: false,
          error: errorMessage,
          address: content?.address || initWalletProvider(runtime).getAddress()
        }
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "List all my buckets on Greenfield"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll list all your buckets on BNB Greenfield",
          actions: ["GET_BUCKETS_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me my Greenfield storage buckets"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll show you all your buckets on BNB Greenfield",
          actions: ["GET_BUCKETS_BNB"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "What buckets do I have on Greenfield?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check what buckets you have on BNB Greenfield",
          actions: ["GET_BUCKETS_BNB"]
        }
      }
    ]
  ]
};
var bnbEnvSchema = z.object({
  BNB_PRIVATE_KEY: z.string().optional(),
  BNB_PUBLIC_KEY: z.string().optional(),
  BSC_PROVIDER_URL: z.string().default(API_CONFIG.DEFAULT_BSC_PROVIDER_URL),
  BSC_TESTNET_PROVIDER_URL: z.string().default(API_CONFIG.DEFAULT_BSC_TESTNET_PROVIDER_URL),
  OPBNB_PROVIDER_URL: z.string().default(API_CONFIG.DEFAULT_OPBNB_PROVIDER_URL)
});
function getConfig() {
  return {
    BNB_PRIVATE_KEY: process.env.BNB_PRIVATE_KEY,
    BNB_PUBLIC_KEY: process.env.BNB_PUBLIC_KEY,
    BSC_PROVIDER_URL: process.env.BSC_PROVIDER_URL || API_CONFIG.DEFAULT_BSC_PROVIDER_URL,
    BSC_TESTNET_PROVIDER_URL: process.env.BSC_TESTNET_PROVIDER_URL || API_CONFIG.DEFAULT_BSC_TESTNET_PROVIDER_URL,
    OPBNB_PROVIDER_URL: process.env.OPBNB_PROVIDER_URL || API_CONFIG.DEFAULT_OPBNB_PROVIDER_URL
  };
}
async function validateBnbConfig(runtime) {
  try {
    logger.debug("Validating BNB configuration");
    const config = {
      BNB_PRIVATE_KEY: runtime.getSetting("BNB_PRIVATE_KEY") || process.env.BNB_PRIVATE_KEY,
      BNB_PUBLIC_KEY: runtime.getSetting("BNB_PUBLIC_KEY") || process.env.BNB_PUBLIC_KEY,
      BSC_PROVIDER_URL: runtime.getSetting("BSC_PROVIDER_URL") || process.env.BSC_PROVIDER_URL || API_CONFIG.DEFAULT_BSC_PROVIDER_URL,
      BSC_TESTNET_PROVIDER_URL: runtime.getSetting("BSC_TESTNET_PROVIDER_URL") || process.env.BSC_TESTNET_PROVIDER_URL || API_CONFIG.DEFAULT_BSC_TESTNET_PROVIDER_URL,
      OPBNB_PROVIDER_URL: runtime.getSetting("OPBNB_PROVIDER_URL") || process.env.OPBNB_PROVIDER_URL || API_CONFIG.DEFAULT_OPBNB_PROVIDER_URL
    };
    const validatedConfig = bnbEnvSchema.parse(config);
    logger.debug("BNB configuration validated successfully");
    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
      logger.error(`BNB configuration validation failed: ${errorMessages}`);
      throw new Error(
        `BNB configuration validation failed:
${errorMessages}`
      );
    }
    logger.error("Unexpected error during BNB configuration validation:", error);
    throw error;
  }
}
function hasWalletConfigured(config) {
  return !!(config.BNB_PRIVATE_KEY || config.BNB_PUBLIC_KEY);
}
function hasPrivateKeyConfigured(config) {
  return !!config.BNB_PRIVATE_KEY;
}

// src/index.ts
dotenv.config();
var bnbPlugin = {
  /**
   * Initialize the plugin
   * 
   * @param config - Plugin configuration
   * @param runtime - ElizaOS agent runtime
   */
  init: async (config, runtime) => {
    logger.info("Initializing BNB Smart Chain plugin");
    logger.debug("BNB plugin config:", config);
    try {
      const bnbConfig = await validateBnbConfig(runtime);
      const hasWallet = !!bnbConfig.BNB_PRIVATE_KEY || !!bnbConfig.BNB_PUBLIC_KEY;
      logger.info(`BNB plugin initialized with wallet: ${hasWallet ? "Yes" : "No"}`);
      logger.info(`BSC Provider: ${bnbConfig.BSC_PROVIDER_URL ? "Configured" : "Default"}`);
      logger.info(`BSC Testnet Provider: ${bnbConfig.BSC_TESTNET_PROVIDER_URL ? "Configured" : "Default"}`);
      logger.info(`OPBNB Provider: ${bnbConfig.OPBNB_PROVIDER_URL ? "Configured" : "Default"}`);
    } catch (error) {
      logger.error("Failed to initialize BNB plugin:", error);
    }
  },
  /**
   * Plugin metadata
   */
  name: "bnb",
  description: "BNB Smart Chain (BSC) and opBNB integration plugin supporting transfers, swaps, staking, bridging, and token deployments",
  /**
   * Plugin components
   */
  actions: [
    getBalanceAction,
    transferAction,
    swapAction,
    bridgeAction,
    stakeAction,
    faucetAction,
    deployAction,
    greenfieldAction,
    getBucketAction
  ],
  providers: [bnbWalletProvider],
  evaluators: [],
  services: []
};
var index_default = bnbPlugin;

export { BridgeAction, DeployAction, FaucetAction, GetBalanceAction, GreenfieldAction, StakeAction, SwapAction, TransferAction, WalletProvider, bnbEnvSchema, bnbPlugin, bnbWalletProvider, bridgeAction, bridgeTemplate, index_default as default, deployAction, ercContractTemplate, faucetAction, faucetTemplate, getBalanceAction, getBalanceTemplate, getConfig, greenfieldAction, greenfieldTemplate, hasPrivateKeyConfigured, hasWalletConfigured, initWalletProvider, stakeAction, stakeTemplate, swapAction, swapTemplate, transferAction, transferTemplate, validateBnbConfig };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map