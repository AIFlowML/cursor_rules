# Datai API Call Reference (from CSV)

This document lists API calls and their proposed action names, extracted from `Datai_API_calls - Sheet1.csv`.

---

### 1. getSupportedChains
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/chains`

---

### 2. getAdvTxsSupportedChains
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/tx/supportedChains`

---

### 3. getSupportedProtocols
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/protocols`

---

### 4. getUserDeFiPositionsWithPnl
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsWithPnl/all/0x3764D79db51726E900a1380055F469eB6e2a7fD3`
**Sample API Call (Optional Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsWithPnl/all/0x3764D79db51726E900a1380055F469eB6e2a7fD3?timestamp=1661753926`

---

### 5. getUserDeFiPositions
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/all/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`

---

### 6. getUserDeFiPositionsWithPnlByChain
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsWithPnl/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=eth`
**Sample API Call (Optional Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsWithPnl/0x3764D79db51726E900a1380055F469eB6e2a7fD3?timestamp=1661753926&chain=eth`

---

### 7. getUserDeFiPositionsByChain
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=arb`

---

### 8. getUserDeFiPositionsByChains
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsByChains/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chains=avax,arb`

---

### 9. getUserDeFiPositionsWithPnlByProtocol
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositionsWithPnl/protocol/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=eth&protocol=compound`

---

### 10. getUserDeFiPositionsByProtocol
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userDeFiPositions/protocol/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=avax&protocol=avax_gmx`

---

### 11. getUserDeFiBalancesByChain
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/protocol/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106?chain=eth`

---

### 12. getDailyAnalyticsForUniswapPosition
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/lpTokenAnalyticsByDay?position=0x3764d79db51726e900a1380055f469eb6e2a7fd3:0xc5be99a02c6857f9eac67bbce58df5572498f40c:UNISWAP_V2`

---

### 13. getSnapshotAnalyticsForAllUniswapPositions
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/uniswapLpTokenAnalytics/0x3764d79db51726e900a1380055f469eb6e2a7fd3`
**Sample API Call (Optional Params):**
`https://api-v1.mymerlin.io/api/merlin/public/uniswapLpTokenAnalytics/0x3764d79db51726e900a1380055f469eb6e2a7fd3?timestamp=1661753926`

---

### 14. getUserTxHistoryBy100
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/0x4f2083f5fbede34c2714affb3105539775f7fe64`

---

### 15. getUserTxHistoryBy20
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/0x4f2083f5fbede34c2714affb3105539775f7fe64?startTime=1745309427`

---

### 16. getUserTxHistoryByChainBy100
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth`
**Sample API Call (Optional Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/extended/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?startTime=1704514055&chain=eth`

---

### 17. getUserTxHistoryByChainRawBy400
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?chain=eth`
**Sample API Call (Optional Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/chain/rawlabel/0x8e9741f27b21d6b3d5791b5566a880ecf5a1f21e?startTime=1646735510&chain=eth`

---

### 18. getUserSolanaTxHistoryBy100
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ`
**Sample API Call (Optional Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/extended/rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ?beforeHash=5tz3YZztKdDzLeTU21CumQrfN3V3Zn2a9RUYtEjvtnPjr4DnMSmtxQaHo1CnmgrwZN6WMPtReqaUthc6jyuBmMQ3`

---

### 19. getUserSolanaTxHistoryBy20
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ`
**Sample API Call (Optional Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/history/all/rTXw3t2M9CowfNy23AVtvnnGvve2VbHtH9AcRRzrXyJ?beforeHash=5tz3YZztKdDzLeTU21CumQrfN3V3Zn2a9RUYtEjvtnPjr4DnMSmtxQaHo1CnmgrwZN6WMPtReqaUthc6jyuBmMQ3`

---

### 20. getUserTxHistoryByPeriodBy100
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/all/extended/0x9a25d79ab755718e0b12bd3c927a010a543c2b31?startTime=1703999553&endTime=1698729153`

---

### 21. getUserTxHistoryByPeriodByChainBy100
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/extended/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?startTime=1716346533&endTime=1705895733&chain=xdai`

---

### 22. getUserTxHistoryByPeriodByChainRawBy20
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/period/chain/rawlabel/20/0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50?chain=eth&startTime=1716346533&endTime=1705895733`

---

### 23. getUserTxByHash
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944`

---

### 24. getUserTxTransfersByHash
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTxTransfers/byHash/eth/0xd4cd05342193d605764dcef1648b4f69fb90b2e4c7e315b7956fa0848cd727bf/0x218e312fF5181290A46e3f87A73A8aD40C05A944`

---

### 25. getUserTxByDefiPosition
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/userTx/position?position=compound__lending:compound-0xc00e94cb662c3520282e6f5717214004a7f26888:0x3764d79db51726e900a1380055f469eb6e2a7fd3:0`

---

### 26. getUserTxOverview
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/overview/0x4fd4ae89eedaa3cbfc01933d981f4cb91d29e8ac`

---

### 27. postUserAnalyticsProvisioning
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/provision/0x581cf4642283eda85a64bb45cd226854415ab830`

---

### 28. getUserAnalyticsBeta
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/userTx/analytics/0x000000000A38444e0a6E37d3b630d7e855a7cb13`

---

### 29. getUserTotalBalanceAllChains
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/all/0x09CF915e195aF33FA7B932C253352Ae9FBdB0106`

---

### 30. getUserTotalBalanceByChain
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/chain/0x21dd5c13925407e5bcec3f27ab11a355a9dafbe3?chain=avax`

---

### 31. getUserAllBalancesByChain
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=matic`

---

### 32. getUserNativeBalanceByChain
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/native/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=eth`

---

### 33. getUserTokenBalancesByChain
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=base`

---

### 34. getUserTokenBalancesByChains
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/chains/token/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chains=base,eth`

---

### 35. getUserNFTsByChain
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/nft/chain/0x3764D79db51726E900a1380055F469eB6e2a7fD3?chain=eth`

---

### 36. getUserNFTs
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/balances/nft/all/0x3764D79db51726E900a1380055F469eB6e2a7fD3`

---

### 37. getLpTokenPriceByTime
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/lp-token/price?address=0xd3d2e2692501a5c9ca623199d38826e513033A17&chain=eth&timestamp=1661753926`

---

### 38. getLpTokenPriceByBlock
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/lp-token/price?address=0xd3d2e2692501a5c9ca623199d38826e513033A17&chain=eth&blockNumber=15432506`

---

### 39. getApiBalanceUsage
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/units-balance`

---

### 40. getCexAddress
**Sample API Call (Mandatory Params):**
`https://api-v1.mymerlin.io/api/merlin/public/v2/insights/catalog/cex/0xc1921072db5266d950acc8e721507f7542445ba5`

---
