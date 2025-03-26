import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Automatically reset after each test
    mockReset: true,
  },
})
