# Story 1.6: SMS Webhook Handler

Status: ready-for-dev

## Story

As a system,
I want to receive SMS webhooks from Twilio,
So that inbound SMS messages are processed in real-time.

## Acceptance Criteria

1. Webhook endpoint created for Twilio SMS
2. Webhook validates Twilio request signature
3. Webhook converts Twilio payload to UnifiedMessage
4. Webhook routes message using routing logic
5. Webhook handles delivery status updates
6. Webhook responds correctly to Twilio
7. Error handling for invalid webhooks
8. Webhook retry logic for failed processing

## Tasks / Subtasks

- [x] Task 1: Complete webhook endpoint integration (AC: 1, 4)
  - [x] Review existing webhook handler in `functions/src/channels/sms.ts`
  - [x] Remove TODOs and implement full routing integration
  - [x] Import routeMessageToThread from routing Cloud Function
  - [x] Call routing service after converting to UnifiedMessage
  - [x] Ensure routing is called before message is saved
  - [x] Handle routing result (route to thread or create new thread)
  - [x] Update channelSources when message is routed
  - [x] Save message to routed thread
  - [x] Remove temporary incomingMessages collection usage (routing is now synchronous)
  - [ ] Write unit tests for webhook routing integration

- [x] Task 2: Ensure webhook signature validation (AC: 2)
  - [x] Review existing validateTwilioWebhookSignature() function
  - [x] Verify signature validation uses validateRequest() from Twilio SDK
  - [x] Ensure authToken is properly retrieved from environment
  - [x] Ensure signature validation happens before any processing
  - [ ] Test signature validation with valid and invalid signatures
  - [ ] Write unit tests for signature validation

- [x] Task 3: Ensure UnifiedMessage conversion (AC: 3)
  - [x] Review existing TwilioSMSAdapter.receive() method
  - [x] Verify webhook handler calls adapter.receive() correctly
  - [x] Ensure all required fields are converted (MessageSid, From, To, Body, Timestamp)
  - [x] Ensure timestamp is parsed correctly from Twilio format
  - [x] Ensure status is mapped correctly using mapTwilioStatusToUnifiedStatus
  - [x] Ensure Twilio-specific data is stored in metadata.channelSpecific
  - [x] Add error handling for invalid webhook payloads
  - [ ] Test conversion with various Twilio webhook payloads
  - [ ] Write unit tests for UnifiedMessage conversion

- [x] Task 4: Implement routing integration (AC: 4)
  - [x] Ensure webhook handler calls routeMessageToThread() function directly
  - [x] Pass UnifiedMessage and organizationId to routing function
  - [x] Handle routing result (threadId or null)
  - [x] If routing returns threadId, save message to that thread (handled in routeMessageToThread)
  - [x] If routing returns null, create new thread (handled in routeMessageToThread)
  - [x] Update thread channelSources when message is routed (handled in routeMessageToThread)
  - [x] Ensure message is saved with correct threadId (handled in routeMessageToThread)
  - [x] Store failed messages in pending_retry for retry
  - [ ] Test routing integration with various scenarios
  - [ ] Write integration tests for routing integration

- [x] Task 5: Implement delivery status update handling (AC: 5)
  - [x] Review existing status update handling in webhook handler
  - [x] Ensure status updates are detected correctly (MessageStatus field)
  - [x] Ensure message is found by Twilio MessageSid (using channelMessageId field)
  - [x] Ensure status is mapped correctly using mapTwilioStatusToUnifiedStatus
  - [x] Ensure message status is updated in Firestore
  - [x] Handle case where message is not found (log warning)
  - [ ] Test status update handling with various statuses
  - [ ] Write unit tests for status update handling

- [x] Task 6: Ensure correct Twilio response (AC: 6)
  - [x] Review existing TwiML response format
  - [x] Ensure response is sent as text/xml content type
  - [x] Ensure response is valid TwiML XML
  - [x] Ensure response is sent quickly (acknowledge receipt to Twilio)
  - [x] Ensure response is sent even if routing fails (error handling preserves response)
  - [ ] Test response format with Twilio validation
  - [ ] Write unit tests for TwiML response

- [x] Task 7: Improve error handling (AC: 7)
  - [x] Review existing error handling in webhook handler
  - [x] Add error handling for invalid HTTP method (already exists)
  - [x] Add error handling for invalid webhook signature (already exists)
  - [x] Add error handling for invalid webhook payload (missing required fields)
  - [x] Add error handling for routing failures (stored in pending_retry)
  - [x] Add error handling for message saving failures (handled in routing function)
  - [x] Add error handling for status update failures (graceful handling)
  - [x] Ensure errors are logged with context
  - [x] Ensure errors don't crash the webhook handler
  - [x] Return appropriate HTTP status codes for different error types
  - [ ] Write unit tests for error handling

- [x] Task 8: Implement retry logic (AC: 8)
  - [x] Create retry mechanism for failed routing
  - [x] Store failed messages in pending_retry collection
  - [x] Create Cloud Function trigger to retry failed messages (retryFailedMessages scheduled function)
  - [x] Implement exponential backoff for retries
  - [x] Set maximum retry attempts (3 attempts)
  - [x] Mark messages as failed after max retries (moved to failed_messages collection)
  - [x] Handle transient failures (retry) vs permanent failures (manual review)
  - [ ] Test retry logic with various failure scenarios
  - [ ] Write unit tests for retry logic

- [x] Task 9: Update webhook handler configuration (AC: 1-8)
  - [x] Review webhook handler Cloud Function configuration
  - [x] Ensure proper region configuration (us-central1) - verified in setGlobalOptions
  - [x] Ensure CORS is enabled for webhook endpoint - verified in onRequest({ cors: true })
  - [x] Ensure environment variables are properly configured - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, DEFAULT_ORGANIZATION_ID
  - [ ] Ensure webhook URL is properly configured in Twilio (requires deployment)
  - [ ] Document webhook configuration in README
  - [ ] Test webhook handler with Twilio webhook simulator (requires deployment)

- [ ] Task 10: Integration testing (AC: 1-8)
  - [ ] Test webhook handler with incoming SMS messages
  - [ ] Test webhook handler with delivery status updates
  - [ ] Test routing integration (identity-based, metadata-based, context-based)
  - [ ] Test thread creation for new conversations
  - [ ] Test channelSources update when message is routed
  - [ ] Test error handling with invalid webhooks
  - [ ] Test retry logic with failed messages
  - [ ] Test webhook handler with Twilio webhook simulator
  - [ ] Write integration tests for webhook handler

- [ ] Task 11: Update documentation (AC: 1-8)
  - [ ] Update architecture.md with webhook handler specification
  - [ ] Document webhook handler flow (signature validation → conversion → routing → saving)
  - [ ] Document retry logic and error handling
  - [ ] Create usage examples for webhook handler
  - [ ] Document webhook configuration in Twilio
  - [ ] Document troubleshooting guide for webhook issues

- [ ] Task 12: Testing (All ACs)
  - [ ] Unit tests for webhook handler
  - [ ] Unit tests for signature validation
  - [ ] Unit tests for UnifiedMessage conversion
  - [ ] Unit tests for routing integration
  - [ ] Unit tests for status update handling
  - [ ] Unit tests for TwiML response
  - [ ] Unit tests for error handling
  - [ ] Unit tests for retry logic
  - [ ] Integration tests for webhook handler
  - [ ] Integration tests with Twilio webhook simulator

## Dev Notes

This story completes the SMS webhook handler by integrating it with the routing service from Story 1.5. The webhook handler receives incoming SMS messages from Twilio, validates the webhook signature, converts the payload to UnifiedMessage format, routes the message using the routing service, and saves it to the correct thread. It also handles delivery status updates and implements retry logic for failed processing.

### Key Technical Decisions

1. **Routing Integration**: The webhook handler calls the `routeWebhookMessage()` Cloud Function to route messages. This ensures routing is done server-side using Admin SDK for proper Firestore access.

2. **Asynchronous Processing**: The webhook handler acknowledges receipt to Twilio immediately (returns TwiML response) and processes routing asynchronously. This ensures Twilio receives a quick response while routing can take time.

3. **Retry Logic**: Failed routing attempts are stored in a `pending_retry` collection and retried with exponential backoff. This handles transient failures gracefully.

4. **Error Handling**: All errors are logged with context and don't crash the webhook handler. Invalid webhooks return appropriate HTTP status codes (403 for invalid signature, 400 for invalid payload, 500 for server errors).

5. **Status Updates**: Delivery status updates are handled separately from incoming messages. They update the message status in Firestore using the Twilio MessageSid to find the message.

### Architecture Alignment

- **Webhook Handler**: Implements webhook handler pattern specified in `docs/architecture.md#Epic-3.1.2`
- **Routing Integration**: Uses RoutingService from Story 1.5 for message routing
- **Adapter Pattern**: Uses TwilioSMSAdapter from Story 1.2 for message conversion
- **Channel Integration**: Works with UnifiedMessage format from Story 1.1

### Dependencies

- **Story 1.1**: Channel Abstraction Interface Design - Provides UnifiedMessage type for routing
- **Story 1.2**: SMS Channel Adapter - Provides TwilioSMSAdapter for message conversion
- **Story 1.5**: Message Routing Logic - Provides RoutingService and routeWebhookMessage() Cloud Function

### Project Structure Notes

- **Webhook Handler**: `functions/src/channels/sms.ts` - Update existing webhook handler
- **Routing Function**: `functions/src/routing.ts` - Use existing routeWebhookMessage() function
- **SMS Adapter**: `src/services/channels/sms.ts` - Use existing TwilioSMSAdapter
- **Retry Collection**: `pending_retry` - New Firestore collection for failed messages (optional)

**No Conflicts Detected**: This story completes existing webhook handler implementation without breaking changes.

### Learnings from Previous Story

**From Story 1.5: Message Routing Logic (Status: review)**

- **Routing Service**: `RoutingService` available at `src/services/routing.ts` - use `routeMessage()` method for routing
- **Cloud Function Routing**: `routeWebhookMessage()` Cloud Function available at `functions/src/routing.ts` - use this for webhook routing with Admin SDK
- **Routing Result**: `RoutingResult` interface includes `threadId`, `confidence`, `method`, `reason` fields - check threadId to determine if routing succeeded
- **Thread Creation**: `createThreadForMessage()` method available in routing service - use this when routing returns null
- **Channel Sources**: `updateChannelSourcesForMessage()` method available in threads service - use this when routing messages to threads
- **Routing Logging**: Routing decisions are logged to `routing_logs` collection - use this for debugging and analytics
- **Organization Scoping**: Routing requires organizationId - ensure webhook handler extracts organizationId from request or environment

[Source: docs/stories/1-5-message-routing-logic.md#Dev-Agent-Record]

### References

- [Source: docs/epics.md#Story-1.6] - Story requirements and acceptance criteria
- [Source: docs/architecture.md#Epic-3.1.2] - SMS Integration architecture specification
- [Source: docs/architecture.md#Message-Routing-Pattern] - Message routing pattern for webhook integration
- [Source: functions/src/channels/sms.ts] - Existing webhook handler implementation
- [Source: functions/src/routing.ts] - Routing Cloud Function for webhook routing
- [Source: src/services/routing.ts] - RoutingService for routing logic
- [Source: src/services/channels/sms.ts] - TwilioSMSAdapter for message conversion
- [Source: src/types/Channel.ts] - UnifiedMessage type for routing
- [Source: docs/stories/1-1-channel-abstraction-interface-design.md] - Channel abstraction interface design
- [Source: docs/stories/1-2-sms-channel-adapter-twilio-integration.md] - SMS adapter implementation
- [Source: docs/stories/1-5-message-routing-logic.md] - Message routing logic implementation

## Dev Agent Record

### Context Reference

- docs/stories/1-6-sms-webhook-handler.context.xml

### Agent Model Used

Claude Sonnet 4.5 (via Cursor)

### Debug Log References

- Routing integration completed: routeMessageToThread function created and integrated
- Status update handler fixed: Changed from metadata.channelSpecific.twilioMessageSid to channelMessageId
- Error handling improved: Added payload validation and routing error handling
- Retry logic implemented: retryFailedMessages Cloud Function created with exponential backoff

### Completion Notes List

**Task 1 - Webhook Endpoint Integration:**
- Extracted routing logic from routeWebhookMessage Cloud Function into reusable routeMessageToThread function
- Integrated routeMessageToThread directly into webhook handler for synchronous routing
- Removed temporary incomingMessages collection usage
- Added retry storage for failed routing attempts

**Task 2 - Signature Validation:**
- Verified validateTwilioWebhookSignature uses validateRequest() from Twilio SDK
- Signature validation happens before any processing (already implemented correctly)

**Task 3 - UnifiedMessage Conversion:**
- Verified TwilioSMSAdapter.receive() is called correctly
- Added error handling for invalid webhook payloads with 400 status code

**Task 4 - Routing Integration:**
- Implemented direct call to routeMessageToThread() function
- Routing handles thread creation, channel source updates, and message saving
- Failed routing attempts are stored in pending_retry collection

**Task 5 - Delivery Status Updates:**
- Fixed status update handler to search by channelMessageId instead of nested metadata path
- Added warning log when message is not found for status update

**Task 6 - Twilio Response:**
- Verified TwiML response format is correct
- Response is sent even if routing fails (error handling preserves response)

**Task 7 - Error Handling:**
- Added payload validation with try-catch around adapter.receive()
- Added routing error handling with retry storage
- All errors are logged with context
- Appropriate HTTP status codes returned (400, 403, 405, 500)

**Task 8 - Retry Logic:**
- Created retryFailedMessages Cloud Function (scheduled every 5 minutes)
- Implemented exponential backoff (1 minute base, doubles each retry)
- Maximum 3 retry attempts
- Failed messages moved to failed_messages collection after max retries
- Messages marked as permanentlyFailed for manual review

### File List

**Modified Files:**
- functions/src/routing.ts - Extracted routeMessageToThread function from routeWebhookMessage Cloud Function
- functions/src/channels/sms.ts - Integrated routing, improved error handling, fixed status updates
- functions/src/index.ts - Exported retryFailedMessages function

**New Files:**
- functions/src/retry.ts - Retry logic Cloud Function with exponential backoff

**Files Referenced:**
- functions/src/routing.ts - Helper functions for routing (lookupIdentityByIdentifier, createThreadAdmin, etc.)
- src/services/channels/sms.ts - TwilioSMSAdapter for message conversion
- src/services/channels/twilioStatusMapper.ts - Status mapping utility

