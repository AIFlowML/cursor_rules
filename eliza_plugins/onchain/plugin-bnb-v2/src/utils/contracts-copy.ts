/**
 * Solidity Contract Compilation Utilities
 * 
 * This module provides utilities for compiling Solidity smart contracts
 * using the solc compiler. It handles imports from OpenZeppelin and local files.
 */
import { logger } from "@elizaos/core";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, "../../plugin-bnb/src/contracts");

/**
 * Interface for compilation output
 */
interface CompilationOutput {
  abi: Record<string, unknown>[];
  bytecode: string;
}

/**
 * Interface for solc compiler error
 */
interface SolcError {
  type: string;
  message: string;
  component?: string;
  severity?: string;
}

/**
 * Interface for compiler output
 */
interface SolcOutput {
  errors?: SolcError[];
  contracts: {
    [file: string]: {
      [contract: string]: {
        abi: Record<string, unknown>[];
        evm: {
          bytecode: {
            object: string;
          };
        };
      };
    };
  };
}

/**
 * Reads contract source code from file
 * 
 * @param contractPath - Path to the contract file
 * @returns Contract source code as string
 */
function getContractSource(contractPath: string): string {
  logger.debug(`Reading contract source from ${contractPath}`);
  return fs.readFileSync(contractPath, "utf8");
}

/**
 * Import callback for solc compiler
 * Handles imports from OpenZeppelin and local files
 * 
 * @param importPath - Path to the imported file
 * @returns Object containing file contents or error
 */
function findImports(importPath: string): { contents: string } | { error: string } {
  try {
    logger.debug(`Resolving import: ${importPath}`);
    
    if (importPath.startsWith("@openzeppelin/")) {
      const modPath = require.resolve(importPath);
      return { contents: fs.readFileSync(modPath, "utf8") };
    }

    const localPath = path.resolve("./contracts", importPath);
    if (fs.existsSync(localPath)) {
      return { contents: fs.readFileSync(localPath, "utf8") };
    }
    return { error: "File not found" };
  } catch {
    return { error: `File not found: ${importPath}` };
  }
}

/**
 * Compiles a Solidity contract
 * 
 * @param contractFileName - Name of the contract file without the .sol extension
 * @returns Promise that resolves to the compilation output containing ABI and bytecode
 * @throws Error if compilation fails
 */
export async function compileSolidity(contractFileName: string): Promise<CompilationOutput> {
  const contractPath = path.join(baseDir, `${contractFileName}.sol`);
  logger.debug(`Compiling contract from path: ${contractPath}`);
  
  const source = getContractSource(contractPath);

  const input = {
    language: "Solidity",
    sources: {
      [contractFileName]: {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  logger.debug("Compiling contract...");

  try {
    // Use solc.compile instead of direct call
    // @ts-ignore - solc.compile exists at runtime but TypeScript doesn't recognize it
    const outputString = solc.compile(JSON.stringify(input), { import: findImports });
    const output = JSON.parse(outputString) as SolcOutput;

    if (output.errors) {
      const hasError = output.errors.some(
        (error: SolcError) => error.type === "Error"
      );
      if (hasError) {
        throw new Error(
          `Compilation errors: ${JSON.stringify(output.errors, null, 2)}`
        );
      }
      logger.warn("Compilation warnings:", output.errors);
    }

    const contractName = path.basename(contractFileName, ".sol");
    const contract = output.contracts?.[contractFileName]?.[contractName];

    if (!contract) {
      throw new Error("Contract compilation result is empty");
    }

    logger.debug("Contract compiled successfully");
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Compilation failed:", error.message);
    } else {
      logger.error("Compilation failed with unknown error");
    }
    throw error;
  }
}
