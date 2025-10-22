// Test Helper Functions
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export class TestHelpers {
    // Test data management
    static getTestUsers() {
        return {
            user1: {
                email: 'john@test.com',
                password: 'password'
            },
            user2: {
                email: 'jane@test.com',
                password: 'password'
            }
        };
    }

    // Wait utilities
    static async waitForElement(selector, timeout = 10000) {
        await $(selector).waitForDisplayed({ timeout });
    }

    static async waitForElementToDisappear(selector, timeout = 10000) {
        await $(selector).waitForDisplayed({ timeout, reverse: true });
    }

    static async waitForText(selector, text, timeout = 10000) {
        await browser.waitUntil(
            async () => (await $(selector).getText()) === text,
            { timeout }
        );
    }

    // Screenshot utilities
    static async takeScreenshot(name) {
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
        // For Expo Go, we can't reset the app, so we'll just wait a moment
        // In a real app, you might use browser.resetApp()
        await browser.pause(1000);
    }

    static async terminateApp() {
        // For Expo Go, we can't terminate the app
        await browser.pause(1000);
    }

    static async activateApp() {
        // For Expo Go, we can't activate the app
        await browser.pause(1000);
    }

    // Network utilities
    static async setNetworkConnection(type) {
        await browser.setNetworkConnection(type);
    }

    // Orientation utilities
    static async setOrientation(orientation) {
        await browser.setOrientation(orientation);
    }

    // Timeout utilities
    static async waitWithTimeout(ms) {
        await browser.pause(ms);
    }

    // Error handling utilities
    static async handleTestError(error, testName) {
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
        
        // For now, just return true since we're using hardcoded values
        return true;
    }
}


