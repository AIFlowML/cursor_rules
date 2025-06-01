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
    // BNB-specific dependencies
    '@bnb-chain/greenfield-cosmos-types',
    '@bnb-chain/greenfield-js-sdk',
    '@lifi/data-types',
    '@lifi/sdk',
    '@lifi/types',
    '@openzeppelin/contracts',
    '@solana/web3.js',
    '@web3-name-sdk/core',
    'chalk',
    'cli-table3',
    'mime-types',
    'ora',
    'solc',
    'viem',
    'ws',
  ],
  // Add minification and tree shaking for production
  minify: process.env.NODE_ENV === 'production',
  treeshake: true,
}); 