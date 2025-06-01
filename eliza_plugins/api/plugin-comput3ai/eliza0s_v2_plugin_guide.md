# ElizaOS v2 Plugin Development Guide: Comput3AI Plugin

## Overview

This document outlines the process of creating a plugin for ElizaOS v2 that integrates with the Comput3AI API. The plugin will provide actions for managing GPU workloads, user profiles, and tokens. This guide can be adapted for creating plugins that integrate with other APIs or services.

## Plugin Structure

A typical ElizaOS v2 plugin follows this directory structure, though the actual implementation can be simplified for API-only integrations:

```
plugin-name/
├── dist/               # Compiled output
├── src/
│   ├── actions/        # Action definitions
│   │   ├── action1.ts
│   │   ├── action2.ts
│   │   └── index.ts    # Export all actions
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts    # Define interfaces and types
│   ├── utils/          # Utility functions
│   │   └── apiClient.ts  # Centralized API client
│   ├── constants.ts    # Constants and configuration
│   └── index.ts        # Main plugin entry point
├── tsconfig.json       # TypeScript configuration
├── tsconfig.build.json # TypeScript build configuration
├── tsup.config.ts      # Build tool configuration
└── package.json        # Package metadata and dependencies
```

> **Minimalist Approach**: For API-only plugins like Comput3AI, you can consolidate files:
> - Combine multiple similar actions into a single file
> - Place all types in a single `types/index.ts` file
> - Create a central `utils/apiClient.ts` for all API calls
> - Define all constants in one `constants.ts` file

## Core Components in Detail

### 1. Plugin Definition (index.ts)

The main plugin file exports a `Plugin` object that defines the plugin's behavior and capabilities. This is the entry point for ElizaOS to load and use your plugin.

```typescript
import type { Plugin, IAgentRuntime } from "@elizaos/core";
import { logger } from "@elizaos/core";
import dotenv from "dotenv";
import * as actions from "./actions";

// Load environment variables (optional, but recommended)
dotenv.config();

// Define API configuration constants
const API_CONFIG = {
  BASE_URL: 'https://api.example.com/v1',
  REQUIRED_ENV_VARS: ['API_KEY', 'USER_ID'],
  // Add other API-specific configuration
};

/**
 * Main plugin definition for ElizaOS integration
 * 
 * This object defines how the plugin interacts with the ElizaOS framework
 * and what capabilities it provides to agents.
 */
export const myPlugin: Plugin = {
  // Initialize the plugin with configuration
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    logger.info("Initializing MyPlugin");
    
    // Validate required environment variables
    for (const varName of API_CONFIG.REQUIRED_ENV_VARS) {
      if (!runtime.getSetting(varName) && !process.env[varName]) {
        logger.error(`Missing required environment variable: ${varName}`);
      }
    }
    
    // Set up any necessary initial state or connections
    // ...
  },
  
  // Basic plugin metadata
  name: "my-plugin", // Unique identifier for the plugin
  description: "Plugin for interacting with Example API", // Human-readable description
  
  // Register all action handlers
  actions: Object.values(actions),
  
  // Other optional components
  providers: [], // Data providers
  evaluators: [], // Custom evaluators
  services: [],  // Background services
  routes: [],    // HTTP routes (for web extensions)
};

// Export all actions for external use
export * as actions from "./actions";

// Default export for the plugin
export default myPlugin;
```

#### Key Properties

| Property | Description | Required | Notes |
|----------|-------------|----------|-------|
| `name` | Unique identifier | Yes | Use kebab-case, must be unique in the ElizaOS ecosystem |
| `description` | Human-readable description | Yes | Clear, concise explanation of the plugin's purpose |
| `init` | Initialization function | No | Runs when the plugin is loaded, use for setup tasks |
| `actions` | Array of action handlers | No | The primary way agents interact with your plugin |
| `providers` | Array of data providers | No | For providing data to the agent's context |
| `evaluators` | Array of evaluators | No | For evaluating agent responses |
| `services` | Array of services | No | For background tasks and persistent functionality |
| `routes` | Array of HTTP routes | No | For adding web endpoints |

### 2. Action Definitions

Actions are the primary way agents interact with your plugin. Each action is defined as an object with specific properties and a handler function that executes when the action is triggered.

#### 2.1 Action Structure

```typescript
import {
  type Action,
  type ActionExample,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import { z } from "zod"; // Optional for runtime validation

/**
 * Action that performs a specific task with the API
 * 
 * This action [describe what it does and when it should be used]
 */
export const myAction: Action = {
  // Action identifier - used to trigger this action (always uppercase)
  name: "MY_ACTION",
  
  // Alternative names that can trigger this action
  similes: ["SIMILAR_ACTION", "ALTERNATIVE_NAME"],
  
  // Validation function - determines if this action can be executed
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Check if required settings are available
    if (!runtime.getSetting("REQUIRED_API_KEY")) {
      logger.warn("Cannot execute action: Missing API key");
      return false;
    }
    
    // Check message content if needed
    // if (!message.content || !message.content.text) return false;
    
    return true; // Action can be executed
  },
  
  // Human-readable description of the action
  description: "Performs [specific task] with the API",
  
  // Main function that implements the action
  handler: async (
    runtime: IAgentRuntime,  // Access to runtime environment
    message: Memory,         // The triggering message
    state: State,            // Agent state
    options: Record<string, unknown>, // Additional options
    callback: HandlerCallback // Function to send response
  ): Promise<boolean> => {
    try {
      logger.info("Executing myAction");
      
      // 1. Extract required data from message or state
      const actionData = extractActionData(message, state);
      
      // 2. Validate data (optional but recommended)
      const validatedData = validateActionData(actionData);
      
      // 3. Call API or perform core functionality
      const result = await callApiEndpoint(runtime, validatedData);
      
      // 4. Process the result
      const processedResult = processApiResult(result);
      
      // 5. Send success response via callback
      callback({
        text: formatUserFriendlyResponse(processedResult),
        content: {
          success: true,
          data: processedResult,
          // Include any structured data for further processing
        },
      });
      
      // Return true to indicate success
      return true;
    } catch (error) {
      // Handle errors gracefully
      logger.error(`Error in ${this.name} action:`, error);
      
      // Send error response via callback
      callback({
        text: `Action failed: ${error.message}`,
        content: {
          success: false,
          error: error.message,
          // Include error details for debugging
        },
      });
      
      // Return false to indicate failure
      return false;
    }
  },
  
  // Examples of how this action is used in conversations
  examples: [
    [
      { // User message that would trigger this action
        name: "{{name1}}",
        content: {
          text: "Example user request that triggers this action",
        },
      },
      { // Agent response using this action
        name: "{{name2}}",
        content: {
          text: "Example agent response",
          actions: ["MY_ACTION"],
        },
      },
    ],
    // Additional examples...
  ] as ActionExample[][],
} as Action;

// Helper functions (keep these inside the same file for simplicity)
function extractActionData(message: Memory, state: State) {
  // Logic to extract data from message or state
}

function validateActionData(data: any) {
  // Validation logic (can use zod schemas)
}

async function callApiEndpoint(runtime: IAgentRuntime, data: any) {
  // API call logic
}

function processApiResult(result: any) {
  // Process and transform API response
}

function formatUserFriendlyResponse(result: any): string {
  // Format result into user-friendly text
}
```

#### 2.2 Key Action Components

| Component | Description | Best Practices |
|-----------|-------------|----------------|
| `name` | Unique action identifier | Use UPPERCASE_WITH_UNDERSCORES |
| `similes` | Alternative names | Include variations to improve detection |
| `validate` | Validation function | Check all prerequisites before execution |
| `description` | Human-readable description | Be clear and specific about what the action does |
| `handler` | Main implementation | Structure with try/catch and clear steps |
| `examples` | Example conversations | Include at least 2-3 diverse examples |

#### 2.3 Recommended Action Handler Pattern

For consistent, maintainable action handlers:

1. **Extract**: Get necessary data from the message, state, or runtime
2. **Validate**: Ensure all required data is present and valid
3. **Execute**: Perform the core action functionality (API calls, etc.)
4. **Transform**: Process the results into a useful format
5. **Respond**: Send a response via the callback function
6. **Handle Errors**: Catch and handle all errors gracefully

### 3. Types and Interfaces

Define clear types for API requests, responses, and internal data structures to ensure type safety and better code completion.

```typescript
// src/types/index.ts

/**
 * Types for API requests, responses, and internal data structures
 */

// Common API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Specific API endpoint types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  // Add other user profile fields
}

export interface WorkloadItem {
  id: string;
  status: 'running' | 'stopped' | 'pending';
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  // Add other workload fields
}

export interface WorkloadListResponse {
  workloads: WorkloadItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// Action-specific content types
export interface GetWorkloadContent {
  workloadId: string;
}

export interface LaunchWorkloadContent {
  name: string;
  resources: {
    gpuType: string;
    cpuCount: number;
    memoryGB: number;
  };
  // Add other launch parameters
}

// Add type guards
export function isWorkloadItem(item: any): item is WorkloadItem {
  return (
    item &&
    typeof item.id === 'string' &&
    ['running', 'stopped', 'pending'].includes(item.status)
  );
}
```

### 4. API Client Utilities

Create a centralized API client to handle all API calls with consistent error handling and authentication.

```typescript
// src/utils/apiClient.ts

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';
import { constants } from '../constants';
import { logger } from '@elizaos/core';

/**
 * API client for making requests to the API
 */
export class ApiClient {
  private readonly baseURL: string;
  private readonly apiKey: string;
  
  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }
  
  /**
   * Create an API client instance from environment variables
   */
  static fromEnvironment(runtime: IAgentRuntime): ApiClient {
    const baseURL = constants.API_BASE_URL;
    const apiKey = runtime.getSetting('API_KEY') || process.env.API_KEY || '';
    
    if (!apiKey) {
      logger.warn('API key is missing');
    }
    
    return new ApiClient(baseURL, apiKey);
  }
  
  /**
   * Make a GET request to the API
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.request<T>({
        method: 'GET',
        url: endpoint,
        params,
      });
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }
  
  /**
   * Make a POST request to the API
   */
  async post<T = any>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.request<T>({
        method: 'POST',
        url: endpoint,
        data,
      });
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }
  
  /**
   * Make a request with the configured axios instance
   */
  private async request<T>(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return axiosInstance.request<T>(config);
  }
  
  /**
   * Handle API errors consistently
   */
  private handleError<T>(error: any): ApiResponse<T> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      logger.error(`API Error (${axiosError.code}): ${axiosError.message}`);
      
      // Handle different types of errors
      if (axiosError.response) {
        // Server responded with error status
        return {
          success: false,
          error: axiosError.response.data?.message || axiosError.message,
          statusCode: axiosError.response.status,
        };
      } else if (axiosError.request) {
        // Request was made but no response received
        return {
          success: false,
          error: 'No response received from server',
          statusCode: 0,
        };
      }
    }
    
    // Generic error handling
    logger.error('Unexpected API error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

// Export a factory function for easy client creation
export function createApiClient(runtime: IAgentRuntime): ApiClient {
  return ApiClient.fromEnvironment(runtime);
}
```

### 5. Constants and Configuration

Keep all constants and configuration values in a single file for easy maintenance.

```typescript
// src/constants.ts

/**
 * Constants and configuration values used throughout the plugin
 */
export const constants = {
  // API configuration
  API_BASE_URL: 'https://api.example.com/v1',
  API_TIMEOUT: 30000, // 30 seconds
  
  // Required environment variables
  REQUIRED_ENV_VARS: ['API_KEY', 'USER_ID'],
  
  // Feature flags
  FEATURES: {
    ENABLE_CACHING: true,
    DEBUG_MODE: process.env.NODE_ENV === 'development',
  },
  
  // Error messages
  ERRORS: {
    MISSING_API_KEY: 'API key is required but not provided',
    INVALID_WORKLOAD_ID: 'Invalid workload ID provided',
    NETWORK_ERROR: 'Network error occurred while connecting to the API',
  },
  
  // API endpoints
  ENDPOINTS: {
    USER_PROFILE: '/user/profile',
    USER_TOKENS: '/user/tokens',
    WORKLOAD: '/user/workload',
    WORKLOAD_LAUNCH: '/user/workload/launch',
    WORKLOAD_STOP: '/user/workload/stop',
    WORKLOAD_LIST: '/user/workload/list',
  },
};
```

### 6. Configuration Files

#### 6.1 TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowImportingTsExtensions": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "resolveJsonModule": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowJs": true,
    "checkJs": false,
    "noEmitOnError": true,
    "moduleDetection": "force",
    "allowArbitraryExtensions": true,
    "baseUrl": ".",
    "paths": {
      "@elizaos/core": ["../../core/src"],
      "@elizaos/core/*": ["../../core/src/*"]
    }
  },
  "include": ["src/**/*.ts"]
}
```

#### 6.2 Build-Specific Configuration (tsconfig.build.json)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "sourceMap": true,
    "inlineSources": true,
    "declaration": true,
    "emitDeclarationOnly": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

#### 6.3 Build Tool Configuration (tsup.config.ts)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  tsconfig: './tsconfig.build.json',
  sourcemap: true,
  clean: true,
  format: ['esm'],
  dts: false,
  external: [
    // Node.js built-ins
    'dotenv',
    'fs',
    'path',
    'https',
    'http',
    // ElizaOS dependencies
    '@elizaos/core',
    // Third-party libraries
    'zod',
    'axios',
  ],
  // Optional: Add minification and tree shaking for production
  minify: process.env.NODE_ENV === 'production',
  treeshake: true,
});
```

#### 6.4 Package Metadata (package.json)

```json
{
  "name": "@bio-xyz/plugin-example",
  "description": "Plugin for Example API Integration",
  "version": "1.0.0-beta.1",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": {
    "type": "git",
    "url": "github:bio-xyz/plugin-example"
  },
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  },
  "files": [
    "dist"
  ],
  "dependencies": {
    "@elizaos/core": "1.0.0-beta.21",
    "axios": "^1.8.4",
    "dotenv": "^16.4.7",
    "zod": "3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "prettier": "3.5.3",
    "tsup": "8.4.0"
  },
  "scripts": {
    "start": "npx @elizaos/cli start",
    "dev": "npx @elizaos/cli dev",
    "build": "tsup",
    "lint": "prettier --write ./src",
    "test": "npx @elizaos/cli test",
    "publish": "npx @elizaos/cli plugin publish",
    "format": "prettier --write ./src",
    "format:check": "prettier --check ./src"
  },
  "publishConfig": {
    "access": "public"
  },
  "resolutions": {
    "zod": "3.24.2"
  },
  "platform": "universal",
  "agentConfig": {
    "pluginType": "elizaos:plugin:1.0.0",
    "pluginParameters": {
      "API_KEY": {
        "type": "string",
        "description": "API key for authentication"
      },
      "USER_ID": {
        "type": "string",
        "description": "User identifier for the API service"
      },
      "DEBUG_MODE": {
        "type": "boolean",
        "description": "Enable debug logging",
        "default": false
      }
    }
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Advanced Topics

### 1. Error Handling and Logging

Implement consistent error handling throughout your plugin:

```typescript
try {
  // Operation that might fail
} catch (error) {
  // Determine error type and log appropriately
  if (axios.isAxiosError(error)) {
    logger.error(`API Error (${error.code}): ${error.message}`);
    if (error.response) {
      logger.debug('Error response:', error.response.data);
    }
  } else if (error instanceof SomeSpecificError) {
    logger.warn(`Specific error occurred: ${error.message}`);
  } else {
    logger.error('Unexpected error:', error);
  }
  
  // Propagate the error with context
  throw new Error(`Operation failed: ${error.message}`);
}
```

### 2. Type Validation with Zod

Use Zod for runtime validation and type inference:

```typescript
import { z } from 'zod';

// Define Zod schema for validation
const WorkloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: z.enum(['running', 'stopped', 'pending']),
  resources: z.object({
    cpu: z.number().int().positive(),
    memory: z.number().positive(),
    gpu: z.number().int().min(0),
  }),
  createdAt: z.string().datetime(),
});

// Infer TypeScript type from Zod schema
type Workload = z.infer<typeof WorkloadSchema>;

// Validate data at runtime
function validateWorkload(data: unknown): Workload {
  try {
    return WorkloadSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Invalid workload data: ${issues}`);
    }
    throw error;
  }
}
```

### 3. API Response Processing

Process API responses consistently:

```typescript
async function processApiResponse<T>(apiCall: Promise<ApiResponse<T>>): Promise<T> {
  const response = await apiCall;
  
  if (!response.success) {
    throw new Error(response.error || 'API request failed');
  }
  
  if (!response.data) {
    throw new Error('API returned success but no data');
  }
  
  return response.data;
}

// Usage
const userData = await processApiResponse(apiClient.get<UserProfile>('/user/profile'));
```

### 4. Action Design Patterns

#### 4.1 Command Pattern for Actions

Use a command pattern to organize complex actions:

```typescript
// Define command interface
interface Command {
  execute(): Promise<CommandResult>;
}

// Create specific command implementation
class LaunchWorkloadCommand implements Command {
  constructor(
    private apiClient: ApiClient,
    private params: LaunchWorkloadParams
  ) {}
  
  async execute(): Promise<CommandResult> {
    // Validation
    if (!this.params.name) {
      return { success: false, error: 'Workload name is required' };
    }
    
    // Execution
    const response = await this.apiClient.post('/workload/launch', this.params);
    
    // Result processing
    if (!response.success) {
      return { success: false, error: response.error };
    }
    
    return {
      success: true,
      data: response.data,
      message: `Workload ${this.params.name} launched successfully`,
    };
  }
}

// Use in action handler
const command = new LaunchWorkloadCommand(apiClient, params);
const result = await command.execute();

callback({
  text: result.success ? result.message : `Failed to launch workload: ${result.error}`,
  content: result,
});
```

#### 4.2 Action Factory Pattern

Create actions with a factory pattern for more flexibility:

```typescript
// Action factory function
function createApiAction<T>(
  name: string,
  description: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  similes: string[] = []
): Action {
  return {
    name,
    similes,
    description,
    validate: async (runtime) => !!runtime.getSetting('API_KEY'),
    handler: async (runtime, message, state, options, callback) => {
      const apiClient = createApiClient(runtime);
      
      try {
        const response = method === 'GET'
          ? await apiClient.get<T>(endpoint)
          : await apiClient.post<T>(endpoint, options);
        
        if (!response.success) {
          callback({
            text: `Action failed: ${response.error}`,
            content: { success: false, error: response.error },
          });
          return false;
        }
        
        callback({
          text: `Action completed successfully`,
          content: { success: true, data: response.data },
        });
        return true;
      } catch (error) {
        callback({
          text: `Action failed: ${error.message}`,
          content: { success: false, error: error.message },
        });
        return false;
      }
    },
    examples: [],
  };
}

// Usage
const getUserProfileAction = createApiAction<UserProfile>(
  'GET_USER_PROFILE',
  'Get the current user profile',
  '/user/profile',
  'GET',
  ['USER_PROFILE', 'GET_PROFILE']
);
```

## API Integration Best Practices

### 1. Authentication

Handle authentication securely:

```typescript
// Set authorization header based on authentication type
function getAuthHeaders(runtime: IAgentRuntime): Record<string, string> {
  const apiKey = runtime.getSetting('API_KEY') || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error('API key is required but not provided');
  }
  
  // Choose appropriate auth method based on API requirements
  return {
    // Bearer token (most common)
    'Authorization': `Bearer ${apiKey}`,
    
    // Alternative: API key in header
    // 'X-Api-Key': apiKey,
    
    // Common headers
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}
```

### 2. Rate Limiting

Implement rate limiting to avoid hitting API limits:

```typescript
import { setTimeout } from 'timers/promises';

class RateLimiter {
  private lastRequestTime = 0;
  private requestQueue: Array<() => void> = [];
  private processing = false;
  
  constructor(private minRequestInterval: number = 100) {}
  
  async limitRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add request to queue
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      // Process queue if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  private async processQueue() {
    if (this.requestQueue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    
    // Enforce minimum interval between requests
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + this.minRequestInterval - now);
    
    if (timeToWait > 0) {
      await setTimeout(timeToWait);
    }
    
    // Execute next request
    const nextRequest = this.requestQueue.shift();
    this.lastRequestTime = Date.now();
    
    if (nextRequest) {
      nextRequest();
    }
    
    // Continue processing queue
    this.processQueue();
  }
}

// Usage
const rateLimiter = new RateLimiter(200); // 200ms between requests

async function callApiWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return rateLimiter.limitRequest(fn);
}

// Example
const result = await callApiWithRateLimit(() => 
  apiClient.get<UserProfile>('/user/profile')
);
```

### 3. Caching

Implement simple caching for frequently accessed data:

```typescript
class SimpleCache<T> {
  private cache: Map<string, { data: T; expires: number }> = new Map();
  
  constructor(private defaultTtl: number = 60000) {} // 1 minute default TTL
  
  get(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(key: string, data: T, ttl: number = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  invalidateAll(): void {
    this.cache.clear();
  }
}

// Usage
const profileCache = new SimpleCache<UserProfile>(5 * 60 * 1000); // 5 minute cache

async function getUserProfile(apiClient: ApiClient, userId: string): Promise<UserProfile> {
  // Check cache first
  const cached = profileCache.get(userId);
  if (cached) return cached;
  
  // Make API call if not cached
  const result = await apiClient.get<UserProfile>(`/user/${userId}/profile`);
  
  if (result.success && result.data) {
    // Cache successful result
    profileCache.set(userId, result.data);
    return result.data;
  }
  
  throw new Error(result.error || 'Failed to get user profile');
}
```

## Testing Your Plugin

### 1. Unit Testing with Jest

Set up Jest for unit testing:

```typescript
// src/utils/__tests__/apiClient.test.ts
import { ApiClient } from '../apiClient';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiClient', () => {
  let apiClient: ApiClient;
  
  beforeEach(() => {
    apiClient = new ApiClient('https://api.example.com', 'test-api-key');
    mockedAxios.create.mockReturnValue(mockedAxios);
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('get method should make a GET request and return successful response', async () => {
    const mockResponse = {
      data: { id: '123', name: 'Test User' },
      status: 200,
    };
    
    mockedAxios.request.mockResolvedValueOnce(mockResponse);
    
    const result = await apiClient.get('/user/profile');
    
    expect(mockedAxios.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/user/profile',
      params: undefined,
    });
    
    expect(result).toEqual({
      success: true,
      data: mockResponse.data,
      statusCode: 200,
    });
  });
  
  test('should handle errors correctly', async () => {
    const mockError = {
      isAxiosError: true,
      response: {
        data: { message: 'Unauthorized' },
        status: 401,
      },
      message: 'Request failed with status code 401',
    };
    
    mockedAxios.request.mockRejectedValueOnce(mockError);
    
    const result = await apiClient.get('/user/profile');
    
    expect(result).toEqual({
      success: false,
      error: 'Unauthorized',
      statusCode: 401,
    });
  });
});
```

### 2. Manual Testing with ElizaOS CLI

Test your plugin manually with the ElizaOS CLI:

```bash
# Start the agent with your plugin
npx @elizaos/cli start

# Run tests
npx @elizaos/cli test
```

## Minimalist Approach for API-Only Plugins

For simple API integrations like Comput3AI, you can use this minimalist approach:

### 1. Consolidate Files

Combine related actions in a single file:

```typescript
// src/actions/workloads.ts
// Contains getWorkload, launchWorkload, stopWorkload, and listWorkload actions

// src/actions/user.ts
// Contains getUserProfile and getUserTokens actions

// src/actions/index.ts
export * from './workloads';
export * from './user';
```

### 2. Create a Shared API Client

```typescript
// src/utils/apiClient.ts
// A single shared API client for all actions
```

### 3. Simplified Type Definitions

```typescript
// src/types/index.ts
// All type definitions in a single file
```

### 4. Main Plugin Entry Point

```typescript
// src/index.ts
// Main plugin definition, imports, and exports
```

## Comput3AI-Specific Implementation

For the Comput3AI plugin, we'll use these specific endpoints:

1. GET /api/v0/user/workload - Get workload details
2. GET /api/v0/user/profile - Get user profile
3. GET /api/v0/user/tokens - Get user tokens
4. POST /api/v0/user/workload/launch - Launch a workload
5. POST /api/v0/user/workload/stop - Stop a workload
6. GET /api/v0/user/workload/list - List workloads

The implementation will follow the minimalist approach with:

1. A central API client for Comput3AI API
2. Type definitions for all API responses
3. Consolidated actions in two files (workloads.ts and user.ts)
4. Constants for API endpoints and configuration
5. Main plugin entry point

## Next Steps

1. Create the basic project structure
2. Implement the core utils and types
3. Develop action handlers
4. Configure the main plugin
5. Test and refine

This comprehensive approach ensures that your plugin is well-structured, type-safe, and follows best practices, while still maintaining a minimal file structure for simple API integrations.
