/**
 * Greenfield bucket listing template
 * 
 * This template is used by the GET_BUCKETS_BNB action to extract
 * parameters from user messages related to bucket listing requests.
 */
export const getBucketTemplate = {
  name: "getBucket",
  description: "Get a list of all Greenfield buckets owned by an address",
  inputVariables: ["chain"],
  outputFormat: {
    address: "string",
    includeDetails: "boolean"
  },
  examples: [
    {
      input: "List all my buckets on Greenfield",
      output: {
        address: null,
        includeDetails: true
      }
    },
    {
      input: "Show me my Greenfield buckets",
      output: {
        address: null,
        includeDetails: true
      }
    },
    {
      input: "What buckets do I have on the Greenfield network?",
      output: {
        address: null,
        includeDetails: true
      }
    },
    {
      input: "List all buckets for address 0x1234567890abcdef1234567890abcdef12345678",
      output: {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        includeDetails: true
      }
    }
  ]
}; 