const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', timeout: 90000, workers: 1,
  use: { baseURL: 'http://localhost:4173', channel: 'chrome', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node serve.cjs', url: 'http://localhost:4173', reuseExistingServer: true },
});
