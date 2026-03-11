const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:3335',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx serve -l 3335',
    port: 3335,
    reuseExistingServer: !process.env.CI,
  },
});
