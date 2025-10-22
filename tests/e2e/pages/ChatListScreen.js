// Page Object Model for Chat List Screen
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export class ChatListScreen {
    // Selectors
    private headerTitle = '~chat-list-title';
    private newChatButton = '~new-chat-button';
    private threadList = '~thread-list';
    private threadItem = '~thread-item';
    private threadName = '~thread-name';
    private lastMessage = '~last-message';
    private unreadBadge = '~unread-badge';
    private userMenu = '~user-menu';
    private logoutButton = '~logout-button';
    private contactsButton = '~contacts-button';
    private settingsButton = '~settings-button';

    // Actions
    async tapNewChat() {
        await $(this.newChatButton).click();
    }

    async tapThread(index: number) {
        const threads = await $$(this.threadItem);
        if (threads[index]) {
            await threads[index].click();
        } else {
            throw new Error(`Thread at index ${index} not found`);
        }
    }

    async tapUserMenu() {
        await $(this.userMenu).click();
    }

    async tapLogout() {
        await $(this.logoutButton).click();
    }

    async tapContacts() {
        await $(this.contactsButton).click();
    }

    async tapSettings() {
        await $(this.settingsButton).click();
    }

    // Verification methods
    async isDisplayed() {
        return await $(this.headerTitle).isDisplayed();
    }

    async getThreadCount() {
        const threads = await $$(this.threadItem);
        return threads.length;
    }

    async getThreadName(index: number) {
        const threads = await $$(this.threadItem);
        if (threads[index]) {
            return await threads[index].$(this.threadName).getText();
        }
        return null;
    }

    async getLastMessage(index: number) {
        const threads = await $$(this.threadItem);
        if (threads[index]) {
            return await threads[index].$(this.lastMessage).getText();
        }
        return null;
    }

    async hasUnreadMessages(index: number) {
        const threads = await $$(this.threadItem);
        if (threads[index]) {
            return await threads[index].$(this.unreadBadge).isDisplayed();
        }
        return false;
    }

    async getHeaderTitle() {
        return await $(this.headerTitle).getText();
    }

    // Wait methods
    async waitForThreadsToLoad() {
        await $(this.threadList).waitForDisplayed({ timeout: 10000 });
    }

    async waitForThreadCount(expectedCount: number) {
        await browser.waitUntil(
            async () => (await this.getThreadCount()) === expectedCount,
            { timeout: 10000 }
        );
    }
}


