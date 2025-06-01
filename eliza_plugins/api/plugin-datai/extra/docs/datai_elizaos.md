## 1. Get All User DeFi Positions

Retrieves all DeFi positions for a given user across all supported chains.

**Endpoint:** `https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/all/{userAddress}`

**HTTP Method:** `GET`

**Authorization:** `Bearer <API_KEY>` (Header: `Authorization: YOUR_API_KEY`)

**Path Parameters:**
*   `userAddress` (string, required): The user's wallet address.

**Query Parameters:** None

**Request Body:** None

**Essential Information:**
*   This endpoint aggregates DeFi positions from various protocols and chains where the specified user address has activity.
*   The response can be quite large depending on the user's portfolio diversity.

**cURL to run (Generic):**
`curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/all/{userAddress}"`

**Test Parameters Used:**
*   `userAddress`: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`

**Tested cURL Command:**
`curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/all/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" | cat`

**Response:** Returns a JSON array of objects, where each object represents a protocol the user has positions in. Includes details like chain, protocol name, logo, site, and a portfolio array with supply, borrow, rewards, NAV, P&L, etc. (See original documentation for full response schema).

**Suggested Action Name:** `GET_ALL_USER_DEFI_POSITIONS`
**Corresponding .ts File:** `getAllUserDeFiPositions.ts`

---

## 2. Get User DeFi Positions by Chain

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/{userAddress}?chain={chain}"
```
*(Replace `{userAddress}` with the actual user's wallet address, and `{chain}` with the desired chain ID. Refer to `api_help.md` (Entry #7) for working examples like `userAddress=0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`, `chain=arb`)*

**Test Parameters Used:**
*   `userAddress`: `0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`
*   `chain`: `arb`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=arb" | cat
```
**Notes from cURL Testing:**
*   The API call with the specified parameters was **successful** and returned DeFi position data for the user on the Arbitrum chain.

**Essential Information:**
*   **Description:** Get all DeFi information (active open positions) for a specific user and a specific chain.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID to filter by (e.g., `eth`, `bsc`, `matic`).
*   **Response:** Returns a JSON array of protocol objects specific to the queried chain. Each object includes chain, protocol name, logo, site, and portfolio details (supply, borrow, rewards, NAV, P&L, poolData, etc.). (See original documentation for full response schema).

**Suggested Action Name:** `GET_USER_DEFI_POSITIONS_BY_CHAIN`
**Corresponding .ts File:** `getUserDeFiPositionsByChainAction.ts`

---

## 3. Get User DeFi Positions by Multiple Chains

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsByChains/{userAddress}?chains={chain1,chain2,...,chain10}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsByChains/{userAddress}?chains={chain1,chain2,...,chain10}"
```
*(Replace `{userAddress}` with the actual user's wallet address, and `{chain1,chain2,...,chain10}` with a comma-separated list of up to 10 chain IDs. Refer to `api_help.md` (Entry #8) for working examples like `userAddress=0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50`, `chains=avax,arb`)*

**Test Parameters Used:**
*   `userAddress`: `0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50`
*   `chains`: `avax,arb`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsByChains/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chains=avax,arb" | cat
```
**Notes from cURL Testing:**
*   The API call with the specified parameters was **successful** and returned DeFi position data for the user on the Avalanche and Arbitrum chains.

**Essential Information:**
*   **Description:** Get all DeFi historical information (active open positions) for a specific user across multiple specified chains (up to 10).
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chains` (string, required): A comma-separated list of chain IDs (e.g., `eth,bsc,matic`). Supports up to 10 chains.
*   **Response:** Returns a JSON array of protocol objects, aggregated from the specified chains. Each object includes chain, protocol name, logo, site, and portfolio details. (See original documentation for full response schema).

**Suggested Action Name:** `GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS`
**Corresponding .ts File:** `getUserDeFiPositionsByMultipleChainsAction.ts`

---

## 4. Get User DeFi Positions by Protocol

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/protocol/{userAddress}?chain={chain}&protocol={protocol}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/protocol/{userAddress}?chain={chain}&protocol={protocol}"
```
*(Replace `{userAddress}` with the actual user's wallet address, `{chain}` with the chain ID, and `{protocol}` with the protocol identifier. Refer to `api_help.md` for working examples like `userAddress=0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50`, `chain=avax`, `protocol=avax_gmx`)*

**Test Parameters Used:**
*   `userAddress`: `0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50`
*   `chain`: `avax`
*   `protocol`: `avax_gmx`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/protocol/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=avax&protocol=avax_gmx" | cat
```

**Essential Information:**
*   **Description:** Get all DeFi historical information (active open positions) for a specific user, on a specific chain, and for a specific protocol.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`, `avax`).
    *   `protocol` (string, required): The protocol identifier (e.g., `1inch2`, `aave_v3`, `avax_gmx` - protocol names can be found from other endpoints or `api_help.md`).
*   **Response:** Returns a JSON array containing the DeFi positions for the specified protocol. The response includes protocol details (chain, name, logo, site) and a portfolio array with supply, debt, rewards, NAV, etc. (See original documentation for schema details).

**Suggested Action Name:** `GET_USER_DEFI_POSITIONS_BY_PROTOCOL`
**Corresponding .ts File:** `getUserDeFiPositionsByProtocolAction.ts`

---

## 5. Get User DeFi Protocol Balances by Chain

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/protocol/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/protocol/{userAddress}?chain={chain}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{chain}` with the chain ID. Refer to `api_help.md` for working examples like `userAddress=0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`, `chain=eth`)*

**Test Parameters Used:**
*   `userAddress`: `0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`
*   `chain`: `eth`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/protocol/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=eth" | cat
```

**Essential Information:**
*   **Description:** Get all DeFi balances (balances from active open positions) for a specific user, aggregated by protocol on a specific chain.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`).
*   **Response:** Returns a JSON array of objects, where each object represents a protocol (identified by `chain`, `name`, `commonName`, `logo`, `site`) and its `balance` details (navUSD, assetUSD, debtUSD) for the user on the specified chain. (See original documentation for schema details).

**Suggested Action Name:** `GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN`
**Corresponding .ts File:** `getUserDeFiProtocolBalancesByChainAction.ts`

---

## 6. Get User Overall Balance Across All Chains

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/all/{userAddress}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/all/{userAddress}"
```
*(Replace `{userAddress}` with the actual user's wallet address. Refer to `api_help.md` for working examples like `0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`)*

**Test Parameters Used:**
*   `userAddress`: `0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/all/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106" | cat
```

**Essential Information:**
*   **Description:** Get the user's overall balance across all chains, including tokens, NFTs, and DeFi exposures.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:** None specified.
*   **Response:** Returns a JSON object containing `totalValueUsd` and a `byChain` array. Each element in `byChain` represents a chain and includes `id`, `name`, `logoUrl`, `wrappedTokenId`, `valueUsd`, and `fiatValues` (USD, AED, AUD, CAD, EUR, GBP, INR). (See original documentation for detailed schema of array elements).

**Suggested Action Name:** `GET_USER_OVERALL_BALANCE_ALL_CHAINS`
**Corresponding .ts File:** `getUserOverallBalanceAllChainsAction.ts`

---

## 7. Get User Overall Balance by Chain

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/chain/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/chain/{userAddress}?chain={chain}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{chain}` with the chain ID. Refer to `api_help.md` for working examples like `userAddress=0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3`, `chain=avax`)*

**Test Parameters Used:**
*   `userAddress`: `0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3`
*   `chain`: `avax`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/chain/0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3?chain=avax" | cat
```

**Essential Information:**
*   **Description:** Get the user's overall balance for a specific chain, including tokens, NFTs, and DeFi exposures.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`, `avax`).
*   **Response:** Returns a JSON object with the user's total balance on the specified chain, denominated in various fiat currencies (e.g., `valueUsd`, `valueEUR`, `valueAUD`, `valueCAD`, `valueAED`, `valueINR`, `valueGBP`).

**Suggested Action Name:** `GET_USER_OVERALL_BALANCE_BY_CHAIN`
**Corresponding .ts File:** `getUserOverallBalanceByChainAction.ts`

---

## 8. Get User Wallet Balances by Chain (Native, Tokens, NFTs)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/{userAddress}?chain={chain}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{chain}` with the chain ID. Refer to `api_help.md` for working examples like `userAddress=0x3764D79db51726E900a1380055F469eB6e2a7fD3`, `chain=matic`)*

**Test Parameters Used:**
*   `userAddress`: `0x3764D79db51726E900a1380055F469eB6e2a7fD3`
*   `chain`: `matic`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic" | cat
```

**Essential Information:**
*   **Description:** Get the user's direct wallet balances for a specific chain, including native currency, tokens (ERC20, etc.), and NFTs (ERC721, ERC1155).
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`, `matic`).
*   **Response:** Returns a JSON object containing `nativeBalance`, `nativeBalanceDecimal`, an array of `tokenBalances` (with details like `tokenAddress`, `tokenName`, `tokenSymbol`, `tokenDecimals`, `balance`, `logoUrl`), and an array of `nfts` (with details like `tokenAddress`, `tokenName`, `tokenSymbol`, `chain`, `tokenId`, `contractType`, `ownerOf`, `detailUrl`). (See original documentation for schema details).

**Suggested Action Name:** `GET_WALLET_BALANCES_BY_CHAIN`
**Corresponding .ts File:** `getWalletBalancesByChainAction.ts`

---

## 9. Get User Native Token Balance by Chain

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/native/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/native/{userAddress}?chain={chain}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{chain}` with the chain ID. Refer to `api_help.md` for working examples like `userAddress=0x3764D79db51726E900a1380055F469eB6e2a7fD3`, `chain=eth`)*

**Test Parameters Used:**
*   `userAddress`: `0x3764D79db51726E900a1380055F469eB6e2a7fD3`
*   `chain`: `eth`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/native/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=eth" | cat
```

**Essential Information:**
*   **Description:** Get the user's wallet balance for the native token of a specific chain (e.g., ETH for Ethereum, MATIC for Polygon).
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`).
*   **Response:** Returns a JSON object with `balance` (BigInt string representation) and `balanceDecimal` (float representation) of the native token.

**Suggested Action Name:** `GET_NATIVE_TOKEN_BALANCE_BY_CHAIN`
**Corresponding .ts File:** `getNativeTokenBalanceByChainAction.ts`

---

## 10. Get User Token Balances by Chain (Including Native)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/token/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/token/{userAddress}?chain={chain}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{chain}` with the chain ID. Refer to `api_help.md` for working examples like `userAddress=0x3764D79db51726E900a1380055F469eB6e2a7fD3`, `chain=base`)*

**Test Parameters Used:**
*   `userAddress`: `0x3764D79db51726E900a1380055F469eB6e2a7fD3`
*   `chain`: `base`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=base" | cat
```

**Essential Information:**
*   **Description:** Get the user's wallet balances for all tokens, including the native token, on a specific chain. Provides detailed information for each token including price and fiat values.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`, `base`).
*   **Response:** Returns a JSON array of token objects. Each object includes `token_address`, `name`, `symbol`, `logo`, `decimals`, `balance`, `price`, and a `prices` object with various fiat currency denominations. Native token information might be implicitly included if the API treats it like other tokens on that chain or might require a separate call to the native balance endpoint for explicit native token details.

**Suggested Action Name:** `GET_TOKEN_BALANCES_BY_CHAIN`
**Corresponding .ts File:** `getTokenBalancesByChainAction.ts`

---

## 11. Get User Token Balances by Multiple Chains

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/chains/token/{userAddress}?chains={chain1,chain2}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/chains/token/{userAddress}?chains={chain1,chain2}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{chain1,chain2}` with a comma-separated list of chain IDs (e.g., eth,matic). Refer to `api_help.md` for working examples like `userAddress=0x3764D79db51726E900a1380055F469eB6e2a7fD3`, `chains=base,eth`)*

**Test Parameters Used:**
*   `userAddress`: `0x3764D79db51726E900a1380055F469eB6e2a7fD3`
*   `chains`: `base,eth`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/chains/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chains=base,eth" | cat
```

**Essential Information:**
*   **Description:** Get the user's token balances (including native) for multiple specified chains, grouped by chain.
*   **Suggested Action Name:** `GET_USER_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_ACTION`
*   **Corresponding .ts File:** `getTokenBalancesByMultipleChainsAction.ts`
*   **Response:** Returns a JSON object where keys are chain IDs and values are arrays of token balance objects for that chain.
*   **Notes:**
    *   The `{chains}` parameter should be a comma-separated list of chain IDs (e.g., `eth,matic,bsc`).
    *   Provides a consolidated view of token holdings across selected networks.

---

## 12. Get All User NFTs by Chain

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/{userAddress}"
```
*(Replace `{userAddress}` with the actual user's wallet address. The original endpoint includes a `?chain={chain}` parameter to filter by a specific chain. However, testing shows that omitting the `?chain={chain}` parameter successfully retrieves all NFTs for the user across all chains. For specific chain, add `?chain={chain}`. Refer to `api_help.md` for `userAddress` examples like `0x3764D79db51726E900a1380055F469eB6e2a7fD3`.)*

**Test Parameters Used (for all NFTs across all chains):**
*   `userAddress`: `0x3764D79db51726E900a1380055F469eB6e2a7fD3`
*   `chain`: (Omitted to fetch from all chains)

**Tested cURL Command (all NFTs across all chains):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/0x3764D79db51726E900a1380055F469eB6e2a7fD3" | cat
```

**Notes from cURL Testing:**
*   The API call using the endpoint `https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/0x3764D79db51726E900a1380055F469eB6e2a7fD3` (without a specific chain parameter) was **successful**.
*   It returned a comprehensive list of NFTs owned by the specified address across multiple chains (e.g., base, matic, eth, era, xdai, celo, klay, zora).
*   This confirms that the `/balances/nft/all/{userAddress}` path can be used to get a global view of a user's NFT holdings. To get NFTs for a *specific* chain, the `?chain={chain}` parameter should be appended as per the main endpoint definition.

**Suggested Action Name:** `GET_USER_NFTS_LIST`
**Corresponding .ts File:** `getUserNFTsListAction.ts`

---

## 13. Get User NFT List by Chain

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/balances/nft/chain/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/nft/chain/{userAddress}?chain={chain}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{chain}` with the chain ID. Refer to `api_help.md` for working examples like `userAddress=0x3764D79db51726E900a1380055F469eB6e2a7fD3`, `chain=matic`)*

**Test Parameters Used:**
*   `userAddress`: `0x3764D79db51726E900a1380055F469eB6e2a7fD3`
*   `chain`: `matic`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/nft/chain/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic" | cat
```

**Essential Information:**
*   **Description:** Get the user's wallet list of NFTs for a specific chain.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`).
*   **Response:** Returns a JSON array of NFT objects for the specified chain. Each object includes `tokenAddress`, `tokenName`, `tokenSymbol`, `chain`, `tokenId`, `contractType`, `ownerOf`, `blockNumberMinted`, and `detailUrl`. (See original documentation for schema details).

**Suggested Action Name:** `GET_USER_NFTS_BY_CHAIN`
**Corresponding .ts File:** `getUserNFTsByChainAction.ts`

---

## 14. Get User Transaction History - All Chains, Extended Info

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/{userAddress}?limit={limit}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/{userAddress}?limit={limit}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{limit}` with the desired number of transactions. Refer to `api_help.md` for working examples like `userAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`, `limit=5`)*

**Test Parameters Used:**
*   `userAddress`: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
*   `limit`: `5`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=5" | cat
```

**Essential Information:**
*   **Description:** Get the latest transactions (default 100) for a specific user, across all supported chains they are active on (excluding Solana, which has a dedicated endpoint). Includes classification and DeFi PNL.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters (from description, not formally listed but important):**
    *   `startTime` (timestamp, optional): If set, will return the latest transactions (up to default/specified limit) *prior* to this Unix timestamp.
    *   `limit` (integer, optional, behavior observed): While the docs state a default of 100, testing with `?limit=5` appeared to return a smaller set. Official support for a `limit` param should be confirmed.
*   **Response:** Returns a JSON array of transaction objects. Each object is detailed, including `id`, `balances` (tokens moved, with full details), `chain`, `hash`, `timeStamp`, `txFee`, `txFeeUsd`, `txType`, `protocol`, `pnlUsd`, `yieldUSD`, etc. (See original documentation for the extensive schema).
*   **Note:** The documentation explicitly states, "*For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below."

**Suggested Action Name:** `GET_USER_TRANSACTIONS`
**Corresponding .ts File:** `getUserTransactionsAction.ts`

---

## 15. Get User Transaction History - All Chains (Default 20)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/{userAddress}?limit={limit}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/{userAddress}?limit={limit}"
```
*(Replace `{userAddress}` with the actual user's wallet address and `{limit}` with the desired number of transactions. The API defaults to 20 transactions if limit is not specified. Refer to `api_help.md` for working examples like `userAddress=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`, `limit=10`)*

**Test Parameters Used:**
*   `userAddress`: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
*   `limit`: `10`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=10" | cat
```

**Essential Information:**
*   **Description:** Get the latest transactions (default 20) for a specific user, across all supported chains they are active on (excluding Solana). Includes classification and DeFi PNL.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters (from description, not formally listed but important):**
    *   `startTime` (timestamp, optional): If set, will return the latest transactions (up to 20) *prior* to this Unix timestamp.
*   **Response:** Returns a JSON array of transaction objects, similar in structure to the `/extended/` endpoint. (See original documentation for schema).
*   **Note:**
    *   The documentation explicitly states, "*For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below."
    *   Testing with address `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` returned `List is empty.`, while the `/extended/` version returned data for the same address. This suggests a potential difference in data availability or filtering between the two endpoints.

**Suggested Action Name:** `GET_USER_TX_HISTORY_ALL_CHAINS_SHORT`
**Corresponding .ts File:** `getUserTxHistoryAllChainsShortAction.ts`

---

## 16. Get User Transaction History by Chain - Extended (Default 100)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/{userAddress}?chain={chain}&limit={limit}"
```
*(Replace `{userAddress}` with the user's wallet address, `{chain}` with the chain ID, and optionally `{limit}`. The API defaults to 100 transactions. Refer to `api_help.md` (Entry #16) for working examples like `userAddress=0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e`, `chain=eth`, `limit=10`)*

**Test Parameters Used:**
*   `userAddress`: `0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e`
*   `chain`: `eth`
*   `limit`: `10`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10" | cat
```

**Essential Information:**
*   **Description:** Get the latest transactions (default 100) for a specific user on a specific chain (excluding Solana). Includes classification and DeFi PNL.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`). Cannot be Solana for this endpoint.
    *   `startTime` (timestamp, optional): If set, will return the latest transactions (up to default/specified limit) on that chain *prior* to this Unix timestamp.
    *   `limit` (integer, optional, behavior observed): While docs state a default of 100, testing with `&limit=5` returned a smaller set. Official support should be confirmed.
*   **Response:** Returns a JSON array of transaction objects for the specified chain. Structure is similar to the `history/all/extended` endpoint. (See original documentation for schema).
*   **Note:** The documentation explicitly states, "*For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below."

**Suggested Action Name:** `GET_USER_TRANSACTIONS_BY_CHAIN`
**Corresponding .ts File:** `getUserTransactionsByChainAction.ts`

---

## 17. Get User Transaction History by Chain - Raw Label (Default 400, No USD Values)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}?chain={chain}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}?chain={chain}&limit={limit}"
```
*(Replace `{userAddress}` with the actual user's wallet address, `{chain}` with the chain ID, and optionally `{limit}`. The API defaults to 400 transactions. Refer to `api_help.md` (Entry #17) for working examples like `userAddress=0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e`, `chain=eth`. Test used `limit=10` for brevity.)*

**Test Parameters Used:**
*   `userAddress`: `0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e`
*   `chain`: `eth`
*   `limit`: `10`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10" | cat
```

**Essential Information:**
*   **Description:** Get the latest transactions (default 400) for a specific user on a specific chain (excluding Solana). This version excludes token USD valuations (e.g., `balanceUSD`, `txFeeUsd` will be 0 or null) but includes classification.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`). Cannot be Solana for this endpoint.
    *   `startTime` (timestamp, optional): If set, will return the latest transactions (up to default/specified limit) on that chain *prior* to this Unix timestamp.
    *   `limit` (integer, optional, behavior observed): While docs state a default of 400, testing with `&limit=5` returned a smaller set. Official support should be confirmed.
*   **Response:** Returns a JSON array of transaction objects for the specified chain. USD value fields (like `balanceUSD`, `txFeeUsd`, `pnlUsd`, `yieldUSD`) will be 0 or null. Otherwise, the structure is similar to other transaction history endpoints. (See original documentation for schema).
*   **Note:** The documentation explicitly states, "*For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below."

**Suggested Action Name:** `GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL`
**Corresponding .ts File:** `getUserTxHistoryByChainRawLabelAction.ts`

---

## 18. Get Solana User Transaction History - Extended (Default 100)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/{userAddress}?chain=solana`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/{userAddress}?chain=solana&limit={limit}"
```
*(Replace `{userAddress}` with the actual Solana user's wallet address and optionally `{limit}`. The API defaults to 100 transactions. Refer to `api_help.md` (Entry #18) for working examples like `userAddress=rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ`, `limit=5` and optional `beforeHash` parameter.)*

**Test Parameters Used:**
*   `userAddress`: `rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ`
*   `chain`: `solana`
*   `limit`: `5`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ?chain=solana&limit=5" | cat
```

**Essential Information:**
*   **Description:** Retrieves extended transaction history for a Solana user address. Includes detailed information for each transaction.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The Solana wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): Must be set to `solana`.
    *   `beforeHash` (string, optional): If set, will return the latest transactions (up to default/specified limit) *prior* to this specific Solana transaction hash. Used for pagination.
    *   `limit` (integer, optional, behavior observed): While docs state a default of 100, testing with `&limit=5` appeared to return a smaller set. Official support should be confirmed.
*   **Response:** Returns a JSON array of Solana transaction objects. Schema includes fields like `id` (transaction signature), `timeStamp`, `from`, `to`, `chain` (`solana`), `protocol`, `txType`, `txAction`, `hash`, `txFee`, `balances` (SPL token or SOL movements). (See original documentation for Solana-specific example response schema).
*   **Note:** Classification coverage for Solana transactions is noted as limited: Wallet to Wallet Transfers (Send, Receive), NFT Airdrops, Liquidity Pool Exchange, Staking Deposits and Withdrawals. Extended coverage coming soon (as per original docs).

**Suggested Action Name:** `GET_SOLANA_USER_TX_HISTORY_EXTENDED`
**Corresponding .ts File:** `getSolanaUserTxHistoryExtendedAction.ts`

---

## 19. Get Solana User Transaction History - Short (Default 20)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/{userAddress}?chain=solana`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/{userAddress}?chain=solana&limit={limit}"
```
*(Replace `{userAddress}` with the actual user's Solana wallet address, and optionally `{limit}`. The API defaults to 20 transactions. Refer to `api_help.md` (Entry #19) for working examples like `userAddress=HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g`, `limit=5`. Remove `&limit=5` for default behavior.)*

**Test Parameters Used:**
*   `userAddress`: `HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g`
*   `chain`: `solana`
*   `limit`: `5`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g?chain=solana&limit=5" | cat
```

**Essential Information:**
*   **Description:** Get the latest Solana transactions (default 20) for a specific user on the Solana chain. Includes classification (with limited coverage as per docs).

**Suggested Action Name:** `GET_SOLANA_USER_TX_HISTORY_SHORT`
**Corresponding .ts File:** `getSolanaUserTxHistoryShortAction.ts`

---

## 20. Get User Transactions by Period - All Chains, Extended (Up to 100)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/all/extended/{userAddress}?startTime={Integer}&endTime={Integer}`
**Corresponding .ts File:** `getUserTxByPeriodAllChainsExtendedAction.ts`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: YOUR_API_KEY" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/all/extended/{userAddress}?startTime={startTime}&endTime={endTime}&limit={limit}"
```
*(Replace `{userAddress}`, `{startTime}`, `{endTime}`, and optionally `{limit}`. Timestamps are Unix timestamps. `limit` is optional, default up to 100. Note: User-provided working examples may have specific `startTime`/`endTime` conventions, and the API documentation itself can sometimes have `startTime` as the LATER date and `endTime` as the EARLIER date for period queries.)*

**Test Parameters Used (User-provided working cURL):**
*   `userAddress`: `0x9a25d79ab755718e0b12bd3c927a010a543c2b31`
*   `startTime`: `1703999553`
*   `endTime`: `1698729153`
*   API Key: `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH`

**Tested cURL Command (User-provided working cURL):**
```bash
curl --location "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/all/extended/0x9a25d79ab755718e0b12bd3c927a010a543c2b31?startTime=1703999553&endTime=1698729153" --header "Authorization: OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH" | cat
```
**Notes from cURL testing:**
*   This cURL command and parameters were provided by the user as a working example.
*   The API key `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH` was used.
*   It's important to note the `startTime` (1703999553) is later than `endTime` (1698729153) in this working example, and this is how the API expects it for this call as confirmed by the user.
*   Previous tests with the `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` API key for this endpoint type sometimes returned empty arrays. This user-provided cURL is taken as the current correct working example.

**Essential Information:**
*   **Description:** Get up to 100 transactions for a specific user, across all supported chains (excluding Solana), within a specified timeframe. Includes classification and DeFi PNL.
*   **API Key:** Pass the API key in the `Authorization` header (e.g., `Authorization: YOUR_API_KEY`). The user-provided working example uses `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH`.
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user. (The user provided `0x9a25d79ab755718e0b12bd3c927a010a543c2b31` for this specific cURL test. Previous generic example used `0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`).
*   **Query Parameters:**
    *   `startTime` (integer, required): Unix timestamp. In the user-provided working example, this was the LATER date of the period.
    *   `endTime` (integer, required): Unix timestamp. In the user-provided working example, this was the EARLIER date of the period.
    *   `limit` (integer, optional, behavior observed): While docs imply a max of 100, testing with `&limit=5` returned a smaller set. Official support/behavior for overriding the default 100 should be confirmed.
*   **Response:** Returns a JSON array of transaction objects within the specified period. Structure is similar to other extended transaction history endpoints. (See original documentation for schema).
*   **Note:** 
    *   The API documentation has sometimes specified `startTime` as LATER date, `endTime` as EARLIER date for period queries. The user-provided working example follows this.
    *   "Solana blockchain transactions cannot be retrieved by timeframe."
    *   If 100 transactions are returned and `endTime` is older than the oldest transaction retrieved, more transactions might exist in the timeframe, requiring adjusted calls.

**Suggested Action Name:** `GET_USER_TX_BY_PERIOD_ALL_CHAINS_EXTENDED`
**Corresponding .ts File:** `getUserTxByPeriodAllChainsExtendedAction.ts`

---

## 21. Get User Transactions by Period and Chain - Extended (Up to 100) 

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/{userAddress}?chain={chain}&startTime={Integer}&endTime={Integer}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: YOUR_API_KEY" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/{userAddress}?chain={chain}&startTime={startTime}&endTime={endTime}&limit={limit}"
```
*(Replace `{userAddress}`, `{chain}`, `{startTime}`, `{endTime}`, and optionally `{limit}`. Timestamps are Unix timestamps. `limit` is optional, default up to 100. Note: User-provided working examples may have specific `startTime`/`endTime` conventions, and the API documentation itself can sometimes have `startTime` as the LATER date and `endTime` as the EARLIER date for period queries.)*

**Test Parameters Used (User-provided working cURL):**
*   `userAddress`: `0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50`
*   `chain`: `xdai`
*   `startTime`: `1716346533`
*   `endTime`: `1705895733`
*   API Key: `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH`

**Tested cURL Command (User-provided working cURL):**
```bash
curl --location "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?startTime=1716346533&endTime=1705895733&chain=xdai" --header "Authorization: OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH" | cat
```
**Notes from cURL Testing:**
*   This cURL command and parameters were provided by the user as a working example.
*   The API key `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH` was used.
*   It's important to note the `startTime` (1716346533) is later than `endTime` (1705895733) in this working example, and this is how the API expects it for this call as confirmed by the user.
*   Previous tests with the `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` API key for this endpoint type sometimes returned empty arrays or had different timestamp conventions. This user-provided cURL is taken as the current correct working example.

**Essential Information:**
*   **Description:** Get up to 100 transactions for a specific user, on a specific chain (excluding Solana), within a specified timeframe. Includes classification and DeFi PNL.
*   **API Key:** Pass the API key in the `Authorization` header (e.g., `Authorization: YOUR_API_KEY`). The user-provided working example uses `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH`.
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `xdai`). Cannot be Solana.
    *   `startTime` (integer, required): Unix timestamp. In the user-provided working example, this was the LATER date of the period.
    *   `endTime` (integer, required): Unix timestamp. In the user-provided working example, this was the EARLIER date of the period.
    *   `limit` (integer, optional, behavior observed): Testing with `&limit=5` returned a smaller set. Default is up to 100.
*   **Response:** Returns a JSON array of transaction objects for the specified chain and period. Structure similar to other extended transaction history endpoints. (See original documentation for schema).
*   **Note:** 
    *   The API documentation has sometimes specified `startTime` as LATER date, `endTime` as EARLIER date for period queries. The user-provided working example follows this.
    *   "Solana blockchain transactions cannot be retrieved by timeframe."
    *   If 100 transactions are returned and `endTime` is older than the oldest retrieved, more might exist in the timeframe.

**Suggested Action Name:** `GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED`
**Corresponding .ts File:** `getUserTxByPeriodAndChainExtendedAction.ts`

---

## 22. Get User Transactions by Period and Chain - Raw Label (Fixed 20 Limit, No USD Values) 

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}?chain={chain}&startTime={Integer}&endTime={Integer}`
**Corresponding .ts File:** `getUserTxByPeriodAndChainRawLabel20Action.ts`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: YOUR_API_KEY" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}?chain={chain}&startTime={startTime}&endTime={endTime}"
```
*(Replace `{userAddress}`, `{chain}`, `{startTime}`, and `{endTime}`. Timestamps are Unix timestamps. The `/20/` in the path fixes the limit. Note: User-provided working examples may have specific `startTime`/`endTime` conventions, and the API documentation itself can sometimes have `startTime` as the LATER date and `endTime` as the EARLIER date for period queries.)*

**Test Parameters Used (User-provided working cURL):**
*   `userAddress`: `0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50`
*   `chain`: `eth`
*   `startTime`: `1716346533`
*   `endTime`: `1705895733`
*   API Key: `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS`

**Tested cURL Command (User-provided working cURL):**
```bash
curl --location "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=eth&startTime=1716346533&endTime=1705895733" --header "Authorization: OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH" | cat
```
**Notes from cURL testing:**
*   This cURL command and parameters were provided by the user as a working example.
*   The API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` was used.
*   It's important to note the `startTime` (1716346533) is later than `endTime` (1705895733) in this working example, and this is how the API expects it for this call as confirmed by the user.
*   Previous tests with the `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` API key for this endpoint type sometimes returned empty arrays. This user-provided cURL is taken as the current correct working example.

**Essential Information:**
*   **Description:** Get up to 20 transactions for a specific user, on a specific chain (excluding Solana), within a specified timeframe. This version excludes token USD valuations and has the limit of 20 fixed in the path.
*   **API Key:** Pass the API key in the `Authorization` header (e.g., `Authorization: YOUR_API_KEY`). The user-provided working example uses `OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH`.
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user. The `/20/` segment in the path indicates a fixed limit.
*   **Query Parameters:**
    *   `chain` (string, required): The chain ID (e.g., `eth`). Cannot be Solana.
    *   `startTime` (integer, required): Unix timestamp. In the user-provided working example, this was the LATER date of the period.
    *   `endTime` (integer, required): Unix timestamp. In the user-provided working example, this was the EARLIER date of the period.
*   **Response:** Returns a JSON array of up to 20 transaction objects for the specified chain and period. USD value fields will be 0 or null. (See original documentation for schema).
*   **Note:** 
    *   The API documentation has sometimes specified `startTime` as LATER date, `endTime` as EARLIER date for period queries. The user-provided working example follows this.
    *   "Solana blockchain transactions cannot be retrieved by timeframe."
    *   If 20 transactions are returned and `endTime` is older than the oldest retrieved, more transactions might exist.

**Suggested Action Name:** `GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20`
**Corresponding .ts File:** `getUserTxByPeriodAndChainRawLabel20Action.ts`

---

## 23. Get Transaction by Hash (Supports EVM and Solana)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/{chain}/{hash}/{userAddress}`

**cURL to run (EVM example - Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/{chain}/{hash}/{userAddress}"
```
*(Replace `{chain}`, `{hash}`, and `{userAddress}` with actual values. Refer to `api_help.md` (Entry #23) for EVM example: `chain=eth`, `hash=0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf`, `userAddress=0x218e312fF5181290A46e3f87A73A8aD40C05A944`)*

**Test Parameters Used (EVM):**
*   `chain`: `eth`
*   `hash`: `0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf`
*   `userAddress`: `0x218e312fF5181290A46e3f87A73A8aD40C05A944`

**Tested cURL Command (EVM):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944" | cat
```

**cURL to run (Solana example - Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/solana/{solana_hash}/{solana_address}"
```
*(Replace `{solana_hash}` and `{solana_address}`. Example from `datai_elizaos.md` docs (not `api_help.md` for this specific call): `solana_hash=4FrW8iAy211cNn1mtGDD7KE5VwAbuR5CqYKTuL9oEwN36VquE5nViscvEcJRgdjftBq8K8qZjrr7Kqdb29PADQYG`, `solana_address=HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g`. This specific Solana example was not re-tested in this session, refer to original successful test if needed.)*

**Essential Information:**
*   **Description:** Get full transaction details for a specific transaction hash. Supports all chains compatible with Advanced Transactions, including EVM chains and Solana.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `chain` (string, required): The chain ID of the transaction (e.g., `eth`, `bsc`, `solana`).
    *   `hash` (string, required): The transaction hash (hex string for EVM, base58 string for Solana).
    *   `userAddress` (string, required): The wallet address associated with the transaction context (can be sender or receiver, used for enrichment like PNL if applicable).
*   **Query Parameters:** None specified.
*   **Response:** Returns a single JSON transaction object with detailed information. (See original documentation for schema).

**Suggested Action Name:** `GET_TRANSACTION_BY_HASH`
**Corresponding .ts File:** `getTransactionByHashAction.ts`

---

## 24. Get Transaction Transfers by Hash (Supports EVM and Solana)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/{chain}/{hash}/{userAddress}`

**cURL to run (EVM example - Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/{chain}/{hash}/{userAddress}"
```
*(Replace `{chain}`, `{hash}`, and `{userAddress}` with actual values. Refer to `api_help.md` (Entry #24) for EVM example: `chain=eth`, `hash=0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf`, `userAddress=0x218e312fF5181290A46e3f87A73A8aD40C05A944`)*

**Test Parameters Used (EVM):**
*   `chain`: `eth`
*   `hash`: `0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf`
*   `userAddress`: `0x218e312fF5181290A46e3f87A73A8aD40C05A944`

**Tested cURL Command (EVM):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944" | cat
```

**cURL to run (Solana example - Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/solana/{solana_hash}/{solana_address}"
```
*(Replace `{solana_hash}` and `{solana_address}`. `api_help.md` does not provide a direct Solana example for this specific `userTxTransfers` endpoint, but the structure is similar to the `userTx/byHash` Solana calls. Refer to Section 23 or original `datai_elizaos.md` for Solana hash/address examples if needed for testing.)*

**Essential Information:**
*   **Description:** Get only the transaction transfers (moved balances) for a specific transaction hash. Supports EVM and Solana chains.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `chain` (string, required): The chain ID of the transaction (e.g., `eth`, `solana`).
    *   `hash` (string, required): The transaction hash.
    *   `userAddress` (string, required): The wallet address associated with the transaction context.
*   **Query Parameters:** None specified.
*   **Response:** Returns a JSON array of transfer objects. Each object details a balance movement, including `balance`, `balanceUSD`, `tokenAddress`, `tokenSymbol`, `tokenName`, `tokenDecimals`, `standard`, `from`, and `to`. (See original documentation for schema details, which matches the EVM test result structure).

**Suggested Action Name:** `GET_TRANSACTION_TRANSFERS_BY_HASH`
**Corresponding .ts File:** `getTransactionTransfersByHashAction.ts`

---

## 25. Get Transactions for a DeFi Position (Up to 100)

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/userTx/position/?position={position}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userTx/position/?position={position_id}"
```
*(Replace `{position_id}` with an actual, valid position identifier. Refer to `api_help.md` (Entry #25) for a working example: `position=compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0`)*

**Test Parameters Used:**
*   `position`: `compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userTx/position/?position=compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0" | cat
```

**Essential Information:**
*   **Description:** Get all transactions (up to 100) for a specific user's DeFi position in a protocol. Includes classification and DeFi PNL. Applies to DeFi P&L supported protocol positions.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:** None.
*   **Query Parameters:**
    *   `position` (string, required): The identifier of the DeFi position.
*   **Response:** Returns a JSON array of transaction objects related to the specified DeFi position. Each object contains detailed transaction information, including `id`, `balances`, `chain`, `hash`, `protocol`, `txType`, `pnlUsd`, etc. (See original documentation for the extensive schema).
*   **NOT CLEAR:**
    *   The exact format of the `{position}` identifier is not clear from the documentation or simple inspection of other endpoint responses.
    *   Testing with a guessed ID `20036` (potentially a Uniswap V3 NFT ID from an example) resulted in "Subgraph 20036 not found".
    *   **Action:** Need to clarify with the API provider how to obtain valid `position` identifiers for use with this endpoint.

**Suggested Action Name:** `GET_TRANSACTIONS_FOR_DEFI_POSITION`
**Corresponding .ts File:** `getTransactionsForDeFiPositionAction.ts`

---

## 26. Get User Transaction Overview - NEED TO FIX IN THE CONSTANT.ts

**Endpoint:** `@https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/{userAddress}`

**cURL to run (Generic):**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/{userAddress}"
```
*(Replace `{userAddress}` with the actual user's wallet address. Refer to `api_help.md` (Entry #26) for a working example: `userAddress=0x4f2083f5fbede34c2714affb3105539775f7fe64`)*

**Test Parameters Used:**
*   `userAddress`: `0x4f2083f5fbede34c2714affb3105539775f7fe64`

**Tested cURL Command:**
```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/0x4f2083f5fbede34c2714affb3105539775f7fe64" | cat
```

**Essential Information:**
*   **Description:** Get a list of chains the specific user is active on, and the number of transactions initiated by the user on those chains (excluding Solana). This is not the total number of transactions involved but only those initiated by the user.
*   **API Key:** Pass the API key `dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS` in the `Authorization` header (e.g., `Authorization: your_api_key`).
*   **Method:** `GET`
*   **Path Parameters:**
    *   `userAddress` (string, required): The wallet address of the user.
*   **Query Parameters:** None specified.
*   **Response:** Returns a JSON object containing `wallet` address, `nbOfChains` active, `nbOfTransactions` initiated, `creationTimestamp` of the wallet, and an `overview` array. Each item in the `overview` array represents a chain and includes `chainId`, `creationTimestamp` (first activity on that chain), and `nbOfTransactions` (initiated on that chain, can be null). (See original documentation for schema details).
*   **Note:** The documentation states this endpoint provides the number of transactions *initiated* by the user on Advanced Transactions supported chains (excluding Solana).

**Suggested Action Name:** `GET_USER_TRANSACTION_OVERVIEW`
**Corresponding .ts File:** `getUserTransactionOverviewAction.ts`

---