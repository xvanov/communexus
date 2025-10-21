import AsyncStorage from "@react-native-async-storage/async-storage";

const OFFLINE_MESSAGES_KEY = "communexus_offline_messages";

/**
 * Offline messaging utility for handling messages when network is unavailable
 */
class OfflineMessagingManager {
  constructor() {
    this.messageQueue = [];
    this.isProcessing = false;
  }

  /**
   * Queue a message for offline sending
   */
  async queueMessage(
    conversationId,
    content,
    messageType = "text",
    mediaUrl = null,
  ) {
    const clientId =
      Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const offlineMessage = {
      clientId,
      conversationId,
      content,
      messageType,
      mediaUrl,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };

    // Add to memory queue
    this.messageQueue.push(offlineMessage);

    // Persist to storage
    await this.saveQueueToStorage();

    return clientId;
  }

  /**
   * Process the offline message queue
   */
  async processOfflineQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const processedMessages = [];
    const failedMessages = [];

    try {
      // Load queue from storage if empty in memory
      if (this.messageQueue.length === 0) {
        await this.loadQueueFromStorage();
      }

      for (const message of [...this.messageQueue]) {
        try {
          // Attempt to send the message
          const result = await this.sendQueuedMessage(message);

          if (result.success) {
            processedMessages.push(message.clientId);
            // Remove from queue
            this.messageQueue = this.messageQueue.filter(
              (m) => m.clientId !== message.clientId,
            );
          } else {
            message.attempts++;
            if (message.attempts >= message.maxAttempts) {
              failedMessages.push(message.clientId);
              // Remove failed messages after max attempts
              this.messageQueue = this.messageQueue.filter(
                (m) => m.clientId !== message.clientId,
              );
            }
          }
        } catch (error) {
          console.error("Failed to send queued message:", error);
          message.attempts++;

          if (message.attempts >= message.maxAttempts) {
            failedMessages.push(message.clientId);
            this.messageQueue = this.messageQueue.filter(
              (m) => m.clientId !== message.clientId,
            );
          }
        }
      }

      // Update storage
      await this.saveQueueToStorage();

      // Notify about results if there were any
      if (processedMessages.length > 0 || failedMessages.length > 0) {
        console.log(
          `Processed ${processedMessages.length} messages, ${failedMessages.length} failed`,
        );
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send a single queued message
   */
  async sendQueuedMessage(message) {
    try {
      const response = await fetch(
        `/api/conversations/${message.conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: message.content,
            message_type: message.messageType,
            media_url: message.mediaUrl,
            client_id: message.clientId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Send queued message error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save message queue to AsyncStorage
   */
  async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem(
        OFFLINE_MESSAGES_KEY,
        JSON.stringify(this.messageQueue),
      );
    } catch (error) {
      console.error("Failed to save offline messages to storage:", error);
    }
  }

  /**
   * Load message queue from AsyncStorage
   */
  async loadQueueFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_MESSAGES_KEY);
      if (stored) {
        this.messageQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load offline messages from storage:", error);
      this.messageQueue = [];
    }
  }

  /**
   * Get pending messages count
   */
  getPendingCount() {
    return this.messageQueue.length;
  }

  /**
   * Clear all queued messages (use with caution)
   */
  async clearQueue() {
    this.messageQueue = [];
    await AsyncStorage.removeItem(OFFLINE_MESSAGES_KEY);
  }

  /**
   * Check if a message is in the queue
   */
  isMessageQueued(clientId) {
    return this.messageQueue.some((m) => m.clientId === clientId);
  }

  /**
   * Initialize the manager (call this on app start)
   */
  async initialize() {
    await this.loadQueueFromStorage();

    // Process any existing queue
    if (this.messageQueue.length > 0) {
      this.processOfflineQueue();
    }
  }

  /**
   * Try to process queue (can be called when app comes back online)
   */
  async tryProcessQueue() {
    await this.processOfflineQueue();
  }
}

// Export singleton instance
export const offlineMessaging = new OfflineMessagingManager();
export default offlineMessaging;
