// Page Object Model for Chat List Screen
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export class ChatListScreen {
  // Selectors
  headerTitle = '~chat-list-title';
  newChatButton = '~new-chat-button';
  threadList = '~thread-list';
  threadItem = '~thread-item';
  threadName = '~thread-name';
  lastMessage = '~last-message';
  unreadBadge = '~unread-badge';
  userMenu = '~user-menu';
  logoutButton = '~logout-button';
  contactsButton = '~contacts-button';
  settingsButton = '~settings-button';

  // Actions
  async tapNewChat() {
    await $(this.newChatButton).click();
  }

  async tapThread(index) {
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

  async getThreadName(index) {
    const threads = await $$(this.threadItem);
    if (threads[index]) {
      return await threads[index].$(this.threadName).getText();
    }
    return null;
  }

  async getLastMessage(index) {
    const threads = await $$(this.threadItem);
    if (threads[index]) {
      return await threads[index].$(this.lastMessage).getText();
    }
    return null;
  }

  async hasUnreadMessages(index) {
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

  async waitForThreadCount(expectedCount) {
    await browser.waitUntil(
      async () => (await this.getThreadCount()) === expectedCount,
      { timeout: 10000 }
    );
  }
}
