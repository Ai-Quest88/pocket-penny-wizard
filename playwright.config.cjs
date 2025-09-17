const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
    headless: false,
    actionTimeout: 10000,
    navigationTimeout: 10000,
    // Use installed Chrome browser
    channel: 'chrome',
  },
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  // Add TypeScript support
  projects: [
    {
      name: 'chromium',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        channel: 'chrome',
        headless: false,
      },
    },
  ],
});
