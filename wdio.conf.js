// WebDriverIO Configuration for Communexus Mobile App Testing
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

import { join } from 'node:path';

export const config = {
    // Test runner configuration
    runner: 'local',
    
    // Test specs
    specs: [
        './tests/e2e/**/*.test.js'
    ],
    
    // Exclude patterns
    exclude: [
        // Add patterns to exclude tests
    ],
    
    // Maximum number of concurrent workers
    maxInstances: 1,
    
    // Capabilities for different platforms
    capabilities: [
        {
            // iOS capabilities
            platformName: 'iOS',
            'appium:platformVersion': '17.0',
            'appium:deviceName': 'iPhone 15',
            'appium:automationName': 'XCUITest',
            'appium:app': join(process.cwd(), 'ios/build/Build/Products/Debug-iphonesimulator/Communexus.app'),
            'appium:newCommandTimeout': 300,
            'appium:commandTimeouts': 300,
        },
        {
            // Android capabilities
            platformName: 'Android',
            'appium:platformVersion': '14.0',
            'appium:deviceName': 'Pixel 7',
            'appium:automationName': 'UiAutomator2',
            'appium:app': join(process.cwd(), 'android/app/build/outputs/apk/debug/app-debug.apk'),
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
        'spec',
        ['junit', {
            outputDir: './test-results',
            outputFileFormat: function(options) {
                return `results-${options.cid}.xml`;
            }
        }]
    ],
    
    // Hooks
    beforeSession: function (config, capabilities, specs, cid) {
        console.log(`Starting test session ${cid} for ${capabilities.platformName}`);
    },
    
    before: function (capabilities, specs) {
        console.log(`Starting test on ${capabilities.platformName} ${capabilities['appium:deviceName']}`);
    },
    
    after: function (result, capabilities, specs) {
        console.log(`Test completed on ${capabilities.platformName}`);
    },
    
    afterSession: function (config, capabilities, specs, cid) {
        console.log(`Test session ${cid} completed`);
    },
    
    // Global test timeout
    timeout: 60000,
    
    // Retry configuration
    retries: 1,
    
    // Log level
    logLevel: 'info',
    
    // Base URL (not applicable for mobile apps)
    baseUrl: '',
    
    // Wait timeout
    waitforTimeout: 10000,
    
    // Connection retry timeout
    connectionRetryTimeout: 120000,
    
    // Connection retry count
    connectionRetryCount: 3,
    
    // Services
    services: [
        // Add services as needed
    ],
    
    // Test environment variables
    env: {
        TEST_USER_EMAIL: 'a@test.com',
        TEST_USER_PASSWORD: 'testpassword123',
        TEST_USER_EMAIL_2: 'b@test.com',
        TEST_USER_PASSWORD_2: 'testpassword123',
        FIREBASE_EMULATOR_HOST: 'localhost',
        FIREBASE_EMULATOR_PORT: '8080'
    }
};


