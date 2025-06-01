/**
 * API Client for the Datai API
 * 
 * Handles all API requests to the Datai (Merlin) API
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosRequestHeaders } from 'axios';
import { API_CONFIG } from '../constants';
import type { ApiResponse } from '../types';
import { logger } from '@elizaos/core';
import fetch from "node-fetch";

/**
 * DataiApiClient class for handling API requests
 */
export class DataiApiClient {
  private axiosInstance: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  /**
   * Constructor for the DataiApiClient
   * 
   * @param apiKey - API key for authentication
   * @param baseURL - Optional base URL override
   */
  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseURL || API_CONFIG.API_BASE_URL;

    // Create Axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add request interceptor to include API key
    this.axiosInstance.interceptors.request.use((config) => {
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      
      // Set the Authorization header with the API key (no Bearer prefix)
      config.headers[API_CONFIG.API_KEY_HEADER] = this.apiKey;
      
      logger.debug(`Setting Authorization header: ${API_CONFIG.API_KEY_HEADER}=${this.apiKey.substring(0, 5)}...`);
      
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error.response?.data?.error || error.message;
        logger.error(`Datai API Error: ${errorMessage}`, {
          status: error.response?.status,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a GET request to the API
   * 
   * @param endpoint - API endpoint
   * @param params - Optional query parameters
   * @returns Promise with API response
   */
  public async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    logger.debug(`Making API request to ${url}`);
    
    try {
      const config: AxiosRequestConfig = {};
      if (params) {
        config.params = params;
        logger.debug(`Request params: ${JSON.stringify(params)}`);
      }

      logger.debug(`API Request headers: ${JSON.stringify(this.axiosInstance.defaults.headers)}`);
      
      const response: AxiosResponse<T> = await this.axiosInstance.get(endpoint, config);
      
      logger.debug(`API Response status: ${response.status}`);
      logger.debug(`API Response data items: ${Array.isArray(response.data) ? response.data.length : 'not an array'}`);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      logger.error(`API request failed for endpoint: ${endpoint}`);
      if (axios.isAxiosError(error)) {
        logger.error(`Status: ${error.response?.status}, Code: ${error.code}`);
        logger.error(`Response data: ${JSON.stringify(error.response?.data)}`);
        logger.error(`Request headers: ${JSON.stringify(error.config?.headers)}`);
      }
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Make a POST request to the API
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with API response
   */
  public async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(endpoint, data);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Make a PUT request to the API
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with API response
   */
  public async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(endpoint, data);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Make a DELETE request to the API
   * 
   * @param endpoint - API endpoint
   * @returns Promise with API response
   */
  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(endpoint);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleApiError<T>(error);
    }
  }

  /**
   * Handle API errors in a consistent way
   * 
   * @param error - Error from Axios
   * @returns Standardized API error response
   */
  private handleApiError<T>(error: unknown): ApiResponse<T> {
    const statusCode = axios.isAxiosError(error) ? error.response?.status || 500 : 500;
    const errorMessage = axios.isAxiosError(error) 
      ? error.response?.data?.error || error.message || 'Unknown error occurred' 
      : error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
    
    return {
      success: false,
      error: errorMessage,
      statusCode: statusCode,
    };
  }
}

/**
 * Create a new DataiApiClient instance
 * 
 * @param apiKey - API key for authentication
 * @param baseURL - Optional base URL override
 * @returns New DataiApiClient instance
 */
export const createApiClient = (apiKey: string, baseURL?: string): DataiApiClient => {
  return new DataiApiClient(apiKey, baseURL);
};

/**
 * HTTP client for Datai API
 */
export class DataiApiClientHttp {
  private apiKey: string;
  private baseUrl: string;

  /**
   * Create a new Datai API client
   * 
   * @param apiKey - API key for authentication
   * @param baseUrl - Optional override for API base URL
   */
  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || API_CONFIG.API_BASE_URL;
  }

  /**
   * Make a GET request to the Datai API
   * 
   * @param endpoint - API endpoint (path without base URL)
   * @returns API response with data or error
   */
  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    logger.debug(`Making API request to ${url}`);
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": this.apiKey,
          "Accept": "application/json"
        }
      });

      const status = response.status;
      
      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        logger.error(`API returned non-JSON response: ${text}`);
        return {
          success: false,
          error: `API returned non-JSON response: ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}`,
          statusCode: status
        };
      }

      const data = await response.json() as T;
      
      // Handle API errors
      if (!response.ok) {
        const errorMessage = typeof data === "object" && data !== null && "message" in data
          ? String((data as Record<string, unknown>).message)
          : `API error: ${status}`;
          
        logger.error(`API error: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage,
          statusCode: status
        };
      }
      
      // Success response
      return {
        success: true,
        data,
        statusCode: status
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`API request failed: ${errorMessage}`);
      
      return {
        success: false,
        error: `API request failed: ${errorMessage}`
      };
    }
  }
} 