# Datai Plugin for ElizaOS - Action Plan

## Current Status
- ✅ Project structure and configuration set up
- ✅ Type definitions implemented in `src/types/index.ts` 
- ✅ Constants and API configuration established in `src/constants.ts`
- ✅ Validation utilities created in `src/utils/validation.ts`
- ✅ API client implemented in `src/utils/apiClient.ts`
- ✅ Plugin registration structure set up in `src/index.ts`
- ✅ All 26 actions have been implemented
- ✅ Action index file structure established in `src/actions/index.ts`

## Implemented Actions (26 of 26)
- ✅ `getAllUserDeFiPositionsAction` - `src/actions/getAllUserDeFiPositions.ts`
- ✅ `getUserDeFiPositionsByChainAction` - `src/actions/getUserDeFiPositionsByChainAction.ts`
- ✅ `getUserDeFiPositionsByMultipleChainsAction` - `src/actions/getUserDeFiPositionsByMultipleChainsAction.ts`
- ✅ `getUserDeFiPositionsByProtocolAction` - `src/actions/getUserDeFiPositionsByProtocolAction.ts`
- ✅ `getUserDeFiProtocolBalancesByChainAction` - `src/actions/getUserDeFiProtocolBalancesByChainAction.ts`
- ✅ `getUserOverallBalanceAllChainsAction` - `src/actions/getUserOverallBalanceAllChainsAction.ts`
- ✅ `getWalletBalancesByChainAction` - `src/actions/getWalletBalancesByChainAction.ts`
- ✅ `getTokenBalancesByChainAction` - `src/actions/getTokenBalancesByChainAction.ts`
- ✅ `getUserOverallBalanceByChainAction` - `src/actions/getUserOverallBalanceByChainAction.ts`
- ✅ `getNativeTokenBalanceByChainAction` - `src/actions/getNativeTokenBalanceByChainAction.ts`
- ✅ `getGroupedTokenBalancesByMultipleChainsAction` - `src/actions/getGroupedTokenBalancesByMultipleChainsAction.ts`
- ✅ `getUserNFTsListAction` - `src/actions/getUserNFTsListAction.ts`
- ✅ `getUserNFTsByChainAction` - `src/actions/getUserNFTsByChainAction.ts`
- ✅ `getUserTransactionsAction` - `src/actions/getUserTransactionsAction.ts`
- ✅ `getUserTransactionsByChainAction` - `src/actions/getUserTransactionsByChainAction.ts`
- ✅ `getUserTxHistoryAllChainsShortAction` - `src/actions/getUserTxHistoryAllChainsShortAction.ts`
- ✅ `getSolanaUserTxHistoryExtendedAction` - `src/actions/getSolanaUserTxHistoryExtendedAction.ts`
- ✅ `getSolanaUserTxHistoryShortAction` - `src/actions/getSolanaUserTxHistoryShortAction.ts`
- ✅ `getUserTxByPeriodAllChainsExtendedAction` - `src/actions/getUserTxByPeriodAllChainsExtendedAction.ts`
- ✅ `getUserTxHistoryByChainRawLabelAction` - `src/actions/getUserTxHistoryByChainRawLabelAction.ts`
- ✅ `getUserTxByPeriodAndChainExtendedAction` - `src/actions/getUserTxByPeriodAndChainExtendedAction.ts`
- ✅ `getUserTxByPeriodAndChainRawLabel20Action` - `src/actions/getUserTxByPeriodAndChainRawLabel20Action.ts`
- ✅ `getTransactionByHashAction` - `src/actions/getTransactionByHashAction.ts`
- ✅ `getTransactionTransfersByHashAction` - `src/actions/getTransactionTransfersByHashAction.ts`
- ✅ `getTransactionsForDeFiPositionAction` - `src/actions/getTransactionsForDeFiPositionAction.ts`
- ✅ `getUserTransactionOverviewAction` - `src/actions/getUserTransactionOverviewAction.ts`

## Plugin Integration
- ✅ All actions registered with ElizaOS through the plugin system
- ✅ Proper TypeScript typing throughout the codebase
- ✅ Consistent error handling and validation
- ✅ User-friendly response formatting for all actions

## Next Steps
- Conduct comprehensive testing of each action with real data
- Add more comprehensive documentation for developers
- Implement additional actions as new API endpoints become available

## File Naming Convention
All action files should follow these naming conventions:
1. Use camelCase for file names
2. File names should match the exported action name (including "Action" suffix)
3. Example: `getUserDeFiPositionsByChainAction` is defined in `getUserDeFiPositionsByChainAction.ts`

## Code Pattern for Actions
All action implementations should follow the established pattern:

1. Direct export of an `Action` object (not a factory function)
2. Include proper TypeScript types for all parameters and return values
3. Use the validation utilities from `src/utils/validation.ts`
4. Follow consistent error handling patterns
5. Format user-friendly response messages
6. Include example conversations in `ActionExample[][]` format
7. Use logger for appropriate debug and error tracking
8. Use the suffix "Action" in all action export names

## Testing Strategy
1. Test actions with valid and invalid wallet addresses
2. Verify parameter extraction and validation
3. Test API error handling
4. Verify response formatting for different scenarios
5. Test with mock API responses
6. Verify correct plugin registration

## Current Action Directory Structure
```
src/actions/
├── getAllUserDeFiPositions.ts  
├── getGroupedTokenBalancesByMultipleChainsAction.ts
├── getNativeTokenBalanceByChainAction.ts
├── getTransactionByHashAction.ts
├── getSolanaUserTxHistoryExtendedAction.ts
├── getSolanaUserTxHistoryShortAction.ts
├── getTokenBalancesByChainAction.ts
├── getUserDeFiPositionsByChainAction.ts
├── getUserDeFiPositionsByMultipleChainsAction.ts
├── getUserDeFiPositionsByProtocolAction.ts
├── getUserDeFiProtocolBalancesByChainAction.ts
├── getUserNFTsByChainAction.ts
├── getUserNFTsListAction.ts
├── getUserOverallBalanceAllChainsAction.ts
├── getUserOverallBalanceByChainAction.ts
├── getUserTransactionsAction.ts
├── getUserTransactionsByChainAction.ts
├── getUserTxByPeriodAllChainsExtendedAction.ts
├── getUserTxByPeriodAndChainExtendedAction.ts
├── getUserTxByPeriodAndChainRawLabel20Action.ts
├── getUserTxHistoryAllChainsShortAction.ts
├── getUserTxHistoryByChainRawLabelAction.ts
├── getWalletBalancesByChainAction.ts
└── index.ts
```

## Next Actions to Implement
1. `getTransactionTransfersByHashAction`
2. `getTransactionsForDeFiPositionAction`
3. `getUserTransactionOverviewAction`