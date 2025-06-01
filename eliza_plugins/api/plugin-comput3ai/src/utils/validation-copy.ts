/**
 * Validation Utilities for Comput3AI Plugin
 * 
 * This file contains helper functions for validating and extracting information from user messages.
 */
import { logger } from "@elizaos/core";
import type { WorkloadType } from "../types";

/**
 * Known workload types with regex patterns to match them in natural language
 */
export const WORKLOAD_TYPE_PATTERNS: Record<WorkloadType, RegExp[]> = {
  "media:fast": [
    /media:fast/i,
    /media fast/i,
    /fast media/i,
    /media.*fast/i,
  ],
  "ollama_webui:coder": [
    /ollama_webui:coder/i,
    /ollama webui:coder/i,
    /ollama webui coder/i,
    /ollama.*coder/i,
    /coder workload/i,
    /coding workload/i,
    /workload.*coding/i,
    /workload.*code/i,
  ],
  "ollama_webui:fast": [
    /ollama_webui:fast/i,
    /ollama webui:fast/i,
    /ollama webui fast/i,
    /ollama.*fast/i,
    /ollama fast/i,
    /fast ollama/i,
  ],
  "ollama_webui:large": [
    /ollama_webui:large/i,
    /ollama webui:large/i,
    /ollama webui large/i,
    /ollama.*large/i,
    /large ollama/i,
    /ollama large/i,
  ],
  "llama_webui:coder": [
    /llama_webui:coder/i,
    /llama webui:coder/i, 
    /llama webui coder/i,
    /llama.*coder/i,
    /llama coder/i,
  ],
};

/**
 * Enhanced prompt template for extracting launch workload parameters
 * Includes specific examples and mentions of known workload types
 */
export const ENHANCED_LAUNCH_WORKLOAD_TEMPLATE = `Analyze the most recent user message to extract information about launching a GPU workload on Comput3AI. 
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

/**
 * Enhanced prompt template for extracting stop workload parameters
 * Includes specific examples focusing on extracting workload IDs, including UUIDs and domain formats
 */
export const ENHANCED_STOP_WORKLOAD_TEMPLATE = `Analyze the most recent user message to extract information about stopping a GPU workload on Comput3AI.
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

/**
 * Extract workload type from text using pattern matching
 * 
 * @param text - Text to analyze
 * @returns Extracted workload type or null if not found
 */
export function extractWorkloadType(text: string): WorkloadType | null {
  if (!text) return null;
  
  // Direct match for exact workload type
  for (const [type, patterns] of Object.entries(WORKLOAD_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        logger.debug(`Matched workload type '${type}' using pattern ${pattern}`);
        return type as WorkloadType;
      }
    }
  }
  
  // Context-based inference for less specific mentions
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

/**
 * Extract expiration time in minutes from text
 * 
 * @param text - Text to analyze
 * @param defaultMinutes - Default minutes to use if not specified
 * @returns Extracted expiration time in minutes (NOT converted to timestamp)
 */
export function extractExpirationTime(text: string, defaultMinutes = 10): number {
  if (!text) return defaultMinutes;
  
  // Match patterns like "expires in X minutes", "for X minutes", "X min", etc.
  const expirationPatterns = [
    /expires? in (\d+)\s*min(ute)?s?/i,
    /for (\d+)\s*min(ute)?s?/i,
    /(\d+)\s*min(ute)?s? expir/i,
    /(\d+)\s*min(ute)?s?/i,
    /(\d+)\s*hours?/i,
  ];
  
  for (const pattern of expirationPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number.parseInt(match[1], 10);
      
      // Convert hours to minutes if needed
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

/**
 * Extract workload ID from text
 * 
 * @param text - Text to analyze
 * @returns Extracted workload ID or null if not found
 */
export function extractWorkloadId(text: string): string | null {
  if (!text) return null;
  
  // Match patterns for typical Comput3 workload IDs
  
  // First try to extract UUIDs (e.g., 7b69314d-c88d-47d9-920c-ae827f6b7844)
  const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const uuidMatch = text.match(uuidPattern);
  if (uuidMatch?.[1]) {
    logger.debug(`Extracted workload ID from UUID pattern: ${uuidMatch[1]}`);
    return uuidMatch[1];
  }
  
  // Next try to extract strings ending with .comput3.ai
  const comput3DomainPattern = /([a-zA-Z0-9-]+\.comput3\.ai)/i;
  const domainMatch = text.match(comput3DomainPattern);
  if (domainMatch?.[1]) {
    logger.debug(`Extracted workload ID from domain pattern: ${domainMatch[1]}`);
    return domainMatch[1];
  }
  
  // Look for workload ID patterns (hyphenated strings or wrk_ prefixed IDs)
  const workloadPatterns = [
    /wrk_([a-zA-Z0-9]+)/i,
    /workload[:\s]+([a-zA-Z0-9-_]+)/i,
    /([a-zA-Z]+-[a-zA-Z]+-[a-zA-Z]+-[a-zA-Z]+)/i,
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

/**
 * Enhanced validation for launch workload content
 * 
 * @param text - User message text
 * @returns Validated launch parameters or null if invalid
 */
export function validateLaunchWorkloadFromText(text: string): { type: WorkloadType; expires: number } | null {
  const type = extractWorkloadType(text);
  
  if (!type) {
    logger.debug("Failed to extract valid workload type from text");
    return null;
  }
  
  const expires = extractExpirationTime(text);
  
  return { type, expires };
}

/**
 * Enhanced validation for stop workload content
 * 
 * @param text - User message text
 * @returns Validated stop parameters or null if invalid
 */
export function validateStopWorkloadFromText(text: string): { workload: string } | null {
  const workload = extractWorkloadId(text);
  
  if (!workload) {
    logger.debug("Failed to extract valid workload ID from text");
    return null;
  }
  
  return { workload };
}
