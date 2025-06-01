# DATAI-API  dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS

> Version PROD

## Path Table

| Method | Path                                                                                                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | [/api/merlin/public/userDeFiPositions/all/{userAddress}](#getUserDeFiHistory)                                                     | Get all DeFi information (active open positions) for a specific user                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| GET    | [/api/merlin/public/userDeFiPositions/{userAddress}?chain={chain}](#getUserDeFiHistoryByChain)                                    | Get all DeFi information (active open positions) for a specific user and chain                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| GET    | [/api/merlin/public/userDeFiPositionsByChains/{userAddress}?chains={chain1,chain2,...,chain10}](#getUserDeFiHistoryByMultiChains) | Get all DeFi historical information (active open positions) for a specific user and chains (up to 10 chains)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| GET    | [/api/merlin/public/userDeFiPositions/protocol/{userAddress}?chain={chain}&protocol={protocol}](#getUserDeFiHistoryByProtocol)    | Get all DeFi historical information (active open positions) for a specific user, chain and protocol                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| GET    | [/api/merlin/public/balances/protocol/{userAddress}?chain={chain}](#getUserDeFiBalancesByChain)                                   | Get all DeFi balances (active open positions balances) for a specific user and chain                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| GET    | [/api/merlin/public/balances/all/{userAddress}](#getTotalUserBalanceAllChains)                                                    | Get user overall balance across all chains, including tokens, NFT and DeFi exposures                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| GET    | [/api/merlin/public/balances/chain/{userAddress}?chain={chain}](#getTotalUserBalanceByChain)                                      | Get user overall balance by chain, including tokens, NFT and DeFi exposures                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| GET    | [/api/merlin/public/balances/{userAddress}?chain={chain}](#getAllUserBalancesByChain)                                             | Get user wallet balances by chain: native, tokens and NFTs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| GET    | [/api/merlin/public/balances/native/{userAddress}?chain={chain}](#getUserNativeBalanceByChain)                                    | Get user wallet balances of native token                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| GET    | [/api/merlin/public/balances/token/{userAddress}?chain={chain}](#getUserTokenBalancesByChain)                                     | Get user wallet balances of tokens (including native)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| GET    | [/api/merlin/public/balances/chains/token/{userAddress}?chains={chain1,chain2}](#getUserTokenBalancesByChains)                    | Get user overall balance by chains, including tokens, NFT and DeFi exposures grouping by chain                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| GET    | [/api/merlin/public/balances/nft/all/{userAddress}?chain={chain}](#getUserNFTs)                                                   | Get user wallet list of NFTs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| GET    | [/api/merlin/public/balances/nft/chain/{userAddress}?chain={chain}](#getUserNFTsByChain)                                          | Get user wallet list of NFTs by chain                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| GET    | [/api/merlin/public/v2/userTx/history/all/extended/{userAddress}](#getUserTxHistoryBy100)                                         | Get the latest 100 transactions for a specific user, across all* chains the user is active on, including classification and DeFi PNL. By default, returns the latest 100 transactions of the wallet. If startTime is set, will return the latest 100 Tx prior to startTime. Example: for startTime set to 31 December 2023 (1704059999) will return the latest 100 transactions before 31 December 2023. Applicable for all supported chains, with advanced transaction classification information for all Advanced Transactions supported chains, more info here. *For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below.                                                                                                                                                                                                                                          |
| GET    | [/api/merlin/public/v2/userTx/history/all/{userAddress}](#getUserTxHistoryBy20)                                                   | Get the latest 20 transactions for a specific user, across all* chains the user is active on, including classification and DeFi PNL. By default, returns the latest 20 transactions of the wallet. If startTime is set, will return the latest 20 Tx prior to startTime. Example: for startTime set to 31 December 2023 (1704059999) will return the latest 20 transactions before 31 December 2023. Applicable for all supported protocols, with advanced transaction classification information for all Advanced Transactions supported chains, more info here. *For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below.                                                                                                                                                                                                                                           |
| GET    | [/api/merlin/public/v2/userTx/history/chain/extended/{userAddress}](#getUserTxHistoryByChainBy100)                                | Get the latest 100 transactions for a specific user and chain*, including classification and DeFi PNL. By default, returns the latest 100 transactions of the wallet on the specified chain. If startTime is set, will return the latest 100 Tx prior to startTime. Example: for startTime set to 31 December 2023 (1704059999) will return the latest 100 transactions before 31 December 2023, on the specified chain. Applicable for all supported protocols, with advanced transaction classification information for all Advanced Transactions supported chains, more info here. *For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below.                                                                                                                                                                                                                       |
| GET    | [/api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}](#getUserTxHistoryByChainBy400)                                | Get the latest 400 transactions for a specific user and chain*, excluding token USD valuations, but including classification. By default, returns the latest 400 transactions of the wallet on the specified chain. If startTime is set, will return the latest 400 Tx prior to startTime. Example: for startTime set to 31 December 2023 (1704059999) will return the latest 400 transactions before 31 December 2023, on the specified chain. Applicable for all supported protocols, with advanced transaction classification information for all Advanced Transactions supported chains, more info here. *For Solana blockchain transactions, please refer to the dedicated Solana Transactions endpoint below.                                                                                                                                                                                                |
| GET    | [/api/merlin/public/v2/userTx/history/all/extended/{userAddress}](#getUserSolanaTxHistoryBy100)                                   | Get the latest 100 Solana transactions for a specific user on the Solana chain, including classification*. By default, returns the latest 100 transactions of the wallet on the Solana chain. When the beforeHash is set, will return the latest 100 Tx prior to that transaction hash. *The transaction classification information provides limited coverage: Wallet to Wallet Transfers (Send, Receive), NFT Airdrops, Liquidity Pool Exchange, Staking Deposits and Withdrawals. Extended coverage coming soon.                                                                                                                                                                                                                                                                                                                                                                                                 |
| GET    | [/api/merlin/public/v2/userTx/history/all/{userAddress}](#getUserSolanaTxHistoryBy20)                                             | Get the latest 20 Solana transactions for a specific user on the Solana chain, including classification*. By default, returns the latest 20 transactions of the wallet on the Solana chain. When the beforeHash is set, will return the latest 20 Tx prior to that transaction hash. *The transaction classification information provides limited coverage: Wallet to Wallet Transfers (Send, Receive), NFT Airdrops, Liquidity Pool Exchange, Staking Deposits and Withdrawals. Extended coverage coming soon.                                                                                                                                                                                                                                                                                                                                                                                                    |
| GET    | [/merlin/public/v2/userTx/period/all/extended/{userAddress}](#getUserTxByPeriodBy100)                                             | Get up to 100 transactions for a specific user, across all chains the user is active on, within the specified timeframe, including classification and DeFi PNL.Example for retrieving transactions between 01 Jan 2024 and 31 Jan 2024, startTime is 31 Jan 2024 and endTime 01 Jan 2024. If the response contains 100 transactions, and if the input parameter endTime is older than the date of the oldest transaction returned, it is likely that more than 100 transactions occurred during the input timeframe. In which case, it is recommended to renew the call with an adjusted startTime at the date of the oldest transaction retrieved and the initial endTime. Applicable for all DeFi NAV supported protocols, with advanced transaction classification information for all Advanced Transactions supported chains, more info here. Solana blockchain transactions cannot be retrieved by timeframe. |
| GET    | [/api/merlin/public/v2/userTx/period/chain/extended/{userAddress}](#getUserTxByPeriodByChainBy100)                                | Get up to 100 transactions for a specific user and chain, within the specified timeframe, including classification and DeFi PNL. Example for retrieving transactions between 01 Jan 2024 and 31 Jan 2024, startTime is 31 Jan 2024 and endTime 01 Jan 2024. If the response contains 100 transactions, and if the input parameter endTime is older than the date of the oldest transaction returned, it is likely that more than 100 transactions occurred during the input timeframe. In which case, it is recommended to renew the call with an adjusted startTime at the date of the oldest transaction retrieved and the initial endTime. Applicable for all DeFi NAV supported protocols, with advanced transaction classification information for all Advanced Transactions supported chains, more info here. Solana blockchain transactions cannot be retrieved by timeframe.                               |
| GET    | [/api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}](#getUserNFTs)                                               | Get up to 20 transactions for a specific user and chain, within the specified timeframe, excluding token USD valuations, but including classification. Example for retrieving transactions between 01 Jan 2024 and 31 Jan 2024, startTime is 31 Jan 2024 and endTime 01 Jan 2024. If the response contains 100 transactions, and if the input parameter endTime is older than the date of the oldest transaction returned, it is likely that more than 100 transactions occurred during the input timeframe. In which case, it is recommended to renew the call with an adjusted startTime at the date of the oldest transaction retrieved and the initial endTime. Applicable for all DeFi NAV supported protocols, with advanced transaction classification information for all Advanced Transactions supported chains, more info here. Solana blockchain transactions cannot be retrieved by timeframe.         |
| GET    | [/api/merlin/public/v2/userTx/byHash/{chain}/{hash}/{userAddress}](#getUserTxByHash)                                              | Get full transaction details for a specific transaction hash. Returns one transaction data object for the given user (wallet address), chain and transaction hash, including classification and DeFi PNL information. Applicable for all Advanced Transactions supported chains, more info here, including Solana.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| GET    | [/api/merlin/public/userTx/position/?position={position}](#getUserTxForDeFiPosition)                                              | Get all the transactions for a specific user and DeFi position in a protocol, including classification and DeFi PNL. Returns a position's related transactions, up to 100 related tx. Applies for the DeFi P&L supported protocol positions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| GET    | [/api/merlin/public/userTx/overview/{userAddress}](#getUserTxOverview)                                                            | Get a list of chains the specific user is active on, and the number of transactions initiated by the user on those chains. The number of transactions initiated by the user is not the exhaustive number of transactions related to that user; does not include internal transfers or other transactions not initiated by the user.Returns a wallet activity overview, consisting (for now) in the number of transactions the specified user has initiated on the Advanced Transactions supported chains (excluding Solana); this is not the total number of transactions the user has been involved in, but only those initiated by the user.                                                                                                                                                                                                                                                                     |

## Path Details

---

### [GET]/api/merlin/public/userDeFiPositions/all/{userAddress}

- Summary  
  Get all DeFi information (active open positions) for a specific user

#### Responses

- 200 Ok

`application/json`

```ts
[
  {
    chain: 'string',
    logo: 'string',
    name: 'string',
    portfolio: [
      {
        detail: {
          borrow: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
          rewards: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
          supply: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
        },
        statistic: {
          navUSD: 0,
          totalDebtUSD: 0,
          totalSupplyUSD: 0,
        },
        yieldAndPnl: [
          {
            address: 'string',
            deFiEvents: [
              {
                balances: [
                  {
                    balance: 0,
                    balanceUSD: 0,
                    tokenAddress: 'string',
                    tokenDecimals: 0,
                    tokenLogo: 'string',
                    tokenName: 'string',
                    tokenSymbol: 'string',
                  },
                ],
                eventType: 'string',
                id: 'string',
                position: {
                  active: true,
                  fees: [
                    {
                      fee: 0,
                      feeUSD: 0,
                    },
                  ],
                  pnlUSD: 0,
                  position: {
                    balance: 0,
                  },
                  positionYield: {
                    balance: 0,
                    balanceUSD: 0,
                    tokenDecimals: 0,
                    tokenSymbol: 'string',
                  },
                  yieldUSD: 0,
                  yields: [
                    {
                      balance: 0,
                      balanceUSD: 0,
                      tokenDecimals: 0,
                      tokenSymbol: 'string',
                    },
                  ],
                },
                protocol: 'string',
                timestamp: 0,
              },
            ],
            decimals: 0,
            name: 'string',
            pnlUSD: 0,
            symbol: 'string',
            txCount: 0,
            txFeeUSD: 0,
            yieldUSD: 0,
          },
        ],
      },
    ],
    site: 'string',
  },
];
```

### [GET]/api/merlin/public/userDeFiPositions/{userAddress}?chain={chain}

- Summary  
  Get all DeFi information (active open positions) for a specific user and chain

#### Responses

- 200 Ok

`application/json`

```ts
[
  {
    chain: 'string',
    logo: 'string',
    name: 'string',
    portfolio: [
      {
        detailed: {
          borrow: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
          rewards: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
          supply: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
        },
        poolData: [
          {
            claimedFees: {
              token0: 0,
              token0USD: 0,
              token1: 0,
              token1USD: 0,
              totalUSD: 0,
            },
            impermanentLoss: {
              token0: 0,
              token0USD: 0,
              token1: 0,
              token1USD: 0,
              totalUSD: 0,
            },
            liquidity: {
              token0: 0,
              token0USD: 0,
              token1: 0,
              token1USD: 0,
              totalUSD: 0,
            },
            maxPrice: 0,
            minPrice: 0,
            position: 'string',
            token0: {
              decimals: 0,
              id: 'string',
              name: 'string',
              symbol: 'string',
            },
            token0USDPrice: 0,
            token1: {
              decimals: 0,
              id: 'string',
              name: 'string',
              symbol: 'string',
            },
            token1USDPrice: 0,
            unclaimedFees: {
              token0: 0,
              token0USD: 0,
              token1: 0,
              token1USD: 0,
              totalUSD: 0,
            },
          },
        ],
        total: {
          debtUSD: 0,
          navUSD: 0,
          supplyUSD: 0,
        },
        yieldAndPnl: [
          {
            address: 'string',
            deFiEvents: [
              {
                balances: [
                  {
                    balance: 0,
                    balanceUSD: 0,
                    tokenAddress: 'string',
                    tokenDecimals: 0,
                    tokenLogo: 'string',
                    tokenName: 'string',
                    tokenSymbol: 'string',
                  },
                ],
                eventType: 'string',
                id: 'string',
                position: {
                  active: true,
                  fees: [
                    {
                      fee: 0,
                      feeUSD: 0,
                    },
                  ],
                  pnlUSD: 0,
                  position: {
                    balance: 0,
                  },
                  positionYield: {
                    balance: 0,
                    balanceUSD: 0,
                    tokenDecimals: 0,
                    tokenSymbol: 'string',
                  },
                  yieldUSD: 0,
                  yields: [
                    {
                      balance: 0,
                      balanceUSD: 0,
                      tokenDecimals: 0,
                      tokenSymbol: 'string',
                    },
                  ],
                },
                protocol: 'string',
                timestamp: 0,
              },
            ],
            name: 'string',
            pnlUSD: 0,
            symbol: 'string',
            txCount: 0,
            txFeeUSD: 0,
            yieldUSD: 0,
          },
        ],
      },
    ],
    site: 'string',
  },
];
```

### [GET]/api/merlin/public/userDeFiPositionsByChains/{userAddress}?chains={chain1,chain2,...,chain10}

- Summary  
  Get all DeFi historical information (active open positions) for a specific user and chains (up to 10 chains)

#### Responses

- 200 Ok

`application/json`

```ts
[
  {
    chain: 'string',
    logo: 'string',
    name: 'string',
    portfolio: [
      {
        detail: {
          borrow: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
          rewards: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
          supply: [
            {
              balance: 0,
              balanceUSD: 0,
              id: 'string',
              logo: 'string',
              tokenAddress: 'string',
              tokenDecimals: 0,
              tokenName: 'string',
              tokenSymbol: 'string',
              usdRate: 0,
            },
          ],
        },
        statistic: {
          navUSD: 0,
          totalDebtUSD: 0,
          totalSupplyUSD: 0,
        },
        yieldAndPnl: [
          {
            address: 'string',
            deFiEvents: [
              {
                balances: [
                  {
                    balance: 0,
                    balanceUSD: 0,
                    tokenAddress: 'string',
                    tokenDecimals: 0,
                    tokenLogo: 'string',
                    tokenName: 'string',
                    tokenSymbol: 'string',
                  },
                ],
                eventType: 'string',
                id: 'string',
                position: {
                  active: true,
                  fees: [
                    {
                      fee: 0,
                      feeUSD: 0,
                    },
                  ],
                  pnlUSD: 0,
                  position: {
                    balance: 0,
                  },
                  positionYield: {
                    balance: 0,
                    balanceUSD: 0,
                    tokenDecimals: 0,
                    tokenSymbol: 'string',
                  },
                  yieldUSD: 0,
                  yields: [
                    {
                      balance: 0,
                      balanceUSD: 0,
                      tokenDecimals: 0,
                      tokenSymbol: 'string',
                    },
                  ],
                },
                protocol: 'string',
                timestamp: 0,
              },
            ],
            decimals: 0,
            name: 'string',
            pnlUSD: 0,
            symbol: 'string',
            txCount: 0,
            txFeeUSD: 0,
            yieldUSD: 0,
          },
        ],
      },
    ],
    site: 'string',
  },
];
```

### [GET]/api/merlin/public/userDeFiPositions/protocol/{userAddress}?chain={chain}&protocol={protocol}

- Summary  
  Get all DeFi historical information (active open positions) for a specific user, chain and protocol

#### Responses

- 200 Ok

`application/json`

```ts
{
  "chain": "string",
  "logo": "string",
  "name": "string",
  "portfolio": [
    {
      "detail": {
        "borrow": [
          {
            "balance": 0,
            "balanceUSD": 0,
            "id": "string",
            "logo": "string",
            "tokenAddress": "string",
            "tokenDecimals": 0,
            "tokenName": "string",
            "tokenSymbol": "string",
            "usdRate": 0
          }
        ],
        "rewards": [
          {
            "balance": 0,
            "balanceUSD": 0,
            "id": "string",
            "logo": "string",
            "tokenAddress": "string",
            "tokenDecimals": 0,
            "tokenName": "string",
            "tokenSymbol": "string",
            "usdRate": 0
          }
        ],
        "supply": [
          {
            "balance": 0,
            "balanceUSD": 0,
            "id": "string",
            "logo": "string",
            "tokenAddress": "string",
            "tokenDecimals": 0,
            "tokenName": "string",
            "tokenSymbol": "string",
            "usdRate": 0
          }
        ]
      },
      "statistic": {
        "navUSD": 0,
        "totalDebtUSD": 0,
        "totalSupplyUSD": 0
      },
      "yieldAndPnl": [
        {
          "address": "string",
          "deFiEvents": [
            {
              "balances": [
                {
                  "balance": 0,
                  "balanceUSD": 0,
                  "tokenAddress": "string",
                  "tokenDecimals": 0,
                  "tokenLogo": "string",
                  "tokenName": "string",
                  "tokenSymbol": "string"
                }
              ],
              "eventType": "string",
              "id": "string",
              "position": {
                "active": true,
                "fees": [
                  {
                    "fee": 0,
                    "feeUSD": 0
                  }
                ],
                "pnlUSD": 0,
                "position": {
                  "balance": 0
                },
                "positionYield": {
                  "balance": 0,
                  "balanceUSD": 0,
                  "tokenDecimals": 0,
                  "tokenSymbol": "string"
                },
                "yieldUSD": 0,
                "yields": [
                  {
                    "balance": 0,
                    "balanceUSD": 0,
                    "tokenDecimals": 0,
                    "tokenSymbol": "string"
                  }
                ]
              },
              "protocol": "string",
              "timestamp": 0
            }
          ],
          "decimals": 0,
          "name": "string",
          "pnlUSD": 0,
          "symbol": "string",
          "txCount": 0,
          "txFeeUSD": 0,
          "yieldUSD": 0
        }
      ]
    }
  ],
  "site": "string"
}
```

### [GET]/api/merlin/public/balances/protocol/{userAddress}?chain={chain}

- Summary  
  Get all DeFi balances (active open positions balances) for a specific user and chain

#### Responses

- 200 Ok

`application/json`

```ts
[
  {
    chain: 'eth',
    name: '1inch2',
    commonName: '1inch',
    logo: 'https://valk-merlin.s3.amazonaws.com/protocol-icons/1inch2.png',
    site: 'https://app.1inch.io',
    balance: {
      navUSD: 5.822127211246744e-4,
      assetUSD: 5.822127211246744e-4,
      debtUSD: 0.0,
    },
  },
  {
    chain: 'eth',
    name: 'badger',
    commonName: 'Badger DAO',
    logo: 'https://valk-merlin.s3.amazonaws.com/protocol-icons/badger.png',
    site: 'https://app.badger.com',
    balance: {
      navUSD: 545.2310423950731,
      assetUSD: 545.2310423950731,
      debtUSD: 0.0,
    },
  },
];
```

### [GET]/api/merlin/public/balances/all/{userAddress}

- Summary  
  Get user overall balance across all chains, including tokens, NFT and DeFi exposures

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
            "id": String, chain id
            "name": String, chain name
            "logoUrl": String,
            "wrappedTokenId": String,
            "valueUsd": Double,
            "fiatValues": {
                "USD": Double,
                "AED": Double,
                "AUD": Double,
                "CAD": Double,
                "EUR": Double,
                "GBP": Double,
                "INR": Double
            }
        },...
]
```

### [GET]/api/merlin/public/balances/chain/{userAddress}?chain={chain}

- Summary  
  Get user overall balance by chain, including tokens, NFT and DeFi exposures

#### Responses

- 200 Ok

`application/json`

```ts
{
    "valueUsd": Double,
    "valueEUR": Double,
    "valueAUD": Double,
    "valueCAD": Double,
    "valueAED": Double,
    "valueINR": Double,
    "valueGBP": Double
}
```

### [GET]/api/merlin/public/balances/{userAddress}?chain={chain}

- Summary  
  Get user wallet balances by chain: native, tokens and NFTs

#### Responses

- 200 Ok

`application/json`

```ts
{
  "nativeBalance": long,
  "nativeBalanceDecimal": double,
  "nfts": [
    {
      "tokenAddress": "string",
      "tokenName": "string",
      "tokenSymbol": "string",
      "chain": "string",
      "tokenId": "string",
      "contractType": "string",
      "ownerOf": "string",
      "blockNumberMinted": 0,
      "detailUrl": "string"
    }, ...
  ],
  "tokenBalances": [
    {
      "tokenAddress": "string",
      "tokenName": "string",
      "tokenSymbol": "string",
      "tokenDecimals": 0,
      "balance": 0,
      "logoUrl": "string"
    }, ...
  ]
}
```

### [GET]/api/merlin/public/balances/native/{userAddress}?chain={chain}

- Summary  
  Get user wallet balances of native token

#### Responses

- 200 Ok

`application/json`

```ts
{
  "balance": long,
  "balanceDecimal": double
}
```

### [GET]/api/merlin/public/balances/token/{userAddress}?chain={chain}

- Summary  
  Get user wallet balances of tokens (including native)

#### Responses

- 200 Ok

`application/json`

```ts
[
  {
        "token_address": "string",
        "name": "string",
        "symbol": "string",
        "logo": "string",
        "thumbnail": null,
        "decimals": int,
        "balance": long,
        "price": double,
        "priceChange24h": double,
        "bundleWallet": null,
        "prices": {
            "USD": double,
            "AED": double,
            "AUD": double,
            "CAD": double,
            "EUR": double,
            "GBP": double,
            "INR": double
        },
        "isWallet": boolean, true for wallet token, false for underlying DeFi position
    },
]
```

### [GET]/api/merlin/public/balances/chains/token/{userAddress}?chains={chain1,chain2}

- Summary  
  Get user overall balance by chains, including tokens, NFT and DeFi exposures grouping by chain

#### Responses

- 200 Ok

`application/json`

```ts
{
    "chain": [
        {
            "token_address": "string",
            "name": "string",
            "symbol": "string",
            "logo": "string",
            "thumbnail": "string",
            "decimals": int,
            "balance": long,
            "price": double,
            "priceChange24h": double,
            "bundleWallet": null,
            "prices": {
                "AED": double,
                "AUD": double,
                "CAD": double,
                "EUR": double,
                "GBP": double,
                "INR": double,
                "USD": double
            },
            "isWallet": boolean, true for wallet token, false for underlying DeFi position
        },...],
    "chain": [...],
    ...
}
```

### [GET]/api/merlin/public/balances/nft/all/{userAddress}?chain={chain}

- Summary  
  Get user wallet list of NFTs

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "tokenAddress": "string",
        "tokenName": "string",
        "tokenSymbol": string,
        "chain": "string",
        "tokenId": "string",
        "contractType": "string",
        "ownerOf": "string",
        "blockNumberMinted": long,
        "detailUrl": "string"
    }, ...
]
```

### [GET]/api/merlin/public/balances/nft/chain/{userAddress}?chain={chain}

- Summary  
  Get user wallet list of NFTs by chain

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "tokenAddress": "string",
        "tokenName": "string",
        "tokenSymbol": string,
        "chain": "string",
        "tokenId": "string",
        "contractType": "string",
        "ownerOf": "string",
        "blockNumberMinted": long,
        "detailUrl": "string"
    }, ...
]
```

### [GET]/api/merlin/public/v2/userTx/history/all/extended/{userAddress}

- Summary  
  Get the latest 100 transactions for a specific user, across all\* chains the user is active on, including classification and DeFi PNL.

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "id": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xe08773a8efdc9006ff753c59d1bbf278d8eb9127",
                "tokenSymbol": "Reward at BoneWin.com",
                "tokenName": "",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": []
                },
                "from": "0x8d59af660a19f2a5c96dc452549922bb427604e2",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 50612654,
        "chain": "matic",
        "from": null,
        "hash": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1701433660,
        "txFee": 1149043491300000000,
        "txFeeUsd": 0.89774767975269,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "36de232f337436f2d357d95e5384b46d",
                "tokenSymbol": "Reward at shiba-bone.com",
                "tokenName": "#0",
                "tokenDecimals": 0,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": 0.0,
                    "action": "TRANSFER",
                    "content": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                    "detailUrl": "https://opensea.io/assets/0xfceb0b966be2921313daa57e898157b80adfc639/0",
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": "1",
                    "salesHistory": null
                },
                "from": "0xc89a584ed4540b4eada14f52e261e8e4831ba3a1",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 0,
        "chain": "xdai",
        "from": "0x4041f293958a98497d215b9c2b11f486d4e464e2",
        "hash": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": "0xfceb0b966be2921313daa57e898157b80adfc639",
        "timeStamp": 1701430325,
        "txFee": 0,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": "0x3764d79db51726e900a1380055f469eb6e2a7fd3",
        "logs": null,
        "contractName": null,
        "functionName": null,
        "encodingFunction": null,
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": null,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "LidoSubmitEvent:0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19-1018",
        "active": true,
        "balances": [
            {
                "balance": 190000199999999999999,
                "balanceUSD": 298951.1125650504,
                "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
                "tokenSymbol": "stETH",
                "tokenName": "stETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0xae7ab96520de3a18e5e111b5eaab095312d7fe84.png",
                "standard": "ERC20",
                "nftDetails": null,
                "from": "0x0000000000000000000000000000000000000000",
                "to": "0x796fa775ef443ce683d24eadf48cbf551473b3b6"
            },
            {
                "balance": -190000200000000000000,
                "balanceUSD": -299176.70892252,
                "tokenAddress": "0x0000000000000000000000000000000000000000",
                "tokenSymbol": "ETH",
                "tokenName": "ETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0x0000000000000000000000000000000000000000.png",
                "standard": "NATIVE",
                "nftDetails": null,
                "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
                "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
            }
        ],
        "slippageUSD": null,
        "block": 18212373,
        "chain": "eth",
        "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
        "hash": "0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19",
        "order": 78221546417553513,
        "pnlUsd": 86993.58318610775,
        "positionYield": {
            "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
            "balance": 1000928015303509754,
            "balanceUSD": 1986.911609735535,
            "tokenSymbol": "stETH",
            "tokenDecimals": 18
        },
        "protocol": "lido",
        "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
        "timeStamp": 1695639731,
        "txFee": 1015807888924390,
        "txFeeUsd": 1.5995039010797447,
        "txType": "Staking Deposit",
        "txAction": "Staked",
        "yields": [],
        "yieldUSD": 1986.911609735535,
        "poolData": {
            "poolToken": "0x0000000000000000000000000000000000000000",
            "poolPnlUSD": 0.0,
            "poolYieldUSD": 0.0
        },
        "oppositeEvents": [],
        "user": "null",
        "logs": null,
        "contractName": "Lido",
        "functionName": "_submit",
        "encodingFunction": "0xa1903eab",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": false,
        "blacklisted": false,
        "successful": true,
        "userPaidFees": true
    }, ...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/history/all/{userAddress}

- Summary  
  Get the latest 20 transactions for a specific user, across all\* chains the user is active on, including classification and DeFi PNL.

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "id": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xe08773a8efdc9006ff753c59d1bbf278d8eb9127",
                "tokenSymbol": "Reward at BoneWin.com",
                "tokenName": "",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": []
                },
                "from": "0x8d59af660a19f2a5c96dc452549922bb427604e2",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 50612654,
        "chain": "matic",
        "from": null,
        "hash": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1701433660,
        "txFee": 1149043491300000000,
        "txFeeUsd": 0.89774767975269,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "36de232f337436f2d357d95e5384b46d",
                "tokenSymbol": "Reward at shiba-bone.com",
                "tokenName": "#0",
                "tokenDecimals": 0,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": 0.0,
                    "action": "TRANSFER",
                    "content": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                    "detailUrl": "https://opensea.io/assets/0xfceb0b966be2921313daa57e898157b80adfc639/0",
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": "1",
                    "salesHistory": null
                },
                "from": "0xc89a584ed4540b4eada14f52e261e8e4831ba3a1",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 0,
        "chain": "xdai",
        "from": "0x4041f293958a98497d215b9c2b11f486d4e464e2",
        "hash": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": "0xfceb0b966be2921313daa57e898157b80adfc639",
        "timeStamp": 1701430325,
        "txFee": 0,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": "0x3764d79db51726e900a1380055f469eb6e2a7fd3",
        "logs": null,
        "contractName": null,
        "functionName": null,
        "encodingFunction": null,
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": null,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "LidoSubmitEvent:0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19-1018",
        "active": true,
        "balances": [
            {
                "balance": 190000199999999999999,
                "balanceUSD": 298951.1125650504,
                "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
                "tokenSymbol": "stETH",
                "tokenName": "stETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0xae7ab96520de3a18e5e111b5eaab095312d7fe84.png",
                "standard": "ERC20",
                "nftDetails": null,
                "from": "0x0000000000000000000000000000000000000000",
                "to": "0x796fa775ef443ce683d24eadf48cbf551473b3b6"
            },
            {
                "balance": -190000200000000000000,
                "balanceUSD": -299176.70892252,
                "tokenAddress": "0x0000000000000000000000000000000000000000",
                "tokenSymbol": "ETH",
                "tokenName": "ETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0x0000000000000000000000000000000000000000.png",
                "standard": "NATIVE",
                "nftDetails": null,
                "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
                "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
            }
        ],
        "slippageUSD": null,
        "block": 18212373,
        "chain": "eth",
        "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
        "hash": "0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19",
        "order": 78221546417553513,
        "pnlUsd": 86993.58318610775,
        "positionYield": {
            "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
            "balance": 1000928015303509754,
            "balanceUSD": 1986.911609735535,
            "tokenSymbol": "stETH",
            "tokenDecimals": 18
        },
        "protocol": "lido",
        "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
        "timeStamp": 1695639731,
        "txFee": 1015807888924390,
        "txFeeUsd": 1.5995039010797447,
        "txType": "Staking Deposit",
        "txAction": "Staked",
        "yields": [],
        "yieldUSD": 1986.911609735535,
        "poolData": {
            "poolToken": "0x0000000000000000000000000000000000000000",
            "poolPnlUSD": 0.0,
            "poolYieldUSD": 0.0
        },
        "oppositeEvents": [],
        "user": "null",
        "logs": null,
        "contractName": "Lido",
        "functionName": "_submit",
        "encodingFunction": "0xa1903eab",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": false,
        "blacklisted": false,
        "successful": true,
        "userPaidFees": true
    }, ...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/history/chain/extended/{userAddress}

- Summary  
  Get the latest 100 transactions for a specific user and chain\*, including classification and DeFi PNL.

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "id": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xe08773a8efdc9006ff753c59d1bbf278d8eb9127",
                "tokenSymbol": "Reward at BoneWin.com",
                "tokenName": "",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": []
                },
                "from": "0x8d59af660a19f2a5c96dc452549922bb427604e2",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 50612654,
        "chain": "matic",
        "from": null,
        "hash": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1701433660,
        "txFee": 1149043491300000000,
        "txFeeUsd": 0.89774767975269,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "36de232f337436f2d357d95e5384b46d",
                "tokenSymbol": "Reward at shiba-bone.com",
                "tokenName": "#0",
                "tokenDecimals": 0,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": 0.0,
                    "action": "TRANSFER",
                    "content": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                    "detailUrl": "https://opensea.io/assets/0xfceb0b966be2921313daa57e898157b80adfc639/0",
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": "1",
                    "salesHistory": null
                },
                "from": "0xc89a584ed4540b4eada14f52e261e8e4831ba3a1",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 0,
        "chain": "xdai",
        "from": "0x4041f293958a98497d215b9c2b11f486d4e464e2",
        "hash": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": "0xfceb0b966be2921313daa57e898157b80adfc639",
        "timeStamp": 1701430325,
        "txFee": 0,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": "0x3764d79db51726e900a1380055f469eb6e2a7fd3",
        "logs": null,
        "contractName": null,
        "functionName": null,
        "encodingFunction": null,
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": null,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "LidoSubmitEvent:0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19-1018",
        "active": true,
        "balances": [
            {
                "balance": 190000199999999999999,
                "balanceUSD": 298951.1125650504,
                "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
                "tokenSymbol": "stETH",
                "tokenName": "stETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0xae7ab96520de3a18e5e111b5eaab095312d7fe84.png",
                "standard": "ERC20",
                "nftDetails": null,
                "from": "0x0000000000000000000000000000000000000000",
                "to": "0x796fa775ef443ce683d24eadf48cbf551473b3b6"
            },
            {
                "balance": -190000200000000000000,
                "balanceUSD": -299176.70892252,
                "tokenAddress": "0x0000000000000000000000000000000000000000",
                "tokenSymbol": "ETH",
                "tokenName": "ETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0x0000000000000000000000000000000000000000.png",
                "standard": "NATIVE",
                "nftDetails": null,
                "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
                "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
            }
        ],
        "slippageUSD": null,
        "block": 18212373,
        "chain": "eth",
        "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
        "hash": "0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19",
        "order": 78221546417553513,
        "pnlUsd": 86993.58318610775,
        "positionYield": {
            "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
            "balance": 1000928015303509754,
            "balanceUSD": 1986.911609735535,
            "tokenSymbol": "stETH",
            "tokenDecimals": 18
        },
        "protocol": "lido",
        "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
        "timeStamp": 1695639731,
        "txFee": 1015807888924390,
        "txFeeUsd": 1.5995039010797447,
        "txType": "Staking Deposit",
        "txAction": "Staked",
        "yields": [],
        "yieldUSD": 1986.911609735535,
        "poolData": {
            "poolToken": "0x0000000000000000000000000000000000000000",
            "poolPnlUSD": 0.0,
            "poolYieldUSD": 0.0
        },
        "oppositeEvents": [],
        "user": "null",
        "logs": null,
        "contractName": "Lido",
        "functionName": "_submit",
        "encodingFunction": "0xa1903eab",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": false,
        "blacklisted": false,
        "successful": true,
        "userPaidFees": true
    }, ...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}

- Summary  
  Get the latest 400 transactions for a specific user and chain\*, excluding token USD valuations, but including classification.

#### Responses

- 200 Ok

`application/json`

```ts
[
{
        "id": "0x1b6d7a57c8a2c2c24a9db727f4e1c198844c162f753dfe17a0fc0440816807a7",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xa0abe27ed222dc405ed2baa00e848686af54984b",
                "tokenSymbol": "$77,749 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x4a950bb1498a7e2151dd1885c303972bb342ef59",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 25069360,
        "chain": "celo",
        "from": null,
        "hash": "0x1b6d7a57c8a2c2c24a9db727f4e1c198844c162f753dfe17a0fc0440816807a7",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1713017366,
        "txFee": 37917590000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x6d0982e713cc1334fee9c053a10204c838c956c99c4eba3a7817ba3dec1e42dc",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0x6cba96d3a42707967325da35349b46a86b1a49d7",
                "tokenSymbol": "$77,749 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x4a950bb1498a7e2151dd1885c303972bb342ef59",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 25069334,
        "chain": "celo",
        "from": null,
        "hash": "0x6d0982e713cc1334fee9c053a10204c838c956c99c4eba3a7817ba3dec1e42dc",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1713017236,
        "txFee": 37917590000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x54383b97cfea67066669131e288b6edb1a39a57efaa2c5f93b61f8700de5c086",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0x673d9e3e1b2fea36836aef5f123923dc45ee7ec7",
                "tokenSymbol": "$77,749 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x4a950bb1498a7e2151dd1885c303972bb342ef59",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 25069307,
        "chain": "celo",
        "from": null,
        "hash": "0x54383b97cfea67066669131e288b6edb1a39a57efaa2c5f93b61f8700de5c086",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1713017101,
        "txFee": 37917590000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x9898f0d014117e0506254ce5f1411b10b11ed4ff1720f2bf97ee7dbe4bd9e995",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0x0c57c4f675b7c322caf570d003496ef3906f204e",
                "tokenSymbol": "$77,749 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x4a950bb1498a7e2151dd1885c303972bb342ef59",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 25069283,
        "chain": "celo",
        "from": null,
        "hash": "0x9898f0d014117e0506254ce5f1411b10b11ed4ff1720f2bf97ee7dbe4bd9e995",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1713016981,
        "txFee": 37917590000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0xc04d9168c025b5c04da7f4d3de62a54ee92ad7c5f4e835630e333bf02cba0a87",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0x81faad7d94ca1ab2b15ebe8cfb07a5a728e1c8b7",
                "tokenSymbol": "$82,499 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0xbd4c607379da7b162f77161eadaa2d0d6dbf07f1",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 24945917,
        "chain": "celo",
        "from": null,
        "hash": "0xc04d9168c025b5c04da7f4d3de62a54ee92ad7c5f4e835630e333bf02cba0a87",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1712400136,
        "txFee": 37918010000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x1dabd585dec5a710abc8edeab88d56f9366812f385403bee9c2a6bc940c4fcec",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xdca54b467c531661942daab4ac3c93171b5db6a5",
                "tokenSymbol": "reward at BONEWIN.com",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x691d1a6878dd6c7591ce1cda641531b9621151aa",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 24917383,
        "chain": "celo",
        "from": null,
        "hash": "0x1dabd585dec5a710abc8edeab88d56f9366812f385403bee9c2a6bc940c4fcec",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1712257458,
        "txFee": 68698280000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x168c969d2226a2754f9718f58672cb9aa0337b04ced06a1e70b19b810a91b3e8",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xdf18490b7bd07982a554799db18cbd882105cc7a",
                "tokenSymbol": "reward at BONEWIN.com",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x6ddb0f62f598d18b215dd30754bfcf3d0e4e4257",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 24902759,
        "chain": "celo",
        "from": null,
        "hash": "0x168c969d2226a2754f9718f58672cb9aa0337b04ced06a1e70b19b810a91b3e8",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1712184337,
        "txFee": 62930064000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/history/all/extended/{userAddress}

- Summary  
  Get the latest 100 Solana transactions for a specific user on the Solana chain, including classification\*.

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "id": "NDqHG15rPNphFYvr4PgJQyqNaZiBQogywNBXGi5weGBMv8gsjLkmXrkwZhEi4yBzqHUNbojjUkYUV9HTgp9Qrq8",
        "timeStamp": 1688917275,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "7UnHadCCAZe4uhTR5e2ueTwXCZjsjwp6cLkDm8CBLKhd",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "NDqHG15rPNphFYvr4PgJQyqNaZiBQogywNBXGi5weGBMv8gsjLkmXrkwZhEi4yBzqHUNbojjUkYUV9HTgp9Qrq8",
        "txFee": 6600,
        "txFeeUsd": 0.00014451822733660744,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -4000000000,
                "balanceUSD": -87.58680444642874,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 204356956,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "hzkYvh74cdsVtaAn1Mr5SJ8k4zqJu596iw7v2XnkaFgqfQWtRDi77gXRkbxZY6bfAbH9EpL8u537uQ3SC2pdmBX",
        "timeStamp": 1688917210,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "7UnHadCCAZe4uhTR5e2ueTwXCZjsjwp6cLkDm8CBLKhd",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "hzkYvh74cdsVtaAn1Mr5SJ8k4zqJu596iw7v2XnkaFgqfQWtRDi77gXRkbxZY6bfAbH9EpL8u537uQ3SC2pdmBX",
        "txFee": 6600,
        "txFeeUsd": 0.00014451822733660744,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -78000000000,
                "balanceUSD": -1707.9426867053605,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 204356811,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "5BzvyBcAvm6sAzkRkGhyPG7Ks2KyituoYZKpSsEBXuoWkfYwAWX9sfivD2SAVHogJrBEZxV5S4QEkv8R8CSXCXZM",
        "timeStamp": 1688675559,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "7UnHadCCAZe4uhTR5e2ueTwXCZjsjwp6cLkDm8CBLKhd",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "5BzvyBcAvm6sAzkRkGhyPG7Ks2KyituoYZKpSsEBXuoWkfYwAWX9sfivD2SAVHogJrBEZxV5S4QEkv8R8CSXCXZM",
        "txFee": 6600,
        "txFeeUsd": 0.00012521619730931674,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -78000000000,
                "balanceUSD": -1479.8277863828341,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 203813415,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "5exBujWoZM1hgf1mayT8vBQyceXN9pWptQh3VRzGUiNzHmNM1fU93798Mf1kEdP933xy8mJnhCDhGwXh7KXwEPdU",
        "timeStamp": 1688674197,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "C8YHH5RrZP84PFbLmD6AzxPwomKQdX7iRsCjyMaXor1P",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "5exBujWoZM1hgf1mayT8vBQyceXN9pWptQh3VRzGUiNzHmNM1fU93798Mf1kEdP933xy8mJnhCDhGwXh7KXwEPdU",
        "txFee": 6600,
        "txFeeUsd": 0.00012521619730931674,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -16000000000,
                "balanceUSD": -303.5544177195557,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 203810507,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "nQjXB9v2ohJ1mdyjBTTnZxigKqyc4UycfZXsvJnkKqUrrSxrSGEDDGWiUUjQYcqUfMFu4TAmJKwgMcLUa9HCLNY",
        "timeStamp": 1684489501,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "7ztDC9W2Wr6z3oZJ9GBWgxvaSfxVoA2pt7PPVy1uSaoh",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "nQjXB9v2ohJ1mdyjBTTnZxigKqyc4UycfZXsvJnkKqUrrSxrSGEDDGWiUUjQYcqUfMFu4TAmJKwgMcLUa9HCLNY",
        "txFee": 6600,
        "txFeeUsd": 0.00013427829219951617,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -40000000000,
                "balanceUSD": -813.8078315122192,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 194755294,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "5TJSXNU9hgrcfTajo28CNsiTcw3ujh7tTZz8J6tkeZKHgPrRwXMYthwqJvi2hcPaWDY81ii1hBTDX6GX8EMC9SnZ",
        "timeStamp": 1674473439,
        "from": "DeuPTn6umdaiKBtAQxStHYUZwAZZSNMcXfYWw3fyzPCz",
        "to": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "chain": "solana",
        "protocol": "",
        "txType": "Receive",
        "txAction": "Balance Transfer",
        "hash": "5TJSXNU9hgrcfTajo28CNsiTcw3ujh7tTZz8J6tkeZKHgPrRwXMYthwqJvi2hcPaWDY81ii1hBTDX6GX8EMC9SnZ",
        "txFee": 5000,
        "txFeeUsd": 0.00012135917447777594,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": 12900000000,
                "balanceUSD": 313.10667015266193,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 173969068,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": false
    }, ...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/history/all/{userAddress}

- Summary  
  Get the latest 20 Solana transactions for a specific user on the Solana chain, including classification\*.

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "id": "NDqHG15rPNphFYvr4PgJQyqNaZiBQogywNBXGi5weGBMv8gsjLkmXrkwZhEi4yBzqHUNbojjUkYUV9HTgp9Qrq8",
        "timeStamp": 1688917275,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "7UnHadCCAZe4uhTR5e2ueTwXCZjsjwp6cLkDm8CBLKhd",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "NDqHG15rPNphFYvr4PgJQyqNaZiBQogywNBXGi5weGBMv8gsjLkmXrkwZhEi4yBzqHUNbojjUkYUV9HTgp9Qrq8",
        "txFee": 6600,
        "txFeeUsd": 0.00014451822733660744,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -4000000000,
                "balanceUSD": -87.58680444642874,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 204356956,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "hzkYvh74cdsVtaAn1Mr5SJ8k4zqJu596iw7v2XnkaFgqfQWtRDi77gXRkbxZY6bfAbH9EpL8u537uQ3SC2pdmBX",
        "timeStamp": 1688917210,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "7UnHadCCAZe4uhTR5e2ueTwXCZjsjwp6cLkDm8CBLKhd",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "hzkYvh74cdsVtaAn1Mr5SJ8k4zqJu596iw7v2XnkaFgqfQWtRDi77gXRkbxZY6bfAbH9EpL8u537uQ3SC2pdmBX",
        "txFee": 6600,
        "txFeeUsd": 0.00014451822733660744,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -78000000000,
                "balanceUSD": -1707.9426867053605,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 204356811,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "5BzvyBcAvm6sAzkRkGhyPG7Ks2KyituoYZKpSsEBXuoWkfYwAWX9sfivD2SAVHogJrBEZxV5S4QEkv8R8CSXCXZM",
        "timeStamp": 1688675559,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "7UnHadCCAZe4uhTR5e2ueTwXCZjsjwp6cLkDm8CBLKhd",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "5BzvyBcAvm6sAzkRkGhyPG7Ks2KyituoYZKpSsEBXuoWkfYwAWX9sfivD2SAVHogJrBEZxV5S4QEkv8R8CSXCXZM",
        "txFee": 6600,
        "txFeeUsd": 0.00012521619730931674,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -78000000000,
                "balanceUSD": -1479.8277863828341,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 203813415,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "5exBujWoZM1hgf1mayT8vBQyceXN9pWptQh3VRzGUiNzHmNM1fU93798Mf1kEdP933xy8mJnhCDhGwXh7KXwEPdU",
        "timeStamp": 1688674197,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "C8YHH5RrZP84PFbLmD6AzxPwomKQdX7iRsCjyMaXor1P",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "5exBujWoZM1hgf1mayT8vBQyceXN9pWptQh3VRzGUiNzHmNM1fU93798Mf1kEdP933xy8mJnhCDhGwXh7KXwEPdU",
        "txFee": 6600,
        "txFeeUsd": 0.00012521619730931674,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -16000000000,
                "balanceUSD": -303.5544177195557,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 203810507,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "nQjXB9v2ohJ1mdyjBTTnZxigKqyc4UycfZXsvJnkKqUrrSxrSGEDDGWiUUjQYcqUfMFu4TAmJKwgMcLUa9HCLNY",
        "timeStamp": 1684489501,
        "from": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "to": "7ztDC9W2Wr6z3oZJ9GBWgxvaSfxVoA2pt7PPVy1uSaoh",
        "chain": "solana",
        "protocol": "",
        "txType": "Send",
        "txAction": "Balance Transfer",
        "hash": "nQjXB9v2ohJ1mdyjBTTnZxigKqyc4UycfZXsvJnkKqUrrSxrSGEDDGWiUUjQYcqUfMFu4TAmJKwgMcLUa9HCLNY",
        "txFee": 6600,
        "txFeeUsd": 0.00013427829219951617,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": -40000000000,
                "balanceUSD": -813.8078315122192,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 194755294,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": true
    },
    {
        "id": "5TJSXNU9hgrcfTajo28CNsiTcw3ujh7tTZz8J6tkeZKHgPrRwXMYthwqJvi2hcPaWDY81ii1hBTDX6GX8EMC9SnZ",
        "timeStamp": 1674473439,
        "from": "DeuPTn6umdaiKBtAQxStHYUZwAZZSNMcXfYWw3fyzPCz",
        "to": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "chain": "solana",
        "protocol": "",
        "txType": "Receive",
        "txAction": "Balance Transfer",
        "hash": "5TJSXNU9hgrcfTajo28CNsiTcw3ujh7tTZz8J6tkeZKHgPrRwXMYthwqJvi2hcPaWDY81ii1hBTDX6GX8EMC9SnZ",
        "txFee": 5000,
        "txFeeUsd": 0.00012135917447777594,
        "yields": null,
        "positionYield": null,
        "yieldUSD": null,
        "pnlUsd": null,
        "balances": [
            {
                "balance": 12900000000,
                "balanceUSD": 313.10667015266193,
                "tokenAddress": "solana",
                "tokenDecimals": 9,
                "tokenName": "Solana",
                "tokenSymbol": "SOL",
                "tokenLogo": "https://assets.coingecko.com/coins/images/4128/thumb/solana.png?1696504756"
            }
        ],
        "walletToWallet": true,
        "slippageUSD": null,
        "block": 173969068,
        "user": "HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g",
        "contractName": null,
        "functionName": null,
        "standard": null,
        "blacklisted": false,
        "status": "Identified",
        "userPaidFee": false
    }, ...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/period/all/extended/{userAddress}

- Summary  
  Get up to 100 transactions for a specific user, across all chains the user is active on, within the specified timeframe, including classification and DeFi PNL.

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "id": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xe08773a8efdc9006ff753c59d1bbf278d8eb9127",
                "tokenSymbol": "Reward at BoneWin.com",
                "tokenName": "",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": []
                },
                "from": "0x8d59af660a19f2a5c96dc452549922bb427604e2",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 50612654,
        "chain": "matic",
        "from": null,
        "hash": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1701433660,
        "txFee": 1149043491300000000,
        "txFeeUsd": 0.89774767975269,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "36de232f337436f2d357d95e5384b46d",
                "tokenSymbol": "Reward at shiba-bone.com",
                "tokenName": "#0",
                "tokenDecimals": 0,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": 0.0,
                    "action": "TRANSFER",
                    "content": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                    "detailUrl": "https://opensea.io/assets/0xfceb0b966be2921313daa57e898157b80adfc639/0",
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": "1",
                    "salesHistory": null
                },
                "from": "0xc89a584ed4540b4eada14f52e261e8e4831ba3a1",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 0,
        "chain": "xdai",
        "from": "0x4041f293958a98497d215b9c2b11f486d4e464e2",
        "hash": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": "0xfceb0b966be2921313daa57e898157b80adfc639",
        "timeStamp": 1701430325,
        "txFee": 0,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": "0x3764d79db51726e900a1380055f469eb6e2a7fd3",
        "logs": null,
        "contractName": null,
        "functionName": null,
        "encodingFunction": null,
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": null,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "LidoSubmitEvent:0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19-1018",
        "active": true,
        "balances": [
            {
                "balance": 190000199999999999999,
                "balanceUSD": 298951.1125650504,
                "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
                "tokenSymbol": "stETH",
                "tokenName": "stETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0xae7ab96520de3a18e5e111b5eaab095312d7fe84.png",
                "standard": "ERC20",
                "nftDetails": null,
                "from": "0x0000000000000000000000000000000000000000",
                "to": "0x796fa775ef443ce683d24eadf48cbf551473b3b6"
            },
            {
                "balance": -190000200000000000000,
                "balanceUSD": -299176.70892252,
                "tokenAddress": "0x0000000000000000000000000000000000000000",
                "tokenSymbol": "ETH",
                "tokenName": "ETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0x0000000000000000000000000000000000000000.png",
                "standard": "NATIVE",
                "nftDetails": null,
                "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
                "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
            }
        ],
        "slippageUSD": null,
        "block": 18212373,
        "chain": "eth",
        "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
        "hash": "0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19",
        "order": 78221546417553513,
        "pnlUsd": 86993.58318610775,
        "positionYield": {
            "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
            "balance": 1000928015303509754,
            "balanceUSD": 1986.911609735535,
            "tokenSymbol": "stETH",
            "tokenDecimals": 18
        },
        "protocol": "lido",
        "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
        "timeStamp": 1695639731,
        "txFee": 1015807888924390,
        "txFeeUsd": 1.5995039010797447,
        "txType": "Staking Deposit",
        "txAction": "Staked",
        "yields": [],
        "yieldUSD": 1986.911609735535,
        "poolData": {
            "poolToken": "0x0000000000000000000000000000000000000000",
            "poolPnlUSD": 0.0,
            "poolYieldUSD": 0.0
        },
        "oppositeEvents": [],
        "user": "null",
        "logs": null,
        "contractName": "Lido",
        "functionName": "_submit",
        "encodingFunction": "0xa1903eab",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": false,
        "blacklisted": false,
        "successful": true,
        "userPaidFees": true
    }, ...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/period/chain/extended/{userAddress}

- Summary  
  Get up to 100 transactions for a specific user and chain, within the specified timeframe, including classification and DeFi PNL.

#### Responses

- 200 Ok

`application/json`

```ts
[
    {
        "id": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xe08773a8efdc9006ff753c59d1bbf278d8eb9127",
                "tokenSymbol": "Reward at BoneWin.com",
                "tokenName": "",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": []
                },
                "from": "0x8d59af660a19f2a5c96dc452549922bb427604e2",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 50612654,
        "chain": "matic",
        "from": null,
        "hash": "0x19764c9a1afcd9cda4c46d20458fad9ed1961bfd7bcc2f7f14d740e9737bb807",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1701433660,
        "txFee": 1149043491300000000,
        "txFeeUsd": 0.89774767975269,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "36de232f337436f2d357d95e5384b46d",
                "tokenSymbol": "Reward at shiba-bone.com",
                "tokenName": "#0",
                "tokenDecimals": 0,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": 0.0,
                    "action": "TRANSFER",
                    "content": "https://valk-merlin.s3.amazonaws.com/token-icons-small/36de232f337436f2d357d95e5384b46d.",
                    "detailUrl": "https://opensea.io/assets/0xfceb0b966be2921313daa57e898157b80adfc639/0",
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": "1",
                    "salesHistory": null
                },
                "from": "0xc89a584ed4540b4eada14f52e261e8e4831ba3a1",
                "to": "0x3764d79db51726e900a1380055f469eb6e2a7fd3"
            }
        ],
        "slippageUSD": null,
        "block": 0,
        "chain": "xdai",
        "from": "0x4041f293958a98497d215b9c2b11f486d4e464e2",
        "hash": "0x19c0c5797cffd83dd47ab426572914dff4c0f0e910b96b8787a3472f3b6dff53",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": "0xfceb0b966be2921313daa57e898157b80adfc639",
        "timeStamp": 1701430325,
        "txFee": 0,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": "0x3764d79db51726e900a1380055f469eb6e2a7fd3",
        "logs": null,
        "contractName": null,
        "functionName": null,
        "encodingFunction": null,
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": null,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "LidoSubmitEvent:0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19-1018",
        "active": true,
        "balances": [
            {
                "balance": 190000199999999999999,
                "balanceUSD": 298951.1125650504,
                "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
                "tokenSymbol": "stETH",
                "tokenName": "stETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0xae7ab96520de3a18e5e111b5eaab095312d7fe84.png",
                "standard": "ERC20",
                "nftDetails": null,
                "from": "0x0000000000000000000000000000000000000000",
                "to": "0x796fa775ef443ce683d24eadf48cbf551473b3b6"
            },
            {
                "balance": -190000200000000000000,
                "balanceUSD": -299176.70892252,
                "tokenAddress": "0x0000000000000000000000000000000000000000",
                "tokenSymbol": "ETH",
                "tokenName": "ETH",
                "tokenDecimals": 18,
                "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0x0000000000000000000000000000000000000000.png",
                "standard": "NATIVE",
                "nftDetails": null,
                "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
                "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
            }
        ],
        "slippageUSD": null,
        "block": 18212373,
        "chain": "eth",
        "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
        "hash": "0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19",
        "order": 78221546417553513,
        "pnlUsd": 86993.58318610775,
        "positionYield": {
            "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
            "balance": 1000928015303509754,
            "balanceUSD": 1986.911609735535,
            "tokenSymbol": "stETH",
            "tokenDecimals": 18
        },
        "protocol": "lido",
        "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
        "timeStamp": 1695639731,
        "txFee": 1015807888924390,
        "txFeeUsd": 1.5995039010797447,
        "txType": "Staking Deposit",
        "txAction": "Staked",
        "yields": [],
        "yieldUSD": 1986.911609735535,
        "poolData": {
            "poolToken": "0x0000000000000000000000000000000000000000",
            "poolPnlUSD": 0.0,
            "poolYieldUSD": 0.0
        },
        "oppositeEvents": [],
        "user": "null",
        "logs": null,
        "contractName": "Lido",
        "functionName": "_submit",
        "encodingFunction": "0xa1903eab",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": null,
        "walletToWallet": false,
        "blacklisted": false,
        "successful": true,
        "userPaidFees": true
    }, ...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}

- Summary  
  Get up to 20 transactions for a specific user and chain, within the specified timeframe, excluding token USD valuations, but including classification.

#### Responses

- 200 Ok

`application/json`

```ts
[
{
        "id": "0x1b6d7a57c8a2c2c24a9db727f4e1c198844c162f753dfe17a0fc0440816807a7",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xa0abe27ed222dc405ed2baa00e848686af54984b",
                "tokenSymbol": "$77,749 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x4a950bb1498a7e2151dd1885c303972bb342ef59",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 25069360,
        "chain": "celo",
        "from": null,
        "hash": "0x1b6d7a57c8a2c2c24a9db727f4e1c198844c162f753dfe17a0fc0440816807a7",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1713017366,
        "txFee": 37917590000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x6d0982e713cc1334fee9c053a10204c838c956c99c4eba3a7817ba3dec1e42dc",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0x6cba96d3a42707967325da35349b46a86b1a49d7",
                "tokenSymbol": "$77,749 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x4a950bb1498a7e2151dd1885c303972bb342ef59",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 25069334,
        "chain": "celo",
        "from": null,
        "hash": "0x6d0982e713cc1334fee9c053a10204c838c956c99c4eba3a7817ba3dec1e42dc",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1713017236,
        "txFee": 37917590000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x54383b97cfea67066669131e288b6edb1a39a57efaa2c5f93b61f8700de5c086",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0x673d9e3e1b2fea36836aef5f123923dc45ee7ec7",
                "tokenSymbol": "$77,749 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x4a950bb1498a7e2151dd1885c303972bb342ef59",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 25069307,
        "chain": "celo",
        "from": null,
        "hash": "0x54383b97cfea67066669131e288b6edb1a39a57efaa2c5f93b61f8700de5c086",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1713017101,
        "txFee": 37917590000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x9898f0d014117e0506254ce5f1411b10b11ed4ff1720f2bf97ee7dbe4bd9e995",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0x0c57c4f675b7c322caf570d003496ef3906f204e",
                "tokenSymbol": "$77,749 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x4a950bb1498a7e2151dd1885c303972bb342ef59",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 25069283,
        "chain": "celo",
        "from": null,
        "hash": "0x9898f0d014117e0506254ce5f1411b10b11ed4ff1720f2bf97ee7dbe4bd9e995",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1713016981,
        "txFee": 37917590000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0xc04d9168c025b5c04da7f4d3de62a54ee92ad7c5f4e835630e333bf02cba0a87",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0x81faad7d94ca1ab2b15ebe8cfb07a5a728e1c8b7",
                "tokenSymbol": "$82,499 Random Winner",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0xbd4c607379da7b162f77161eadaa2d0d6dbf07f1",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 24945917,
        "chain": "celo",
        "from": null,
        "hash": "0xc04d9168c025b5c04da7f4d3de62a54ee92ad7c5f4e835630e333bf02cba0a87",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1712400136,
        "txFee": 37918010000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x1dabd585dec5a710abc8edeab88d56f9366812f385403bee9c2a6bc940c4fcec",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xdca54b467c531661942daab4ac3c93171b5db6a5",
                "tokenSymbol": "reward at BONEWIN.com",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x691d1a6878dd6c7591ce1cda641531b9621151aa",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 24917383,
        "chain": "celo",
        "from": null,
        "hash": "0x1dabd585dec5a710abc8edeab88d56f9366812f385403bee9c2a6bc940c4fcec",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1712257458,
        "txFee": 68698280000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    },
    {
        "id": "0x168c969d2226a2754f9718f58672cb9aa0337b04ced06a1e70b19b810a91b3e8",
        "active": null,
        "balances": [
            {
                "balance": 1,
                "balanceUSD": 0.0,
                "tokenAddress": "0xdf18490b7bd07982a554799db18cbd882105cc7a",
                "tokenSymbol": "reward at BONEWIN.com",
                "tokenName": "­",
                "tokenDecimals": 0,
                "tokenLogo": null,
                "standard": "ERC1155",
                "nftDetails": {
                    "floorPrice": null,
                    "action": "TRANSFER",
                    "content": null,
                    "detailUrl": null,
                    "innerId": "0",
                    "payToken": null,
                    "totalSupply": null,
                    "salesHistory": null
                },
                "from": "0x6ddb0f62f598d18b215dd30754bfcf3d0e4e4257",
                "to": "0x3af4a49c8e2fcaf33fd3389543b80d320fcc9091"
            }
        ],
        "slippageUSD": null,
        "block": 24902759,
        "chain": "celo",
        "from": null,
        "hash": "0x168c969d2226a2754f9718f58672cb9aa0337b04ced06a1e70b19b810a91b3e8",
        "order": 0,
        "pnlUsd": null,
        "positionYield": null,
        "protocol": "",
        "to": null,
        "timeStamp": 1712184337,
        "txFee": 62930064000000000,
        "txFeeUsd": 0.0,
        "txType": "Airdrop",
        "txClassification": "Scam",
        "txAction": null,
        "yields": null,
        "yieldUSD": null,
        "poolData": null,
        "oppositeEvents": null,
        "user": null,
        "logs": null,
        "contractName": null,
        "functionName": "Transfer",
        "encodingFunction": "0xa9059cbb",
        "bundleWallet": null,
        "walletAddress": null,
        "standard": "ERC1155",
        "walletToWallet": false,
        "blacklisted": true,
        "successful": true,
        "userPaidFees": false
    }, ...
]
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTx/byHash/{chain}/{hash}/{userAddress}

- Summary  
  Get full transaction details for a specific transaction hash.

#### Responses

- 200 Ok

`application/json`

```ts
{
    "id": "LidoSubmitEvent:0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19-1018",
    "active": true,
    "balances": [
        {
            "balance": 190000199999999999999,
            "balanceUSD": 298951.1125650504,
            "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
            "tokenSymbol": "stETH",
            "tokenName": "stETH",
            "tokenDecimals": 18,
            "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0xae7ab96520de3a18e5e111b5eaab095312d7fe84.png",
            "standard": "ERC20",
            "nftDetails": null,
            "from": "0x0000000000000000000000000000000000000000",
            "to": "0x796fa775ef443ce683d24eadf48cbf551473b3b6"
        },
        {
            "balance": -190000200000000000000,
            "balanceUSD": -299176.70892252,
            "tokenAddress": "0x0000000000000000000000000000000000000000",
            "tokenSymbol": "ETH",
            "tokenName": "ETH",
            "tokenDecimals": 18,
            "tokenLogo": "https://valk-merlin.s3.amazonaws.com/token-icons-small/0x0000000000000000000000000000000000000000.png",
            "standard": "NATIVE",
            "nftDetails": null,
            "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
            "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
        }
    ],
    "slippageUSD": null,
    "block": 18212373,
    "chain": "eth",
    "from": "0x796fa775ef443ce683d24eadf48cbf551473b3b6",
    "hash": "0xea46e0ac95b6a2f1e9666f26515bf0a3c439e80204a049f3a840a87a00021b19",
    "order": 78221546417553513,
    "pnlUsd": 126935.32727649844,
    "positionYield": {
        "tokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
        "balance": 1347501855409297530,
        "balanceUSD": 2938.82970983688,
        "tokenSymbol": "stETH",
        "tokenDecimals": 18
    },
    "protocol": "lido",
    "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
    "timeStamp": 1695639731,
    "txFee": 1015807888924390,
    "txFeeUsd": 1.5995039010797447,
    "txType": "Staking Deposit",
    "txAction": "Staked",
    "yields": [],
    "yieldUSD": 2938.82970983688,
    "poolData": {
        "poolToken": "0x0000000000000000000000000000000000000000",
        "poolPnlUSD": 0.0,
        "poolYieldUSD": 0.0
    },
    "oppositeEvents": [],
    "user": "null",
    "logs": null,
    "contractName": "Lido",
    "functionName": "_submit",
    "encodingFunction": "0xa1903eab",
    "bundleWallet": null,
    "walletAddress": null,
    "standard": null,
    "walletToWallet": false,
    "blacklisted": false,
    "successful": null,
    "userPaidFees": null
}
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/v2/userTxTransfers/byHash/{chain}/{hash}/{userAddress}

- Summary  
  Get only transaction transfers (moved balances) for a specific transaction hash.

#### Responses

- 200 Ok

`application/json`

```ts
[
  {
    balance: 12500000000,
    balanceUSD: 0.0,
    tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenDecimals: 6,
    tokenLogo: null,
    standard: 'ERC20',
    nftDetails: null,
    from: '0x4fd4ae89eedaa3cbfc01933d981f4cb91d29e8ac',
    to: '0xdef171fe48cf0115b1d80b88dc8eab59176fee57',
  },
  {
    balance: 12472427925,
    balanceUSD: 0.0,
    tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    tokenSymbol: 'USDT',
    tokenName: 'Tether USD',
    tokenDecimals: 6,
    tokenLogo: null,
    standard: 'ERC20',
    nftDetails: null,
    from: '0xdef171fe48cf0115b1d80b88dc8eab59176fee57',
    to: '0x4fd4ae89eedaa3cbfc01933d981f4cb91d29e8ac',
  },
  {
    balance: 8383088,
    balanceUSD: 0.0,
    tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenDecimals: 6,
    tokenLogo: null,
    standard: 'ERC20',
    nftDetails: null,
    from: '0x4fd4ae89eedaa3cbfc01933d981f4cb91d29e8ac',
    to: '0xb21090c8f6bac1ba614a3f529aae728ea92b6487',
  },
];
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/userTx/position/?position={position}

- Summary  
  Get all the transactions for a specific user and DeFi position in a protocol, including classification and DeFi PNL.

#### Responses

- 200 Ok

`application/json`

```ts
[
  {
    id: 'UniswapV3CollectEvent:0xc2f719aa635b24bdce2102ebbdc9e6ece820c6ddfa4b38bba8d7f282fe790738-315:20036',
    active: null,
    balances: [
      {
        balance: 313367054486062730,
        balanceUSD: 8.08,
        tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        tokenSymbol: 'UNI',
        tokenName: 'Uniswap',
        tokenDecimals: 18,
        tokenLogo: null,
        standard: 'ERC20',
        nftDetails: null,
        from: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
        to: 'null',
      },
      {
        balance: 3129530492612959,
        balanceUSD: 8.24,
        tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        tokenSymbol: 'WETH',
        tokenName: 'Wrapped Ether',
        tokenDecimals: 18,
        tokenLogo: null,
        standard: 'ERC20',
        nftDetails: null,
        from: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
        to: 'null',
      },
    ],
    slippageUSD: null,
    block: 0,
    chain: 'eth',
    from: 'null',
    hash: '0xc2f719aa635b24bdce2102ebbdc9e6ece820c6ddfa4b38bba8d7f282fe790738',
    order: 231988688441189853942513979,
    pnlUsd: null,
    positionYield: null,
    protocol: 'UNISWAP_V3__POOL',
    to: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
    timeStamp: 1622918956,
    txFee: 0,
    txFeeUsd: 0.0,
    txType: 'Claim',
    txClassification: 'Collect Reward',
    txAction: 'Liquidity Pool',
    yields: null,
    yieldUSD: null,
    poolData: null,
    oppositeEvents: null,
    user: 'null',
    logs: null,
    contractName: 'NonfungiblePositionManager',
    functionName: 'collect',
    encodingFunction: null,
    bundleWallet: null,
    walletAddress: null,
    standard: null,
    walletToWallet: null,
    blacklisted: false,
    successful: null,
    userPaidFees: null,
  },
  {
    id: 'UniswapV3DecreaseLiquidityEvent:0xc2f719aa635b24bdce2102ebbdc9e6ece820c6ddfa4b38bba8d7f282fe790738-310:20036',
    active: null,
    balances: [
      {
        balance: 61017352980475735710,
        balanceUSD: 1574.39,
        tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        tokenSymbol: 'UNI',
        tokenName: 'Uniswap',
        tokenDecimals: 18,
        tokenLogo: null,
        standard: 'ERC20',
        nftDetails: null,
        from: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
        to: 'null',
      },
      {
        balance: 533541894507637327,
        balanceUSD: 1406.05,
        tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        tokenSymbol: 'WETH',
        tokenName: 'Wrapped Ether',
        tokenDecimals: 18,
        tokenLogo: null,
        standard: 'ERC20',
        nftDetails: null,
        from: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
        to: 'null',
      },
    ],
    slippageUSD: null,
    block: 0,
    chain: 'eth',
    from: 'null',
    hash: '0xc2f719aa635b24bdce2102ebbdc9e6ece820c6ddfa4b38bba8d7f282fe790738',
    order: 231988688441189853942513974,
    pnlUsd: null,
    positionYield: null,
    protocol: 'UNISWAP_V3__POOL',
    to: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
    timeStamp: 1622918956,
    txFee: 0,
    txFeeUsd: 0.0,
    txType: 'Withdrew',
    txClassification: 'LP Withdraw',
    txAction: 'Liquidity Pool',
    yields: null,
    yieldUSD: null,
    poolData: null,
    oppositeEvents: null,
    user: 'null',
    logs: null,
    contractName: 'NonfungiblePositionManager',
    functionName: 'decreaseLiquidity',
    encodingFunction: null,
    bundleWallet: null,
    walletAddress: null,
    standard: null,
    walletToWallet: null,
    blacklisted: false,
    successful: null,
    userPaidFees: null,
  },
  {
    id: 'UniswapV3IncreaseLiquidityEvent:0xb61b84f899f89a8b78945adde85ef1d552125ca3ccbfe09797a6f665c85663c5-202:20036',
    active: true,
    balances: [
      {
        balance: -67608508299357399788,
        balanceUSD: -1362.91,
        tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        tokenSymbol: 'UNI',
        tokenName: 'Uniswap',
        tokenDecimals: 18,
        tokenLogo: null,
        standard: 'ERC20',
        nftDetails: null,
        from: 'null',
        to: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
      },
      {
        balance: -483412023761024692,
        balanceUSD: -1108.98,
        tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        tokenSymbol: 'WETH',
        tokenName: 'Wrapped Ether',
        tokenDecimals: 18,
        tokenLogo: null,
        standard: 'ERC20',
        nftDetails: null,
        from: 'null',
        to: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
      },
      {
        balance: 1000000000000000000,
        balanceUSD: 187.33,
        tokenAddress: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
        tokenSymbol: 'UNI-V3',
        tokenName: 'Uniswap V3',
        tokenDecimals: 18,
        tokenLogo: null,
        standard: 'ERC721',
        nftDetails: null,
        from: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
        to: 'null',
      },
    ],
    slippageUSD: null,
    block: 0,
    chain: 'eth',
    from: 'null',
    hash: '0xb61b84f899f89a8b78945adde85ef1d552125ca3ccbfe09797a6f665c85663c5',
    order: 230320973649717543538000074,
    pnlUsd: 506.97,
    positionYield: null,
    protocol: 'UNISWAP_V3__POOL',
    to: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
    timeStamp: 1621708078,
    txFee: 0,
    txFeeUsd: 0.0,
    txType: 'Deposited',
    txClassification: 'LP Deposit',
    txAction: 'Liquidity Pool',
    yields: [
      {
        tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        balance: 313367054486062730,
        balanceUSD: 8.08,
        tokenSymbol: 'UNI',
        tokenDecimals: 18,
      },
      {
        tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        balance: 3129530492612959,
        balanceUSD: 8.24,
        tokenSymbol: 'WETH',
        tokenDecimals: 18,
      },
    ],
    yieldUSD: 16.32,
    poolData: null,
    oppositeEvents: [
      {
        id: 'UniswapV3CollectEvent:0xc2f719aa635b24bdce2102ebbdc9e6ece820c6ddfa4b38bba8d7f282fe790738-315:20036',
        balances: [
          {
            balance: 313367054486062730,
            balanceUSD: 8.08,
            tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            tokenSymbol: 'UNI',
            tokenName: 'Uniswap',
            tokenDecimals: 18,
            tokenLogo: null,
          },
          {
            balance: 3129530492612959,
            balanceUSD: 8.24,
            tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenSymbol: 'WETH',
            tokenName: 'Wrapped Ether',
            tokenDecimals: 18,
            tokenLogo: null,
          },
        ],
        eventType: 'UniswapV3CollectEvent',
        position: null,
        protocol: 'UNISWAP_V3__POOL',
        timestamp: 1622918956,
        txInfo: {
          txFee: {
            fee: 3514200000000000,
            feeUSD: 9.26,
          },
          block: null,
        },
        chain: 'eth',
        transaction: null,
      },
    ],
    user: 'null',
    logs: null,
    contractName: 'NonfungiblePositionManager',
    functionName: 'increaseLiquidity',
    encodingFunction: null,
    bundleWallet: null,
    walletAddress: null,
    standard: null,
    walletToWallet: null,
    blacklisted: false,
    successful: null,
    userPaidFees: null,
  },
];
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```

### [GET]/api/merlin/public/userTx/overview/{userAddress}

- Summary  
  Get a list of chains the specific user is active on, and the number of transactions initiated by the user on those chains

#### Responses

- 200 Ok

`application/json`

```ts
{
    "wallet": "0x3764D79db51726E900a1380055F469eB6e2a7fD3",
    "nbOfChains": 14,
    "nbOfTransactions": 245,
    "creationTimestamp": 1575512403,
    "overview": [
        {
            "chainId": "era",
            "creationTimestamp": 1693829339,
            "nbOfTransactions": null
        },
        {
            "chainId": "pls",
            "creationTimestamp": 1575512403,
            "nbOfTransactions": null
        }, ...
    ]
}
```

- 403 Forbidden

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:30:15.637+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/merlin/public/..."
}
```

- 404 Not Found

`application/json`

```ts
{
    "timestamp": "2023-12-04T08:19:51.738+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/api/merlin/public/v2/..."
}
```
