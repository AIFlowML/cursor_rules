/**
 * Constants and configuration for the Comput3AI plugin
 * 
 * This file contains all API endpoints, configuration values, and error messages.
 */

/**
 * API configuration
 */
export const API_CONFIG = {
  /**
   * Base URL for the Comput3AI API
   */
  BASE_URL: 'https://api.comput3.ai/api/v0',
  
  /**
   * Timeout in milliseconds for API requests
   */
  TIMEOUT: 30000, // 30 seconds
  
  /**
   * Required environment variables for the plugin
   */
  REQUIRED_ENV_VARS: ['COMPUT3AI_API_KEY', 'COMPUT3AI_WALLET_ADDRESS'],
  
  /**
   * API key header name
   */
  API_KEY_HEADER: 'X-C3-API-KEY',
};

/**
 * API endpoints
 */
export const ENDPOINTS = {
  /**
   * Get available workload types
   * GET /api/v0/types
   */
  TYPES: '/types',
  
  /**
   * Get user balance
   * GET /api/v0/balance
   */
  BALANCE: '/balance',
  
  /**
   * Get user profile
   * GET /api/v0/profile
   */
  PROFILE: '/profile',
  
  /**
   * Launch a workload
   * POST /api/v0/launch
   */
  LAUNCH: '/launch',
  
  /**
   * Stop a workload
   * POST /api/v0/stop
   */
  STOP: '/stop',
  
  /**
   * List workloads
   * POST /api/v0/workloads
   */
  WORKLOADS: '/workloads',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  /**
   * Missing API key error
   */
  MISSING_API_KEY: 'Comput3AI API key is required but not provided',
  
  /**
   * Invalid workload ID error
   */
  INVALID_WORKLOAD_ID: 'Invalid workload ID provided',
  
  /**
   * Network error
   */
  NETWORK_ERROR: 'Network error occurred while connecting to the Comput3AI API',
  
  /**
   * Unknown error
   */
  UNKNOWN_ERROR: 'An unknown error occurred',
  
  /**
   * Invalid workload type
   */
  INVALID_WORKLOAD_TYPE: 'Invalid workload type provided',
}; 