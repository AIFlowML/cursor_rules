/**
 * Type definitions for Comput3AI API
 * 
 * This file contains all interfaces and types for the API requests and responses.
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
 * Available workload types returned by /api/v0/types endpoint
 */
export type WorkloadType = 
  | "media:fast"
  | "ollama_webui:coder"
  | "ollama_webui:fast"
  | "ollama_webui:large"
  | string; // Allow for future types

/**
 * User balance information from /api/v0/balance endpoint
 */
export interface UserBalance {
  balance: number;
}

/**
 * User profile information from /api/v0/profile endpoint
 */
export interface UserProfile {
  addr: string;
  tags: string[];
  user_uuid: string;
}

/**
 * Request payload for launching a workload
 */
export interface LaunchWorkloadRequest {
  /**
   * Type of workload to launch
   */
  type: WorkloadType;
  
  /**
   * Unix timestamp (seconds since epoch) when the workload should expire
   * In the API, this must be a future timestamp, not a duration
   */
  expires: number;
}

/**
 * Response from launching a workload
 */
export interface LaunchWorkloadResponse {
  node: string;
  workload: string;
  workload_key: string;
}

/**
 * Request payload for stopping a workload
 */
export interface StopWorkloadRequest {
  workload: string;
}

/**
 * Response from stopping a workload (typically empty)
 */
export interface StopWorkloadResponse {
  // API may return empty response or success indicator
  success?: boolean;
}

/**
 * Request payload for listing workloads
 */
export interface ListWorkloadsRequest {
  running?: boolean;
}

/**
 * Individual workload item in the list response
 */
export interface WorkloadItem {
  created: number;
  expires: number;
  node: string;
  running: boolean;
  status: string;
  type: WorkloadType;
  workload: string;
}

/**
 * Type guard to check if an object is a valid WorkloadItem
 */
export function isWorkloadItem(item: unknown): item is WorkloadItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as WorkloadItem).workload === 'string' &&
    typeof (item as WorkloadItem).node === 'string' &&
    typeof (item as WorkloadItem).running === 'boolean'
  );
}

/**
 * Type guard to check if an array contains WorkloadItems
 */
export function isWorkloadItemArray(items: unknown[]): items is WorkloadItem[] {
  return Array.isArray(items) && (items.length === 0 || isWorkloadItem(items[0]))
}
