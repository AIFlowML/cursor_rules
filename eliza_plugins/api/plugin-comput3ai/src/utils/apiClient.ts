/**
 * API client for Comput3AI
 * 
 * This utility handles all API communication with proper error handling and logging.
 */
import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '@elizaos/core';
import type { IAgentRuntime } from '@elizaos/core';
import type { 
  ApiResponse,
  UserBalance, 
  UserProfile, 
  WorkloadType,
  LaunchWorkloadRequest,
  LaunchWorkloadResponse,
  StopWorkloadRequest,
  StopWorkloadResponse,
  ListWorkloadsRequest,
  WorkloadItem
} from '../types';
import { API_CONFIG, ENDPOINTS, ERROR_MESSAGES } from '../constants';

/**
 * Comput3AI API client class
 * 
 * Handles API calls with proper error handling, logging, and response typing
 */
export class Comput3ApiClient {
  private readonly baseURL: string;
  private readonly apiKey: string;
  
  /**
   * Creates a new Comput3AI API client
   * 
   * @param baseURL - Base URL for the API
   * @param apiKey - API key for authentication
   */
  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    
    logger.debug(`Comput3ApiClient initialized with base URL: ${baseURL}`);
  }
  
  /**
   * Creates an API client instance from runtime environment settings
   * 
   * @param runtime - ElizaOS agent runtime
   * @returns A configured API client instance
   */
  static fromRuntime(runtime: IAgentRuntime): Comput3ApiClient {
    const baseURL = API_CONFIG.BASE_URL;
    const apiKey = runtime.getSetting('COMPUT3AI_API_KEY') || process.env.COMPUT3AI_API_KEY || '';
    
    if (!apiKey) {
      logger.error(ERROR_MESSAGES.MISSING_API_KEY);
      throw new Error(ERROR_MESSAGES.MISSING_API_KEY);
    }
    
    return new Comput3ApiClient(baseURL, apiKey);
  }
  
  /**
   * Makes a GET request to the API
   * 
   * @param endpoint - API endpoint to call
   * @param params - Query parameters for the request
   * @returns Typed API response
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    logger.debug(`Comput3API GET request to ${endpoint}`, params);
    
    try {
      const response = await this.request<T>({
        method: 'GET',
        url: endpoint,
        params,
      });
      
      logger.debug(`Comput3API GET response from ${endpoint}`, response.data);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error, endpoint);
    }
  }
  
  /**
   * Makes a POST request to the API
   * 
   * @param endpoint - API endpoint to call
   * @param data - Request body
   * @returns Typed API response
   */
  async post<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    logger.debug(`Comput3API POST request to ${endpoint}`, data);
    
    try {
      const response = await this.request<T>({
        method: 'POST',
        url: endpoint,
        data,
      });
      
      logger.debug(`Comput3API POST response from ${endpoint}`, response.data);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error, endpoint);
    }
  }
  
  /**
   * Gets available workload types
   * 
   * @returns List of available workload types
   */
  async getWorkloadTypes(): Promise<ApiResponse<WorkloadType[]>> {
    return this.get<WorkloadType[]>(ENDPOINTS.TYPES);
  }
  
  /**
   * Gets user balance
   * 
   * @returns User balance information
   */
  async getUserBalance(): Promise<ApiResponse<UserBalance>> {
    return this.get<UserBalance>(ENDPOINTS.BALANCE);
  }
  
  /**
   * Gets user profile
   * 
   * @returns User profile information
   */
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.get<UserProfile>(ENDPOINTS.PROFILE);
  }
  
  /**
   * Launches a new workload
   * 
   * @param request - Launch workload request parameters
   * @returns Launch workload response
   */
  async launchWorkload(request: LaunchWorkloadRequest): Promise<ApiResponse<LaunchWorkloadResponse>> {
    return this.post<LaunchWorkloadResponse>(ENDPOINTS.LAUNCH, request);
  }
  
  /**
   * Stops a running workload
   * 
   * @param request - Stop workload request parameters
   * @returns Stop workload response
   */
  async stopWorkload(request: StopWorkloadRequest): Promise<ApiResponse<StopWorkloadResponse>> {
    return this.post<StopWorkloadResponse>(ENDPOINTS.STOP, request);
  }
  
  /**
   * Lists user workloads
   * 
   * @param request - List workloads request parameters
   * @returns List of workload items
   */
  async listWorkloads(request?: ListWorkloadsRequest): Promise<ApiResponse<WorkloadItem[]>> {
    return this.post<WorkloadItem[]>(ENDPOINTS.WORKLOADS, request || { running: true });
  }
  
  /**
   * Makes a request with appropriate headers and configuration
   * 
   * @param config - Axios request configuration
   * @returns Axios response
   * @private
   */
  private async request<T>(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        [API_CONFIG.API_KEY_HEADER]: this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    return axiosInstance.request<T>(config);
  }
  
  /**
   * Handles API errors consistently
   * 
   * @param error - Error object
   * @param endpoint - API endpoint that was called
   * @returns Error response
   * @private
   */
  private handleError<T>(error: unknown, endpoint: string): ApiResponse<T> {
    if (axios.isAxiosError(error)) {
      const axiosError = error;
      
      logger.error(`Comput3API Error for ${endpoint}: ${axiosError.message}`);
      
      if (axiosError.response) {
        // Server responded with an error status
        const responseData = axiosError.response.data as Record<string, unknown>;
        logger.debug('Error response data:', responseData);
        
        return {
          success: false,
          error: responseData.message as string || axiosError.message,
          statusCode: axiosError.response.status,
        };
      }
      
      if (axiosError.request) {
        // Request was made but no response received
        logger.error('No response received from Comput3AI API');
        
        return {
          success: false,
          error: ERROR_MESSAGES.NETWORK_ERROR,
          statusCode: 0,
        };
      }
    }
    
    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
    logger.error(`Unexpected Comput3AI API error: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Creates an API client from runtime environment
 * 
 * @param runtime - ElizaOS agent runtime
 * @returns Configured API client
 */
export function createComput3ApiClient(runtime: IAgentRuntime): Comput3ApiClient {
  return Comput3ApiClient.fromRuntime(runtime);
} 