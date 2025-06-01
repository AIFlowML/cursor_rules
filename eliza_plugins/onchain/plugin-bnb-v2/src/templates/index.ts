/**
 * BNB Plugin Action Templates
 * 
 * This file contains template strings used to extract structured data from user messages
 * for various BNB chain actions. Each template defines how to parse natural language requests
 * into formatted parameters that can be used by action handlers.
 * 
 * The templates use {{recentMessages}} and {{walletInfo}} placeholders that get replaced
 * with actual conversation context and wallet data at runtime.
 */

/**
 * Template for checking token balances
 * 
 * Extracts information about which chain, address, and token to check balances for.
 * Supports BSC, BSC Testnet, opBNB, and opBNB Testnet chains.
 * Can check balances for any address, defaulting to the user's wallet address.
 * 
 * @example
 * "What's my BNB balance?"
 * "Check BUSD balance for 0x123..."
 */
export const getBalanceTemplate = `Given the recent messages and wallet information below:

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

/**
 * Template for transferring tokens
 * 
 * Extracts information about token transfers, including chain, token, amount,
 * recipient address, and optional transaction data.
 * Supports transferring native BNB or any ERC20 token on BSC or opBNB networks.
 * 
 * @example
 * "Send 0.1 BNB to 0x123..."
 * "Transfer 50 BUSD to vitalik.eth on BSC"
 */
export const transferTemplate = `Given the recent messages and wallet information below:

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

/**
 * Template for swapping tokens
 * 
 * Extracts information about token swaps, including chain, input token,
 * output token, amount, and slippage tolerance.
 * Supports swapping between any tokens available on decentralized exchanges
 * on BSC or opBNB networks.
 * 
 * @example
 * "Swap 0.5 BNB for CAKE"
 * "Exchange 10 BUSD for ETH with 1% slippage on opBNB"
 */
export const swapTemplate = `Given the recent messages and wallet information below:

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

/**
 * Template for bridging tokens between chains
 * 
 * Extracts information about token bridging operations between BSC and opBNB,
 * including source chain, destination chain, token addresses, amount, and recipient.
 * Enables cross-chain token transfers using the BNB Chain bridge infrastructure.
 * 
 * @example
 * "Bridge 1 BNB from BSC to opBNB"
 * "Send 25 BUSD from opBNB to BSC to my address"
 */
export const bridgeTemplate = `Given the recent messages and wallet information below:

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

/**
 * Template for staking operations
 * 
 * Extracts information about staking actions, including chain, action type
 * (deposit, withdraw, claim), and amount.
 * Supports staking BNB tokens in various staking protocols on BSC or opBNB.
 * 
 * @example
 * "Stake 2 BNB on BSC"
 * "Withdraw 0.5 BNB from staking on opBNB"
 * "Claim my staking rewards"
 */
export const stakeTemplate = `Given the recent messages and wallet information below:

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

/**
 * Template for faucet requests
 * 
 * Extracts information about testnet faucet requests, including
 * token type and recipient address.
 * Allows users to request test tokens on BSC Testnet or opBNB Testnet.
 * 
 * @example
 * "Get testnet BNB from faucet"
 * "Request BUSD from faucet to 0x123..."
 */
export const faucetTemplate = `Given the recent messages and wallet information below:

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

/**
 * Template for token contract deployment
 * 
 * Extracts information about token contract deployments, including chain,
 * contract type (ERC20, ERC721, ERC1155), and contract parameters.
 * Enables users to deploy custom tokens and NFT collections on BSC or opBNB.
 * 
 * @example
 * "Deploy an ERC20 token named 'My Token' with symbol MTK"
 * "Create an NFT collection with name 'Cool NFTs' and symbol CNFT"
 */
export const ercContractTemplate = `Given the recent messages and wallet information below:

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

/**
 * Template for Greenfield operations
 * 
 * Extracts information about BNB Greenfield decentralized storage operations,
 * including operation type, bucket details, object details, and cross-chain transfers.
 * Enables interactions with the BNB Greenfield decentralized storage network.
 * 
 * @example
 * "Create a private bucket called 'my-data' on Greenfield"
 * "Upload a file to my Greenfield bucket"
 * "Transfer 0.5 BNB to Greenfield"
 */
export const greenfieldTemplate = `Given the recent messages and wallet information below(only including 'Greenfield' keyword):

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
/**
 * Template for listing Greenfield buckets
 * 
 * Extracts information about Greenfield bucket listing requests,
 * including the address to check and whether to include details.
 * Enables users to view their Greenfield buckets.
 * 
 * @example
 * "List all my buckets on Greenfield"
 * "Show me my Greenfield buckets"
 */
export const getBucketTemplate = {
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