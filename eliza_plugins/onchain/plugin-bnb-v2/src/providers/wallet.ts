import type {
     IAgentRuntime,
     Provider,
     Memory,
     State,
} from "@elizaos/core";
import { EVM, createConfig, getToken } from "@lifi/sdk";
import type {
    Address,
    WalletClient,
    PublicClient,
    Chain,
    HttpTransport,
    Account,
    PrivateKeyAccount,
    Hex,
} from "viem";
import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    erc20Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as viemChains from "viem/chains";
import { createWeb3Name } from "@web3-name-sdk/core";
import { elizaLogger } from "@elizaos/core";

import type { SupportedChain } from "../types";

export class WalletProvider {
    private currentChain: SupportedChain = "bsc";
    chains: Record<string, Chain> = { bsc: viemChains.bsc };
    account: PrivateKeyAccount;
    private privateKey: `0x${string}`;
    constructor(privateKey: `0x${string}`, chains?: Record<string, Chain>) {
        this.privateKey = privateKey;
        this.setAccount(privateKey);
        this.setChains(chains);

        if (chains && Object.keys(chains).length > 0) {
            this.setCurrentChain(Object.keys(chains)[0] as SupportedChain);
        }
    }
 
    getAccount(): PrivateKeyAccount {
        return this.account;
    }
    getPk(): `0x${string}` {
        return this.privateKey;
    }

    getAddress(): Address {
        return this.account.address;
    }

    getCurrentChain(): Chain {
        return this.chains[this.currentChain];
    }

    getPublicClient(
        chainName: SupportedChain
    ): PublicClient<HttpTransport, Chain, Account | undefined> {
        const transport = this.createHttpTransport(chainName);

        const publicClient = createPublicClient({
            chain: this.chains[chainName],
            transport,
        });
        return publicClient;
    }

    getWalletClient(chainName: SupportedChain): WalletClient {
        const transport = this.createHttpTransport(chainName);

        const walletClient = createWalletClient({
            chain: this.chains[chainName],
            transport,
            account: this.account,
        });

        return walletClient;
    }

    getChainConfigs(chainName: SupportedChain): Chain {
        const chain = viemChains[chainName];

        if (!chain?.id) {
            throw new Error("Invalid chain name");
        }

        return chain;
    }

    configureLiFiSdk(chainName: SupportedChain) {
        const chains = Object.values(this.chains);
        const walletClient = this.getWalletClient(chainName);

        createConfig({
            integrator: "eliza",
            providers: [
                EVM({
                    getWalletClient: async () => walletClient,
                    switchChain: async (chainId) =>
                        createWalletClient({
                            account: this.account,
                            chain: chains.find(
                                (chain) => chain.id === chainId
                            ) as Chain,
                            transport: http(),
                        }),
                }),
            ],
        });
    }

    async formatAddress(address: string | null | undefined): Promise<Address> {
        // If address is null or undefined, use the wallet's own address
        if (address === null || address === undefined) {
            elizaLogger.debug("Address is null or undefined, using wallet's own address");
            return this.getAddress();
        }

        // If address is empty string, use wallet's own address
        if (typeof address === 'string' && address.trim().length === 0) {
            elizaLogger.debug("Address is empty string, using wallet's own address");
            return this.getAddress();
        }

        // Convert to string in case we get an object or other type
        const addressStr = String(address).trim();
        
        // If it's already a valid hex address, return it directly
        if (addressStr.startsWith("0x") && addressStr.length === 42) {
            elizaLogger.debug(`Using valid hex address: ${addressStr}`);
            return addressStr as Address;
        }
        
        // Skip web3 name resolution for common tokens that might be mistakenly
        // passed as addresses
        const commonTokens = ['USDT', 'USDC', 'BNB', 'ETC', 'WETC', 'BUSD', 'WBNB', 'TRON', 'LINK', 'OM', 'UNI', 'PEPE', 'AAVE', 'ATOM'];
        if (commonTokens.includes(addressStr.toUpperCase())) {
            elizaLogger.debug(`Value appears to be a token symbol, not an address: ${addressStr}. Using wallet's own address.`);
            return this.getAddress();
        }

        // Try to resolve as web3 name
        try {
            elizaLogger.debug(`Attempting to resolve as Web3Name: ${addressStr}`);
            const resolvedAddress = await this.resolveWeb3Name(addressStr);
            if (resolvedAddress) {
                elizaLogger.debug(`Resolved Web3Name to address: ${resolvedAddress}`);
                return resolvedAddress as Address;
            }
        } catch (error) {
            elizaLogger.debug(`Failed to resolve Web3Name '${addressStr}': ${error.message}. Will try other methods.`);
            // Continue to other methods rather than throwing
        }
        
        // If we can't resolve the name but it looks like a potential address
        if (addressStr.startsWith("0x")) {
            elizaLogger.debug(`Address "${addressStr}" doesn't look like a standard Ethereum address but will be used as is`);
            return addressStr as Address;
        }
        
        // If all else fails, use the wallet's own address
        elizaLogger.debug(`Could not resolve address '${addressStr}'. Using wallet's own address.`);
        return this.getAddress();
    }

    async resolveWeb3Name(name: string | null | undefined): Promise<string | null> {
        // Handle null/undefined/empty cases
        if (name === null || name === undefined || name === 'null') {
            elizaLogger.debug(`Web3Name resolution skipped for null/undefined value`);
            return null;
        }
        
        // Convert to string and trim
        const nameStr = String(name).trim();
        if (nameStr.length === 0) {
            elizaLogger.debug(`Web3Name resolution skipped for empty string`);
            return null;
        }
        
        // If it's already a valid address, return it directly
        if (nameStr.startsWith('0x') && nameStr.length === 42) {
            elizaLogger.debug(`Value is already a valid address: ${nameStr}`);
            return nameStr;
        }
        
        // Skip resolution for common token symbols and keywords
        const commonTokens = ['USDT', 'USDC', 'BNB', 'ETH', 'BTC', 'BUSD', 'DAI', 'WETC', 'WBNB', 'TRON', 'LINK', 'OM', 'UNI', 'PEPE', 'AAVE', 'ATOM'];
        if (commonTokens.includes(nameStr.toUpperCase())) {
            elizaLogger.debug(`Skipping Web3Name resolution for common token: ${nameStr}`);
            return null;
        }
        
        try {
            // Get the current chain's RPC URL to use for name resolution
            const chain = this.getCurrentChain();
            const rpcUrl = chain.rpcUrls.custom?.http[0] || chain.rpcUrls.default.http[0];
            
            elizaLogger.debug(`Resolving Web3Name: ${nameStr} using chain ${chain.name} and RPC: ${rpcUrl}`);
            
            // Create nameService with explicit RPC URL
            const nameService = createWeb3Name({
                rpcUrl
            });
            
            // Attempt resolution with timeout
            const result = await Promise.race([
                nameService.getAddress(nameStr),
                new Promise<null>((resolve) => 
                    setTimeout(() => {
                        elizaLogger.debug(`Web3Name resolution timeout for ${nameStr}`);
                        resolve(null);
                    }, 5000) // 5 second timeout
                )
            ]);
            
            if (result) {
                elizaLogger.debug(`Web3Name resolved: ${nameStr} → ${result}`);
                return result;
            } else {
                elizaLogger.debug(`Web3Name not resolved: ${nameStr}`);
                return null;
            }
        } catch (error) {
            // Log error but don't propagate it - maintain smooth user experience
            elizaLogger.debug(`Error resolving Web3Name ${nameStr}: ${error.message}`);
            return null;
        }
    }

    async checkERC20Allowance(
        chain: SupportedChain,
        token: Address,
        owner: Address,
        spender: Address,
    ): Promise<bigint> {
        const publicClient = this.getPublicClient(chain);
        return await publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "allowance",
            args: [owner, spender],
        });
    }

    async approveERC20(
        chain: SupportedChain,
        token: Address,
        spender: Address,
        amount: bigint
    ): Promise<Hex> {
        const publicClient = this.getPublicClient(chain);
        const walletClient = this.getWalletClient(chain);
        const { request } = await publicClient.simulateContract({
            account: this.account,
            address: token,
            abi: erc20Abi,
            functionName: "approve",
            args: [spender, amount],
        });

        return await walletClient.writeContract(request);
    }

    async transfer(
        chain: SupportedChain,
        toAddress: Address,
        amount: bigint,
        options?: {
            gas?: bigint;
            gasPrice?: bigint;
            data?: Hex;
        }
    ): Promise<Hex> {
        const walletClient = this.getWalletClient(chain);
        return await walletClient.sendTransaction({
            account: this.account,
            to: toAddress,
            value: amount,
            chain: this.getChainConfigs(chain),
            ...options,
        });
    }

    async transferERC20(
        chain: SupportedChain,
        tokenAddress: Address,
        toAddress: Address,
        amount: bigint,
        options?: {
            gas?: bigint;
            gasPrice?: bigint;
        }
    ): Promise<Hex> {
        const publicClient = this.getPublicClient(chain);
        const walletClient = this.getWalletClient(chain);
        const { request } = await publicClient.simulateContract({
            account: this.account,
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: "transfer",
            args: [toAddress as `0x${string}`, amount],
            ...options,
        });

        return await walletClient.writeContract(request);
    }

    async getBalance(): Promise<string> {
        const client = this.getPublicClient(this.currentChain);
        const balance = await client.getBalance({
            address: this.account.address,
        });
        return formatUnits(balance, 18);
    }

    async getTokenAddress(
        chainName: SupportedChain,
        tokenSymbol: string
    ): Promise<string> {
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
    getTestnetTokenAddress(tokenSymbol: string): string | null {
        // Testnet token mapping - keep in sync with the mapping in getBalanceTestnet.ts
        const TESTNET_TOKEN_ADDRESSES: Record<string, string> = {
            "BNB": "0x64544969ed7EBf5f083679233325356EbE738930",
            "BUSD": "0x48D87A2d14De41E2308A764905B93E05c9377cE1",
            "DAI": "0x46B48c1Ef4B5F15B7DdC415290CEC2f774cD1021",
            "ETH": "0x635780E5D02Ab29d7aE14d266936A38d3D5B0CC5",
            "USDC": "0x053Fc65249dF91a02Ddb294A081f774615aB45F4",
        };

        // Normalize input to uppercase
        const normalizedSymbol = tokenSymbol.toUpperCase();
        
        // Check if token exists in mapping
        if (TESTNET_TOKEN_ADDRESSES[normalizedSymbol]) {
            elizaLogger.debug(`Found testnet token address for ${normalizedSymbol}: ${TESTNET_TOKEN_ADDRESSES[normalizedSymbol]}`);
            return TESTNET_TOKEN_ADDRESSES[normalizedSymbol];
        }
        
        elizaLogger.debug(`No testnet address found for token ${normalizedSymbol}`);
        return null;
    }

    addChain(chain: Record<string, Chain>) {
        this.setChains(chain);
    }

    switchChain(chainName: SupportedChain, customRpcUrl?: string) {
        if (!this.chains[chainName]) {
            const chain = WalletProvider.genChainFromName(
                chainName,
                customRpcUrl
            );
            this.addChain({ [chainName]: chain });
        }
        this.setCurrentChain(chainName);
    }

    private setAccount = (pk: `0x${string}`) => {
        this.account = privateKeyToAccount(pk);
    };

    private setChains = (chains?: Record<string, Chain>) => {
        if (!chains) {
            return;
        }
        for (const chain of Object.keys(chains)) {
            this.chains[chain] = chains[chain];
        }
    };

    private setCurrentChain = (chain: SupportedChain) => {
        this.currentChain = chain;
    };

    private createHttpTransport = (chainName: SupportedChain) => {
        const chain = this.chains[chainName];

        if (chain.rpcUrls.custom) {
            return http(chain.rpcUrls.custom.http[0]);
        }
        return http(chain.rpcUrls.default.http[0]);
    };

    static genChainFromName(
        chainName: string,
        customRpcUrl?: string | null
    ): Chain {
        const baseChain = viemChains[chainName];

        if (!baseChain?.id) {
            throw new Error("Invalid chain name");
        }

        const viemChain: Chain = customRpcUrl
            ? {
                  ...baseChain,
                  rpcUrls: {
                      ...baseChain.rpcUrls,
                      custom: {
                          http: [customRpcUrl],
                      },
                  },
              }
            : baseChain;

        return viemChain;
    }
}

const genChainsFromRuntime = (
    runtime: IAgentRuntime
): Record<string, Chain> => {
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

export const initWalletProvider = (runtime: IAgentRuntime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    if (!privateKey) {
        throw new Error("BNB_PRIVATE_KEY is missing");
    }

    const chains = genChainsFromRuntime(runtime);

    return new WalletProvider(privateKey as `0x${string}`, chains);
};

export const bnbWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        try {
            const walletProvider = initWalletProvider(runtime);
            const address = walletProvider.getAddress();
            const balance = await walletProvider.getBalance();
            const chain = walletProvider.getCurrentChain();
            return `BNB chain Wallet Address: ${address}\nBalance: ${balance} ${chain.nativeCurrency.symbol}\nChain ID: ${chain.id}, Name: ${chain.name}`;
        } catch (error) {
            console.error("Error in BNB chain wallet provider:", error);
            return null;
        }
    },
};
