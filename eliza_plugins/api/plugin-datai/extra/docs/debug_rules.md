# DataI Plugin Debug Rules

## Debugging Process

1. **Initialization & Setup**
   - User activates one action at a time in `src/index.ts`
   - User runs the app with `bun run build && bun start`
   - User tests with prompts from `action_examples.md`
   - Claude analyzes errors and proposes fixes

2. **Common Issues to Check**
   - Formatting function output formatting issues
   - Parameter validation and extraction errors
   - API endpoint URL construction
   - Data processing and transformation logic
   - Error handling

3. **Action Debug Checklist**
   - [ ] Verify the action name matches the constants in the prompt
   - [ ] Check validation function extracts the correct parameters
   - [ ] Verify endpoint construction and API call
   - [ ] Analyze data processing logic
   - [ ] Review output formatting function
   - [ ] Test error handling

4. **Specific Action Patterns**
   - **GET_ALL_USER_DEFI_POSITIONS**: Look for wallet extraction and chain formatting
   - **Token Balance Actions**: Verify token value calculations and formatting
   - **Transaction Actions**: Check transaction detail extraction and summarization
   - **NFT Actions**: Ensure proper collection and item formatting

5. **Action Debug Status**
   - [x] getAllUserDeFiPositions.ts (In progress)
   - [ ] getUserDeFiPositionsByChainAction.ts
   - [ ] getUserDeFiPositionsByMultipleChainsAction.ts
   - [ ] getUserDeFiPositionsByProtocolAction.ts
   - [ ] getUserDeFiProtocolBalancesByChainAction.ts
   - [ ] *Other actions to be added as we proceed*

## Common Fix Patterns

1. **Formatting Function Fixes**
   - Improve readability of output with proper spacing and formatting
   - Add details for position/token names, values, and percentages where applicable
   - Format currency values consistently with proper decimal places
   - Add headers and summaries for better user experience

2. **Parameter Extraction Fixes**
   - Improve regex patterns for extracting wallet addresses, chain IDs, transaction hashes
   - Add fallbacks for parameter extraction from different parts of the prompt
   - Add support for additional formats and aliases for chains

3. **API Integration Fixes**
   - Handle API response structure changes
   - Add proper error handling for different API error codes
   - Implement fallbacks for missing or null data in responses

4. **Testing Process**
   - Test each action with the corresponding prompt from action_examples.md
   - Document the actual response in action_examples.md
   - Compare actual vs expected output and identify issues
   - Fix issues and retest until the output matches expected format and content

## File Structure Reference

```
packages/plugin-datai/
├── src/
│   ├── index.ts                     # Plugin definition with action exports
│   ├── actions/                     # Action implementations
│   │   ├── getAllUserDeFiPositions.ts
│   │   └── ...                      # Other action files
│   ├── constants.ts                 # API endpoints and configuration
│   ├── types/                       # TypeScript type definitions
│   └── utils/
│       ├── apiClient.ts             # API client implementation
│       ├── validation.ts            # Parameter validation utilities
│       └── ...                      # Other utility files
├── action_examples.md               # Example prompts and expected responses
└── debug_rules.md                   # This file - debugging guidelines
```
## Implementation Progress Checklist

### User DeFi Positions Actions
- [X] getAllUserDeFiPositions.ts
- [ ] getUserDeFiPositionsByChainAction.ts
- [ ] getUserDeFiPositionsByMultipleChainsAction.ts
- [ ] getUserDeFiPositionsByProtocolAction.ts
- [ ] getUserDeFiProtocolBalancesByChainAction.ts

### Token Balance Actions
- [x] getGroupedTokenBalancesByMultipleChainsAction.ts
- [ ] getNativeTokenBalanceByChainAction.ts
- [ ] getTokenBalancesByChainAction.ts
- [ ] getWalletBalancesByChainAction.ts
- [ ] getUserOverallBalanceByChainAction.ts
- [ ] getUserOverallBalanceAllChainsAction.ts

### Transaction Actions
- [ ] getTransactionByHashAction.ts
- [ ] getTransactionsForDeFiPositionAction.ts
- [ ] getTransactionTransfersByHashAction.ts
- [ ] getUserTransactionOverviewAction.ts
- [ ] getUserTransactionsAction.ts
- [ ] getUserTransactionsByChainAction.ts

### Transaction History Actions
- [ ] getSolanaUserTxHistoryExtendedAction.ts
- [ ] getSolanaUserTxHistoryShortAction.ts
- [ ] getUserTxHistoryAllChainsShortAction.ts
- [ ] getUserTxHistoryByChainRawLabelAction.ts
- [ ] getUserTxByPeriodAndChainExtendedAction.ts
- [ ] getUserTxByPeriodAndChainRawLabel20Action.ts

### NFT Actions
- [ ] getUserNFTsByChainAction.ts
- [ ] getUserNFTsListAction.ts

## Action Examples

### GET_ALL_USER_DEFI_POSITIONS_ON_DATAI - getAllUserDeFiPositions.ts
**Prompt:**  
What are all my DATAI DeFi positions for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on DATAI?

**Response:**  
We will add here the reponse from the LLM 

---

### GET_GROUPED_TOKEN_BALANCES_BY_MULTIPLE_CHAINS - getGroupedTokenBalancesByMultipleChainsAction.ts
**Prompt:**  
Show me my tokens on Ethereum and Base for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on DATAI

**Response:**  
We will add here the reponse from the LLM

---

### GET_NATIVE_TOKEN_BALANCE_BY_CHAIN - getNativeTokenBalanceByChainAction.ts 
**Prompt:**  
What's my ETH balance for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3

**Response:**  
We will add here the reponse from the LLM

---

### GET_SOLANA_USER_TX_HISTORY_EXTENDED - getSolanaUserTxHistoryExtendedAction.ts
**Prompt:**  
Show me my detailed Solana transaction history for wallet rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ

**Response:**  
We will add here the reponse from the LLM

---

### GET_SOLANA_USER_TX_HISTORY_SHORT - getSolanaUserTxHistoryShortAction.ts
**Prompt:**  
Show me my recent Solana transactions for wallet HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g, limit to 5

**Response:**  
We will add here the reponse from the LLM

---

### GET_TOKEN_BALANCES_BY_CHAIN - getTokenBalancesByChainAction.ts
**Prompt:**  
What are the token balances for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3 on Base chain?

**Response:**  
We will add here the reponse from the LLM

---

### GET_TRANSACTION_BY_HASH - getTransactionByHashAction.ts
**Prompt:**  
Show me the details for transaction hash 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on Ethereum for wallet 0x218e312fF5181290A46e3f87A73A8aD40C05A944

**Response:**  
We will add here the reponse from the LLM

---

### GET_TRANSACTIONS_FOR_DEFI_POSITION - getTransactionsForDeFiPositionAction.ts
**Prompt:**  
Show me all transactions for DeFi position compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0

**Response:**  
We will add here the reponse from the LLM

---

### GET_TRANSACTION_TRANSFERS_BY_HASH - getTransactionTransfersByHashAction.ts
**Prompt:**  
Show me the token transfers for transaction hash 0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf on Ethereum for 0x218e312fF5181290A46e3f87A73A8aD40C05A944

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_DEFI_POSITIONS_BY_CHAIN - getUserDeFiPositionsByChainAction.ts
**Prompt:**  
What DeFi positions do I have on Arbitrum with wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS - getUserDeFiPositionsByMultipleChainsAction.ts
**Prompt:**  
What DeFi positions does wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 have on Avalanche and Arbitrum?

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_DEFI_POSITIONS_BY_PROTOCOL - getUserDeFiPositionsByProtocolAction.ts
**Prompt:**  
What positions does wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 have in avax_gmx protocol on Avalanche?

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN - getUserDeFiProtocolBalancesByChainAction.ts
**Prompt:**  
What are my DeFi protocol balances on Ethereum for wallet 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_NFTS_BY_CHAIN - getUserNFTsByChainAction.ts
**Prompt:**  
What NFTs do I own on Polygon for wallet 0x3764D79db51726E900a1380055F469eB6e2a7fD3?

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_NFTS_LIST - getUserNFTsListAction.ts
**Prompt:**  
What NFTs do I own? My wallet is 0x3764D79db51726E900a1380055F469eB6e2a7fD3

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_OVERALL_BALANCE_ALL_CHAINS - getUserOverallBalanceAllChainsAction.ts
**Prompt:**  
What is my total balance across all chains? My wallet address is 0x09CF915e195aF33FA7B932C253352Ae9FBdB0106

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_OVERALL_BALANCE_BY_CHAIN - getUserOverallBalanceByChainAction.ts
**Prompt:**  
What's my total balance on Avalanche? My wallet is 0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_TRANSACTION_OVERVIEW - getUserTransactionOverviewAction.ts
**Prompt:**  
Show me a transaction overview for wallet 0x4f2083f5fbede34c2714affb3105539775f7fe64

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_TRANSACTIONS - getUserTransactionsAction.ts 
**Prompt:**  
Show me transaction history for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_TRANSACTIONS_BY_CHAIN - getUserTransactionsByChainAction.ts
**Prompt:**  
Show me transaction history for wallet 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e on Ethereum

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED - getUserTxByPeriodAndChainExtendedAction.ts
**Prompt:**  
Show me transactions on xDai chain for wallet 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 with startTime=1716346533 and endTime=1705895733

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20 - getUserTxByPeriodAndChainRawLabel20Action.ts
**Prompt:**  
Show me raw labeled Ethereum transactions for 0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50 startTime=1716346533 and endTime=1705895733

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_TX_HISTORY_ALL_CHAINS_SHORT - getUserTxHistoryAllChainsShortAction.ts
**Prompt:**  
Give me a quick overview of my recent transactions for wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

**Response:**  
We will add here the reponse from the LLM

---

### GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL - getUserTxHistoryByChainRawLabelAction.ts
**Prompt:**  
Show me my raw labeled transaction history on Ethereum for 0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e

**Response:**  
We will add here the reponse from the LLM

---

### GET_WALLET_BALANCES_BY_CHAIN - getWalletBalancesByChainAction.ts
**Prompt:**  
What is in my wallet balance on Polygon for address 0x3764D79db51726E900a1380055F469eB6e2a7fD3 ?

**Response:**  
We will add here the reponse from the LLM