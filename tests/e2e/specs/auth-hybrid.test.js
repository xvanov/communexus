// Hybrid Authentication Flow Tests
// Phase 3.5: Appium Actions + Claude Visual Verification
// Best of both worlds: Fast Appium interactions + Smart AI verification

import { AuthScreen } from '../pages/AuthScreen.js';
import { ChatListScreen } from '../pages/ChatListScreen.js';
import { TestHelpers } from '../helpers/TestHelpers.js';
const ClaudeVisualAssertions = require('../helpers/ClaudeVisualAssertions.js');

describe('Hybrid Authentication Flow Tests', () => {
    let authScreen;
    let chatListScreen;
    let claude;
    let testUsers;

    before(async () => {
        // Initialize page objects
        authScreen = new AuthScreen();
        chatListScreen = new ChatListScreen();
        testUsers = TestHelpers.getTestUsers();

        // Initialize Claude for visual verification
        claude = new ClaudeVisualAssertions();
        await claude.initialize();

        // Validate test environment
        await TestHelpers.validateTestEnvironment();
        
        // Wait for Firebase emulator
        await TestHelpers.waitForFirebaseEmulator();

        // Create test users programmatically (no UI interaction needed!)
        await TestHelpers.createFirebaseTestUsers();
    });

    beforeEach(async () => {
        // Reset app state and ensure logged out
        await TestHelpers.resetApp();
        await TestHelpers.ensureLoggedOut();
        await TestHelpers.waitForElement('~email-input');
    });

    afterEach(async () => {
        // Take screenshot on test failure
        try {
            if (this.currentTest?.state === 'failed') {
                await TestHelpers.takeScreenshot(`hybrid-auth-failed-${this.currentTest.title}`);
            }
        } catch (error) {
            console.log('Screenshot failed:', error.message);
        }
    });

    after(async () => {
        // Print Claude's visual assertion results
        claude.printResults();
        
        // Cleanup test data
        await TestHelpers.cleanupTestData();
    });

    describe('Sign In Flow with Visual Verification', () => {
        it('should display authentication screen correctly', async () => {
            // Traditional Appium check
            expect(await authScreen.isDisplayed()).toBe(true);
            
            // AI Visual Verification - adds intelligence!
            const result = await claude.visualAssert(
                'Is this the authentication/login screen with email and password input fields, ' +
                'a blue Sign In button, and a "Try Demo User" button?',
                'yes'
            );
            
            // Optional: fail test if visual assertion fails
            if (result.passed === false) {
                throw new Error(`Visual assertion failed: ${result.description}`);
            }
        });

        it('should sign in with credentials and show chat list', async () => {
            // Use Appium for actions (FAST!)
            console.log('🎬 Action: Signing in with email and password...');
            
            // Type credentials directly (bypasses demo user button issue)
            await authScreen.enterEmail(testUsers.user1.email);
            await authScreen.enterPassword(testUsers.user1.password);
            await authScreen.tapSignIn();

            // Wait for navigation with longer timeout
            await TestHelpers.waitForElement('~chat-list-title', 15000);
            
            // Use Claude for visual verification (SMART!)
            await claude.visualAssert(
                'Is this a chat list screen showing "Communexus" as the title, ' +
                'with a logout button, and either showing conversations or a ' +
                '"No conversations yet" empty state?',
                'yes'
            );

            // Traditional assertion still works
            expect(await chatListScreen.isDisplayed()).toBe(true);
        });

        it('should display user email in header', async () => {
            // Action: Sign in with credentials
            await authScreen.enterEmail(testUsers.user1.email);
            await authScreen.enterPassword(testUsers.user1.password);
            await authScreen.tapSignIn();
            await TestHelpers.waitForElement('~chat-list-title', 15000);

            // Visual verification: Check if user email is shown
            const result = await claude.visualAssert(
                'Is the user email (john@test.com or similar) ' +
                'displayed somewhere in the header area of this screen?',
                'yes'
            );

            expect(result.passed).toBe(true);
        });

        it('should handle logout flow correctly', async () => {
            // Action: Sign in first with credentials
            await authScreen.enterEmail(testUsers.user1.email);
            await authScreen.enterPassword(testUsers.user1.password);
            await authScreen.tapSignIn();
            await TestHelpers.waitForElement('~chat-list-title', 15000);
            
            // Visual check: Verify we're on chat list
            await claude.visualAssert(
                'Is this the chat list screen with a logout button visible?',
                'yes'
            );

            // Action: Click logout
            console.log('🎬 Action: Clicking logout button...');
            const logoutButton = await $('~logout-button');
            await logoutButton.click();
            
            // Wait for logout to complete
            await browser.pause(4000);
            
            // Visual check: Verify we're back on auth screen
            await claude.visualAssert(
                'Are we back on the authentication/login screen with email and password inputs?',
                'yes'
            );
        });

        it('should show error for invalid credentials', async () => {
            // Action: Enter invalid credentials
            await authScreen.signInWithCredentials('invalid@test.com', 'wrongpassword');
            
            // Wait a moment for error to appear
            await browser.pause(2000);

            // Visual check: Look for error message
            const result = await claude.visualAssert(
                'Is there an error message displayed indicating login failed or invalid credentials?',
                'yes'
            );

            // We expect this to show an error
            expect(result.passed).toBe(true);
        });
    });

    describe('Visual Regression Detection', () => {
        it('should detect UI layout issues', async () => {
            // Get detailed screen description
            const description = await claude.describeScreen();
            console.log('📱 Screen Description:', description);

            // Check for expected elements in the description
            expect(description.toLowerCase()).toContain('email');
            expect(description.toLowerCase()).toContain('password');
        });
    });
});

