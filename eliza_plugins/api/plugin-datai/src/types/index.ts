/**
 * Type definitions for Datai API
 */

/**
 * Common API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Common fiat currency values
 */
export interface FiatValues {
  USD: number;
  AED: number;
  AUD: number;
  CAD: number;
  EUR: number;
  GBP: number;
  INR: number;
}

/**
 * DeFi token detail type
 */
export interface DeFiTokenDetail {
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

/**
 * DeFi portfolio detail type
 */
export interface DeFiPortfolioDetail {
  borrow: DeFiTokenDetail[];
  rewards: DeFiTokenDetail[];
  supply: DeFiTokenDetail[];
}

/**
 * DeFi statistics type
 */
export interface DeFiStatistic {
  navUSD: number;
  totalDebtUSD: number;
  totalSupplyUSD: number;
}

/**
 * DeFi event balance type
 */
export interface DeFiEventBalance {
  balance: number;
  balanceUSD: number;
  tokenAddress: string;
  tokenDecimals: number;
  tokenLogo: string;
  tokenName: string;
  tokenSymbol: string;
}

/**
 * DeFi event fee type
 */
export interface DeFiEventFee {
  fee: number;
  feeUSD: number;
}

/**
 * DeFi event position detail type
 */
export interface DeFiEventPositionDetail {
  balance: number;
}

/**
 * DeFi event position yield type
 */
export interface DeFiEventPositionYield {
  balance: number;
  balanceUSD: number;
  tokenDecimals: number;
  tokenSymbol: string;
}

/**
 * DeFi event position type
 */
export interface DeFiEventPosition {
  active: boolean;
  fees: DeFiEventFee[];
  pnlUSD: number;
  position: DeFiEventPositionDetail;
  positionYield: DeFiEventPositionYield;
  yieldUSD: number;
  yields: DeFiEventPositionYield[];
}

/**
 * DeFi event type
 */
export interface DeFiEvent {
  balances: DeFiEventBalance[];
  eventType: string;
  id: string;
  position: DeFiEventPosition;
  protocol: string;
  timestamp: number;
}

/**
 * DeFi yield and PnL type
 */
export interface DeFiYieldAndPnl {
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

/**
 * DeFi portfolio item type
 */
export interface DeFiPortfolioItem {
  detail: DeFiPortfolioDetail;
  statistic: DeFiStatistic;
  yieldAndPnl: DeFiYieldAndPnl[];
}

/**
 * User DeFi position type
 */
export interface UserDeFiPosition {
  chain: string;
  logo: string;
  name: string;
  portfolio: DeFiPortfolioItem[];
  site: string;
}

/**
 * Detailed DeFi portfolio type
 */
export interface DeFiDetailedPortfolio {
  borrow: DeFiTokenDetail[];
  rewards: DeFiTokenDetail[];
  supply: DeFiTokenDetail[];
}

/**
 * Pool token monetary value type
 */
export interface PoolTokenMonetaryValue {
  token0: number;
  token0USD: number;
  token1: number;
  token1USD: number;
  totalUSD: number;
}

/**
 * Pool token info type
 */
export interface PoolTokenInfo {
  decimals: number;
  id: string;
  name: string;
  symbol: string;
}

/**
 * Pool data item type
 */
export interface PoolDataItem {
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

/**
 * DeFi total type
 */
export interface DeFiTotal {
  debtUSD: number;
  navUSD: number;
  supplyUSD: number;
}

/**
 * DeFi portfolio item by chain type
 */
export interface DeFiPortfolioItemByChain {
  detailed: DeFiDetailedPortfolio;
  poolData?: PoolDataItem[];
  total: DeFiTotal;
  yieldAndPnl: DeFiYieldAndPnl[];
}

/**
 * User DeFi position by chain type
 */
export interface UserDeFiPositionByChain {
  chain: string;
  logo: string;
  name: string;
  portfolio: DeFiPortfolioItemByChain[];
  site: string;
}

/**
 * Protocol balance detail type
 */
export interface ProtocolBalanceDetail {
  navUSD: number;
  assetUSD: number;
  debtUSD: number;
}

/**
 * User DeFi protocol balance type
 */
export interface UserDeFiProtocolBalance {
  chain: string;
  name: string;
  commonName: string;
  logo: string;
  site: string;
  balance: ProtocolBalanceDetail;
}

/**
 * Chain balance info type
 */
export interface ChainBalanceInfo {
  id: string;
  name: string;
  logoUrl: string;
  wrappedTokenId: string;
  valueUsd: number;
  fiatValues: FiatValues;
}

/**
 * User overall balance all chains type
 */
export interface UserOverallBalanceAllChains {
  totalValueUsd: number;
  byChain: ChainBalanceInfo[];
}

/**
 * User overall balance by chain response type
 */
export interface UserOverallBalanceByChainResponse {
  valueUsd: number;
  valueEUR: number;
  valueAUD: number;
  valueCAD: number;
  valueAED: number;
  valueINR: number;
  valueGBP: number;
}

/**
 * NFT balance detail type
 */
export interface NftBalanceDetail {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  tokenId: string;
  contractType: string;
  ownerOf: string;
  blockNumberMinted: number;
  detailUrl: string;
}

/**
 * Token balance detail type
 */
export interface TokenBalanceDetail {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  balance: number;
  logoUrl: string;
}

/**
 * Wallet balances by chain response type
 */
export interface WalletBalancesByChainResponse {
  nativeBalance: number;
  nativeBalanceDecimal: number;
  nfts: NftBalanceDetail[];
  tokenBalances: TokenBalanceDetail[];
}

/**
 * Native token balance response type
 */
export interface NativeTokenBalanceResponse {
  balance: number;
  balanceDecimal: number;
}

/**
 * Bundle wallet type
 */
export interface BundleWallet {
  id?: string;
  name?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Token balance with price type
 */
export interface TokenBalanceWithPrice {
  token_address: string;
  name: string;
  symbol: string;
  logo: string | null;
  thumbnail: string | null;
  decimals: number;
  balance: number;
  price: number;
  priceChange24h: number;
  bundleWallet: BundleWallet | null;
  prices: FiatValues;
  isWallet: boolean;
}

/**
 * Token balances by multiple chains response type
 */
export interface TokenBalancesByMultipleChainsResponse {
  [chainId: string]: TokenBalanceWithPrice[];
}

/**
 * NFT sales history item type
 */
export interface NftSalesHistoryItem {
  eventType?: string;
  price?: number;
  priceToken?: string;
  timestamp?: number;
  from?: string;
  to?: string;
}

/**
 * Transaction NFT details type
 */
export interface TxNftDetails {
  floorPrice: number | null;
  action: string | null;
  content: string | null;
  detailUrl: string | null;
  innerId: string | null;
  payToken: string | null;
  totalSupply: string | null;
  salesHistory: NftSalesHistoryItem[] | null;
}

/**
 * Transaction balance item type
 */
export interface TxBalanceItem {
  balance: number;
  balanceString: string;
  balanceUSD: number;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  tokenLogo: string | null;
  standard: string | null;
  nftDetails: TxNftDetails | null;
  from: string;
  to: string;
}

/**
 * Transaction position yield type
 */
export interface TxPositionYield {
  tokenAddress: string;
  balance: number;
  balanceUSD: number;
  tokenSymbol: string;
  tokenDecimals: number;
}

/**
 * Transaction yield item type
 */
export interface TxYieldItem {
  balance: number;
  balanceUSD: number;
  tokenDecimals: number;
  tokenSymbol: string;
}

/**
 * Transaction pool data type
 */
export interface TxPoolData {
  poolToken: string;
  poolPnlUSD: number;
  poolYieldUSD: number;
}

/**
 * Transaction logs type
 */
export interface TxLogs {
  [key: string]: unknown;
}

/**
 * Transaction opposite events type
 */
export interface TxOppositeEvent {
  [key: string]: unknown;
}

/**
 * Transaction history item type
 */
export interface TransactionHistoryItem {
  id: string;
  active: boolean | null;
  balances: TxBalanceItem[];
  slippageUSD: number | null;
  block: number;
  chain: string;
  from: string | null;
  hash: string;
  order: number;
  pnlUsd: number | null;
  positionYield: TxPositionYield | null;
  protocol: string;
  to: string | null;
  timeStamp: number;
  txFee: number;
  txFeeUsd: number;
  txType: string;
  txClassification?: string | null;
  txAction: string | null;
  yields: TxYieldItem[] | null;
  yieldUSD: number | null;
  poolData: TxPoolData | null;
  oppositeEvents: TxOppositeEvent[] | null;
  user: string | null;
  logs: TxLogs | null;
  contractName: string | null;
  functionName: string | null;
  encodingFunction: string | null;
  bundleWallet: BundleWallet | null;
  walletAddress: string | null;
  standard: string | null;
  walletToWallet: boolean | null;
  blacklisted: boolean;
  successful: boolean;
  userPaidFees: boolean;
  status?: string;
}

/**
 * Transaction transfer item type
 */
export interface TransactionTransferItem {
  balance: number;
  balanceUSD: number | null;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  tokenLogo: string | null;
  standard: string | null;
  nftDetails: TxNftDetails | null;
  from: string;
  to: string;
}

/**
 * Chain overview type
 */
export interface ChainOverview {
  chainId: string;
  creationTimestamp: number;
  nbOfTransactions: number | null;
}

/**
 * User transaction overview response type
 */
export interface UserTransactionOverviewResponse {
  wallet: string;
  nbOfChains: number;
  nbOfTransactions: number;
  creationTimestamp: number;
  overview: ChainOverview[];
  // Extended fields for transaction overview - now optional as not always present
  totalTxCount?: number;
  chainStats?: Array<{chain: string; txCount: number}>;
  firstTxTimestamp?: number;
  lastTxTimestamp?: number;
  totalFeeUsd?: number;
  avgTxFeeUsd?: number;
  totalPnlUsd?: number;
  activityHeatmap?: Record<string, number>;
  txTypeBreakdown?: Array<{type: string; count: number; percentage: number}>;
  recentActivity?: Array<{timestamp: number; type: string; details?: string}>;
  protocols?: Array<{name: string; interactions: number; firstUsed?: number}>;
}

// Response types for different API endpoints

/**
 * Response type for getAllUserDeFiPositions
 */
export type GetAllUserDeFiPositionsResponse = UserDeFiPosition[];

/**
 * Response type for getUserDeFiPositionsByChain
 */
export type GetUserDeFiPositionsByChainResponse = UserDeFiPositionByChain[];

/**
 * Response type for getUserDeFiPositionsByMultipleChains
 */
export type GetUserDeFiPositionsByMultipleChainsResponse = UserDeFiPosition[];

/**
 * Response type for getUserDeFiPositionsByProtocol
 */
export type GetUserDeFiPositionsByProtocolResponse = UserDeFiPosition[];

/**
 * Response type for getUserDeFiProtocolBalancesByChain
 */
export type GetUserDeFiProtocolBalancesByChainResponse = UserDeFiProtocolBalance[];

/**
 * Response type for getUserOverallBalanceAllChains
 */
export type GetUserOverallBalanceAllChainsResponse = UserOverallBalanceAllChains;

/**
 * Response type for getUserNFTsList and getUserNFTsByChain
 */
export type GetUserNFTsResponse = NftBalanceDetail[];

/**
 * Response type for getUserTxHistoryAllChainsExtended and other transaction history endpoints
 */
export type GetUserTxHistoryResponse = TransactionHistoryItem[];

/**
 * Response type for getTransactionByHash
 */
export type GetTransactionByHashResponse = TransactionHistoryItem;

/**
 * Response type for getTransactionTransfersByHash
 */
export type GetTransactionTransfersByHashResponse = TransactionTransferItem[];
