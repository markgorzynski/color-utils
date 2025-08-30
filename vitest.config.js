import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test configuration
    globals: true,
    environment: 'node',
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        'legacy/**',
        'docs/**',
        'examples/**',
        '*.config.js',
        'src/types.js' // Type definitions don't need testing
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95
      }
    },
    
    // Test file patterns
    include: ['tests/**/*.test.js'],
    
    // Exclude patterns
    exclude: ['node_modules', 'legacy', 'docs'],
    
    // Timeout for tests
    testTimeout: 10000,
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Watch mode configuration
    watchExclude: ['node_modules/**', 'legacy/**', 'docs/**']
  }
});