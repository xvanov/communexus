// Authentication Flow Tests
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

import { AuthScreen } from '../pages/AuthScreen.js';
import { ChatListScreen } from '../pages/ChatListScreen.js';
import { TestHelpers } from '../helpers/TestHelpers.js';

describe('Authentication Flow Tests', () => {
    let authScreen: AuthScreen;
    let chatListScreen: ChatListScreen;
    let testUsers: any;

    before(async () => {
        // Initialize page objects
        authScreen = new AuthScreen();
        chatListScreen = new ChatListScreen();
        testUsers = TestHelpers.getTestUsers();

        // Validate test environment
        await TestHelpers.validateTestEnvironment();
        
        // Wait for Firebase emulator
        await TestHelpers.waitForFirebaseEmulator();
    });

    beforeEach(async () => {
        // Reset app state before each test
        await TestHelpers.resetApp();
        
        // Wait for auth screen to load
        await TestHelpers.waitForElement('~email-input');
    });

    afterEach(async () => {
        // Take screenshot on test failure
        if (browser.config.framework === 'mocha' && this.currentTest?.state === 'failed') {
            await TestHelpers.takeScreenshot(`auth-test-failed-${this.currentTest.title}`);
        }
    });

    after(async () => {
        // Cleanup test data
        await TestHelpers.cleanupTestData();
    });

    describe('Sign In Flow', () => {
        it('should display authentication screen', async () => {
            // Verify auth screen is displayed
            expect(await authScreen.isDisplayed()).toBe(true);
            
            // Verify sign in button is enabled
            expect(await authScreen.isSignInButtonEnabled()).toBe(true);
        });

        it('should sign in with valid credentials', async () => {
            // Sign in with test user credentials
            await authScreen.signInWithCredentials(
                testUsers.user1.email,
                testUsers.user1.password
            );

            // Verify navigation to chat list screen
            await TestHelpers.waitForElement('~chat-list-title');
            expect(await chatListScreen.isDisplayed()).toBe(true);
        });

        it('should sign in as test user', async () => {
            // Sign in as test user
            await authScreen.signInAsTestUser();

            // Verify navigation to chat list screen
            await TestHelpers.waitForElement('~chat-list-title');
            expect(await chatListScreen.isDisplayed()).toBe(true);
        });

        it('should show error for invalid credentials', async () => {
            // Attempt to sign in with invalid credentials
            await authScreen.signInWithCredentials('invalid@test.com', 'wrongpassword');

            // Verify error message is displayed
            await authScreen.waitForErrorMessage();
            const errorMessage = await authScreen.getErrorMessage();
            expect(errorMessage).toContain('error');
        });

        it('should validate email format', async () => {
            // Enter invalid email format
            await authScreen.enterEmail('invalid-email');
            await authScreen.enterPassword('password123');
            
            // Verify sign in button is disabled or shows validation error
            const isEnabled = await authScreen.isSignInButtonEnabled();
            expect(isEnabled).toBe(false);
        });
    });

    describe('Sign Up Flow', () => {
        it('should navigate to sign up', async () => {
            // Tap sign up button
            await authScreen.tapSignUp();

            // Verify sign up form is displayed
            await TestHelpers.waitForElement('~sign-up-form');
        });
    });

    describe('Cross-Platform Consistency', () => {
        it('should have consistent UI elements across platforms', async () => {
            const deviceInfo = await TestHelpers.getDeviceInfo();
            
            // Verify core elements are present regardless of platform
            expect(await authScreen.isDisplayed()).toBe(true);
            
            // Take screenshot for visual comparison
            await TestHelpers.takeScreenshot(`auth-screen-${deviceInfo.platformName}`);
        });
    });
});


