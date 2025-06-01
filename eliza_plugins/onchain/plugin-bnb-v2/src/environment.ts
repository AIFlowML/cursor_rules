/**
 * Environment configuration utilities for BNB Plugin
 * 
 * This file handles configuration loading and validation for the BNB Plugin.
 */
import type { IAgentRuntime } from "@elizaos/core";
import { logger } from "@elizaos/core";
import { z } from "zod";
import { API_CONFIG } from "./constants";

/**
 * BNB configuration schema using Zod for validation
 */
export const bnbEnvSchema = z.object({
    BNB_PRIVATE_KEY: z.string().optional(),
    BNB_PUBLIC_KEY: z.string().optional(),
    BSC_PROVIDER_URL: z.string().default(API_CONFIG.DEFAULT_BSC_PROVIDER_URL),
    BSC_TESTNET_PROVIDER_URL: z.string().default(API_CONFIG.DEFAULT_BSC_TESTNET_PROVIDER_URL),
    OPBNB_PROVIDER_URL: z.string().default(API_CONFIG.DEFAULT_OPBNB_PROVIDER_URL),
});

/**
 * Type definition for BNB configuration
 */
export type BnbConfig = z.infer<typeof bnbEnvSchema>;

/**
 * Get configuration with defaults
 * 
 * @returns BNB configuration object with defaults applied
 */
export function getConfig(): BnbConfig {
    return {
        BNB_PRIVATE_KEY: process.env.BNB_PRIVATE_KEY,
        BNB_PUBLIC_KEY: process.env.BNB_PUBLIC_KEY,
        BSC_PROVIDER_URL: process.env.BSC_PROVIDER_URL || API_CONFIG.DEFAULT_BSC_PROVIDER_URL,
        BSC_TESTNET_PROVIDER_URL: process.env.BSC_TESTNET_PROVIDER_URL || API_CONFIG.DEFAULT_BSC_TESTNET_PROVIDER_URL,
        OPBNB_PROVIDER_URL: process.env.OPBNB_PROVIDER_URL || API_CONFIG.DEFAULT_OPBNB_PROVIDER_URL,
    };
}

/**
 * Validate BNB configuration using runtime settings or environment variables
 * 
 * @param runtime - ElizaOS agent runtime
 * @returns Validated BNB configuration
 * @throws Error if validation fails
 */
export async function validateBnbConfig(
    runtime: IAgentRuntime
): Promise<BnbConfig> {
    try {
        logger.debug("Validating BNB configuration");
        
        // Get configuration from runtime settings or environment variables
        const config = {
            BNB_PRIVATE_KEY: runtime.getSetting("BNB_PRIVATE_KEY") || process.env.BNB_PRIVATE_KEY,
            BNB_PUBLIC_KEY: runtime.getSetting("BNB_PUBLIC_KEY") || process.env.BNB_PUBLIC_KEY,
            BSC_PROVIDER_URL: runtime.getSetting("BSC_PROVIDER_URL") || process.env.BSC_PROVIDER_URL || API_CONFIG.DEFAULT_BSC_PROVIDER_URL,
            BSC_TESTNET_PROVIDER_URL: runtime.getSetting("BSC_TESTNET_PROVIDER_URL") || process.env.BSC_TESTNET_PROVIDER_URL || API_CONFIG.DEFAULT_BSC_TESTNET_PROVIDER_URL,
            OPBNB_PROVIDER_URL: runtime.getSetting("OPBNB_PROVIDER_URL") || process.env.OPBNB_PROVIDER_URL || API_CONFIG.DEFAULT_OPBNB_PROVIDER_URL,
        };

        // Validate configuration against schema
        const validatedConfig = bnbEnvSchema.parse(config);
        
        // Log validation success
        logger.debug("BNB configuration validated successfully");
        
        return validatedConfig;
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            
            logger.error(`BNB configuration validation failed: ${errorMessages}`);
            
            throw new Error(
                `BNB configuration validation failed:\n${errorMessages}`
            );
        }
        
        // Handle other errors
        logger.error("Unexpected error during BNB configuration validation:", error);
        throw error;
    }
}

/**
 * Check if a wallet is configured (either private or public key)
 * 
 * @param config - BNB configuration
 * @returns True if a wallet is configured, false otherwise
 */
export function hasWalletConfigured(config: BnbConfig): boolean {
    return !!(config.BNB_PRIVATE_KEY || config.BNB_PUBLIC_KEY);
}

/**
 * Check if a wallet with private key is configured
 * 
 * @param config - BNB configuration
 * @returns True if a wallet with private key is configured, false otherwise
 */
export function hasPrivateKeyConfigured(config: BnbConfig): boolean {
    return !!config.BNB_PRIVATE_KEY;
}
