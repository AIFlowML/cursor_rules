import { logger, composePrompt, ModelType, parseJSONObjectFromText } from '@elizaos/core';
import dotenv from 'dotenv';
import axios from 'axios';

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/actions/index.ts
var actions_exports = {};
__export(actions_exports, {
  getUserBalanceAction: () => getUserBalanceAction,
  getUserProfileAction: () => getUserProfileAction,
  getWorkloadTypesAction: () => getWorkloadTypesAction,
  launchWorkloadAction: () => launchWorkloadAction,
  listWorkloadsAction: () => listWorkloadsAction,
  stopWorkloadAction: () => stopWorkloadAction
});

// src/constants.ts
var API_CONFIG = {
  /**
   * Base URL for the Comput3AI API
   */
  BASE_URL: "https://api.comput3.ai/api/v0",
  /**
   * Timeout in milliseconds for API requests
   */
  TIMEOUT: 3e4,
  // 30 seconds
  /**
   * Required environment variables for the plugin
   */
  REQUIRED_ENV_VARS: ["COMPUT3AI_API_KEY", "COMPUT3AI_WALLET_ADDRESS"],
  /**
   * API key header name
   */
  API_KEY_HEADER: "X-C3-API-KEY"
};
var ENDPOINTS = {
  /**
   * Get available workload types
   * GET /api/v0/types
   */
  TYPES: "/types",
  /**
   * Get user balance
   * GET /api/v0/balance
   */
  BALANCE: "/balance",
  /**
   * Get user profile
   * GET /api/v0/profile
   */
  PROFILE: "/profile",
  /**
   * Launch a workload
   * POST /api/v0/launch
   */
  LAUNCH: "/launch",
  /**
   * Stop a workload
   * POST /api/v0/stop
   */
  STOP: "/stop",
  /**
   * List workloads
   * POST /api/v0/workloads
   */
  WORKLOADS: "/workloads"
};
var ERROR_MESSAGES = {
  /**
   * Missing API key error
   */
  MISSING_API_KEY: "Comput3AI API key is required but not provided",
  /**
   * Invalid workload ID error
   */
  INVALID_WORKLOAD_ID: "Invalid workload ID provided",
  /**
   * Network error
   */
  NETWORK_ERROR: "Network error occurred while connecting to the Comput3AI API",
  /**
   * Unknown error
   */
  UNKNOWN_ERROR: "An unknown error occurred",
  /**
   * Invalid workload type
   */
  INVALID_WORKLOAD_TYPE: "Invalid workload type provided"
};

// src/utils/apiClient.ts
var Comput3ApiClient = class _Comput3ApiClient {
  baseURL;
  apiKey;
  /**
   * Creates a new Comput3AI API client
   * 
   * @param baseURL - Base URL for the API
   * @param apiKey - API key for authentication
   */
  constructor(baseURL, apiKey) {
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
  static fromRuntime(runtime) {
    const baseURL = API_CONFIG.BASE_URL;
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY || "";
    if (!apiKey) {
      logger.error(ERROR_MESSAGES.MISSING_API_KEY);
      throw new Error(ERROR_MESSAGES.MISSING_API_KEY);
    }
    return new _Comput3ApiClient(baseURL, apiKey);
  }
  /**
   * Makes a GET request to the API
   * 
   * @param endpoint - API endpoint to call
   * @param params - Query parameters for the request
   * @returns Typed API response
   */
  async get(endpoint, params) {
    logger.debug(`Comput3API GET request to ${endpoint}`, params);
    try {
      const response = await this.request({
        method: "GET",
        url: endpoint,
        params
      });
      logger.debug(`Comput3API GET response from ${endpoint}`, response.data);
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      return this.handleError(error, endpoint);
    }
  }
  /**
   * Makes a POST request to the API
   * 
   * @param endpoint - API endpoint to call
   * @param data - Request body
   * @returns Typed API response
   */
  async post(endpoint, data) {
    logger.debug(`Comput3API POST request to ${endpoint}`, data);
    try {
      const response = await this.request({
        method: "POST",
        url: endpoint,
        data
      });
      logger.debug(`Comput3API POST response from ${endpoint}`, response.data);
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      return this.handleError(error, endpoint);
    }
  }
  /**
   * Gets available workload types
   * 
   * @returns List of available workload types
   */
  async getWorkloadTypes() {
    return this.get(ENDPOINTS.TYPES);
  }
  /**
   * Gets user balance
   * 
   * @returns User balance information
   */
  async getUserBalance() {
    return this.get(ENDPOINTS.BALANCE);
  }
  /**
   * Gets user profile
   * 
   * @returns User profile information
   */
  async getUserProfile() {
    return this.get(ENDPOINTS.PROFILE);
  }
  /**
   * Launches a new workload
   * 
   * @param request - Launch workload request parameters
   * @returns Launch workload response
   */
  async launchWorkload(request) {
    return this.post(ENDPOINTS.LAUNCH, request);
  }
  /**
   * Stops a running workload
   * 
   * @param request - Stop workload request parameters
   * @returns Stop workload response
   */
  async stopWorkload(request) {
    return this.post(ENDPOINTS.STOP, request);
  }
  /**
   * Lists user workloads
   * 
   * @param request - List workloads request parameters
   * @returns List of workload items
   */
  async listWorkloads(request) {
    return this.post(ENDPOINTS.WORKLOADS, request || { running: true });
  }
  /**
   * Makes a request with appropriate headers and configuration
   * 
   * @param config - Axios request configuration
   * @returns Axios response
   * @private
   */
  async request(config) {
    const axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        [API_CONFIG.API_KEY_HEADER]: this.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    return axiosInstance.request(config);
  }
  /**
   * Handles API errors consistently
   * 
   * @param error - Error object
   * @param endpoint - API endpoint that was called
   * @returns Error response
   * @private
   */
  handleError(error, endpoint) {
    if (axios.isAxiosError(error)) {
      const axiosError = error;
      logger.error(`Comput3API Error for ${endpoint}: ${axiosError.message}`);
      if (axiosError.response) {
        const responseData = axiosError.response.data;
        logger.debug("Error response data:", responseData);
        return {
          success: false,
          error: responseData.message || axiosError.message,
          statusCode: axiosError.response.status
        };
      }
      if (axiosError.request) {
        logger.error("No response received from Comput3AI API");
        return {
          success: false,
          error: ERROR_MESSAGES.NETWORK_ERROR,
          statusCode: 0
        };
      }
    }
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
    logger.error(`Unexpected Comput3AI API error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage
    };
  }
};
function createComput3ApiClient(runtime) {
  return Comput3ApiClient.fromRuntime(runtime);
}

// src/actions/getWorkloadTypes.ts
dotenv.config();
var getWorkloadTypesAction = {
  /**
   * Action identifier
   */
  name: "GET_WORKLOAD_TYPES",
  /**
   * Alternative action names
   */
  similes: [
    "LIST_WORKLOAD_TYPES",
    "GET_COMPUT3_TYPES",
    "LIST_COMPUT3_TYPES",
    "SHOW_WORKLOAD_TYPES"
  ],
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime, _message) => {
    logger.debug("Validating GET_WORKLOAD_TYPES action");
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    if (!apiKey) {
      logger.error("GET_WORKLOAD_TYPES validation failed: Missing API key");
      return false;
    }
    logger.debug("GET_WORKLOAD_TYPES validation successful");
    return true;
  },
  /**
   * Human-readable description of the action
   */
  description: "Retrieves available GPU workload types from Comput3AI",
  /**
   * Main action handler
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @param state - Agent state
   * @param options - Additional options
   * @param callback - Callback for sending response
   * @returns Success status
   */
  handler: async (runtime, _message, _state, _options, callback) => {
    logger.info("Executing GET_WORKLOAD_TYPES action");
    try {
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      logger.debug("Fetching workload types from Comput3AI API");
      const response = await apiClient.getWorkloadTypes();
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to retrieve workload types";
        logger.error(`GET_WORKLOAD_TYPES failed: ${errorMessage}`);
        callback({
          text: `Failed to retrieve workload types: ${errorMessage}`,
          content: {
            success: false,
            error: errorMessage
          }
        });
        return false;
      }
      const workloadTypes = response.data;
      logger.info(`Retrieved ${workloadTypes.length} workload types`);
      logger.debug("Workload types:", workloadTypes);
      const formattedTypes = formatWorkloadTypes(workloadTypes);
      callback({
        text: `Available workload types: ${formattedTypes}`,
        content: {
          success: true,
          data: workloadTypes
        }
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`GET_WORKLOAD_TYPES error: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      callback({
        text: `Failed to retrieve workload types: ${errorMessage}`,
        content: {
          success: false,
          error: errorMessage
        }
      });
      return false;
    }
  },
  /**
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "What workload types are available on Comput3?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check the available workload types...",
          actions: ["GET_WORKLOAD_TYPES"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me the GPU workload options I can launch"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Here are the available GPU workload types...",
          actions: ["GET_WORKLOAD_TYPES"]
        }
      }
    ]
  ]
};
function formatWorkloadTypes(types) {
  if (types.length === 0) {
    return "No workload types available";
  }
  return types.map((type) => `'${type}'`).join(", ");
}
dotenv.config();
var getUserProfileAction = {
  /**
   * Action identifier
   */
  name: "GET_USER_PROFILE",
  /**
   * Alternative action names
   */
  similes: [
    "SHOW_USER_PROFILE",
    "GET_COMPUT3_PROFILE",
    "DISPLAY_USER_PROFILE",
    "MY_COMPUT3_PROFILE"
  ],
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime, _message) => {
    logger.debug("Validating GET_USER_PROFILE action");
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    if (!apiKey) {
      logger.error("GET_USER_PROFILE validation failed: Missing API key");
      return false;
    }
    logger.debug("GET_USER_PROFILE validation successful");
    return true;
  },
  /**
   * Human-readable description of the action
   */
  description: "Retrieves user profile information from Comput3AI",
  /**
   * Main action handler
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @param state - Agent state
   * @param options - Additional options
   * @param callback - Callback for sending response
   * @returns Success status
   */
  handler: async (runtime, _message, _state, _options, callback) => {
    logger.info("Executing GET_USER_PROFILE action");
    try {
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      logger.debug("Fetching user profile from Comput3AI API");
      const response = await apiClient.getUserProfile();
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to retrieve user profile";
        logger.error(`GET_USER_PROFILE failed: ${errorMessage}`);
        callback({
          text: `Failed to retrieve user profile: ${errorMessage}`,
          content: {
            success: false,
            error: errorMessage
          }
        });
        return false;
      }
      const profile = response.data;
      logger.info("Retrieved user profile");
      logger.debug("User profile:", profile);
      const formattedProfile = formatUserProfile(profile);
      callback({
        text: formattedProfile,
        content: {
          success: true,
          data: profile
        }
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`GET_USER_PROFILE error: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      callback({
        text: `Failed to retrieve user profile: ${errorMessage}`,
        content: {
          success: false,
          error: errorMessage
        }
      });
      return false;
    }
  },
  /**
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "What's my Comput3 profile?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your Comput3AI profile information...",
          actions: ["GET_USER_PROFILE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me my Comput3AI user profile"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Here's your Comput3AI profile information...",
          actions: ["GET_USER_PROFILE"]
        }
      }
    ]
  ]
};
function formatUserProfile(profile) {
  const lines = [
    "User Profile Information:",
    `Wallet Address: ${profile.addr}`,
    `User UUID: ${profile.user_uuid}`
  ];
  if (profile.tags && profile.tags.length > 0) {
    lines.push(`Tags: ${profile.tags.join(", ")}`);
  } else {
    lines.push("Tags: None");
  }
  return lines.join("\n");
}
dotenv.config();
var getUserBalanceAction = {
  /**
   * Action identifier
   */
  name: "GET_USER_BALANCE",
  /**
   * Alternative action names
   */
  similes: [
    "SHOW_USER_BALANCE",
    "CHECK_BALANCE",
    "GET_COMPUT3_BALANCE",
    "DISPLAY_USER_BALANCE",
    "MY_COMPUT3_BALANCE"
  ],
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime, _message) => {
    logger.debug("Validating GET_USER_BALANCE action");
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    if (!apiKey) {
      logger.error("GET_USER_BALANCE validation failed: Missing API key");
      return false;
    }
    logger.debug("GET_USER_BALANCE validation successful");
    return true;
  },
  /**
   * Human-readable description of the action
   */
  description: "Retrieves user balance information from Comput3AI",
  /**
   * Main action handler
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @param state - Agent state
   * @param options - Additional options
   * @param callback - Callback for sending response
   * @returns Success status
   */
  handler: async (runtime, _message, _state, _options, callback) => {
    logger.info("Executing GET_USER_BALANCE action");
    try {
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      logger.debug("Fetching user balance from Comput3AI API");
      const response = await apiClient.getUserBalance();
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to retrieve user balance";
        logger.error(`GET_USER_BALANCE failed: ${errorMessage}`);
        callback({
          text: `Failed to retrieve user balance: ${errorMessage}`,
          content: {
            success: false,
            error: errorMessage
          }
        });
        return false;
      }
      const balance = response.data;
      logger.info("Retrieved user balance");
      logger.debug("User balance:", balance);
      const formattedBalance = formatUserBalance(balance);
      callback({
        text: formattedBalance,
        content: {
          success: true,
          data: balance
        }
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`GET_USER_BALANCE error: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      callback({
        text: `Failed to retrieve user balance: ${errorMessage}`,
        content: {
          success: false,
          error: errorMessage
        }
      });
      return false;
    }
  },
  /**
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "What's my current balance on Comput3?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your Comput3AI balance...",
          actions: ["GET_USER_BALANCE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "How many tokens do I have in my Comput3AI account?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me check your current token balance...",
          actions: ["GET_USER_BALANCE"]
        }
      }
    ]
  ]
};
function formatUserBalance(balance) {
  return `Your current Comput3AI balance is: ${balance.balance} tokens`;
}
dotenv.config();
var listWorkloadsAction = {
  /**
   * Action identifier
   */
  name: "LIST_WORKLOADS",
  /**
   * Alternative action names
   */
  similes: [
    "GET_WORKLOADS",
    "SHOW_WORKLOADS",
    "LIST_MY_WORKLOADS",
    "DISPLAY_WORKLOADS",
    "SHOW_MY_WORKLOADS"
  ],
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime, _message) => {
    logger.debug("Validating LIST_WORKLOADS action");
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    if (!apiKey) {
      logger.error("LIST_WORKLOADS validation failed: Missing API key");
      return false;
    }
    logger.debug("LIST_WORKLOADS validation successful");
    return true;
  },
  /**
   * Human-readable description of the action
   */
  description: "Retrieves a list of user workloads from Comput3AI",
  /**
   * Main action handler
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @param state - Agent state
   * @param options - Additional options
   * @param callback - Callback for sending response
   * @returns Success status
   */
  handler: async (runtime, message, _state, _options, callback) => {
    logger.info("Executing LIST_WORKLOADS action");
    try {
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      const messageText = message.content?.text || "";
      const showOnlyRunning = messageText.toLowerCase().includes("running");
      logger.debug(`Filtering for running workloads only: ${showOnlyRunning}`);
      const requestOptions = {
        running: showOnlyRunning || void 0
      };
      logger.debug("Fetching workloads list from Comput3AI API", requestOptions);
      const response = await apiClient.listWorkloads(requestOptions);
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to retrieve workloads";
        logger.error(`LIST_WORKLOADS failed: ${errorMessage}`);
        callback({
          text: `Failed to retrieve workloads: ${errorMessage}`,
          content: {
            success: false,
            error: errorMessage
          }
        });
        return false;
      }
      const workloads = response.data;
      logger.info(`Retrieved ${workloads.length} workloads`);
      logger.debug("Workloads:", workloads);
      const formattedWorkloads = formatWorkloadsList(workloads, showOnlyRunning);
      callback({
        text: formattedWorkloads,
        content: {
          success: true,
          data: workloads
        }
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`LIST_WORKLOADS error: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      callback({
        text: `Failed to retrieve workloads: ${errorMessage}`,
        content: {
          success: false,
          error: errorMessage
        }
      });
      return false;
    }
  },
  /**
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "List all my Comput3 workloads"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Here are your Comput3AI workloads...",
          actions: ["LIST_WORKLOADS"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me my running workloads on Comput3AI"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Let me fetch your running workloads...",
          actions: ["LIST_WORKLOADS"]
        }
      }
    ]
  ]
};
function formatWorkloadsList(workloads, showOnlyRunning) {
  if (workloads.length === 0) {
    return `No ${showOnlyRunning ? "running " : ""}workloads found.`;
  }
  const header = `Found ${workloads.length} ${showOnlyRunning ? "running " : ""}workload${workloads.length > 1 ? "s" : ""}:`;
  const workloadLines = workloads.map((workload) => {
    const createdDate = new Date(workload.created * 1e3).toLocaleString();
    const expiresDate = new Date(workload.expires * 1e3).toLocaleString();
    return [
      `
\u2022 Workload: ${workload.workload}`,
      `  Type: ${workload.type}`,
      `  Status: ${workload.status}`,
      `  Node: ${workload.node}`,
      `  Running: ${workload.running ? "Yes" : "No"}`,
      `  Created: ${createdDate}`,
      `  Expires: ${expiresDate}`
    ].join("\n");
  });
  return `${header}${workloadLines.join("\n")}`;
}
var WORKLOAD_TYPE_PATTERNS = {
  "media:fast": [
    /media:fast/i,
    /media fast/i,
    /fast media/i,
    /media.*fast/i
  ],
  "ollama_webui:coder": [
    /ollama_webui:coder/i,
    /ollama webui:coder/i,
    /ollama webui coder/i,
    /ollama.*coder/i,
    /coder workload/i,
    /coding workload/i,
    /workload.*coding/i,
    /workload.*code/i
  ],
  "ollama_webui:fast": [
    /ollama_webui:fast/i,
    /ollama webui:fast/i,
    /ollama webui fast/i,
    /ollama.*fast/i,
    /ollama fast/i,
    /fast ollama/i
  ],
  "ollama_webui:large": [
    /ollama_webui:large/i,
    /ollama webui:large/i,
    /ollama webui large/i,
    /ollama.*large/i,
    /large ollama/i,
    /ollama large/i
  ],
  "llama_webui:coder": [
    /llama_webui:coder/i,
    /llama webui:coder/i,
    /llama webui coder/i,
    /llama.*coder/i,
    /llama coder/i
  ]
};
var ENHANCED_LAUNCH_WORKLOAD_TEMPLATE = `Analyze the most recent user message to extract information about launching a GPU workload on Comput3AI. 
Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example responses:
\`\`\`json
{
   "type": "ollama_webui:coder",
   "expires": 10
}
\`\`\`

\`\`\`json
{
   "type": "media:fast",
   "expires": 30
}
\`\`\`

\`\`\`json
{
   "type": "llama_webui:coder",
   "expires": 15
}
\`\`\`

{{recentMessages}}

Extract the following information about the requested workload launch:
- Workload type: Must be exactly one of these strings: "media:fast", "ollama_webui:coder", "ollama_webui:fast", "ollama_webui:large", "llama_webui:coder"
- Expiration time in minutes (default to 10 if not specified) - this will be converted to a Unix timestamp later

If the workload type is unclear, try to infer from context (e.g., "coding" -> "ollama_webui:coder", "fast media" -> "media:fast").
`;
var ENHANCED_STOP_WORKLOAD_TEMPLATE = `Analyze the most recent user message to extract information about stopping a GPU workload on Comput3AI.
Respond with a JSON markdown block containing only the extracted values.

Example responses:
\`\`\`json
{
   "workload": "7b69314d-c88d-47d9-920c-ae827f6b7844"
}
\`\`\`

\`\`\`json
{
   "workload": "firmly-widely-proud-gpu.comput3.ai"
}
\`\`\`

{{recentMessages}}

Extract the following information about the requested workload to stop:
- Workload ID to stop (can be either in UUID format like "7b69314d-c88d-47d9-920c-ae827f6b7844" or domain format like "something-something-something-gpu.comput3.ai")

Look for either UUID format strings (8-4-4-4-12 format) or strings ending in ".comput3.ai" or any identifier that appears to be a workload ID.
`;
function extractWorkloadType(text) {
  if (!text) return null;
  for (const [type, patterns] of Object.entries(WORKLOAD_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        logger.debug(`Matched workload type '${type}' using pattern ${pattern}`);
        return type;
      }
    }
  }
  if (text.match(/coder|coding|code|developer|development/i)) {
    logger.debug("Inferred 'ollama_webui:coder' from context");
    return "ollama_webui:coder";
  }
  if (text.match(/media|video|audio|streaming/i)) {
    logger.debug("Inferred 'media:fast' from context");
    return "media:fast";
  }
  if (text.match(/large|big|powerful/i)) {
    logger.debug("Inferred 'ollama_webui:large' from context");
    return "ollama_webui:large";
  }
  if (text.match(/fast|quick|speed/i)) {
    logger.debug("Inferred 'ollama_webui:fast' from context");
    return "ollama_webui:fast";
  }
  return null;
}
function extractExpirationTime(text, defaultMinutes = 10) {
  if (!text) return defaultMinutes;
  const expirationPatterns = [
    /expires? in (\d+)\s*min(ute)?s?/i,
    /for (\d+)\s*min(ute)?s?/i,
    /(\d+)\s*min(ute)?s? expir/i,
    /(\d+)\s*min(ute)?s?/i,
    /(\d+)\s*hours?/i
  ];
  for (const pattern of expirationPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number.parseInt(match[1], 10);
      if (pattern.toString().includes("hours")) {
        const minutes = value * 60;
        logger.debug(`Extracted expiration time: ${value} hours = ${minutes} minutes`);
        return minutes;
      }
      logger.debug(`Extracted expiration time: ${value} minutes`);
      return value;
    }
  }
  logger.debug(`No expiration time found, using default: ${defaultMinutes} minutes`);
  return defaultMinutes;
}
function extractWorkloadId(text) {
  if (!text) return null;
  const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const uuidMatch = text.match(uuidPattern);
  if (uuidMatch?.[1]) {
    logger.debug(`Extracted workload ID from UUID pattern: ${uuidMatch[1]}`);
    return uuidMatch[1];
  }
  const comput3DomainPattern = /([a-zA-Z0-9-]+\.comput3\.ai)/i;
  const domainMatch = text.match(comput3DomainPattern);
  if (domainMatch?.[1]) {
    logger.debug(`Extracted workload ID from domain pattern: ${domainMatch[1]}`);
    return domainMatch[1];
  }
  const workloadPatterns = [
    /wrk_([a-zA-Z0-9]+)/i,
    /workload[:\s]+([a-zA-Z0-9-_]+)/i,
    /([a-zA-Z]+-[a-zA-Z]+-[a-zA-Z]+-[a-zA-Z]+)/i
  ];
  for (const pattern of workloadPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      logger.debug(`Extracted workload ID: ${match[1]}`);
      return pattern.toString().includes("wrk_") ? `wrk_${match[1]}` : match[1];
    }
  }
  return null;
}
function validateLaunchWorkloadFromText(text) {
  const type = extractWorkloadType(text);
  if (!type) {
    logger.debug("Failed to extract valid workload type from text");
    return null;
  }
  const expires = extractExpirationTime(text);
  return { type, expires };
}
function validateStopWorkloadFromText(text) {
  const workload = extractWorkloadId(text);
  if (!workload) {
    logger.debug("Failed to extract valid workload ID from text");
    return null;
  }
  return { workload };
}

// src/actions/launchWorkload.ts
dotenv.config();
function isLaunchWorkloadContent(content) {
  logger.debug("Validating launch workload content:", content);
  if (!content.type || typeof content.type !== "string") {
    logger.debug("Invalid content: Missing or invalid workload type");
    return false;
  }
  if (content.expires !== void 0 && typeof content.expires !== "number") {
    logger.debug("Invalid content: Expires must be a number if provided");
    return false;
  }
  return true;
}
var launchWorkloadTemplate = ENHANCED_LAUNCH_WORKLOAD_TEMPLATE;
var launchWorkloadAction = {
  /**
   * Action identifier
   */
  name: "LAUNCH_WORKLOAD",
  /**
   * Alternative action names
   */
  similes: [
    "START_WORKLOAD",
    "CREATE_WORKLOAD",
    "LAUNCH_GPU",
    "START_GPU",
    "CREATE_GPU_WORKLOAD"
  ],
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime, _message) => {
    logger.debug("Validating LAUNCH_WORKLOAD action");
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    if (!apiKey) {
      logger.error("LAUNCH_WORKLOAD validation failed: Missing API key");
      return false;
    }
    logger.debug("LAUNCH_WORKLOAD validation successful");
    return true;
  },
  /**
   * Human-readable description of the action
   */
  description: "Launches a new GPU workload on Comput3AI",
  /**
   * Main action handler
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @param state - State object
   * @param options - Additional options
   * @param callback - Callback for sending response
   * @returns Success status
   */
  handler: async (runtime, message, state, _options, callback) => {
    logger.info("Executing LAUNCH_WORKLOAD action");
    try {
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      logger.debug("Extracting launch parameters from message");
      let launchParams;
      if (message.content && "type" in message.content) {
        launchParams = message.content;
      } else {
        const prompt = composePrompt({
          template: launchWorkloadTemplate,
          state: { recentMessages: formatRecentMessages(state) }
        });
        logger.debug("Extracting workload parameters using LLM");
        const result = await runtime.useModel(ModelType.TEXT_SMALL, {
          prompt
        });
        launchParams = parseJSONObjectFromText(result);
        if (!isLaunchWorkloadContent(launchParams) && message.content && typeof message.content.text === "string") {
          logger.debug("LLM parsing failed, trying direct text extraction");
          const extractedParams = validateLaunchWorkloadFromText(message.content.text);
          if (extractedParams) {
            logger.debug("Direct text extraction successful:", extractedParams);
            launchParams = extractedParams;
          }
        }
      }
      if (!isLaunchWorkloadContent(launchParams)) {
        const errorMessage = ERROR_MESSAGES.INVALID_WORKLOAD_TYPE;
        logger.error(`LAUNCH_WORKLOAD failed: ${errorMessage}`);
        callback({
          text: `Failed to launch workload: ${errorMessage}. Please specify a valid workload type.`,
          content: {
            success: false,
            error: errorMessage
          }
        });
        return false;
      }
      if (launchParams.expires === void 0) {
        launchParams.expires = 10;
      }
      const request = {
        type: launchParams.type,
        expires: Math.floor(Date.now() / 1e3) + launchParams.expires * 60
        // Convert minutes to Unix timestamp
      };
      logger.debug("Launching workload with parameters:", request);
      logger.debug("Request JSON body:", JSON.stringify(request, null, 2));
      logger.debug("Requested workload type:", request.type);
      logger.debug("Requested expiration minutes:", request.expires);
      logger.debug("About to make API call to launch workload");
      const response = await apiClient.launchWorkload(request);
      logger.debug("API call completed with response:", response);
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to launch workload";
        logger.error(`LAUNCH_WORKLOAD failed: ${errorMessage}`);
        logger.debug("Full error response:", JSON.stringify(response, null, 2));
        let userMessage = `Failed to launch workload: ${errorMessage}`;
        if (response.statusCode === 502) {
          userMessage = "Failed to launch workload: Server error (502 Bad Gateway). The Comput3AI service is currently experiencing issues. Please try again later or contact Comput3AI support if the problem persists.";
        }
        callback({
          text: userMessage,
          content: {
            success: false,
            error: errorMessage,
            statusCode: response.statusCode
          }
        });
        return false;
      }
      const launchResponse = response.data;
      logger.info("Successfully launched workload");
      logger.debug("Launch response:", launchResponse);
      const formattedResponse = formatLaunchResponse(launchResponse, request, launchParams.expires);
      callback({
        text: formattedResponse,
        content: {
          success: true,
          data: launchResponse,
          request
        }
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`LAUNCH_WORKLOAD error: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      if (typeof error === "object" && error !== null) {
        try {
          logger.debug("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
          logger.debug("Could not stringify full error object");
        }
      }
      let userMessage = `Failed to launch workload: ${errorMessage}`;
      if (errorMessage.includes("502") || errorMessage.includes("Bad Gateway")) {
        userMessage = "Failed to launch workload: Server error (502 Bad Gateway). The Comput3AI service is currently experiencing issues. Please try again later or contact Comput3AI support if the problem persists.";
      }
      callback({
        text: userMessage,
        content: {
          success: false,
          error: errorMessage
        }
      });
      return false;
    }
  },
  /**
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Launch a new GPU workload of type media:fast that expires in 10 minutes"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Launching a new workload...",
          actions: ["LAUNCH_WORKLOAD"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Start a llama_webui:coder workload that expires in 30 minutes"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Creating a new workload for you...",
          actions: ["LAUNCH_WORKLOAD"]
        }
      }
    ]
  ]
};
function formatRecentMessages(state) {
  const messages = state.messages || [];
  return messages.slice(-3).map((msg) => {
    if (typeof msg.content === "string") {
      return `${msg.role || "user"}: ${msg.content}`;
    }
    if (msg.content && typeof msg.content.text === "string") {
      return `${msg.role || "user"}: ${msg.content.text}`;
    }
    return "";
  }).join("\n\n");
}
function formatLaunchResponse(response, request, expiresMinutes) {
  const expiryTime = /* @__PURE__ */ new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + expiresMinutes);
  return [
    `Successfully launched a new ${request.type} workload!`,
    "",
    `Workload ID: ${response.workload}`,
    `Workload Key: ${response.workload_key}`,
    `Node: ${response.node}`,
    `Type: ${request.type}`,
    `Expires: in ${expiresMinutes} minutes (${expiryTime.toLocaleString()})`
  ].join("\n");
}
dotenv.config();
function isStopWorkloadContent(content) {
  logger.debug("Validating stop workload content:", content);
  if (!content.workload || typeof content.workload !== "string") {
    logger.debug("Invalid content: Missing or invalid workload ID");
    return false;
  }
  return true;
}
var stopWorkloadTemplate = ENHANCED_STOP_WORKLOAD_TEMPLATE;
var stopWorkloadAction = {
  /**
   * Action identifier
   */
  name: "STOP_WORKLOAD",
  /**
   * Alternative action names
   */
  similes: [
    "TERMINATE_WORKLOAD",
    "END_WORKLOAD",
    "SHUTDOWN_WORKLOAD",
    "STOP_GPU",
    "TERMINATE_GPU"
  ],
  /**
   * Validate action prerequisites
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @returns Whether the action can be executed
   */
  validate: async (runtime, _message) => {
    logger.debug("Validating STOP_WORKLOAD action");
    const apiKey = runtime.getSetting("COMPUT3AI_API_KEY") || process.env.COMPUT3AI_API_KEY;
    if (!apiKey) {
      logger.error("STOP_WORKLOAD validation failed: Missing API key");
      return false;
    }
    logger.debug("STOP_WORKLOAD validation successful");
    return true;
  },
  /**
   * Human-readable description of the action
   */
  description: "Stops a running GPU workload on Comput3AI",
  /**
   * Main action handler
   * 
   * @param runtime - ElizaOS agent runtime
   * @param message - Triggering message
   * @param state - State object
   * @param options - Additional options
   * @param callback - Callback for sending response
   * @returns Success status
   */
  handler: async (runtime, message, state, _options, callback) => {
    logger.info("Executing STOP_WORKLOAD action");
    try {
      logger.debug("Creating Comput3AI API client");
      const apiClient = createComput3ApiClient(runtime);
      logger.debug("Extracting stop parameters from message");
      let stopParams;
      logger.debug("Message content:", JSON.stringify(message.content, null, 2));
      if (message.content && typeof message.content === "object" && "workload" in message.content && typeof message.content.workload === "string") {
        stopParams = {
          workload: message.content.workload,
          ...message.content
        };
        logger.debug("Using directly provided workload ID:", stopParams.workload);
      } else if (message.content && typeof message.content === "object" && "text" in message.content && typeof message.content.text === "string") {
        logger.debug("Attempting to extract workload ID from text:", message.content.text);
        const extractedParams = validateStopWorkloadFromText(message.content.text);
        if (extractedParams) {
          logger.debug("Direct text extraction successful:", extractedParams);
          stopParams = extractedParams;
        } else {
          const prompt = composePrompt({
            template: stopWorkloadTemplate,
            state: { recentMessages: formatRecentMessages2(state) }
          });
          logger.debug("Extracting workload ID using LLM");
          const result = await runtime.useModel(ModelType.TEXT_SMALL, {
            prompt
          });
          logger.debug("LLM extraction result:", result);
          stopParams = parseJSONObjectFromText(result);
          if (!isStopWorkloadContent(stopParams)) {
            logger.error("LLM extraction failed to produce valid workload ID");
            callback({
              text: "Failed to identify a workload ID to stop. Please provide a specific workload ID like '7b69314d-c88d-47d9-920c-ae827f6b7844' or 'name-name-name-gpu.comput3.ai'.",
              content: {
                success: false,
                error: "Could not extract workload ID"
              }
            });
            return false;
          }
        }
      } else {
        const errorMessage = "No valid message content to extract workload ID from";
        logger.error(`STOP_WORKLOAD failed: ${errorMessage}`);
        callback({
          text: `Failed to stop workload: ${errorMessage}. Please specify a valid workload ID (either UUID format like "7b69314d-c88d-47d9-920c-ae827f6b7844" or domain format like "name-name-name-gpu.comput3.ai").`,
          content: {
            success: false,
            error: errorMessage
          }
        });
        return false;
      }
      if (!isStopWorkloadContent(stopParams)) {
        const errorMessage = ERROR_MESSAGES.INVALID_WORKLOAD_ID || "Invalid workload ID";
        logger.error(`STOP_WORKLOAD failed: ${errorMessage}`);
        callback({
          text: `Failed to stop workload: ${errorMessage}. Please specify a valid workload ID (either UUID format like "7b69314d-c88d-47d9-920c-ae827f6b7844" or domain format like "name-name-name-gpu.comput3.ai").`,
          content: {
            success: false,
            error: errorMessage
          }
        });
        return false;
      }
      const request = {
        workload: stopParams.workload
      };
      logger.debug("Stopping workload with ID:", stopParams.workload);
      logger.debug("Full stop request parameters:", request);
      callback({
        text: `Stopping your workload with ID '${stopParams.workload}' now...`,
        content: {
          processing: true,
          workload: stopParams.workload
        }
      });
      const response = await apiClient.stopWorkload(request);
      if (!response.success || !response.data) {
        const errorMessage = response.error || "Failed to stop workload";
        logger.error(`STOP_WORKLOAD failed: ${errorMessage}`);
        logger.debug("Full error response:", JSON.stringify(response, null, 2));
        let userMessage = `Failed to stop workload ${stopParams.workload}: ${errorMessage}`;
        if (response.statusCode === 502) {
          userMessage = `Failed to stop workload ${stopParams.workload}: Server error (502 Bad Gateway). The Comput3AI service is currently experiencing issues. Please try again later or contact Comput3AI support if the problem persists.`;
        }
        callback({
          text: userMessage,
          content: {
            success: false,
            error: errorMessage,
            statusCode: response.statusCode,
            workload: stopParams.workload
          }
        });
        return false;
      }
      const stopResponse = response.data;
      logger.info(`Successfully stopped workload: ${stopParams.workload}`);
      logger.debug("Stop response:", stopResponse);
      const formattedResponse = formatStopResponse(stopResponse, request);
      callback({
        text: formattedResponse,
        content: {
          success: true,
          data: stopResponse,
          request,
          workload: stopParams.workload
        }
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`STOP_WORKLOAD error: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        logger.debug(`Error stack: ${error.stack}`);
      }
      if (typeof error === "object" && error !== null) {
        try {
          logger.debug("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
          logger.debug("Could not stringify full error object");
        }
      }
      let userMessage = `Failed to stop workload: ${errorMessage}`;
      if (errorMessage.includes("502") || errorMessage.includes("Bad Gateway")) {
        userMessage = "Failed to stop workload: Server error (502 Bad Gateway). The Comput3AI service is currently experiencing issues. Please try again later or contact Comput3AI support if the problem persists.";
      }
      callback({
        text: userMessage,
        content: {
          success: false,
          error: errorMessage
        }
      });
      return false;
    }
  },
  /**
   * Example conversations for action usage
   */
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Stop my workload {{workload_id}}"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Stopping your workload with ID '{{workload_id}}' now...",
          actions: ["STOP_WORKLOAD"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Terminate the GPU instance {{workload_domain}}"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Terminating the workload with ID '{{workload_domain}}' now...",
          actions: ["STOP_WORKLOAD"]
        }
      }
    ]
  ]
};
function formatRecentMessages2(state) {
  const messages = state.messages || [];
  return messages.slice(-3).map((msg) => {
    if (typeof msg.content === "string") {
      return `${msg.role || "user"}: ${msg.content}`;
    }
    if (msg.content && typeof msg.content.text === "string") {
      return `${msg.role || "user"}: ${msg.content.text}`;
    }
    return "";
  }).join("\n\n");
}
function formatStopResponse(response, request) {
  const workloadId = request.workload;
  return [
    "Successfully stopped workload!",
    "",
    `Workload ID: ${workloadId}`,
    "Status: Stopped"
  ].join("\n");
}

// src/types/index.ts
function isWorkloadItem(item) {
  return typeof item === "object" && item !== null && typeof item.workload === "string" && typeof item.node === "string" && typeof item.running === "boolean";
}
function isWorkloadItemArray(items) {
  return Array.isArray(items) && (items.length === 0 || isWorkloadItem(items[0]));
}

// src/index.ts
dotenv.config();
var comput3aiPlugin = {
  /**
   * Initialize the plugin
   * 
   * @param config - Plugin configuration
   * @param runtime - ElizaOS agent runtime
   */
  init: async (config, runtime) => {
    logger.info("Initializing Comput3AI plugin");
    logger.debug("Comput3AI plugin config:", config);
    for (const varName of API_CONFIG.REQUIRED_ENV_VARS) {
      const value = runtime.getSetting(varName) || process.env[varName];
      if (!value) {
        logger.error(`Missing required environment variable: ${varName}`);
      } else {
        logger.debug(`Found environment variable: ${varName}`);
      }
    }
  },
  /**
   * Plugin metadata
   */
  name: "comput3ai",
  description: "Plugin for interacting with Comput3AI GPU services API",
  /**
   * Plugin components
   */
  actions: [
    getWorkloadTypesAction,
    getUserProfileAction,
    getUserBalanceAction,
    listWorkloadsAction,
    launchWorkloadAction,
    stopWorkloadAction
    // Will add more actions as they are implemented
  ],
  providers: [],
  evaluators: [],
  services: [],
  routes: []
};
var index_default = comput3aiPlugin;

export { actions_exports as actions, comput3aiPlugin, index_default as default, isWorkloadItem, isWorkloadItemArray };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map