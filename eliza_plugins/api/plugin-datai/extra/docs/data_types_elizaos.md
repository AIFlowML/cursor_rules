```typescript
// Action: getAllUserDeFiPositions
// Endpoint: GET /api/merlin/public/userDeFiPositions/all/{userAddress}

interface DeFiTokenDetail {
  balance: number;
  balanceUSD: number;
  id: string;
  logo: string;
  tokenAddress: string;
  tokenDecimals: number;
  tokenName: string;
  tokenSymbol: string;
  usdRate: number;
}

interface DeFiPortfolioDetail {
  borrow: DeFiTokenDetail[];
  rewards: DeFiTokenDetail[];
  supply: DeFiTokenDetail[];
}

interface DeFiStatistic {
  navUSD: number;
  totalDebtUSD: number;
  totalSupplyUSD: number;
}

interface DeFiEventBalance {
  balance: number;
  balanceUSD: number;
  tokenAddress: string;
  tokenDecimals: number;
  tokenLogo: string;
  tokenName: string;
  tokenSymbol: string;
}

interface DeFiEventFee {
  fee: number;
  feeUSD: number;
}

interface DeFiEventPositionDetail {
  balance: number;
}

interface DeFiEventPositionYield {
  balance: number;
  balanceUSD: number;
  tokenDecimals: number;
  tokenSymbol: string;
}

interface DeFiEventPosition {
  active: boolean;
  fees: DeFiEventFee[];
  pnlUSD: number;
  position: DeFiEventPositionDetail;
  positionYield: DeFiEventPositionYield;
  yieldUSD: number;
  yields: DeFiEventPositionYield[];
}

interface DeFiEvent {
  balances: DeFiEventBalance[];
  eventType: string;
  id: string;
  position: DeFiEventPosition;
  protocol: string;
  timestamp: number;
}

interface DeFiYieldAndPnl {
  address: string;
  deFiEvents: DeFiEvent[];
  decimals: number;
  name: string;
  pnlUSD: number;
  symbol: string;
  txCount: number;
  txFeeUSD: number;
  yieldUSD: number;
}

interface DeFiPortfolioItem {
  detail: DeFiPortfolioDetail;
  statistic: DeFiStatistic;
  yieldAndPnl: DeFiYieldAndPnl[];
}

interface UserDeFiPosition {
  chain: string;
  logo: string;
  name: string;
  portfolio: DeFiPortfolioItem[];
  site: string;
}

// This is the main response type for getAllUserDeFiPositions
// It's an array of UserDeFiPosition objects.
// type GetAllUserDeFiPositionsResponse = UserDeFiPosition[];

// Action: getUserDeFiPositionsByChain
// Endpoint: GET /api/merlin/public/userDeFiPositions/{userAddress}?chain={chain}

interface DeFiDetailedPortfolio {
  borrow: DeFiTokenDetail[];
  rewards: DeFiTokenDetail[];
  supply: DeFiTokenDetail[];
}

interface PoolTokenMonetaryValue {
  token0: number;
  token0USD: number;
  token1: number;
  token1USD: number;
  totalUSD: number;
}

interface PoolTokenInfo {
  decimals: number;
  id: string;
  name: string;
  symbol: string;
}

interface PoolDataItem {
  claimedFees: PoolTokenMonetaryValue;
  impermanentLoss: PoolTokenMonetaryValue;
  liquidity: PoolTokenMonetaryValue;
  maxPrice: number;
  minPrice: number;
  position: string;
  token0: PoolTokenInfo;
  token0USDPrice: number;
  token1: PoolTokenInfo;
  token1USDPrice: number;
  unclaimedFees: PoolTokenMonetaryValue;
}

interface DeFiTotal {
  debtUSD: number;
  navUSD: number;
  supplyUSD: number;
}

interface DeFiPortfolioItemByChain {
  detailed: DeFiDetailedPortfolio; // Note: Renamed from 'detail'
  poolData?: PoolDataItem[]; // Optional as per some structures
  total: DeFiTotal;
  yieldAndPnl: DeFiYieldAndPnl[];
}

interface UserDeFiPositionByChain {
  chain: string;
  logo: string;
  name: string;
  portfolio: DeFiPortfolioItemByChain[];
  site: string;
}

// type GetUserDeFiPositionsByChainResponse = UserDeFiPositionByChain[];

// Action: getUserDeFiPositionsByMultipleChains
// Endpoint: GET /api/merlin/public/userDeFiPositionsByChains/{userAddress}?chains={chain1,chain2,...,chain10}

// Response type is an array of UserDeFiPosition (defined for getAllUserDeFiPositions)
// type GetUserDeFiPositionsByMultipleChainsResponse = UserDeFiPosition[];

// Action: getUserDeFiPositionsByProtocol
// Endpoint: GET /api/merlin/public/userDeFiPositions/protocol/{userAddress}?chain={chain}&protocol={protocol}

// The original documentation shows a single object, but cURL tests returned an array.
// Using an array type for safety, reflecting observed behavior.
// type GetUserDeFiPositionsByProtocolResponse = UserDeFiPosition[];

// Action: getUserDeFiProtocolBalancesByChain
// Endpoint: GET /api/merlin/public/balances/protocol/{userAddress}?chain={chain}

interface ProtocolBalanceDetail {
  navUSD: number;
  assetUSD: number;
  debtUSD: number;
}

interface UserDeFiProtocolBalance {
  chain: string;
  name: string;
  commonName: string;
  logo: string;
  site: string;
  balance: ProtocolBalanceDetail;
}

// type GetUserDeFiProtocolBalancesByChainResponse = UserDeFiProtocolBalance[];

// Action: getUserOverallBalanceAllChains
// Endpoint: GET /api/merlin/public/balances/all/{userAddress}

interface FiatValues {
  USD: number;
  AED: number;
  AUD: number;
  CAD: number;
  EUR: number;
  GBP: number;
  INR: number;
}

interface ChainBalanceInfo {
  id: string; // chain id
  name: string; // chain name
  logoUrl: string;
  wrappedTokenId: string;
  valueUsd: number;
  fiatValues: FiatValues;
}

// Type based on the original documentation's schema (array root)
// type GetUserOverallBalanceAllChainsResponse_Doc = ChainBalanceInfo[];

// Type based on observed cURL response (object root)
interface UserOverallBalanceAllChains_Observed {
  totalValueUsd: number;
  byChain: ChainBalanceInfo[];
}

// Using the observed response structure as the primary type
// type GetUserOverallBalanceAllChainsResponse = UserOverallBalanceAllChains_Observed;

// Action: getUserOverallBalanceByChain
// Endpoint: GET /api/merlin/public/balances/chain/{userAddress}?chain={chain}

interface UserOverallBalanceByChainResponse {
  valueUsd: number;
  valueEUR: number;
  valueAUD: number;
  valueCAD: number;
  valueAED: number;
  valueINR: number;
  valueGBP: number;
}

// Action: getWalletBalancesByChain
// Endpoint: GET /api/merlin/public/balances/{userAddress}?chain={chain}

interface NftBalanceDetail {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  tokenId: string;
  contractType: string;
  ownerOf: string;
  blockNumberMinted: number; // Assuming long translates to number in TS
  detailUrl: string;
}

interface TokenBalanceDetail {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  balance: number; // Assuming long translates to number in TS
  logoUrl: string;
}

interface WalletBalancesByChainResponse {
  nativeBalance: number; // Assuming long translates to number
  nativeBalanceDecimal: number;
  nfts: NftBalanceDetail[];
  tokenBalances: TokenBalanceDetail[];
}

// Action: getNativeTokenBalanceByChain
// Endpoint: GET /api/merlin/public/balances/native/{userAddress}?chain={chain}

interface NativeTokenBalanceResponse {
  balance: number; // Assuming long translates to number
  balanceDecimal: number;
}

// Action: getTokenBalancesByChain
// Endpoint: GET /api/merlin/public/balances/token/{userAddress}?chain={chain}

interface TokenBalanceWithPrice {
  token_address: string;
  name: string;
  symbol: string;
  logo: string | null;
  thumbnail: string | null; // Original schema showed null, assuming string or null
  decimals: number;
  balance: number; // Assuming long translates to number
  price: number;
  priceChange24h: number;
  bundleWallet: any | null; // Type not specified, using any
  prices: FiatValues; // Reusing FiatValues interface
  isWallet: boolean;
}

// type GetTokenBalancesByChainResponse = TokenBalanceWithPrice[];

// Action: getTokenBalancesByMultipleChains
// Endpoint: GET /api/merlin/public/balances/chains/token/{userAddress}?chains={chain1,chain2}

// The response is an object where keys are chain IDs (e.g., "eth", "matic")
// and values are arrays of TokenBalanceWithPrice objects.
interface TokenBalancesByMultipleChainsResponse {
  [chainId: string]: TokenBalanceWithPrice[];
}

// Action: getUserNFTsAllOrByChain (Marked as NOT CLEAR in documentation)
// Endpoint: GET /api/merlin/public/balances/nft/all/{userAddress}?chain={chain}

// Response type is an array of NftBalanceDetail (defined for getWalletBalancesByChain)
// type GetUserNFTsAllOrByChainResponse = NftBalanceDetail[];

// Action: getUserNFTsByChain
// Endpoint: GET /api/merlin/public/balances/nft/chain/{userAddress}?chain={chain}

// Response type is an array of NftBalanceDetail (defined for getWalletBalancesByChain)
// type GetUserNFTsByChainResponse = NftBalanceDetail[];

// Action: getUserTxHistoryAll
// Endpoint: GET /api/merlin/public/v2/userTx/history/all/{userAddress}

interface NftSalesHistoryItem {
  // Structure not fully defined in example, assuming basic fields
  eventType?: string;
  price?: number;
  priceToken?: string;
  timestamp?: number;
  from?: string;
  to?: string;
}

interface TxNftDetails {
  floorPrice: number | null;
  action: string | null; // e.g., "TRANSFER"
  content: string | null;
  detailUrl: string | null;
  innerId: string | null;
  payToken: string | null;
  totalSupply: string | null;
  salesHistory: NftSalesHistoryItem[] | null;
}

interface TxBalanceItem {
  balance: number;
  balanceUSD: number;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  tokenLogo: string | null;
  standard: string | null; // e.g., "ERC1155", "ERC20", "NATIVE"
  nftDetails: TxNftDetails | null;
  from: string; // Address
  to: string; // Address
}

interface TxPositionYield {
  tokenAddress: string;
  balance: number;
  balanceUSD: number;
  tokenSymbol: string;
  tokenDecimals: number;
}

interface TxYieldItem { // Matches DeFiEventPositionYield structure
  balance: number;
  balanceUSD: number;
  tokenDecimals: number;
  tokenSymbol: string;
}

interface TxPoolData {
  poolToken: string; // Address
  poolPnlUSD: number;
  poolYieldUSD: number;
}

// This is a generic transaction item structure, applicable to multiple endpoints.
// Fields that are sometimes null or have varying structures are made optional or use unions.
interface TransactionHistoryItem {
  id: string;
  active: boolean | null;
  balances: TxBalanceItem[];
  slippageUSD: number | null;
  block: number;
  chain: string;
  from: string | null; // Transaction sender, can be different from userAddress
  hash: string;
  order: number;
  pnlUsd: number | null;
  positionYield: TxPositionYield | null;
  protocol: string;
  to: string | null; // Transaction receiver/contract
  timeStamp: number; // Unix timestamp
  txFee: number; // In native currency, smallest unit
  txFeeUsd: number;
  txType: string; // e.g., "Airdrop", "Staking Deposit", "Send", "Receive"
  txClassification?: string | null; // e.g., "Scam", added for rawlabel endpoint
  txAction: string | null; // e.g., "Staked", "Balance Transfer"
  yields: TxYieldItem[] | null;
  yieldUSD: number | null;
  poolData: TxPoolData | null;
  oppositeEvents: any[] | null; // Structure not defined
  user: string | null; // User address associated with this part of tx
  logs: any | null; // Structure not defined
  contractName: string | null;
  functionName: string | null;
  encodingFunction: string | null;
  bundleWallet: any | null; // Structure not defined
  walletAddress: string | null; // Seems redundant with userAddress in path
  standard: string | null; // Overall transaction standard if applicable
  walletToWallet: boolean | null;
  blacklisted: boolean;
  successful: boolean;
  userPaidFees: boolean;
  status?: string; // For Solana: e.g., "Identified"
}

// Response type is an array of TransactionHistoryItem
// type GetUserTxHistoryAllResponse = TransactionHistoryItem[];

// Action: getUserTxHistoryByChainExtended
// Endpoint: GET /api/merlin/public/v2/userTx/history/chain/extended/{userAddress}?chain={chain}

// Response type is an array of TransactionHistoryItem
type GetUserTxHistoryByChainExtendedResponse = TransactionHistoryItem[];

// ---

// Action: getUserTxHistoryByChainRawLabel
// Endpoint: GET /api/merlin/public/v2/userTx/history/chain/rawlabel/{userAddress}?chain={chain}
// Note: This endpoint returns data similar to TransactionHistoryItem, but with USD values typically set to 0 or null.
// The structural type definition remains the same.
type GetUserTxHistoryByChainRawLabelResponse = TransactionHistoryItem[];

// ---

// Action: getSolanaUserTxHistoryExtended
// Endpoint: GET /api/merlin/public/v2/userTx/history/all/extended/{userAddress}?chain=solana
// Note: The TransactionHistoryItem is comprehensive. For Solana, some fields might be null or structured slightly differently
// if there are Solana-specific nuances not covered in the generic EVM-centric parts of TransactionHistoryItem.
// However, based on the provided datai-api.md, the schema is largely consistent.
type GetSolanaUserTxHistoryExtendedResponse = TransactionHistoryItem[];

// ---

// Action: getSolanaUserTxHistoryShort
// Endpoint: GET /api/merlin/public/v2/userTx/history/all/{userAddress}?chain=solana
// Similar to getSolanaUserTxHistoryExtended, uses TransactionHistoryItem.
type GetSolanaUserTxHistoryShortResponse = TransactionHistoryItem[];

// ---

// Action: getUserTxByPeriodAllExtended
// Endpoint: GET /merlin/public/v2/userTx/period/all/extended/{userAddress}?startTime={Integer}&endTime={Integer}
type GetUserTxByPeriodAllExtendedResponse = TransactionHistoryItem[];

// ---

// Action: getUserTxByPeriodChainExtended
// Endpoint: GET /api/merlin/public/v2/userTx/period/chain/extended/{userAddress}?chain={chain}&startTime={Integer}&endTime={Integer}
type GetUserTxByPeriodChainExtendedResponse = TransactionHistoryItem[];

// ---

// Action: getUserTxByPeriodChainRawLabel20
// Endpoint: GET /api/merlin/public/v2/userTx/period/chain/rawlabel/20/{userAddress}?chain={chain}&startTime={Integer}&endTime={Integer}
// Similar to other rawlabel endpoints, uses TransactionHistoryItem but USD values will be 0/null.
type GetUserTxByPeriodChainRawLabel20Response = TransactionHistoryItem[];

// ---

// Action: getTransactionByHash
// Endpoint: GET /api/merlin/public/v2/userTx/byHash/{chain}/{hash}/{userAddress}
// Response is a single TransactionHistoryItem object, not an array.
type GetTransactionByHashResponse = TransactionHistoryItem;

// ---

// Action: getTransactionTransfersByHash
// Endpoint: GET /api/merlin/public/v2/userTxTransfers/byHash/{chain}/{hash}/{userAddress}

interface TransactionTransferItem {
  balance: number; // Can be long, using number for simplicity in TS unless BigInt is needed
  balanceUSD: number | null; // Was 0.0 in example, indicating it might be null if not applicable/calculated
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  tokenLogo: string | null;
  standard: string | null; // e.g., "ERC20"
  nftDetails: TxNftDetails | null; // Assuming TxNftDetails can be reused if it's an NFT transfer
  from: string;
  to: string;
}

type GetTransactionTransfersByHashResponse = TransactionTransferItem[];

// ---

// Action: getTransactionsForDeFiPosition
// Endpoint: GET /api/merlin/public/userTx/position/?position={position}
// NOT CLEAR - Marked as "NOT CLEAR" due to uncertainty about obtaining a valid `position` ID.
// Types are based on the example response in datai-api.md which uses TransactionHistoryItem structure.
type GetTransactionsForDeFiPositionResponse = TransactionHistoryItem[];

// ---

// Action: getUserTransactionOverview
// Endpoint: GET /api/merlin/public/userTx/overview/{userAddress}
// NOT CLEAR - Test call resulted in 404, but types based on documentation.

interface ChainOverview {
  chainId: string;
  creationTimestamp: number;
  nbOfTransactions: number | null;
}

interface UserTransactionOverviewResponse {
  wallet: string;
  nbOfChains: number;
  nbOfTransactions: number;
  creationTimestamp: number;
  overview: ChainOverview[];
}