/**
 * Type declarations for the solc Solidity compiler
 */
declare module 'solc' {
  /**
   * Compiles Solidity source code
   * 
   * @param input - JSON string containing source code and compiler settings
   * @param options - Compiler options including import resolver
   * @returns JSON string with compilation results
   */
  function compile(
    input: string, 
    options: { 
      import: (path: string) => { contents: string } | { error: string } 
    }
  ): string;
  
  export = compile;
} 