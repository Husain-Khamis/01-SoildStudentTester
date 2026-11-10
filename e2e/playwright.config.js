const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: '.',
  timeout: 180_000,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: process.env.BASE_URL || 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
