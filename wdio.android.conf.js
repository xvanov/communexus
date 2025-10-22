// WebDriverIO Configuration for Android Testing
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export const config = {
    // Test runner configuration
    runner: 'local',
    
    // Appium server configuration
    hostname: 'localhost',
    port: 4723,
    path: '/',
    
    // Test specs
    specs: [
        './tests/e2e/**/*.test.js'
    ],
    
    // Maximum number of concurrent workers
    maxInstances: 1,
    
    // Android capabilities only
    capabilities: [
        {
            platformName: 'Android',
            'appium:platformVersion': '14.0',
            'appium:deviceName': 'Pixel 7',
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': 'com.communexus.communexus',
            'appium:newCommandTimeout': 300,
            'appium:commandTimeouts': 300,
        }
    ],
    
    // Test framework configuration
    framework: 'mocha',
    
    // Mocha options
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        retries: 1
    },
    
    // Reporter configuration
    reporters: [
        'spec'
    ],
    
    // Global test timeout
    timeout: 60000,
    
    // Retry configuration
    retries: 1,
    
    // Log level
    logLevel: 'info',
    
    // Wait timeout
    waitforTimeout: 10000,
    
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
        FIREBASE_EMULATOR_PORT: '8080'
    }
};
