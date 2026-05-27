import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Automatically reset after each test
    mockReset: true,
    // Only run TypeScript test sources, never compiled output under dist.
    // (Vitest 4's default exclude no longer covers dist.)
    include: ['packages/*/src/**/*.test.ts'],
  },
})
