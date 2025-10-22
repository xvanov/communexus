// Test Helper Functions
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export class TestHelpers {
    // Test data management
    static getTestUsers() {
        return {
            user1: {
                email: process.env.TEST_USER_EMAIL || 'a@test.com',
                password: process.env.TEST_USER_PASSWORD || 'testpassword123'
            },
            user2: {
                email: process.env.TEST_USER_EMAIL_2 || 'b@test.com',
                password: process.env.TEST_USER_PASSWORD_2 || 'testpassword123'
            }
        };
    }

    // Wait utilities
    static async waitForElement(selector: string, timeout: number = 10000) {
        await $(selector).waitForDisplayed({ timeout });
    }

    static async waitForElementToDisappear(selector: string, timeout: number = 10000) {
        await $(selector).waitForDisplayed({ timeout, reverse: true });
    }

    static async waitForText(selector: string, text: string, timeout: number = 10000) {
        await browser.waitUntil(
            async () => (await $(selector).getText()) === text,
            { timeout }
        );
    }

    // Screenshot utilities
    static async takeScreenshot(name: string) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot-${name}-${timestamp}.png`;
        await browser.saveScreenshot(`./test-results/screenshots/${filename}`);
        return filename;
    }

    // Device utilities
    static async getDeviceInfo() {
        const capabilities = browser.capabilities;
        return {
            platformName: capabilities.platformName,
            platformVersion: capabilities['appium:platformVersion'],
            deviceName: capabilities['appium:deviceName'],
            automationName: capabilities['appium:automationName']
        };
    }

    // App state utilities
    static async resetApp() {
        await browser.resetApp();
    }

    static async terminateApp() {
        await browser.terminateApp();
    }

    static async activateApp() {
        await browser.activateApp();
    }

    // Network utilities
    static async setNetworkConnection(type: 'wifi' | 'cellular' | 'none') {
        await browser.setNetworkConnection(type);
    }

    // Orientation utilities
    static async setOrientation(orientation: 'portrait' | 'landscape') {
        await browser.setOrientation(orientation);
    }

    // Timeout utilities
    static async waitWithTimeout(ms: number) {
        await browser.pause(ms);
    }

    // Error handling utilities
    static async handleTestError(error: Error, testName: string) {
        console.error(`Test ${testName} failed:`, error.message);
        await this.takeScreenshot(`error-${testName}`);
        throw error;
    }

    // Cleanup utilities
    static async cleanupTestData() {
        // Add cleanup logic for test data
        console.log('Cleaning up test data...');
    }

    // Firebase emulator utilities
    static async waitForFirebaseEmulator() {
        const emulatorHost = process.env.FIREBASE_EMULATOR_HOST || 'localhost';
        const emulatorPort = process.env.FIREBASE_EMULATOR_PORT || '8080';
        
        // Wait for Firebase emulator to be ready
        await browser.waitUntil(
            async () => {
                try {
                    // Try to ping the emulator
                    const response = await fetch(`http://${emulatorHost}:${emulatorPort}`);
                    return response.ok;
                } catch {
                    return false;
                }
            },
            { timeout: 30000, interval: 1000 }
        );
    }

    // Test environment validation
    static async validateTestEnvironment() {
        const deviceInfo = await this.getDeviceInfo();
        console.log('Test Environment:', deviceInfo);
        
        // Validate required environment variables
        const requiredEnvVars = ['TEST_USER_EMAIL', 'TEST_USER_PASSWORD'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Required environment variable ${envVar} is not set`);
            }
        }
        
        return true;
    }
}


