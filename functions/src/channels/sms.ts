/**
 * SMS Webhook Handler (Twilio Integration)
 *
 * This module provides Cloud Function webhook handlers for receiving SMS messages
 * from Twilio. It handles:
 * - Incoming SMS messages
 * - Delivery status updates
 * - Webhook signature validation for security
 * - Conversion to UnifiedMessage format
 *
 * @example
 * ```typescript
 * import { smsWebhookHandler } from './channels/sms';
 *
 * // Register webhook handler
 * export const smsWebhook = smsWebhookHandler;
 * ```
 */

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { TwilioSMSAdapter } from '../../../src/services/channels/sms';
import { TwilioCredentials } from '../../../src/services/channels/twilioConfig';
import { mapTwilioStatusToUnifiedStatus } from '../../../src/services/channels/twilioStatusMapper';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import type { UnifiedMessage } from '../../../src/types/Channel';
import { routeMessageToThread } from '../routing';

setGlobalOptions({ region: 'us-central1' });

if (getAdminApps().length === 0) {
  initializeAdminApp();
}

/**
 * SMS Webhook Handler
 *
 * Handles incoming SMS webhooks from Twilio.
 * Validates webhook signature, parses payload, converts to UnifiedMessage,
 * and stores in Firestore for message routing.
 *
 * @param request - HTTP request from Twilio
 * @param response - HTTP response to Twilio
 * @returns Promise resolving when webhook is processed
 */
export const smsWebhookHandler = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      console.log('📨 SMS webhook received:', {
        method: request.method,
        url: request.url,
        body: request.body,
      });

      // Validate HTTP method (Twilio webhooks use POST)
      if (request.method !== 'POST') {
        console.log('❌ Invalid HTTP method:', request.method);
        response.status(405).send('Method Not Allowed');
        return;
      }

      // Get Twilio credentials from environment variables
      const credentials: TwilioCredentials = {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      };

      // Validate webhook signature (security)
      if (!validateTwilioWebhookSignature(request, credentials.authToken)) {
        console.log('❌ Invalid webhook signature');
        response.status(403).send('Forbidden - Invalid signature');
        return;
      }

      // Parse webhook payload
      const webhookPayload = request.body;

      // Extract message type (incoming message or status update)
      const messageType = webhookPayload.MessageSid
        ? 'incoming'
        : webhookPayload.MessageStatus
          ? 'status_update'
          : 'unknown';

      console.log('📊 Message type:', messageType);

      // Create TwilioSMSAdapter instance
      const adapter = new TwilioSMSAdapter(credentials);

      // Handle incoming SMS message
      if (messageType === 'incoming') {
        // Convert Twilio webhook to UnifiedMessage
        let unifiedMessage: UnifiedMessage;
        try {
          unifiedMessage = adapter.receive(webhookPayload);
        } catch (error) {
          console.error('❌ Error converting webhook payload to UnifiedMessage:', error);
          const errorMessage = error instanceof Error ? error.message : 'Invalid webhook payload';
          
          // Return error response to Twilio
          response.status(400).send(`Bad Request - ${errorMessage}`);
          return;
        }

        console.log('✅ Unified message created:', {
          id: unifiedMessage.id,
          channel: unifiedMessage.channel,
          direction: unifiedMessage.direction,
          senderIdentifier: unifiedMessage.senderIdentifier,
          text: unifiedMessage.text.substring(0, 50) + '...',
        });

        // Route message using routing service
        // Get organizationId from environment or request metadata
        const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'default-org';

        try {
          // Route message using routing service
          const routingResult = await routeMessageToThread(unifiedMessage, organizationId);

          if (routingResult.success && routingResult.threadId) {
            console.log(`✅ Message routed successfully to thread: ${routingResult.threadId} (method: ${routingResult.method}, confidence: ${routingResult.confidence})`);
          } else {
            console.error('❌ Routing failed:', routingResult.error);
            // Store message for retry
            const db = getFirestore();
            await db.collection('pending_retry').add({
              ...unifiedMessage,
              timestamp: unifiedMessage.timestamp.toISOString(),
              organizationId,
              retryCount: 0,
              lastError: routingResult.error || 'Unknown routing error',
              createdAt: new Date(),
            });
          }

          // Return TwiML response to Twilio (acknowledge receipt)
          response.type('text/xml');
          response.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
          return;
        } catch (error) {
          console.error('❌ Error processing incoming message:', error);
          
          // Store message for retry
          try {
            const db = getFirestore();
            await db.collection('pending_retry').add({
              ...unifiedMessage,
              timestamp: unifiedMessage.timestamp.toISOString(),
              organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'default-org',
              retryCount: 0,
              lastError: error instanceof Error ? error.message : 'Unknown error',
              createdAt: new Date(),
            });
          } catch (retryError) {
            console.error('❌ Failed to store message for retry:', retryError);
          }
          
          // Still acknowledge receipt to Twilio even if routing fails
          response.type('text/xml');
          response.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
          return;
        }
      }

      // Handle delivery status update
      if (messageType === 'status_update') {
        console.log('📊 Status update received:', {
          messageSid: webhookPayload.MessageSid,
          status: webhookPayload.MessageStatus,
        });

        // Update message status in Firestore (if message exists)
        const db = getFirestore();
        const messageSid = webhookPayload.MessageSid;

        if (messageSid) {
          // Find message by Twilio message SID (stored as channelMessageId)
          const messagesRef = db.collectionGroup('messages');
          const snapshot = await messagesRef
            .where('channelMessageId', '==', messageSid)
            .limit(1)
            .get();

          if (!snapshot.empty && snapshot.docs.length > 0) {
            const messageDoc = snapshot.docs[0];
            if (messageDoc) {
              // Map Twilio status to UnifiedMessage status using shared utility
              const status = mapTwilioStatusToUnifiedStatus(
                webhookPayload.MessageStatus || 'failed'
              );

              await messageDoc.ref.update({
                status,
                updatedAt: new Date(),
              });

              console.log('✅ Message status updated:', {
                messageId: messageDoc.id,
                status,
              });
            }
          } else {
            console.warn('⚠️ Message not found for status update:', messageSid);
          }
        }

        // Return TwiML response to Twilio (acknowledge receipt)
        response.type('text/xml');
        response.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }

      // Unknown message type
      console.log('⚠️ Unknown message type:', messageType);
      response.status(400).send('Bad Request - Unknown message type');
    } catch (error) {
      console.error('❌ Error processing SMS webhook:', error);
      response.status(500).send('Internal Server Error');
    }
  }
);

/**
 * Validate Twilio Webhook Signature
 *
 * Validates that the webhook request is from Twilio by checking the signature.
 * This is critical for security to prevent unauthorized webhook requests.
 *
 * Uses Twilio's built-in validateRequest function to verify the webhook signature
 * against the auth token, URL, and request body.
 *
 * @param request - HTTP request from Twilio
 * @param authToken - Twilio auth token
 * @returns True if signature is valid, false otherwise
 */
function validateTwilioWebhookSignature(
  request: any,
  authToken: string
): boolean {
  try {
    // Get the signature from the request header
    const signature = request.headers['x-twilio-signature'] as string;

    if (!signature) {
      console.log('⚠️ No Twilio signature header found');
      return false;
    }

    if (!authToken) {
      console.log('⚠️ No Twilio auth token configured');
      return false;
    }

    // Get the full URL from the request
    const url = request.protocol + '://' + request.get('host') + request.url;

    // Get the request body (for POST requests, Twilio sends form-encoded data)
    // Firebase Functions automatically parses the body, so we use the parsed body
    const body = request.body || {};

    // Use Twilio's built-in validation
    // This validates that the request is actually from Twilio by checking
    // the signature against the auth token, URL, and body parameters
    const isValid = validateRequest(authToken, signature, url, body);

    if (!isValid) {
      console.log('⚠️ Webhook signature validation failed');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error validating webhook signature:', error);
    return false;
  }
}

