// Page Object Model for Chat Screen
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export class ChatScreen {
  // Selectors
  headerTitle = '~chat-header-title';
  messageList = '~message-list';
  messageBubble = '~message-bubble';
  messageText = '~message-text';
  messageSender = '~message-sender';
  messageTimestamp = '~message-timestamp';
  messageInput = '~message-input';
  sendButton = '~send-button';
  backButton = '~back-button';
  typingIndicator = '~typing-indicator';
  messageStatus = '~message-status';

  // Actions
  async enterMessage(text) {
    await $(this.messageInput).setValue(text);
  }

  async tapSend() {
    await $(this.sendButton).click();
  }

  async sendMessage(text) {
    await this.enterMessage(text);
    await this.tapSend();
  }

  async tapBack() {
    await $(this.backButton).click();
  }

  // Verification methods
  async isDisplayed() {
    return await $(this.headerTitle).isDisplayed();
  }

  async getMessageCount() {
    const messages = await $$(this.messageBubble);
    return messages.length;
  }

  async getMessageText(index) {
    const messages = await $$(this.messageBubble);
    if (messages[index]) {
      return await messages[index].$(this.messageText).getText();
    }
    return null;
  }

  async getLastMessageText() {
    const messages = await $$(this.messageBubble);
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      return await lastMessage.$(this.messageText).getText();
    }
    return null;
  }

  async getMessageSender(index) {
    const messages = await $$(this.messageBubble);
    if (messages[index]) {
      return await messages[index].$(this.messageSender).getText();
    }
    return null;
  }

  async getHeaderTitle() {
    return await $(this.headerTitle).getText();
  }

  async isTypingIndicatorVisible() {
    return await $(this.typingIndicator).isDisplayed();
  }

  async isSendButtonEnabled() {
    return await $(this.sendButton).isEnabled();
  }

  // Wait methods
  async waitForMessagesToLoad() {
    await $(this.messageList).waitForDisplayed({ timeout: 10000 });
  }

  async waitForMessageCount(expectedCount) {
    await browser.waitUntil(
      async () => (await this.getMessageCount()) === expectedCount,
      { timeout: 10000 }
    );
  }

  async waitForNewMessage() {
    const initialCount = await this.getMessageCount();
    await browser.waitUntil(
      async () => (await this.getMessageCount()) > initialCount,
      { timeout: 10000 }
    );
  }

  async waitForTypingIndicator() {
    await $(this.typingIndicator).waitForDisplayed({ timeout: 5000 });
  }

  async waitForTypingIndicatorToDisappear() {
    await $(this.typingIndicator).waitForDisplayed({
      timeout: 5000,
      reverse: true,
    });
  }
}
