/**
 * Retry Logic for Failed Message Routing
 *
 * This module provides Cloud Function trigger for retrying failed message routing.
 * It processes messages from the pending_retry collection with exponential backoff.
 *
 * @example
 * ```typescript
 * import { retryFailedMessages } from './retry';
 *
 * // Register retry trigger
 * export const retryMessages = retryFailedMessages;
 * ```
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
} from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { routeMessageToThread } from './routing';
import type { UnifiedMessage } from '../../src/types/Channel';

setGlobalOptions({ region: 'us-central1' });

if (getAdminApps().length === 0) {
  initializeAdminApp();
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE_MS = 60000; // 1 minute base delay

/**
 * Calculate exponential backoff delay
 *
 * @param retryCount - Number of retries attempted
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(retryCount: number): number {
  return RETRY_DELAY_BASE_MS * Math.pow(2, retryCount);
}

/**
 * Retry Failed Messages
 *
 * Cloud Function trigger that processes messages from pending_retry collection.
 * Retries routing with exponential backoff, and marks messages as failed after max retries.
 *
 * Runs every 5 minutes to check for messages ready to retry.
 */
export const retryFailedMessages = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'UTC',
  },
  async () => {
    try {
      console.log('🔄 Starting retry process for failed messages');

      const db = getFirestore();
      const pendingRetryRef = db.collection('pending_retry');
      
      // Get messages that are ready to retry (retryCount < MAX_RETRY_ATTEMPTS)
      const now = new Date();
      const snapshot = await pendingRetryRef
        .where('retryCount', '<', MAX_RETRY_ATTEMPTS)
        .get();

      if (snapshot.empty) {
        console.log('✅ No messages to retry');
        return;
      }

      console.log(`📋 Found ${snapshot.size} messages to process`);

      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const retryCount = data.retryCount || 0;
        const createdAt = data.createdAt?.toDate() || new Date(data.createdAt);
        const retryDelay = calculateRetryDelay(retryCount);
        const nextRetryTime = new Date(createdAt.getTime() + retryDelay);

        // Skip if not ready to retry yet
        if (now < nextRetryTime) {
          skippedCount++;
          continue;
        }

        try {
          // Reconstruct UnifiedMessage from stored data
          const unifiedMessage: UnifiedMessage = {
            id: data.id,
            threadId: data.threadId || '',
            channel: data.channel,
            direction: data.direction,
            senderIdentifier: data.senderIdentifier,
            recipientIdentifier: data.recipientIdentifier,
            text: data.text || '',
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            status: data.status || 'failed',
            metadata: data.metadata || {},
          };

          const organizationId = data.organizationId || 'default-org';

          console.log(`🔄 Retrying message ${unifiedMessage.id} (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);

          // Attempt routing
          const routingResult = await routeMessageToThread(unifiedMessage, organizationId);

          if (routingResult.success && routingResult.threadId) {
            console.log(`✅ Message ${unifiedMessage.id} routed successfully on retry`);
            
            // Delete from pending_retry collection
            await doc.ref.delete();
            successCount++;
          } else {
            // Increment retry count
            const newRetryCount = retryCount + 1;
            
            if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
              // Mark as permanently failed
              console.error(`❌ Message ${unifiedMessage.id} failed after ${MAX_RETRY_ATTEMPTS} attempts`);
              
              await doc.ref.update({
                retryCount: newRetryCount,
                permanentlyFailed: true,
                failedAt: FieldValue.serverTimestamp(),
                lastError: routingResult.error || 'Unknown routing error',
              });
              
              // Optionally move to failed_messages collection for manual review
              await db.collection('failed_messages').add({
                ...data,
                retryCount: newRetryCount,
                permanentlyFailed: true,
                failedAt: FieldValue.serverTimestamp(),
                lastError: routingResult.error || 'Unknown routing error',
              });
              
              // Delete from pending_retry
              await doc.ref.delete();
              failureCount++;
            } else {
              // Update retry count and next retry time
              await doc.ref.update({
                retryCount: newRetryCount,
                lastError: routingResult.error || 'Unknown routing error',
                nextRetryAt: new Date(now.getTime() + calculateRetryDelay(newRetryCount)),
                updatedAt: FieldValue.serverTimestamp(),
              });
              skippedCount++;
            }
          }
        } catch (error) {
          console.error(`❌ Error retrying message ${doc.id}:`, error);
          
          const newRetryCount = retryCount + 1;
          
          if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
            // Mark as permanently failed
            await doc.ref.update({
              retryCount: newRetryCount,
              permanentlyFailed: true,
              failedAt: FieldValue.serverTimestamp(),
              lastError: error instanceof Error ? error.message : 'Unknown error',
            });
            
            // Move to failed_messages collection
            await db.collection('failed_messages').add({
              ...doc.data(),
              retryCount: newRetryCount,
              permanentlyFailed: true,
              failedAt: FieldValue.serverTimestamp(),
              lastError: error instanceof Error ? error.message : 'Unknown error',
            });
            
            await doc.ref.delete();
            failureCount++;
          } else {
            // Update retry count
            await doc.ref.update({
              retryCount: newRetryCount,
              lastError: error instanceof Error ? error.message : 'Unknown error',
              nextRetryAt: new Date(now.getTime() + calculateRetryDelay(newRetryCount)),
              updatedAt: FieldValue.serverTimestamp(),
            });
            skippedCount++;
          }
        }
      }

      console.log(`✅ Retry process complete: ${successCount} succeeded, ${failureCount} failed permanently, ${skippedCount} deferred`);
    } catch (error) {
      console.error('❌ Error in retry process:', error);
    }
  }
);







