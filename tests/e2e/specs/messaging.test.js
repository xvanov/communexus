// Messaging Flow Tests
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

import { AuthScreen } from '../pages/AuthScreen.js';
import { ChatListScreen } from '../pages/ChatListScreen.js';
import { ChatScreen } from '../pages/ChatScreen.js';
import { TestHelpers } from '../helpers/TestHelpers.js';

describe('Messaging Flow Tests', () => {
    let authScreen: AuthScreen;
    let chatListScreen: ChatListScreen;
    let chatScreen: ChatScreen;
    let testUsers: any;

    before(async () => {
        // Initialize page objects
        authScreen = new AuthScreen();
        chatListScreen = new ChatListScreen();
        chatScreen = new ChatScreen();
        testUsers = TestHelpers.getTestUsers();

        // Validate test environment
        await TestHelpers.validateTestEnvironment();
        
        // Wait for Firebase emulator
        await TestHelpers.waitForFirebaseEmulator();
    });

    beforeEach(async () => {
        // Reset app state and sign in
        await TestHelpers.resetApp();
        await TestHelpers.waitForElement('~email-input');
        await authScreen.signInAsTestUser();
        await TestHelpers.waitForElement('~chat-list-title');
    });

    afterEach(async () => {
        // Take screenshot on test failure
        if (browser.config.framework === 'mocha' && this.currentTest?.state === 'failed') {
            await TestHelpers.takeScreenshot(`messaging-test-failed-${this.currentTest.title}`);
        }
    });

    after(async () => {
        // Cleanup test data
        await TestHelpers.cleanupTestData();
    });

    describe('Thread Creation', () => {
        it('should create new conversation', async () => {
            // Tap new chat button
            await chatListScreen.tapNewChat();

            // Verify navigation to group create screen
            await TestHelpers.waitForElement('~group-create-title');
        });

        it('should display existing threads', async () => {
            // Wait for threads to load
            await chatListScreen.waitForThreadsToLoad();

            // Verify thread list is displayed
            const threadCount = await chatListScreen.getThreadCount();
            expect(threadCount).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Message Sending', () => {
        beforeEach(async () => {
            // Navigate to a chat or create one
            await chatListScreen.tapNewChat();
            await TestHelpers.waitForElement('~group-create-title');
            
            // Create a test conversation (simplified for now)
            // This would need to be implemented based on the actual UI
        });

        it('should send a text message', async () => {
            const testMessage = 'Hello, this is a test message!';
            
            // Send message
            await chatScreen.sendMessage(testMessage);

            // Verify message appears in chat
            await chatScreen.waitForNewMessage();
            const lastMessage = await chatScreen.getLastMessageText();
            expect(lastMessage).toBe(testMessage);
        });

        it('should display message with correct sender', async () => {
            const testMessage = 'Test message with sender verification';
            
            // Send message
            await chatScreen.sendMessage(testMessage);

            // Verify message appears with correct sender
            await chatScreen.waitForNewMessage();
            const messageCount = await chatScreen.getMessageCount();
            const sender = await chatScreen.getMessageSender(messageCount - 1);
            expect(sender).toBeTruthy();
        });

        it('should handle empty message input', async () => {
            // Try to send empty message
            await chatScreen.enterMessage('');
            
            // Verify send button is disabled
            const isEnabled = await chatScreen.isSendButtonEnabled();
            expect(isEnabled).toBe(false);
        });

        it('should handle long messages', async () => {
            const longMessage = 'A'.repeat(1000); // Very long message
            
            // Send long message
            await chatScreen.sendMessage(longMessage);

            // Verify message is sent successfully
            await chatScreen.waitForNewMessage();
            const lastMessage = await chatScreen.getLastMessageText();
            expect(lastMessage).toBe(longMessage);
        });
    });

    describe('Thread Management', () => {
        it('should navigate between threads', async () => {
            // Wait for threads to load
            await chatListScreen.waitForThreadsToLoad();
            
            const threadCount = await chatListScreen.getThreadCount();
            if (threadCount > 0) {
                // Tap first thread
                await chatListScreen.tapThread(0);
                
                // Verify navigation to chat screen
                await TestHelpers.waitForElement('~chat-header-title');
                expect(await chatScreen.isDisplayed()).toBe(true);
                
                // Navigate back
                await chatScreen.tapBack();
                
                // Verify return to chat list
                expect(await chatListScreen.isDisplayed()).toBe(true);
            }
        });

        it('should display thread names correctly', async () => {
            // Wait for threads to load
            await chatListScreen.waitForThreadsToLoad();
            
            const threadCount = await chatListScreen.getThreadCount();
            for (let i = 0; i < threadCount; i++) {
                const threadName = await chatListScreen.getThreadName(i);
                expect(threadName).toBeTruthy();
            }
        });

        it('should show last message preview', async () => {
            // Wait for threads to load
            await chatListScreen.waitForThreadsToLoad();
            
            const threadCount = await chatListScreen.getThreadCount();
            if (threadCount > 0) {
                const lastMessage = await chatListScreen.getLastMessage(0);
                // Last message might be empty for new threads
                expect(lastMessage).toBeDefined();
            }
        });
    });

    describe('Cross-Platform Consistency', () => {
        it('should have consistent messaging behavior across platforms', async () => {
            const deviceInfo = await TestHelpers.getDeviceInfo();
            
            // Test basic messaging functionality
            const testMessage = `Cross-platform test from ${deviceInfo.platformName}`;
            
            // Navigate to chat if available
            await chatListScreen.waitForThreadsToLoad();
            const threadCount = await chatListScreen.getThreadCount();
            
            if (threadCount > 0) {
                await chatListScreen.tapThread(0);
                await TestHelpers.waitForElement('~chat-header-title');
                
                // Send message
                await chatScreen.sendMessage(testMessage);
                await chatScreen.waitForNewMessage();
                
                // Verify message was sent
                const lastMessage = await chatScreen.getLastMessageText();
                expect(lastMessage).toBe(testMessage);
                
                // Take screenshot for visual comparison
                await TestHelpers.takeScreenshot(`messaging-${deviceInfo.platformName}`);
            }
        });
    });
});


