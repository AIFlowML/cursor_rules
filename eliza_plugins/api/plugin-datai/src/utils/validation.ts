/**
 * Validation Utilities for Datai Plugin
 * 
 * This file contains helper functions for validating parameters 
 * used in Datai API calls, extracting information from user messages,
 * and ensuring data integrity.
 */
import { logger } from "@elizaos/core";

/**
 * Regex pattern for validating Ethereum addresses
 * Matches 0x followed by 40 hex characters, case-insensitive
 * For exact validation (complete string must be address)
 */
const ETHEREUM_ADDRESS_PATTERN_EXACT = /^0x[a-f0-9]{40}$/i;

/**
 * Regex pattern for finding Ethereum addresses within text
 * Matches 0x followed by 40 hex characters, case-insensitive
 * For extraction from text
 */
const ETHEREUM_ADDRESS_PATTERN_EXTRACT = /\b(0x[a-f0-9]{40})\b/i;

/**
 * Regex pattern for validating Solana addresses
 * Base58 format, typically 32-44 characters long
 * For exact validation (complete string must be address)
 */
const SOLANA_ADDRESS_PATTERN_EXACT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Regex pattern for finding Solana addresses within text
 * Base58 format, typically 32-44 characters long
 * For extraction from text
 */
const SOLANA_ADDRESS_PATTERN_EXTRACT = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/;

/**
 * Regex pattern for validating EVM transaction hashes
 * 0x followed by 64 hex characters
 */
const EVM_TX_HASH_PATTERN = /^0x[a-f0-9]{64}$/i;

/**
 * Regex pattern for validating Solana transaction signatures
 * Base58 format, typically 87-88 characters long
 */
const SOLANA_TX_HASH_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

/**
 * Known valid chain IDs for the Datai API
 */
export const VALID_CHAIN_IDS = [
  "eth",    // Ethereum
  "bsc",    // Binance Smart Chain
  "matic",  // Polygon
  "arb",    // Arbitrum
  "avax",   // Avalanche
  "ftm",    // Fantom
  "op",     // Optimism
  "sol",    // Solana (sometimes referenced as "solana" in full)
  "solana", // Solana (full name)
  "base",   // Base
  "xdai",   // xDai
  // Add other chains as they become supported
];

/**
 * Validates a wallet address depending on chain type
 * 
 * @param address - The wallet address to validate
 * @param chain - Optional chain ID to determine address format
 * @returns True if address is valid for the specified chain (or any supported chain if chain not specified)
 */
export function isValidWalletAddress(address: string, chain?: string): boolean {
  if (!address) {
    logger.debug("Empty address provided");
    return false;
  }

  // If chain is specified, validate according to that chain's format
  if (chain) {
    if (chain === "sol" || chain === "solana") {
      return SOLANA_ADDRESS_PATTERN_EXACT.test(address);
    } 
    
    if (VALID_CHAIN_IDS.includes(chain)) {
      // All other supported chains use EVM-compatible addresses
      return ETHEREUM_ADDRESS_PATTERN_EXACT.test(address);
    }
    
    logger.debug(`Unknown chain: ${chain}`);
    return false;
  }

  // If no chain specified, check if it's valid for any supported format
  return ETHEREUM_ADDRESS_PATTERN_EXACT.test(address) || SOLANA_ADDRESS_PATTERN_EXACT.test(address);
}

/**
 * Validates a chain ID
 * 
 * @param chain - The chain ID to validate
 * @returns True if the chain ID is supported by the Datai API
 */
export function isValidChainId(chain: string): boolean {
  if (!chain) {
    logger.debug("Empty chain ID provided");
    return false;
  }

  const isValid = VALID_CHAIN_IDS.includes(chain.toLowerCase());
  if (!isValid) {
    logger.debug(`Invalid chain ID: ${chain}`);
  }
  
  return isValid;
}

/**
 * Validates a transaction hash based on the specified chain
 * 
 * @param txHash - The transaction hash to validate
 * @param chain - The chain ID to determine hash format
 * @returns True if the transaction hash format is valid for the specified chain
 */
export function isValidTransactionHash(txHash: string, chain: string): boolean {
  if (!txHash || !chain) {
    logger.debug("Empty transaction hash or chain ID provided");
    return false;
  }

  if (chain === "sol" || chain === "solana") {
    return SOLANA_TX_HASH_PATTERN.test(txHash);
  } 
  
  if (VALID_CHAIN_IDS.includes(chain)) {
    // All other supported chains use EVM-compatible tx hashes
    return EVM_TX_HASH_PATTERN.test(txHash);
  }
  
  logger.debug(`Unknown chain for tx hash validation: ${chain}`);
  return false;
}

/**
 * Validates a timestamp is a proper Unix timestamp
 * 
 * @param timestamp - The timestamp to validate (as number or string)
 * @returns True if the timestamp is a valid Unix timestamp
 */
export function isValidTimestamp(timestamp: number | string): boolean {
  if (timestamp === undefined || timestamp === null) {
    logger.debug("Empty timestamp provided");
    return false;
  }

  const timestampNum = typeof timestamp === "string" ? Number.parseInt(timestamp, 10) : timestamp;
  
  if (Number.isNaN(timestampNum)) {
    logger.debug(`Invalid timestamp format: ${timestamp}`);
    return false;
  }

  // Basic validation: timestamps should be reasonable
  // Between 2010-01-01 and 2050-01-01
  const minTimestamp = 1262304000; // 2010-01-01
  const maxTimestamp = 2525644800; // 2050-01-01
  
  if (timestampNum < minTimestamp || timestampNum > maxTimestamp) {
    logger.debug(`Timestamp out of reasonable range: ${timestampNum}`);
    return false;
  }

  return true;
}

/**
 * Validates a list of chain IDs for multi-chain queries
 * 
 * @param chains - Comma-separated list of chain IDs or array of chain IDs
 * @param maxChains - Maximum number of chains allowed (default: 10)
 * @returns True if all chain IDs are valid and count is within limits
 */
export function isValidChainList(chains: string | string[], maxChains = 10): boolean {
  if (!chains) {
    logger.debug("Empty chain list provided");
    return false;
  }

  let chainArray: string[];
  
  if (typeof chains === "string") {
    chainArray = chains.split(",").map(chain => chain.trim());
  } else {
    chainArray = chains;
  }

  if (chainArray.length === 0) {
    logger.debug("Empty chain array after processing");
    return false;
  }

  if (chainArray.length > maxChains) {
    logger.debug(`Too many chains (${chainArray.length}). Maximum allowed: ${maxChains}`);
    return false;
  }

  // Validate each chain ID in the list
  return chainArray.every(chain => isValidChainId(chain));
}

/**
 * Validates a time period defined by start and end timestamps
 * 
 * @param startTime - The start time (Unix timestamp, more recent date)
 * @param endTime - The end time (Unix timestamp, earlier date)
 * @returns True if both timestamps are valid and startTime >= endTime
 */
export function isValidTimePeriod(startTime: number | string, endTime: number | string): boolean {
  if (!isValidTimestamp(startTime) || !isValidTimestamp(endTime)) {
    return false;
  }

  const startNum = typeof startTime === "string" ? Number.parseInt(startTime, 10) : startTime;
  const endNum = typeof endTime === "string" ? Number.parseInt(endTime, 10) : endTime;

  if (startNum < endNum) {
    logger.debug(`Invalid time period: startTime (${startNum}) should be >= endTime (${endNum})`);
    return false;
  }

  return true;
}

/**
 * Validates parameters for the getAllUserDeFiPositions action
 * 
 * @param params - The parameters to validate
 * @returns Object containing validation result and error message if any
 */
export function validateGetAllUserDeFiPositionsParams(params: { userAddress: string }): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!isValidWalletAddress(params.userAddress)) {
    return { isValid: false, error: `Invalid wallet address: ${params.userAddress}` };
  }

  return { isValid: true };
}

/**
 * Validates parameters for the getUserDeFiPositionsByChain action
 * 
 * @param params - The parameters to validate
 * @returns Object containing validation result and error message if any
 */
export function validateGetUserDeFiPositionsByChainParams(params: { 
  userAddress: string; 
  chain: string 
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!params.chain) {
    return { isValid: false, error: "Missing required parameter: chain" };
  }

  if (!isValidWalletAddress(params.userAddress)) {
    return { isValid: false, error: `Invalid wallet address: ${params.userAddress}` };
  }

  if (!isValidChainId(params.chain)) {
    return { isValid: false, error: `Invalid chain ID: ${params.chain}` };
  }

  return { isValid: true };
}

/**
 * Validates parameters for the getUserDeFiPositionsByMultipleChains action
 * 
 * @param params - The parameters to validate
 * @returns Object containing validation result and error message if any
 */
export function validateGetUserDeFiPositionsByMultipleChainsParams(params: { 
  userAddress: string; 
  chains: string 
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!params.chains) {
    return { isValid: false, error: "Missing required parameter: chains" };
  }

  if (!isValidWalletAddress(params.userAddress)) {
    return { isValid: false, error: `Invalid wallet address: ${params.userAddress}` };
  }

  if (!isValidChainList(params.chains, 10)) {
    return { isValid: false, error: `Invalid chain list: ${params.chains}. Must be comma-separated list of valid chain IDs, maximum 10.` };
  }

  return { isValid: true };
}

/**
 * Validates parameters for the getUserDeFiPositionsByProtocol action
 * 
 * @param params - The parameters to validate
 * @returns Object containing validation result and error message if any
 */
export function validateGetUserDeFiPositionsByProtocolParams(params: { 
  userAddress: string; 
  chain: string;
  protocol: string;
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!params.chain) {
    return { isValid: false, error: "Missing required parameter: chain" };
  }

  if (!params.protocol) {
    return { isValid: false, error: "Missing required parameter: protocol" };
  }

  if (!isValidWalletAddress(params.userAddress)) {
    return { isValid: false, error: `Invalid wallet address: ${params.userAddress}` };
  }

  if (!isValidChainId(params.chain)) {
    return { isValid: false, error: `Invalid chain ID: ${params.chain}` };
  }

  // Protocol is a string identifier, we can only check if it's non-empty
  if (params.protocol.trim() === "") {
    return { isValid: false, error: "Protocol cannot be empty" };
  }

  return { isValid: true };
}

/**
 * Validates parameters for the getUserTxHistoryByChainExtended action
 * 
 * @param params - The parameters to validate
 * @returns Object containing validation result and error message if any
 */
export function validateGetUserTxHistoryByChainExtendedParams(params: { 
  userAddress: string; 
  chain: string;
  startTime?: number | string;
  limit?: number | string;
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!params.chain) {
    return { isValid: false, error: "Missing required parameter: chain" };
  }

  if (!isValidWalletAddress(params.userAddress)) {
    return { isValid: false, error: `Invalid wallet address: ${params.userAddress}` };
  }

  if (!isValidChainId(params.chain)) {
    return { isValid: false, error: `Invalid chain ID: ${params.chain}` };
  }

  // Optional parameter validations
  if (params.startTime !== undefined && !isValidTimestamp(params.startTime)) {
    return { isValid: false, error: `Invalid startTime: ${params.startTime}` };
  }

  if (params.limit !== undefined) {
    const limitNum = typeof params.limit === "string" ? Number.parseInt(params.limit, 10) : params.limit;
    if (Number.isNaN(limitNum) || limitNum <= 0) {
      return { isValid: false, error: `Invalid limit: ${params.limit}. Must be a positive number.` };
    }
  }

  return { isValid: true };
}

/**
 * Validates parameters for the getUserTxByPeriodAllExtended action
 * 
 * @param params - The parameters to validate
 * @returns Object containing validation result and error message if any
 */
export function validateGetUserTxByPeriodAllExtendedParams(params: { 
  userAddress: string;
  startTime: number | string;
  endTime: number | string;
  limit?: number | string;
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (params.startTime === undefined) {
    return { isValid: false, error: "Missing required parameter: startTime" };
  }

  if (params.endTime === undefined) {
    return { isValid: false, error: "Missing required parameter: endTime" };
  }

  if (!isValidWalletAddress(params.userAddress)) {
    return { isValid: false, error: `Invalid wallet address: ${params.userAddress}` };
  }

  if (!isValidTimePeriod(params.startTime, params.endTime)) {
    return { 
      isValid: false, 
      error: `Invalid time period: startTime (${params.startTime}) should be the more recent date and endTime (${params.endTime}) should be the earlier date.` 
    };
  }

  if (params.limit !== undefined) {
    const limitNum = typeof params.limit === "string" ? Number.parseInt(params.limit, 10) : params.limit;
    if (Number.isNaN(limitNum) || limitNum <= 0) {
      return { isValid: false, error: `Invalid limit: ${params.limit}. Must be a positive number.` };
    }
  }

  return { isValid: true };
}

/**
 * Validates parameters for the getTransactionByHash action
 * 
 * @param params - The parameters to validate
 * @returns Object containing validation result and error message if any
 */
export function validateGetTransactionByHashParams(params: { 
  chain: string;
  hash: string;
  userAddress: string;
}): { isValid: boolean; error?: string } {
  if (!params.userAddress) {
    return { isValid: false, error: "Missing required parameter: userAddress" };
  }

  if (!params.chain) {
    return { isValid: false, error: "Missing required parameter: chain" };
  }

  if (!params.hash) {
    return { isValid: false, error: "Missing required parameter: hash" };
  }

  if (!isValidWalletAddress(params.userAddress)) {
    return { isValid: false, error: `Invalid wallet address: ${params.userAddress}` };
  }

  if (!isValidChainId(params.chain)) {
    return { isValid: false, error: `Invalid chain ID: ${params.chain}` };
  }

  if (!isValidTransactionHash(params.hash, params.chain)) {
    return { isValid: false, error: `Invalid transaction hash for chain ${params.chain}: ${params.hash}` };
  }

  return { isValid: true };
}

/**
 * Extract wallet address from text
 * 
 * @param text - Text to analyze
 * @returns First found valid wallet address or null if not found
 */
export function extractWalletAddress(text: string): string | null {
  if (!text) {
    logger.debug("extractWalletAddress: Empty text provided");
    return null;
  }
  
  logger.debug(`extractWalletAddress: Analyzing text: "${text}"`);
  logger.debug("extractWalletAddress: Looking for Ethereum pattern in text");
  
  // Try to match Ethereum address within text
  const ethMatch = text.match(ETHEREUM_ADDRESS_PATTERN_EXTRACT);
  if (ethMatch) {
    logger.debug(`extractWalletAddress: Ethereum match found: ${JSON.stringify(ethMatch)}`);
    if (ethMatch[1]) {
      logger.debug(`extractWalletAddress: Successfully extracted Ethereum address: ${ethMatch[1]}`);
      return ethMatch[1]; // Use the capture group instead of the whole match
    }
  } else {
    logger.debug("extractWalletAddress: No Ethereum address pattern match");
  }
  
  logger.debug("extractWalletAddress: Looking for Solana pattern in text");
  
  // Try to match Solana address within text
  const solMatch = text.match(SOLANA_ADDRESS_PATTERN_EXTRACT);
  if (solMatch) {
    logger.debug(`extractWalletAddress: Solana match found: ${JSON.stringify(solMatch)}`);
    if (solMatch[1]) {
      logger.debug(`extractWalletAddress: Successfully extracted Solana address: ${solMatch[1]}`);
      return solMatch[1]; // Use the capture group instead of the whole match
    }
  } else {
    logger.debug("extractWalletAddress: No Solana address pattern match");
  }
  
  logger.debug("extractWalletAddress: No wallet address found in text");
  return null;
}

/**
 * Extract chain ID from text
 * 
 * @param text - Text to analyze
 * @returns First found valid chain ID or null if not found
 */
export function extractChainId(text: string): string | null {
  if (!text) return null;
  
  // Create patterns for each valid chain ID
  for (const chain of VALID_CHAIN_IDS) {
    // Look for chain IDs in various formats:
    // "ethereum", "eth", "chain: eth", "chain=eth", "on eth", etc.
    const patterns = [
      new RegExp(`\\b${chain}\\b`, 'i'),
      new RegExp(`chain[:=\\s]\\s*${chain}\\b`, 'i'),
      new RegExp(`\\bon\\s+${chain}\\b`, 'i'),
      new RegExp(`\\bfor\\s+${chain}\\b`, 'i'),
    ];
    
    // Special case for commonly used names that aren't the chain ID
    if (chain === "eth") {
      patterns.push(/\bethereum\b/i);
    } else if (chain === "xdai") {
      patterns.push(/\bxdai\b/i);
    } else if (chain === "arb") {
      patterns.push(/\barbitrum\b/i);
    } else if (chain === "matic") {
      patterns.push(/\bpolygon\b/i);
    } else if (chain === "bsc") {
      patterns.push(/\bbinance\b/i, /\bbnb chain\b/i);
    } else if (chain === "avax") {
      patterns.push(/\bavalanche\b/i);
    } else if (chain === "ftm") {
      patterns.push(/\bfantom\b/i);
    } else if (chain === "op") {
      patterns.push(/\boptimism\b/i);
    } else if (chain === "base") {
      patterns.push(/\bbase\b/i);
    }
      
    // Check all patterns for this chain ID
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        logger.debug(`Extracted chain ID '${chain}' using pattern ${pattern}`);
        return chain;
      }
    }
  }
  
  return null;
}

/**
 * Extract transaction hash from text
 * 
 * @param text - Text to analyze
 * @param chainType - Chain type to determine hash format ("evm" or "solana")
 * @returns First found valid transaction hash or null if not found
 */
export function extractTransactionHash(text: string, chainType: "evm" | "solana" = "evm"): string | null {
  if (!text) return null;
  
  const pattern = chainType === "evm" ? EVM_TX_HASH_PATTERN : SOLANA_TX_HASH_PATTERN;
  const match = text.match(pattern);
  if (match?.[0]) {
    logger.debug(`Extracted ${chainType} transaction hash: ${match[0]}`);
    return match[0];
  }
  
  return null;
}

/**
 * Extract multiple chain IDs from text
 * 
 * @param text - Text to analyze
 * @returns Array of valid chain IDs or empty array if none found
 */
export function extractMultipleChainIds(text: string): string[] {
  if (!text) return [];
  
  const foundChains: string[] = [];
  
  // Common chain combinations in text
  const chainCombinationPatterns = [
    /(?:on|across|between|for|in)\s+([a-z]+)\s+(?:and|,)\s+([a-z]+)/i,
    /(?:on|across|between|for|in)\s+([a-z]+)\s*,\s*([a-z]+)(?:\s*,\s*and\s+|\s*and\s+|\s*,\s*)([a-z]+)/i,
  ];
  
  // Check for common spoken combinations first
  for (const pattern of chainCombinationPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Process each capture group (excluding the full match at index 0)
      for (let i = 1; i < matches.length; i++) {
        if (matches[i]) {
          const potentialChain = (matches[i] as string).toLowerCase().trim();
          // Map common names to chain IDs
          const chainId = mapCommonNameToChainId(potentialChain);
          if (chainId && isValidChainId(chainId) && !foundChains.includes(chainId)) {
            foundChains.push(chainId);
          }
        }
      }
    }
  }
  
  // If no combinations found, look for individual chain IDs
  if (foundChains.length === 0) {
    // Try to find individual chains
    for (const chain of VALID_CHAIN_IDS) {
      const patterns = [
        new RegExp(`\\b${chain}\\b`, 'i'),
        new RegExp(`chain[:=\\s]\\s*${chain}\\b`, 'i'),
        new RegExp(`\\bon\\s+${chain}\\b`, 'i'),
        new RegExp(`\\bfor\\s+${chain}\\b`, 'i'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(text) && !foundChains.includes(chain)) {
          foundChains.push(chain);
          break; // Found this chain, no need to check other patterns for it
        }
      }
    }
    
    // Check for common names that map to chain IDs
    const commonNamePatterns = [
      { pattern: /\bethereum\b/i, chainId: 'eth' },
      { pattern: /\bxdai\b/i, chainId: 'xdai' },
      { pattern: /\barbitrum\b/i, chainId: 'arb' },
      { pattern: /\bpolygon\b/i, chainId: 'matic' },
      { pattern: /\bbinance\b/i, chainId: 'bsc' },
      { pattern: /\bbnb chain\b/i, chainId: 'bsc' },
      { pattern: /\bavalanche\b/i, chainId: 'avax' },
      { pattern: /\bfantom\b/i, chainId: 'ftm' },
      { pattern: /\boptimism\b/i, chainId: 'op' },
      { pattern: /\bbase\b/i, chainId: 'base' },
    ];
    
    for (const { pattern, chainId } of commonNamePatterns) {
      if (pattern.test(text) && !foundChains.includes(chainId)) {
        foundChains.push(chainId);
      }
    }
  }
  
  logger.debug(`Extracted chain IDs: ${foundChains.join(', ')}`);
  return foundChains;
}

/**
 * Map common chain names to their IDs
 * 
 * @param name - Common name or alias for a chain
 * @returns The corresponding chain ID or the input if no mapping exists
 */
function mapCommonNameToChainId(name: string): string {
  const mapping: Record<string, string> = {
    'ethereum': 'eth',
    'xdai': 'xdai',
    'arbitrum': 'arb',
    'polygon': 'matic',
    'binance': 'bsc',
    'bnb': 'bsc',
    'avalanche': 'avax',
    'fantom': 'ftm',
    'optimism': 'op',
    'base': 'base',
  };
  
  return mapping[name.toLowerCase()] || name;
}

/**
 * Parse and validate a parameters object from user input
 * 
 * @param text - User message text
 * @param requiredParams - List of required parameter names to extract
 * @returns Object with extracted parameters or null if required parameters are missing
 */
export function parseParamsFromText(text: string, requiredParams: string[]): Record<string, string> | null {
  const params: Record<string, string> = {};
  
  // Extract wallet address if required
  if (requiredParams.includes("userAddress")) {
    const address = extractWalletAddress(text);
    if (address) {
      params.userAddress = address;
    } else {
      logger.debug("Required userAddress not found in text");
      return null;
    }
  }
  
  // Extract chain ID if required
  if (requiredParams.includes("chain")) {
    const chain = extractChainId(text);
    if (chain) {
      params.chain = chain;
    } else {
      logger.debug("Required chain not found in text");
      return null;
    }
  }
  
  // Extract transaction hash if required
  if (requiredParams.includes("hash")) {
    // Determine chain type from the extracted chain if available
    const chainType = params.chain && (params.chain === "sol" || params.chain === "solana") 
      ? "solana" 
      : "evm";
    
    const hash = extractTransactionHash(text, chainType as "evm" | "solana");
    if (hash) {
      params.hash = hash;
    } else {
      logger.debug("Required hash not found in text");
      return null;
    }
  }
  
  return params;
}

/**
 * Convert a date string to Unix timestamp
 * Supports various date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
 * 
 * @param dateString - Date string to convert
 * @returns Unix timestamp or null if invalid
 */
export function convertDateToUnixTimestamp(dateString: string): number | null {
  if (!dateString) {
    logger.debug("Empty date string provided");
    return null;
  }

  // Remove any extra whitespace
  const cleanDateString = dateString.trim();
  
  // Try various date formats
  const dateFormats = [
    // MM/DD/YYYY or MM-DD-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // DD/MM/YYYY or DD-MM-YYYY (European format)
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY/MM/DD or YYYY-MM-DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
    // YYYY.MM.DD
    /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/,
  ];

  let parsedDate: Date | null = null;

  // Try MM/DD/YYYY format first (US format)
  const mmddyyyyMatch = cleanDateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mmddyyyyMatch?.[1] && mmddyyyyMatch?.[2] && mmddyyyyMatch?.[3]) {
    const month = Number.parseInt(mmddyyyyMatch[1], 10);
    const day = Number.parseInt(mmddyyyyMatch[2], 10);
    const year = Number.parseInt(mmddyyyyMatch[3], 10);
    
    // Validate ranges
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1970 && year <= 2050) {
      parsedDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
      logger.debug(`Parsed as MM/DD/YYYY: ${month}/${day}/${year}`);
    }
  }

  // Try YYYY/MM/DD format
  if (!parsedDate) {
    const yyyymmddMatch = cleanDateString.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (yyyymmddMatch?.[1] && yyyymmddMatch?.[2] && yyyymmddMatch?.[3]) {
      const year = Number.parseInt(yyyymmddMatch[1], 10);
      const month = Number.parseInt(yyyymmddMatch[2], 10);
      const day = Number.parseInt(yyyymmddMatch[3], 10);
      
      // Validate ranges
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1970 && year <= 2050) {
        parsedDate = new Date(year, month - 1, day);
        logger.debug(`Parsed as YYYY/MM/DD: ${year}/${month}/${day}`);
      }
    }
  }

  // Try native Date parsing as fallback
  if (!parsedDate) {
    const nativeDate = new Date(cleanDateString);
    if (!Number.isNaN(nativeDate.getTime()) && nativeDate.getFullYear() >= 1970 && nativeDate.getFullYear() <= 2050) {
      parsedDate = nativeDate;
      logger.debug(`Parsed using native Date constructor: ${cleanDateString}`);
    }
  }

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    logger.debug(`Failed to parse date string: ${cleanDateString}`);
    return null;
  }

  // Convert to Unix timestamp (seconds since epoch)
  const timestamp = Math.floor(parsedDate.getTime() / 1000);
  logger.debug(`Converted date "${cleanDateString}" to Unix timestamp: ${timestamp}`);
  
  return timestamp;
}

/**
 * Calculate time period from relative expressions like "last 3 months", "last 90 days"
 * Returns startTime (more recent) and endTime (older) as Unix timestamps
 * Note: In crypto APIs, startTime is often the LATER date and endTime is the EARLIER date
 * 
 * @param text - Text containing relative time expressions
 * @returns Object with startTime and endTime or null if no valid period found
 */
export function calculateTimePeriodFromText(text: string): { startTime: number; endTime: number } | null {
  if (!text) {
    logger.debug("Empty text provided for time period calculation");
    return null;
  }

  const now = new Date();
  const currentTimestamp = Math.floor(now.getTime() / 1000);
  
  // Pattern: "last X days/weeks/months/years"
  const lastPeriodRegex = /last\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)/i;
  const lastPeriodMatch = text.match(lastPeriodRegex);
  
  if (lastPeriodMatch?.[1] && lastPeriodMatch?.[2]) {
    const amount = Number.parseInt(lastPeriodMatch[1], 10);
    const unit = lastPeriodMatch[2].toLowerCase();
    
    const pastDate = new Date();
    
    if (unit === 'day' || unit === 'days') {
      pastDate.setDate(now.getDate() - amount);
    } else if (unit === 'week' || unit === 'weeks') {
      pastDate.setDate(now.getDate() - (amount * 7));
    } else if (unit === 'month' || unit === 'months') {
      pastDate.setMonth(now.getMonth() - amount);
    } else if (unit === 'year' || unit === 'years') {
      pastDate.setFullYear(now.getFullYear() - amount);
    }
    
    const endTime = Math.floor(pastDate.getTime() / 1000); // Earlier date (older)
    const startTime = currentTimestamp; // Later date (more recent)
    
    logger.debug(`Calculated period from "last ${amount} ${unit}": startTime=${startTime} (${new Date(startTime * 1000).toISOString()}), endTime=${endTime} (${new Date(endTime * 1000).toISOString()})`);
    
    return { startTime, endTime };
  }

  // Pattern: "past X days/weeks/months/years"
  const pastPeriodRegex = /past\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)/i;
  const pastPeriodMatch = text.match(pastPeriodRegex);
  
  if (pastPeriodMatch?.[1] && pastPeriodMatch?.[2]) {
    const amount = Number.parseInt(pastPeriodMatch[1], 10);
    const unit = pastPeriodMatch[2].toLowerCase();
    
    const pastDate = new Date();
    
    if (unit === 'day' || unit === 'days') {
      pastDate.setDate(now.getDate() - amount);
    } else if (unit === 'week' || unit === 'weeks') {
      pastDate.setDate(now.getDate() - (amount * 7));
    } else if (unit === 'month' || unit === 'months') {
      pastDate.setMonth(now.getMonth() - amount);
    } else if (unit === 'year' || unit === 'years') {
      pastDate.setFullYear(now.getFullYear() - amount);
    }
    
    const endTime = Math.floor(pastDate.getTime() / 1000);
    const startTime = currentTimestamp;
    
    logger.debug(`Calculated period from "past ${amount} ${unit}": startTime=${startTime}, endTime=${endTime}`);
    
    return { startTime, endTime };
  }

  // Pattern: "since yesterday/last week/last month"
  if (text.includes('since yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const endTime = Math.floor(yesterday.getTime() / 1000);
    const startTime = currentTimestamp;
    
    logger.debug(`Calculated period "since yesterday": startTime=${startTime}, endTime=${endTime}`);
    return { startTime, endTime };
  }
  
  if (text.includes('since last week')) {
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0);
    
    const endTime = Math.floor(lastWeek.getTime() / 1000);
    const startTime = currentTimestamp;
    
    logger.debug(`Calculated period "since last week": startTime=${startTime}, endTime=${endTime}`);
    return { startTime, endTime };
  }
  
  if (text.includes('since last month')) {
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const endTime = Math.floor(lastMonth.getTime() / 1000);
    const startTime = currentTimestamp;
    
    logger.debug(`Calculated period "since last month": startTime=${startTime}, endTime=${endTime}`);
    return { startTime, endTime };
  }

  // Pattern: "this week/month/year"
  if (text.includes('this week')) {
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as first day of week
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endTime = Math.floor(startOfWeek.getTime() / 1000);
    const startTime = currentTimestamp;
    
    logger.debug(`Calculated period "this week": startTime=${startTime}, endTime=${endTime}`);
    return { startTime, endTime };
  }
  
  if (text.includes('this month')) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endTime = Math.floor(startOfMonth.getTime() / 1000);
    const startTime = currentTimestamp;
    
    logger.debug(`Calculated period "this month": startTime=${startTime}, endTime=${endTime}`);
    return { startTime, endTime };
  }
  
  if (text.includes('this year')) {
    const startOfYear = new Date();
    startOfYear.setMonth(0);
    startOfYear.setDate(1);
    startOfYear.setHours(0, 0, 0, 0);
    
    const endTime = Math.floor(startOfYear.getTime() / 1000);
    const startTime = currentTimestamp;
    
    logger.debug(`Calculated period "this year": startTime=${startTime}, endTime=${endTime}`);
    return { startTime, endTime };
  }

  logger.debug(`No valid time period found in text: ${text}`);
  return null;
}

/**
 * Extract time period from text, supporting both explicit timestamps and relative periods
 * Returns startTime (more recent) and endTime (older) as Unix timestamps
 * 
 * @param text - Text to analyze for time periods
 * @returns Object with startTime and endTime or null if no valid period found
 */
export function extractTimePeriodFromText(text: string): { startTime: number; endTime: number } | null {
  if (!text) {
    logger.debug("Empty text provided for time period extraction");
    return null;
  }

  // First, check for explicit Unix timestamps in the text
  const startTimeMatch = text.match(/starttime\s*=?\s*(\d+)/i) || text.match(/start\s*time\s*=?\s*(\d+)/i);
  const endTimeMatch = text.match(/endtime\s*=?\s*(\d+)/i) || text.match(/end\s*time\s*=?\s*(\d+)/i);
  
  if (startTimeMatch?.[1] && endTimeMatch?.[1]) {
    const startTime = Number.parseInt(startTimeMatch[1], 10);
    const endTime = Number.parseInt(endTimeMatch[1], 10);
    
    if (isValidTimestamp(startTime) && isValidTimestamp(endTime)) {
      logger.debug(`Extracted explicit timestamps: startTime=${startTime}, endTime=${endTime}`);
      return { startTime, endTime };
    }
  }

  // Check for explicit date strings with startDate/endDate keywords
  const startDateMatch = text.match(/startdate\s*=?\s*([^\s,]+)/i) || text.match(/start\s*date\s*=?\s*([^\s,]+)/i);
  const endDateMatch = text.match(/enddate\s*=?\s*([^\s,]+)/i) || text.match(/end\s*date\s*=?\s*([^\s,]+)/i);
  
  if (startDateMatch?.[1] && endDateMatch?.[1]) {
    const startTime = convertDateToUnixTimestamp(startDateMatch[1]);
    const endTime = convertDateToUnixTimestamp(endDateMatch[1]);
    
    if (startTime && endTime) {
      logger.debug(`Extracted explicit dates: startTime=${startTime}, endTime=${endTime}`);
      return { startTime, endTime };
    }
  }

  // Check for date range patterns like "from MM/DD/YYYY to MM/DD/YYYY"
  const dateRangeMatch = text.match(/from\s+([^\s,]+)\s+to\s+([^\s,]+)/i);
  if (dateRangeMatch?.[1] && dateRangeMatch?.[2]) {
    const fromDate = convertDateToUnixTimestamp(dateRangeMatch[1]);
    const toDate = convertDateToUnixTimestamp(dateRangeMatch[2]);
    
    if (fromDate && toDate) {
      // Determine which is more recent (startTime should be the later date)
      const startTime = Math.max(fromDate, toDate);
      const endTime = Math.min(fromDate, toDate);
      
      logger.debug(`Extracted date range: startTime=${startTime}, endTime=${endTime}`);
      return { startTime, endTime };
    }
  }

  // Fall back to relative period calculation
  return calculateTimePeriodFromText(text);
}

/**
 * Check if text contains extended transaction history keywords
 */
export function containsExtendedTxHistoryKeywords(text: string): boolean {
  const extendedTxKeywords = [
    /extended\s+tx/i,
    /extended\s+transaction/i,
    /complete\s+tx/i,
    /complete\s+transaction/i,
    /full\s+tx\s+list/i,
    /full\s+transaction\s+list/i,
    /transaction\s+history/i,
    /tx\s+history/i,
    /detailed\s+transaction/i,
    /detailed\s+tx/i,
    /comprehensive\s+transaction/i,
    /comprehensive\s+tx/i,
    /all\s+transactions/i,
    /all\s+tx/i,
  ];

  for (const pattern of extendedTxKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found extended tx history keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

/**
 * Check if text contains time period keywords
 */
export function containsTimePeriodKeywords(text: string): boolean {
  const timePeriodKeywords = [
    /starttime/i,
    /endtime/i,
    /start\s+time/i,
    /end\s+time/i,
    /startdate/i,
    /enddate/i,
    /start\s+date/i,
    /end\s+date/i,
    /last\s+\d+\s+(day|days|week|weeks|month|months|year|years)/i,
    /past\s+\d+\s+(day|days|week|weeks|month|months|year|years)/i,
    /since\s+(yesterday|last\s+week|last\s+month)/i,
    /this\s+(week|month|year)/i,
    /from\s+.+\s+to\s+/i,
    /between\s+.+\s+and\s+/i,
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/i, // Date patterns
    /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/i, // Date patterns
  ];

  for (const pattern of timePeriodKeywords) {
    if (pattern.test(text)) {
      logger.debug(`Found time period keyword: ${pattern}`);
      return true;
    }
  }

  return false;
}

