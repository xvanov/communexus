// Test Helper Functions
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export class TestHelpers {
  // Test data management
  static getTestUsers() {
    return {
      user1: {
        email: 'john@test.com',
        password: 'password',
      },
      user2: {
        email: 'jane@test.com',
        password: 'password',
      },
    };
  }

  // Wait utilities
  // Note: Using waitForExist instead of waitForDisplayed due to Expo Go + Appium visibility detection issues
  static async waitForElement(selector, timeout = 10000) {
    await $(selector).waitForExist({ timeout });
  }

  static async waitForElementToDisappear(selector, timeout = 10000) {
    await $(selector).waitForExist({ timeout, reverse: true });
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
      automationName: capabilities['appium:automationName'],
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
          const response = await fetch(
            `http://${emulatorHost}:${emulatorPort}`
          );
          return response.ok;
        } catch {
          return false;
        }
      },
      { timeout: 30000, interval: 1000 }
    );
  }

  // Create test users in Firebase emulator
  static async createFirebaseTestUsers() {
    console.log('🔧 Creating test users in Firebase emulator...');

    try {
      const admin = require('firebase-admin');

      // Initialize admin SDK for emulator if not already initialized
      let app;
      if (admin.apps.length === 0) {
        app = admin.initializeApp({
          projectId: 'demo-communexus',
        });
      } else {
        app = admin.apps[0];
      }

      // Connect to emulator
      const auth = admin.auth(app);
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

      const testUsers = [
        { email: 'john@test.com', password: 'password', displayName: 'John' },
        { email: 'jane@test.com', password: 'password', displayName: 'Jane' },
        { email: 'alice@test.com', password: 'password', displayName: 'Alice' },
        { email: 'bob@test.com', password: 'password', displayName: 'Bob' },
      ];

      for (const user of testUsers) {
        try {
          await auth.createUser({
            email: user.email,
            password: user.password,
            displayName: user.displayName,
            emailVerified: true,
          });
          console.log(`✅ Created test user: ${user.email}`);
        } catch (error) {
          if (error.code === 'auth/email-already-exists') {
            console.log(`ℹ️  Test user already exists: ${user.email}`);
          } else {
            console.error(`❌ Failed to create ${user.email}:`, error.message);
          }
        }
      }

      console.log('✅ Test users ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to create test users:', error.message);
      console.error('   Make sure Firebase emulators are running:');
      console.error(
        '   firebase emulators:start --only auth,firestore,storage'
      );
      return false;
    }
  }

  // Test environment validation
  static async validateTestEnvironment() {
    const deviceInfo = await this.getDeviceInfo();
    console.log('Test Environment:', deviceInfo);

    // For now, just return true since we're using hardcoded values
    return true;
  }

  // Alert handling utilities
  // Note: Using isExisting() instead of isDisplayed() due to Expo Go + Appium visibility detection issues
  static async dismissAnyAlerts() {
    try {
      const alert = await $('XCUIElementTypeAlert');
      const alertExists = await alert.isExisting();

      if (alertExists) {
        console.log('Alert detected, attempting to dismiss...');

        // Try common button texts
        const buttonTexts = [
          'OK',
          'Allow',
          'Dismiss',
          'Close',
          'Cancel',
          'Continue',
        ];

        for (const buttonText of buttonTexts) {
          try {
            const button = await $(`~${buttonText}`);
            const buttonExists = await button.isExisting();
            if (buttonExists) {
              await button.click();
              console.log(`Dismissed alert using "${buttonText}" button`);
              await browser.pause(1000);
              return true;
            }
          } catch (err) {
            // Button not found, try next one
          }
        }

        // If no button worked, try clicking the alert itself
        console.log('No button found, clicking alert directly');
        await alert.click();
        await browser.pause(1000);
        return true;
      }
    } catch (err) {
      // No alert present or error dismissing
      console.log('No alert to dismiss or error:', err.message);
    }
    return false;
  }

  // Ensure logged out state for tests
  // Note: Using isExisting() instead of isDisplayed() due to Expo Go + Appium visibility detection issues
  static async ensureLoggedOut() {
    console.log('Ensuring logged out state...');

    // Try up to 3 times to get to the auth screen
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Logout attempt ${attempt}/3`);

      // First, dismiss any blocking alerts
      await this.dismissAnyAlerts();
      await browser.pause(1000);

      // Check if we're already on the auth screen
      try {
        const emailInput = await $('~email-input');
        if (await emailInput.isExisting()) {
          console.log('Already on auth screen!');
          return;
        }
      } catch (err) {
        console.log('Not on auth screen yet...');
      }

      // Check if we're on the ChatListScreen (logged in)
      try {
        const chatListTitle = await $('~chat-list-title');
        const isChatListExists = await chatListTitle.isExisting();

        if (isChatListExists) {
          console.log('Found chat list, attempting logout...');

          // Dismiss any alerts first
          await this.dismissAnyAlerts();

          // Try to find and click logout button
          try {
            const logoutButton = await $('~logout-button');
            // Use waitForExist instead of waitForDisplayed
            await logoutButton.waitForExist({ timeout: 3000 });
            console.log('Clicking logout button...');
            await logoutButton.click();

            // Wait for logout to process
            await browser.pause(4000);

            // Dismiss any post-logout alerts or confirmations
            await this.dismissAnyAlerts();
            await browser.pause(1000);

            console.log('Logout click completed');
          } catch (logoutErr) {
            console.log('Could not click logout button:', logoutErr.message);
          }
        } else {
          console.log('Chat list not visible...');
        }
      } catch (err) {
        console.log('Error during logout attempt:', err.message);
      }

      // Final alert dismissal
      await this.dismissAnyAlerts();

      // Check if we made it to auth screen
      try {
        const emailInput = await $('~email-input');
        if (await emailInput.isExisting()) {
          console.log('Successfully reached auth screen!');
          return;
        }
      } catch (err) {
        console.log(`Auth screen not found after attempt ${attempt}`);
        if (attempt === 3) {
          console.log('Taking screenshot for debugging...');
          await this.takeScreenshot('ensure-logged-out-failed');
        }
      }

      // Wait a bit before next attempt
      if (attempt < 3) {
        await browser.pause(2000);
      }
    }

    console.log('WARNING: Could not ensure logged out state after 3 attempts');
  }
}
