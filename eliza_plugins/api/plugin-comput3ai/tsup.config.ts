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
  // Add minification and tree shaking for production
  minify: process.env.NODE_ENV === 'production',
  treeshake: true,
}); 