# DATAI Plugin for ElizaOS v2

A comprehensive blockchain data analysis plugin that provides real-time access to wallet balances, transaction history, DeFi positions, NFT collections, and more across multiple blockchain networks.

## 🚀 Features

- **Multi-Chain Support**: Ethereum, Polygon, Arbitrum, Avalanche, Base, Optimism, BSC, Solana, and more
- **Comprehensive Data Access**: Balances, transactions, DeFi positions, NFTs, and protocol interactions
- **Real-Time Data**: Live blockchain data with USD valuations and price information
- **Advanced Filtering**: Time-based queries, chain-specific data, and protocol-specific analysis
- **Rich Formatting**: User-friendly responses with emojis, structured layouts, and detailed insights

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Available Actions](#available-actions)
  - [Core Balance Actions](#core-balance-actions)
  - [Transaction Actions](#transaction-actions)
  - [DeFi Position Actions](#defi-position-actions)
  - [NFT Actions](#nft-actions)
  - [Solana Actions](#solana-actions)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)

## 🛠 Installation

1. Install the plugin in your ElizaOS project:
```bash
bun install @elizaos/plugin-datai
```

2. Add the plugin to your character configuration:
```typescript
import { dataiPlugin } from "@elizaos/plugin-datai";

export default {
  plugins: ["@elizaos/plugin-datai"],
  // ... other configuration
};
```

## ⚙️ Configuration

Set your DATAI API key as an environment variable:

```bash
DATAI_API_KEY=your_api_key_here
```

Or configure it in your `.env` file:
```env
DATAI_API_KEY=GET_YOUR_API_KEY
```

## 📊 Available Actions

### Core Balance Actions

#### 1. Get Wallet Balances by Chain
**Action**: `GET_WALLET_BALANCES_BY_CHAIN_DATAI`

Retrieves direct wallet balances including native currency, tokens, and NFTs for a specific chain.

**Example Prompt**:
> "What is in my wallet balance on Polygon for address 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?"

---

#### 2. Get Token Balances by Chain
**Action**: `GET_TOKEN_BALANCES_BY_SINGLE_CHAIN_DATAI`

Retrieves all token balances with detailed price information for a specific chain.

**Example Prompt**:
> "List my tokens balance and their prices on Base chain for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?"

---

#### 3. Get Native Token Balance by Chain
**Action**: `GET_NATIVE_TOKEN_BALANCE_BY_CHAIN_DATAI`

Retrieves native token balance (ETH, MATIC, etc.) for a specific chain.

**Example Prompt**:
> "What is my ETH native balance for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?"

---

#### 4. Get Grouped Token Balances by Multiple Chains
**Action**: `GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_DATAI`

Retrieves token balances across multiple specified chains, grouped by chain ID.

**Example Prompt**:
> "Show me my token balances on Ethereum and Base for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI"

---

#### 5. Get User Overall Balance by Chain
**Action**: `GET_USER_OVERALL_BALANCE_BY_SINGLE_CHAIN_DATAI`

Retrieves overall balance including tokens, NFTs, and DeFi exposures for a specific chain.

**Example Prompt**:
> "What's my total balance on Avalanche chain? My wallet is 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3 on DATAI"

---

#### 6. Get User Overall Balance All Chains
**Action**: `GET_USER_OVERALL_BALANCE_ALL_CHAINS_DATAI`

Retrieves overall balance across all supported chains.

**Example Prompt**:
> "What is my total balance across all chains? My wallet address is 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI"

---

#### 7. Get User DeFi Protocol Balances by Chain
**Action**: `GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN_DATAI`

Retrieves summary of DeFi balances across all protocols on a specific chain.

**Example Prompt**:
> "What is my DeFi protocol balances on the chain Ethereum for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI?"

---

### Transaction Actions

#### 8. Get User Transactions
**Action**: `GET_USER_TRANSACTIONS_DATAI`

Retrieves user's transaction history across all chains.

**Example Prompt**:
> "Show me my recent transactions for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI"

---

#### 9. Get User Transactions by Chain
**Action**: `GET_USER_TRANSACTIONS_BY_CHAIN_DATAI`

Retrieves user's transaction history for a specific chain.

**Example Prompt**:
> "What are my recent transactions on Ethereum for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?"

---

#### 10. Get Transaction by Hash
**Action**: `GET_TRANSACTION_BY_HASH_DATAI`

Retrieves detailed information about a specific transaction.

**Example Prompt**:
> "Show me details for transaction 0x1234567890abcdef1234567890abcdef12345678 for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI"

---

#### 11. Get Transaction Transfers by Hash
**Action**: `GET_TRANSACTION_TRANSFERS_BY_HASH_DATAI`

Retrieves all token transfers within a specific transaction.

**Example Prompt**:
> "What transfers happened in transaction 0x1234567890abcdef1234567890abcdef12345678 for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?"

---

#### 12. Get User Transaction Overview
**Action**: `GET_USER_TRANSACTION_OVERVIEW_DATAI`

Retrieves a statistical overview of user's transaction activity.

**Example Prompt**:
> "Give me a transaction overview for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI"

---

#### 13. Get User Tx by Period and Chain Extended
**Action**: `GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED`

Retrieves extended transaction history for a specific time period and chain with enhanced date/period handling.

**Example Prompt**:
> "Show me extended tx history for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on xDai for the last 3 months on DATAI"

---

#### 14. Get User Tx by Period and Chain Raw Label
**Action**: `GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20_DATAI`

Retrieves raw transaction data with classifications for a specific time period and chain (limited to 20 transactions).

**Example Prompt**:
> "Show me raw tx history for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on eth for the last month on DATAI"

---

#### 15. Get User Tx History All Chains Short
**Action**: `GET_USER_TX_HISTORY_ALL_CHAINS_SHORT_DATAI`

Retrieves short transaction history across all chains.

**Example Prompt**:
> "Show me short tx history across all chains for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI"

---

#### 16. Get User Tx History by Chain Raw Label
**Action**: `GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL_DATAI`

Retrieves raw labeled transaction history for a specific chain.

**Example Prompt**:
> "Show me raw transaction history for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on eth on DATAI"

---

### DeFi Position Actions

#### 17. Get All User DeFi Positions
**Action**: `GET_ALL_USER_DEFI_POSITIONS_DATAI`

Retrieves all DeFi positions across all chains and protocols.

**Example Prompt**:
> "Show me all my DeFi positions for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI"

---

#### 18. Get User DeFi Positions by Chain
**Action**: `GET_USER_DEFI_POSITIONS_BY_CHAIN_DATAI`

Retrieves DeFi positions for a specific chain.

**Example Prompt**:
> "What are my DeFi positions on Ethereum for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI?"

---

#### 19. Get User DeFi Positions by Multiple Chains
**Action**: `GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS_DATAI`

Retrieves DeFi positions across multiple specified chains.

**Example Prompt**:
> "Show me my DeFi positions on Ethereum and Arbitrum for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI"

---

#### 20. Get User DeFi Positions by Protocol
**Action**: `GET_USER_DEFI_POSITIONS_BY_PROTOCOL_DATAI`

Retrieves DeFi positions for a specific protocol.

**Example Prompt**:
> "What are my Aave positions for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106 on DATAI?"

---

#### 21. Get Transactions for DeFi Position
**Action**: `GET_TRANSACTIONS_FOR_DEFI_POSITION_DATAI`

Retrieves transaction history for a specific DeFi position.

**Example Prompt**:
> "Show me transactions for DeFi position 12345 on DATAI"

---

### NFT Actions

#### 22. Get User NFTs by Chain
**Action**: `GET_USER_NFTS_BY_CHAIN_DATAI`

Retrieves all NFTs owned by a user on a specific chain.

**Example Prompt**:
> "What NFTs do I own on Polygon for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?"

---

#### 23. Get User NFTs List
**Action**: `GET_USER_NFTS_LIST_DATAI`

Retrieves all NFTs owned by a user, optionally filtered by chain.

**Example Prompt**:
> "What NFTs do I own? My wallet is 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI?"

---

### Solana Actions

#### 24. Get Solana User Tx History Extended
**Action**: `GET_SOLANA_USER_TX_HISTORY_EXTENDED_DATAI`

Retrieves extended transaction history for Solana addresses.

**Example Prompt**:
> "Show me my Solana transaction history for wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU on DATAI"

---

#### 25. Get Solana User Tx History Short
**Action**: `GET_SOLANA_USER_TX_HISTORY_SHORT_DATAI`

Retrieves short transaction history for Solana addresses.

**Example Prompt**:
> "Show me recent Solana transactions for wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU on DATAI"

---

## 🎯 Usage Examples

### Basic Balance Check
```
User: "What's my balance on Ethereum for 0x3764D79db51726E900a1380055F469eB6e2a7fD3?"
Agent: Retrieves and displays ETH balance, token holdings, and NFTs on Ethereum.
```

### Multi-Chain Portfolio Overview
```
User: "Show me my total portfolio across all chains for 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106"
Agent: Displays comprehensive portfolio breakdown across all supported chains.
```

### DeFi Position Analysis
```
User: "What are my Aave positions on Ethereum for 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?"
Agent: Shows detailed Aave lending/borrowing positions with USD values.
```

### Transaction History with Time Periods
```
User: "Show me extended tx history for 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 on xDai for the last 3 months"
Agent: Retrieves and formats transaction history for the specified period.
```

### NFT Collection Overview
```
User: "What NFTs do I own on Polygon for 0x3764D79db51726E900a1380055F469eB6e2a7fD3?"
Agent: Lists all NFTs with contract details and view links.
```

## 🔧 Advanced Features

### Time Period Support
The plugin supports various time period formats:
- **Explicit timestamps**: `startTime=1716346533 and endTime=1705895733`
- **Date formats**: `01/07/2020`, `2020-01-07`, `January 7, 2020`
- **Relative periods**: `last 3 months`, `past 90 days`, `since yesterday`
- **Named periods**: `this week`, `this month`, `this year`

### Chain Support
- **Ethereum** (eth)
- **Polygon** (matic)
- **Arbitrum** (arb)
- **Avalanche** (avax)
- **Base** (base)
- **Optimism** (op)
- **BSC** (bsc)
- **Solana** (sol)
- **And more...**

### Data Types
- **Native tokens** (ETH, MATIC, AVAX, etc.)
- **ERC20 tokens** with price data
- **NFTs** (ERC721, ERC1155)
- **DeFi positions** (lending, borrowing, staking)
- **Transaction history** with classifications
- **USD valuations** and multi-currency support

## 🔗 API Reference

The plugin uses the DATAI API v1 endpoints:
- Base URL: `https://api-v1.mymerlin.io/api/merlin/public`
- Authentication: API key in Authorization header
- Rate limits: Configured with 140-second timeout for complex queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This plugin is part of the ElizaOS ecosystem. Please refer to the main ElizaOS license for terms and conditions.

## 🆘 Support

For issues and questions:
1. Check the [ElizaOS documentation](https://elizaos.github.io/eliza/)
2. Open an issue in the repository
3. Join the community Discord

---

**Note**: This plugin requires a valid DATAI API key. Contact DATAI for access and pricing information.
