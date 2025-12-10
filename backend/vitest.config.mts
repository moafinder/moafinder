import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // Run test files sequentially to avoid MongoDB lock contention
    // Each test file uses the same database and they conflict when running in parallel
    fileParallelism: false,
    // Pool options for better isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Retry transient failures (e.g., MongoDB lock timeouts)
    retry: 1,
    // Increase test timeout for database operations
    testTimeout: 30000,
  },
})
