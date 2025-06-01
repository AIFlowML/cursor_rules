# Tested cURL Commands for Actions

This file lists the cURL commands that will be executed by `curls_test.sh`.

## GET_ALL_USER_DEFI_POSITIONS 

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/all/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" | cat
```

## GET_USER_DEFI_POSITIONS_BY_CHAIN

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=arb" | cat
```

## GET_USER_DEFI_POSITIONS_BY_MULTIPLE_CHAINS

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsByChains/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chains=avax,arb" | cat
```

## GET_USER_DEFI_POSITIONS_BY_PROTOCOL

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/protocol/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=avax&protocol=avax_gmx" | cat
```

## GET_USER_DEFI_PROTOCOL_BALANCES_BY_CHAIN

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/protocol/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=eth" | cat
```

## GET_USER_OVERALL_BALANCE_ALL_CHAINS

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/all/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106" | cat
```

## GET_USER_OVERALL_BALANCE_BY_CHAIN

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/chain/0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3?chain=avax" | cat
```

## GET_WALLET_BALANCES_BY_CHAIN

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic" | cat
```

## GET_NATIVE_TOKEN_BALANCE_BY_CHAIN

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/native/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=eth" | cat
```

## GET_TOKEN_BALANCES_BY_CHAIN

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=base" | cat
```

## GET_USER_TOKEN_BALANCES_BY_MULTIPLE_CHAINS_ACTION

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/chains/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chains=base,eth" | cat
```

## GET_USER_NFTS_LIST

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/0x3764D79db51726E900a1380055F469eB6e2a7fD3" | cat
```

## GET_USER_NFTS_BY_CHAIN

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/balances/nft/chain/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic" | cat
```

## GET_USER_TRANSACTIONS

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=5" | cat
```

## GET_USER_TX_HISTORY_ALL_CHAINS_SHORT

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userTx/history/all/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?limit=10" | cat
```

## GET_USER_TRANSACTIONS_BY_CHAIN

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10" | cat
```

## GET_USER_TX_HISTORY_BY_CHAIN_RAW_LABEL

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth&limit=10" | cat
```

## GET_SOLANA_USER_TX_HISTORY_EXTENDED

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ?chain=solana&limit=5" | cat
```

## GET_SOLANA_USER_TX_HISTORY_SHORT

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/HM7A27keP6GtwQ2nRCgstb2UhveG5SDTvM7aHJadRb2g?chain=solana&limit=5" | cat
```

## GET_USER_TX_BY_PERIOD_ALL_CHAINS_EXTENDED

```bash
curl --location "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/all/extended/0x9a25d79ab755718e0b12bd3c927a010a543c2b31?startTime=1703999553&endTime=1698729153" --header "Authorization: OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH" | cat
```

## GET_USER_TX_BY_PERIOD_AND_CHAIN_EXTENDED

```bash
curl --location "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?startTime=1716346533&endTime=1705895733&chain=xdai" --header "Authorization: OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH" | cat
```

## GET_USER_TX_BY_PERIOD_AND_CHAIN_RAW_LABEL_20

```bash
curl --location "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=eth&startTime=1716346533&endTime=1705895733" --header "Authorization: OmlhD7WJMBRQVWHrEOXmruDBNj4DhbQH" | cat
```

## GET_TRANSACTION_BY_HASH

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944" | cat
```

## GET_TRANSACTION_TRANSFERS_BY_HASH

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944" | cat
```

## GET_TRANSACTIONS_FOR_DEFI_POSITION

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/userTx/position/?position=compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726E900a1380055F469eB6e2a7fD3:0" | cat
```

## GET_USER_TRANSACTION_OVERVIEW

```bash
curl -X GET -H "Authorization: dbNb54fQUGCuy2xO3RXPRw7bH9nbDSkS" "https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/0x4f2083f5fbede34c2714affb3105539775f7fe64" | cat
```
