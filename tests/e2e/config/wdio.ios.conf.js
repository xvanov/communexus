// WebDriverIO Configuration for iOS Testing
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export const config = {
  // Test runner configuration
  runner: 'local',

  // Appium server configuration
  hostname: 'localhost',
  port: 4723,
  path: '/',

  // Test specs
  specs: ['./tests/e2e/**/*.test.js'],

  // Maximum number of concurrent workers
  maxInstances: 1,

  // iOS capabilities - Development Build configuration
  capabilities: [
    {
      platformName: 'iOS',
      'appium:platformVersion': '17.5',
      'appium:deviceName': 'iPhone 15',
      'appium:automationName': 'XCUITest',
      'appium:bundleId': 'com.communexus.communexus',
      'appium:newCommandTimeout': 300,
      'appium:commandTimeouts': 300,
      // Keep app running for speed - reset only between test FILES
      'appium:noReset': true,
      'appium:fullReset': false,
      // Auto-dismiss system alerts
      'appium:autoAcceptAlerts': true,
      // Wait for app to be ready
      'appium:waitForIdleTimeout': 5000,
    },
  ],

  // Test framework configuration
  framework: 'mocha',

  // Mocha options
  mochaOpts: {
    ui: 'bdd',
    timeout: 30000, // Reduced from 60s for faster feedback
    retries: 0, // No retries for speed
  },

  // Reporter configuration
  reporters: ['spec'],

  // Global test timeout
  timeout: 60000,

  // Retry configuration (0 for faster feedback)
  retries: 0,

  // Log level
  logLevel: 'info',

  // Wait timeout (reduced for speed)
  waitforTimeout: 5000,

  // Connection retry timeout
  connectionRetryTimeout: 120000,

  // Connection retry count
  connectionRetryCount: 3,

  // Test environment variables
  env: {
    TEST_USER_EMAIL: 'john@test.com',
    TEST_USER_PASSWORD: 'password',
    TEST_USER_EMAIL_2: 'jane@test.com',
    TEST_USER_PASSWORD_2: 'password',
    FIREBASE_EMULATOR_HOST: 'localhost',
    FIREBASE_EMULATOR_PORT: '8080',
  },
};
