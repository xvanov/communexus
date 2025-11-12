# Communexus Phase 3 - Epic Breakdown

**Author:** BMad
**Date:** 2025-01-02
**Project Level:** 3
**Target Scale:** Enterprise
**Related Document:** [PRD-Phase3-Addendum.md](./PRD-Phase3-Addendum.md)

---

## Overview

This document provides the detailed epic breakdown for Communexus Phase 3, expanding on the Phase 3 roadmap in the [PRD-Phase3-Addendum.md](./PRD-Phase3-Addendum.md).

Each epic includes:

- Expanded goal and value proposition
- Complete story breakdown with user stories
- Acceptance criteria for each story
- Story sequencing and dependencies

**Epic Sequencing Principles:**

- Epic 1 establishes foundational infrastructure and initial functionality
- Subsequent epics build progressively, each delivering significant end-to-end value
- Stories within epics are vertically sliced and sequentially ordered
- No forward dependencies - each story builds only on previous work

---

## Epic 1: Multi-Channel Foundation

**Goal:** Establish channel abstraction layer and SMS integration to enable unified messaging across multiple communication platforms.

**Expanded Goal:** Transform Communexus into a unified wrapper around existing messaging platforms. This epic creates the foundational infrastructure that allows messages from different channels (SMS, Messenger, Email) to appear in unified threads. The channel abstraction layer enables future channel integrations without modifying core application logic.

**Value Proposition:** Users can receive messages from SMS in the same thread as in-app messages, enabling seamless communication across channels without switching between apps.

**Estimated Story Count:** 8-12 stories

### Story 1.1: Channel Abstraction Interface Design

As a developer,
I want a standardized channel adapter interface,
So that new channels can be integrated without modifying core messaging logic.

**Acceptance Criteria:**
1. ChannelAdapter interface defined with send(), receive(), and getStatus() methods
2. UnifiedMessage interface defined with all required fields (channel, direction, senderIdentifier, etc.)
3. TypeScript types exported and documented
4. Interface design reviewed and approved

**Prerequisites:** None

---

### Story 1.2: SMS Channel Adapter (Twilio Integration)

As a property manager,
I want to send and receive SMS messages via Twilio,
So that I can communicate with tenants via their phone numbers.

**Acceptance Criteria:**
1. Twilio SDK integrated and configured
2. SMS channel adapter implements ChannelAdapter interface
3. Can send SMS messages via Twilio API
4. Can receive SMS webhooks from Twilio
5. Inbound SMS converted to UnifiedMessage format
6. Outbound SMS converted from UnifiedMessage to Twilio format
7. Error handling for invalid numbers, rate limits, carrier failures
8. Support for international phone numbers

**Prerequisites:** Story 1.1

---

### Story 1.3: Identity Linking System

As a property manager,
I want external phone numbers and emails to be linked to internal user identities,
So that messages from the same person across channels appear in the same thread.

**Acceptance Criteria:**
1. Identity linking data model created (identityLinks collection)
2. Can link phone number to user ID
3. Can link email to user ID
4. Can link Facebook ID to user ID
5. Identity lookup by external identifier returns user ID
6. Multiple external identities can link to same user
7. Identity verification status tracked
8. UI for manually linking identities (admin)

**Prerequisites:** Story 1.1

---

### Story 1.4: Unified Thread Model with Channel Support

As a property manager,
I want messages from different channels to appear in the same thread,
So that I can see the complete conversation history regardless of channel.

**Acceptance Criteria:**
1. Thread data model extended with channelSources array
2. Messages include channel field (sms, messenger, email, in-app)
3. Thread can contain messages from multiple channels
4. Messages display with channel indicator icon
5. Messages display with direction indicator ("Incoming from [Phone: +1-555-0123]")
6. Messages sorted chronologically regardless of channel
7. Thread view shows channel badges for each message
8. Channel filter allows filtering messages by channel

**Prerequisites:** Story 1.2, Story 1.3

---

### Story 1.5: Message Routing Logic

As a property manager,
I want inbound SMS messages to be routed to the correct thread automatically,
So that conversations stay organized without manual assignment.

**Acceptance Criteria:**
1. Message routing service created
2. Routes inbound messages based on participant identity matching
3. Routes messages based on thread metadata (property address, project ID)
4. Uses conversation context (keyword matching) as fallback
5. Manual thread assignment fallback for ambiguous cases
6. Creates new thread if no match found
7. Routing logic handles edge cases (multiple matches, no identity link)
8. Routing decisions logged for debugging

**Prerequisites:** Story 1.4

---

### Story 1.6: SMS Webhook Handler

As a system,
I want to receive SMS webhooks from Twilio,
So that inbound SMS messages are processed in real-time.

**Acceptance Criteria:**
1. Webhook endpoint created for Twilio SMS
2. Webhook validates Twilio request signature
3. Webhook converts Twilio payload to UnifiedMessage
4. Webhook routes message using routing logic
5. Webhook handles delivery status updates
6. Webhook responds correctly to Twilio
7. Error handling for invalid webhooks
8. Webhook retry logic for failed processing

**Prerequisites:** Story 1.5

---

### Story 1.7: Channel Badge UI Component

As a property manager,
I want to see which channel each message came from,
So that I can understand the communication context.

**Acceptance Criteria:**
1. ChannelBadge component created with channel icons (📱 SMS, 💬 Messenger, 📧 Email)
2. Component displays channel type and identifier (phone number, email, name)
3. Component shows direction (incoming/outgoing)
4. Component integrated into message list
5. Component styled consistently with app design
6. Component accessible (screen reader support)
7. Component responsive (mobile and desktop)

**Prerequisites:** Story 1.4

---

### Story 1.8: Channel Selection for Outbound Messages

As a property manager,
I want to choose which channel to send a message via,
So that I can use the most appropriate channel for each situation.

**Acceptance Criteria:**
1. Channel selector UI component created
2. Default channel selection uses last-used channel in thread
3. Context-based exceptions (lease links → both SMS and Email)
4. Channel selector shows available channels for recipient
5. Can override default channel selection
6. Channel selection persists per thread
7. Channel selection logic handles edge cases (no previous channel, multiple channels)

**Prerequisites:** Story 1.7

---

### Story 1.9: SMS Channel Configuration UI

As an administrator,
I want to configure SMS channel settings,
So that Twilio integration works correctly.

**Acceptance Criteria:**
1. SMS channel configuration UI created
2. Can enter Twilio API credentials (account SID, auth token)
3. Can configure Twilio phone number
4. Can configure webhook URL
5. Can test SMS connection
6. Configuration encrypted and stored securely
7. Configuration validation (check credentials work)
8. Error messages for invalid configuration

**Prerequisites:** Story 1.2

---

### Story 1.10: Unified Message List UI

As a property manager,
I want to see all messages from all channels in chronological order,
So that I have a complete view of the conversation.

**Acceptance Criteria:**
1. Message list displays messages from all channels
2. Messages sorted chronologically (regardless of channel)
3. Channel badges visible for each message
4. Direction indicators visible for each message
5. Timestamps formatted correctly with timezone handling
6. Message status (sent, delivered, read) displayed per channel
7. Channel filter allows filtering by channel type
8. Filter state persists in URL/state
9. Performance optimized for large message lists

**Prerequisites:** Story 1.7, Story 1.8

---

## Epic 2: Multi-Channel Expansion

**Goal:** Integrate Facebook Messenger and Email channels to enable communication across SMS, Messenger, and Email in unified threads.

**Expanded Goal:** Expand beyond SMS to include Facebook Messenger (primary for Marketplace inquiries) and Email (primary for formal communications). This enables property managers to receive inquiries from Facebook Marketplace listings and handle formal communications via email, all within the same unified interface.

**Value Proposition:** Property managers can respond to Facebook Marketplace inquiries directly in the app and handle formal communications via email without switching between platforms.

**Estimated Story Count:** 10-14 stories

### Story 2.1: Facebook Messenger API Integration Setup

As a developer,
I want to integrate Facebook Messenger API,
So that we can receive and send messages via Messenger.

**Acceptance Criteria:**
1. Facebook Messenger API SDK integrated
2. Facebook Page connection configured
3. Webhook subscription setup for Messenger events
4. Page access token stored securely
5. API connection tested and verified
6. Error handling for API failures

**Prerequisites:** Epic 1 complete (channel abstraction ready)

---

### Story 2.2: Facebook Messenger Channel Adapter

As a property manager,
I want to send and receive Facebook Messenger messages,
So that I can respond to Marketplace inquiries in the app.

**Acceptance Criteria:**
1. Messenger channel adapter implements ChannelAdapter interface
2. Can send Messenger messages via Facebook API
3. Can receive Messenger webhooks
4. Inbound Messenger messages converted to UnifiedMessage
5. Outbound UnifiedMessage converted to Messenger format
6. Page-scoped user ID mapping handled
7. Messenger-specific features (quick replies, templates) supported
8. Error handling for Messenger API failures

**Prerequisites:** Story 2.1

---

### Story 2.3: Facebook Messenger Webhook Handler

As a system,
I want to receive Messenger webhooks from Facebook,
So that inbound Messenger messages are processed in real-time.

**Acceptance Criteria:**
1. Webhook endpoint created for Facebook Messenger
2. Webhook validates Facebook request signature
3. Webhook handles message events (message, postback, delivery, read)
4. Webhook converts Messenger payload to UnifiedMessage
5. Webhook routes messages using routing logic
6. Webhook responds correctly to Facebook
7. Error handling for invalid webhooks

**Prerequisites:** Story 2.2, Story 1.5 (routing logic)

---

### Story 2.4: Email Channel Integration Setup (SendGrid/SMTP)

As a developer,
I want to integrate email sending/receiving via SendGrid or SMTP,
So that we can send and receive emails.

**Acceptance Criteria:**
1. SendGrid SDK or SMTP library integrated
2. Email service configured (SMTP credentials or SendGrid API key)
3. Dedicated email addresses configured for receiving
4. Email parsing library integrated (for inbound email parsing)
5. Email threading logic implemented
6. Connection tested and verified

**Prerequisites:** Epic 1 complete

---

### Story 2.5: Email Channel Adapter

As a property manager,
I want to send and receive emails,
So that I can handle formal communications via email.

**Acceptance Criteria:**
1. Email channel adapter implements ChannelAdapter interface
2. Can send emails via SendGrid/SMTP
3. Can receive emails (webhook or IMAP polling)
4. Inbound emails parsed and converted to UnifiedMessage
5. Outbound UnifiedMessage converted to email format
6. HTML and plain text email support
7. Email attachments handled (stored and linked)
8. Email threading and conversation linking
9. Error handling for email delivery failures

**Prerequisites:** Story 2.4

---

### Story 2.6: Email Webhook Handler (SendGrid)

As a system,
I want to receive email webhooks from SendGrid,
So that inbound emails are processed in real-time.

**Acceptance Criteria:**
1. Webhook endpoint created for SendGrid email events
2. Webhook validates SendGrid request
3. Webhook handles inbound email events
4. Webhook parses email content (subject, body, attachments)
5. Webhook converts email to UnifiedMessage
6. Webhook routes message using routing logic
7. Webhook handles bounce/spam events
8. Error handling for invalid webhooks

**Prerequisites:** Story 2.5, Story 1.5

---

### Story 2.7: Channel Priority Logic Implementation

As a property manager,
I want the system to automatically select the best channel for outbound messages,
So that messages are sent via the most appropriate channel.

**Acceptance Criteria:**
1. Channel selection logic implements priority rules:
   - Lease signing links → both SMS and Email
   - Facebook Marketplace initial responses → Messenger
   - Property tours/scheduling → SMS
   - Formal documents → Email
   - Default: last-used channel in thread
2. Logic handles edge cases (no previous channel, multiple recipients)
3. Logic considers recipient channel availability
4. Logic can be overridden by user
5. Channel selection logged for debugging

**Prerequisites:** Story 1.8, Story 2.2, Story 2.5

---

### Story 2.8: Facebook Marketplace Integration

As a property manager,
I want Marketplace inquiry responses to automatically link to properties,
So that inquiries are organized by property automatically.

**Acceptance Criteria:**
1. Marketplace post metadata extracted from Messenger webhook
2. Property auto-detection from Marketplace post link/metadata
3. Thread automatically linked to property when detected
4. Marketplace inquiry marked as initial inquiry
5. Channel migration logic (Messenger → SMS for tours)
6. Property context available to AI agent (for Epic 3)

**Prerequisites:** Story 2.3, Epic 3 (property organization)

---

### Story 2.9: Email Threading and Conversation Linking

As a property manager,
I want email replies to be linked to the correct thread,
So that email conversations stay organized.

**Acceptance Criteria:**
1. Email threading logic detects reply threads
2. Email replies linked to existing threads based on:
   - Thread ID in email headers
   - Subject line matching
   - Participant matching
3. New email threads created when no match found
4. Email threading handles forwarded emails
5. Email threading handles CC/BCC participants

**Prerequisites:** Story 2.5

---

### Story 2.10: Multi-Channel Message Status Tracking

As a property manager,
I want to see message delivery status for all channels,
So that I know if messages were delivered and read.

**Acceptance Criteria:**
1. Message status tracking per channel (SMS, Messenger, Email)
2. Status updates received via webhooks (delivered, read)
3. Status displayed in message list with channel-specific indicators
4. Status polling for channels that don't support webhooks
5. Status updates in real-time
6. Status history tracked (sent → delivered → read)

**Prerequisites:** Story 1.10, Story 2.2, Story 2.5

---

### Story 2.11: Channel Configuration UI (Messenger and Email)

As an administrator,
I want to configure Messenger and Email channels,
So that these channels work correctly.

**Acceptance Criteria:**
1. Messenger configuration UI (Facebook Page connection, access token)
2. Email configuration UI (SendGrid API key or SMTP settings)
3. Channel enable/disable toggles
4. Channel connection testing
5. Configuration validation and error messages
6. Secure credential storage

**Prerequisites:** Story 2.2, Story 2.5

---

### Story 2.12: Roomies.com Integration (Optional)

As a property manager,
I want Roomies.com messages integrated if API available,
So that I can handle Roomies inquiries in the app.

**Acceptance Criteria:**
1. Roomies.com API integration (if available)
2. Roomies.com channel adapter created
3. Roomies.com webhook handler (if supported)
4. Roomies.com messages appear in unified threads
5. Graceful degradation if API unavailable

**Prerequisites:** Story 2.2, Story 2.5
**Note:** This story is optional and lower priority than primary channels

---

## Epic 3: AI Agent Participation

**Goal:** Enable AI agent to actively participate in conversations on behalf of users, handling property inquiries, scheduling, and tenant management automatically.

**Expanded Goal:** Implement dual AI agent system (Marketing Agent for prospects, Property Management Agent for tenants) with auto-response capabilities, qualification interviews, scheduling integration, and automatic action item generation. AI agents can work in auto mode (full automation) or manual mode (suggestions only).

**Value Proposition:** Property managers can automate repetitive inquiries and tenant management tasks, focusing on high-value activities while AI handles routine communication.

**Estimated Story Count:** 15-20 stories

### Story 3.1: AI Agent Architecture and Framework

As a developer,
I want an AI agent framework with LangChain,
So that AI agents can use tools and make decisions.

**Acceptance Criteria:**
1. LangChain agent framework integrated
2. Agent base class with tool calling capability
3. Agent configuration system (auto/manual mode, context sources)
4. Agent context management (conversation history, property data)
5. Agent response generation pipeline
6. Agent error handling and fallback logic

**Prerequisites:** Epic 2 complete (channels working)

---

### Story 3.2: Marketing Agent Implementation

As a property manager,
I want a Marketing Agent for prospect inquiries,
So that property questions are answered automatically.

**Acceptance Criteria:**
1. Marketing Agent class extends base agent
2. Marketing Agent personality configured (welcoming, sales-focused)
3. Marketing Agent tools: getPropertyDetails, searchProperties, crossSell
4. Marketing Agent can answer property questions using backend data
5. Marketing Agent can cross-sell alternative properties on disinterest
6. Marketing Agent responses are professional and helpful
7. Marketing Agent escalates to human when needed

**Prerequisites:** Story 3.1

---

### Story 3.3: Property Management Agent Implementation

As a property manager,
I want a Property Management Agent for tenant communications,
So that tenant questions and maintenance requests are handled automatically.

**Acceptance Criteria:**
1. Property Management Agent class extends base agent
2. Property Management Agent personality configured (professional, efficient)
3. Property Management Agent tools: getPropertyRules, createMaintenanceRequest, scheduleRepair
4. Property Management Agent can answer tenant questions
5. Property Management Agent can create maintenance requests
6. Property Management Agent can schedule repairs
7. Property Management Agent responses are professional and problem-solving focused

**Prerequisites:** Story 3.1

---

### Story 3.4: Agent Selection Logic

As a system,
I want to automatically select the correct agent based on user status,
So that prospects get Marketing Agent and tenants get Property Management Agent.

**Acceptance Criteria:**
1. Agent selection logic checks user status (potential_tenant vs tenant)
2. Routes to Marketing Agent for prospects
3. Routes to Property Management Agent for tenants
4. Handles edge cases (user shopping for multiple properties)
5. Agent selection logged for debugging
6. Agent selection can be manually overridden

**Prerequisites:** Story 3.2, Story 3.3

---

### Story 3.5: Conversation-Level AI Mode Toggle

As a property manager,
I want to toggle AI mode per conversation (auto/manual),
So that I can control when AI responds automatically.

**Acceptance Criteria:**
1. Thread data model extended with aiMode field (auto/manual)
2. AI mode toggle UI component created
3. Toggle displayed at top of conversation view
4. Toggle state persists per thread
5. Auto mode: AI responds automatically
6. Manual mode: AI generates suggestions, requires approval
7. Toggle can be changed mid-conversation
8. Mode change takes effect immediately

**Prerequisites:** Story 3.1

---

### Story 3.6: AI Auto-Response System

As a property manager,
I want AI to automatically respond to messages in auto mode,
So that routine inquiries are handled without my intervention.

**Acceptance Criteria:**
1. Auto-response system monitors threads in auto mode
2. On incoming message, AI agent generates response
3. Response sent automatically (no approval needed)
4. Response includes AI attribution (sent by AI)
5. Response logged in conversation history
6. Response includes agent type badge (Marketing/Property Management)
7. Error handling if AI response fails

**Prerequisites:** Story 3.5, Story 3.4

---

### Story 3.7: AI Response Preview (Manual Mode)

As a property manager,
I want to see AI-generated responses before they're sent in manual mode,
So that I can approve or edit them.

**Acceptance Criteria:**
1. AI response preview component created
2. Preview shows AI-generated response text
3. Preview includes approve, reject, and edit buttons
4. Can edit response before sending
5. Approved responses sent immediately
6. Rejected responses dismissed
7. Preview UI matches app design
8. Preview accessible (keyboard navigation)

**Prerequisites:** Story 3.5

---

### Story 3.8: Qualification Interview System

As a property manager,
I want AI to conduct qualification interviews before scheduling showings,
So that only qualified prospects get property tours.

**Acceptance Criteria:**
1. Qualification questions template defined (6 questions)
2. Marketing Agent initiates qualification interview
3. Questions asked one at a time or as list
4. Agent waits for responses
5. Agent evaluates answers against acceptable criteria
6. If all qualified → proceed to scheduling
7. If not qualified → politely decline
8. Qualification results stored in backend

**Prerequisites:** Story 3.2, Epic 4 (backend connector)

---

### Story 3.9: Google Calendar Integration for Scheduling

As a property manager,
I want AI to check calendar availability and schedule showings,
So that property tours are scheduled automatically.

**Acceptance Criteria:**
1. Google Calendar API integrated
2. Backend connector method: getGoogleCalendarAvailability
3. Backend connector method: createGoogleCalendarEvent
4. Marketing Agent queries calendar for available slots
5. Marketing Agent presents available time slots to prospect
6. Marketing Agent creates calendar event when time selected
7. Calendar event includes property address and participant info
8. Confirmation sent via original channel

**Prerequisites:** Story 3.2, Epic 4 (backend connector)

---

### Story 3.10: Mode Switching and Context Preservation

As a property manager,
I want to switch between auto and manual mode mid-conversation,
So that I can take over when needed and AI continues seamlessly after.

**Acceptance Criteria:**
1. Mode switching preserves conversation context
2. When switching to manual: AI pauses responses
3. When switching back to auto: AI reads full conversation context
4. AI determines current stage from conversation history
5. AI continues with appropriate next action
6. AI acknowledges if user already handled next step
7. Context includes property manager messages and AI messages

**Prerequisites:** Story 3.6, Story 3.7

---

### Story 3.11: Backend Connector Integration for Property Data

As an AI agent,
I want to fetch property data from backend systems,
So that I can answer property questions accurately.

**Acceptance Criteria:**
1. Backend connector interface: getProperty(propertyId)
2. Backend connector interface: searchProperties(criteria)
3. Marketing Agent uses connector to fetch property details
4. Marketing Agent uses property data in responses
5. Error handling if backend unavailable (graceful degradation)
6. Caching for frequently accessed properties

**Prerequisites:** Story 3.2, Epic 4 (backend connector interface)

---

### Story 3.12: Automatic Action Item Generation

As a property manager,
I want AI to automatically generate action items from conversations,
So that I don't miss important tasks.

**Acceptance Criteria:**
1. Action item extraction analyzes conversation context
2. Action items generated at key stages:
   - After showing → follow-up tasks
   - After application approved → move-in prep tasks
   - During move-in → move-in execution tasks
   - After move-in → welcome tasks
   - During maintenance → repair tasks
3. Action items stored in actionItems collection
4. Action items linked to thread and property
5. Action items visible in thread view sidebar
6. Action items visible in property dashboard

**Prerequisites:** Story 3.2, Story 3.3, Epic 4 (property organization)

---

### Story 3.13: Action Item Templates System

As a system,
I want stage-specific action item templates,
So that appropriate tasks are generated for each conversation stage.

**Acceptance Criteria:**
1. Action item templates defined per stage (prospect, showing, application, move_in_prep, move_in, post_move_in, maintenance)
2. Templates include required and optional tasks
3. Templates include priority and order
4. AI agent uses templates to generate action lists
5. Templates can be customized per organization
6. Templates include conditions (property type, etc.)

**Prerequisites:** Story 3.12

---

### Story 3.14: Action List UI Component

As a property manager,
I want to see and manage action items in the conversation view,
So that I can track tasks without leaving the thread.

**Acceptance Criteria:**
1. ActionList component created
2. Displays action items as checkbox list
3. Can toggle action items complete
4. Shows auto-generated badge for AI-generated items
5. Can add custom action items manually
6. Action items sorted by priority and order
7. Completed items visually distinct
8. Action list visible in thread sidebar
9. Action list also visible in property dashboard

**Prerequisites:** Story 3.12

---

### Story 3.15: Agent Escalation Rules

As a property manager,
I want AI to escalate to human for complex or sensitive topics,
So that important issues are handled personally.

**Acceptance Criteria:**
1. Escalation rules configured (trigger keywords, complexity threshold, sensitive topics)
2. AI agent detects escalation triggers
3. AI agent notifies user when escalation needed
4. AI agent pauses responses until user takes over
5. Escalation reasons logged
6. Escalation rules customizable per organization

**Prerequisites:** Story 3.6

---

### Story 3.16: Cross-Selling Intelligence

As a property manager,
I want AI to suggest alternative properties when prospects show disinterest,
So that I don't lose potential tenants.

**Acceptance Criteria:**
1. Marketing Agent detects disinterest signals ("too expensive", "too far", etc.)
2. Agent searches for alternative properties matching stated preferences
3. Agent presents 2-3 alternatives with brief descriptions
4. Agent asks if alternatives work better
5. If prospect interested → continue with alternative property
6. Cross-selling results logged

**Prerequisites:** Story 3.2, Story 3.11

---

## Epic 4: Property/Project Organization System

**Goal:** Organize all communications by property address, project location, or other hierarchical structure for better management and legal compliance.

**Expanded Goal:** Implement hierarchical organization system (Organization → Properties → Threads) with property auto-assignment, folder views, and property-based filtering. This enables property managers to organize communications by property address for legal/documentation purposes.

**Value Proposition:** Property managers can see all communications for a property in one place, making it easier to manage tenant relationships and export records for legal purposes.

**Estimated Story Count:** 8-12 stories

### Story 4.1: Organization Data Model

As a system,
I want an organization data model,
So that multiple properties can be organized under one organization.

**Acceptance Criteria:**
1. Organization collection created with fields: id, name, type, settings, createdAt
2. Organization type: property_management, contractor, custom
3. Organization settings: backendConnector, aiAgentEnabled, defaultChannels
4. Organization billing account ID (single account per organization)
5. Data model validated and documented

**Prerequisites:** None

---

### Story 4.2: Property Data Model

As a system,
I want a property data model,
So that communications can be organized by property address.

**Acceptance Criteria:**
1. Property collection created with fields: id, organizationId, address, propertyType, metadata, threadIds, externalId, tenants, potentialTenants, createdAt
2. Address structure: street, city, state, zip, country
3. Property type: residential, commercial, mixed
4. Property metadata: units, bedrooms, bathrooms, squareFootage, custom fields
5. Property linked to threads via threadIds array
6. Property linked to external backend via externalId
7. Data model validated and documented

**Prerequisites:** Story 4.1

---

### Story 4.3: Property Creation and Management UI

As a property manager,
I want to create and manage properties,
So that I can organize communications by property address.

**Acceptance Criteria:**
1. Property creation form (address, type, metadata)
2. Property list view (all properties for organization)
3. Property detail view (property info, associated threads, tenants)
4. Property edit/update functionality
5. Property deletion (with confirmation)
6. Property search and filtering
7. UI responsive (mobile and desktop)

**Prerequisites:** Story 4.2

---

### Story 4.4: Thread-Property Assignment

As a property manager,
I want to assign threads to properties,
So that communications are organized by property.

**Acceptance Criteria:**
1. Thread data model extended with propertyId field
2. Property assignment UI in thread view
3. Can assign thread to property during creation
4. Can assign existing thread to property
5. Can reassign thread to different property
6. Can unassign thread from property
7. Property's thread list updated when assigned
8. Thread assignment persisted

**Prerequisites:** Story 4.2, Story 4.3

---

### Story 4.5: Property Auto-Assignment with AI

As a property manager,
I want threads to be automatically assigned to properties,
So that I don't have to manually organize every conversation.

**Acceptance Criteria:**
1. Property detection logic analyzes message content
2. Extracts address if mentioned in message
3. Extracts property link/URL if provided
4. Matches against existing properties in database
5. Auto-assigns thread to detected property
6. Property detection from Facebook Marketplace post metadata
7. AI disambiguation if multiple properties match (asks user)
8. Fallback to manual assignment if detection fails

**Prerequisites:** Story 4.4, Epic 3 (AI agent)

---

### Story 4.6: Property Folder View UI

As a property manager,
I want to see all threads organized by property in a folder view,
So that I can quickly navigate to property-specific conversations.

**Acceptance Criteria:**
1. Property folder view component created
2. Shows properties in hierarchical structure:
   ```
   📁 Properties
     📍 123 Main St, Durham NC
       ├── 💬 Tenant Inquiry (2 messages)
       ├── 📱 Maintenance Request (5 messages)
       └── 📧 Lease Agreement Discussion (12 messages)
   ```
3. Can expand/collapse property folders
4. Shows message count per thread
5. Shows channel indicators per thread
6. Clicking thread opens conversation view
7. Can create new thread for property from folder view

**Prerequisites:** Story 4.3, Story 4.4

---

### Story 4.7: Property-Based Filtering and Search

As a property manager,
I want to filter threads by property and search across properties,
So that I can find conversations quickly.

**Acceptance Criteria:**
1. Filter threads by property address
2. Filter threads by property type
3. Search across all properties
4. Search results show property context
5. Filter state persists in URL/state
6. Filter works with message list
7. Filter performance optimized

**Prerequisites:** Story 4.6

---

### Story 4.8: Property Details Panel

As a property manager,
I want to see property details and all associated threads in one view,
So that I have complete context for property management.

**Acceptance Criteria:**
1. Property details panel component created
2. Shows property metadata (address, type, units, etc.)
3. Shows all threads for property
4. Shows tenants and potential tenants
5. Quick actions: create thread, export all communications
6. Panel can be expanded/collapsed
7. Panel responsive (mobile and desktop)

**Prerequisites:** Story 4.3, Story 4.6

---

### Story 4.9: Property Dashboard View

As a property manager,
I want a dashboard view for each property,
So that I can see property overview and associated tasks.

**Acceptance Criteria:**
1. Property dashboard page created
2. Shows property summary (address, type, tenants)
3. Shows recent threads for property
4. Shows action items for property (from Epic 3)
5. Shows property statistics (message count, tenant count)
6. Quick actions: create thread, export communications
7. Dashboard responsive (mobile and desktop)

**Prerequisites:** Story 4.8, Epic 3 (action items)

---

### Story 4.10: Property Suggestion Algorithm

As a system,
I want to suggest properties when auto-assignment fails,
So that manual assignment is easier.

**Acceptance Criteria:**
1. Property suggestion algorithm created
2. Suggests recent properties (last 30 days)
3. Suggests properties with similar addresses mentioned
4. Suggests properties with active inquiries
5. Suggests user's most accessed properties
6. Returns top 5 suggestions ranked by relevance
7. Suggestions displayed in UI for user selection

**Prerequisites:** Story 4.5

---

## Epic 5: Web Embeddable Architecture

**Goal:** Enable Communexus to be embedded into web applications (rental management platforms, contractor tools, etc.) via SDK and components.

**Expanded Goal:** Create React component library and JavaScript SDK for embedding Communexus messaging interface into web applications. Support white-label theming, custom branding, and flexible integration modes (full embedding, widget, thread view only).

**Value Proposition:** Third-party applications can integrate Communexus messaging capabilities without building their own messaging infrastructure.

**Estimated Story Count:** 10-14 stories

### Story 5.1: Embeddable SDK Architecture Design

As a developer,
I want an embeddable SDK architecture design,
So that Communexus can be integrated into web applications.

**Acceptance Criteria:**
1. SDK architecture documented (React components + JavaScript SDK)
2. SDK API design (initialization, methods, callbacks)
3. Integration modes defined (full embedding, widget, thread view)
4. Authentication flow designed
5. Data sync strategy designed
6. Architecture reviewed and approved

**Prerequisites:** Epic 1-4 complete (core features working)

---

### Story 5.2: React Component Library Foundation

As a developer,
I want a React component library for embedding Communexus,
So that React applications can integrate messaging easily.

**Acceptance Criteria:**
1. React component library project structure created
2. Build system configured (webpack/vite)
3. Component library exports configured
4. TypeScript configured
5. Storybook setup for component development
6. Basic component structure (CommunexusEmbedded)

**Prerequisites:** Story 5.1

---

### Story 5.3: CommunexusEmbedded Main Component

As a developer,
I want a main CommunexusEmbedded React component,
So that I can embed messaging into my React app.

**Acceptance Criteria:**
1. CommunexusEmbedded component created
2. Component accepts props: apiKey, userId, organizationId, backendConnector, config
3. Component renders messaging interface
4. Component handles authentication
5. Component connects to Communexus backend
6. Component responsive (mobile and desktop)
7. Component documented with examples

**Prerequisites:** Story 5.2

---

### Story 5.4: JavaScript SDK (Vanilla JS)

As a developer,
I want a vanilla JavaScript SDK,
So that non-React applications can integrate Communexus.

**Acceptance Criteria:**
1. JavaScript SDK class created (CommunexusSDK)
2. SDK initialization method
3. SDK embed method (embeds into DOM element)
4. SDK API methods: createThread, sendMessage, getThreads
5. SDK event callbacks: onMessageSent, onThreadCreated, onPropertySelected
6. SDK handles authentication
7. SDK documented with examples

**Prerequisites:** Story 5.1

---

### Story 5.5: Theming System

As a developer,
I want to customize Communexus appearance with themes,
So that it matches my application's branding.

**Acceptance Criteria:**
1. Theme configuration interface defined (primaryColor, secondaryColor, backgroundColor, textColor, fontFamily, borderRadius, logoUrl, showBranding)
2. Theme system implemented (CSS variables or theme provider)
3. White-label support (custom logo, colors, fonts)
4. Branding removal option
5. Theme applied to all components
6. Theme examples provided
7. Theme documentation

**Prerequisites:** Story 5.3

---

### Story 5.6: Widget Mode (Floating Chat)

As a developer,
I want to embed Communexus as a floating chat widget,
So that users can access messaging without leaving the page.

**Acceptance Criteria:**
1. Widget mode component created
2. Floating chat button (like Intercom)
3. Chat window opens/closes on button click
4. Widget positioned (bottom-right default, configurable)
5. Widget responsive (mobile and desktop)
6. Widget can be minimized/maximized
7. Widget styling matches theme

**Prerequisites:** Story 5.3, Story 5.5

---

### Story 5.7: Thread View Only Mode

As a developer,
I want to embed only a single thread view,
So that I can show specific conversations in my app.

**Acceptance Criteria:**
1. Thread view only mode component created
2. Component accepts threadId prop
3. Component renders single thread conversation
4. Component allows sending messages
5. Component handles thread not found
6. Component responsive

**Prerequisites:** Story 5.3

---

### Story 5.8: Property Folder View Mode

As a developer,
I want to embed property folder view,
So that I can show property-organized threads in my app.

**Acceptance Criteria:**
1. Property folder view mode component created
2. Component accepts propertyId or organizationId prop
3. Component renders property folder structure
4. Component allows selecting threads
5. Component allows creating new threads
6. Component responsive

**Prerequisites:** Story 5.3, Epic 4 (property organization)

---

### Story 5.9: SDK Authentication Integration

As a developer,
I want SDK to handle authentication with my app's auth system,
So that users don't need separate Communexus accounts.

**Acceptance Criteria:**
1. SDK authentication flow designed
2. Web app passes user token to SDK
3. SDK validates token with Communexus backend
4. SDK handles token refresh
5. SDK handles authentication errors
6. Authentication documented

**Prerequisites:** Story 5.3, Story 5.4

---

### Story 5.10: SDK Data Sync with Backend Connector

As a developer,
I want SDK to sync data with my backend via connector,
So that property data and calendar info are available.

**Acceptance Criteria:**
1. SDK accepts backendConnector prop
2. SDK connects to Communexus backend + custom backend
3. Data sync strategy implemented
4. SDK handles backend connector errors
5. SDK handles offline scenarios
6. Data sync documented

**Prerequisites:** Story 5.3, Epic 4 (backend connector)

---

### Story 5.11: SDK Event Callbacks

As a developer,
I want SDK event callbacks,
So that I can react to messaging events in my app.

**Acceptance Criteria:**
1. Event callback system implemented
2. Callbacks: onMessageSent, onThreadCreated, onPropertySelected, onActionItemCreated
3. Callbacks receive event data
4. Callbacks can be registered/unregistered
5. Callback examples provided
6. Callbacks documented

**Prerequisites:** Story 5.3, Story 5.4

---

### Story 5.12: SDK Integration Documentation

As a developer,
I want comprehensive SDK integration documentation,
So that I can integrate Communexus into my app easily.

**Acceptance Criteria:**
1. SDK integration guide created
2. React integration examples
3. Vanilla JS integration examples
4. Authentication setup guide
5. Backend connector setup guide
6. Theming guide
7. API reference documentation
8. Troubleshooting guide

**Prerequisites:** Story 5.1-5.11

---

### Story 5.13: SDK Package Distribution

As a developer,
I want SDK available as npm package,
So that I can install it easily in my project.

**Acceptance Criteria:**
1. SDK published to npm (or private registry)
2. Package includes React components and JS SDK
3. Package includes TypeScript types
4. Package includes documentation
5. Package versioning strategy
6. Package installation instructions

**Prerequisites:** Story 5.12

---

## Epic 6: Backend Connector System

**Goal:** Enable Communexus to integrate with external backends (property management systems, CRM, etc.) via a pluggable connector system.

**Expanded Goal:** Create BackendConnector interface with methods for property data, calendar availability, prospect qualification, application forms, and custom data. Implement built-in connectors (Firebase, REST, GraphQL) and connector registry system.

**Value Proposition:** Property management systems can integrate with Communexus without modifying Communexus code, enabling AI agents to access property data and calendar information.

**Estimated Story Count:** 12-16 stories

### Story 6.1: Backend Connector Interface Specification

As a developer,
I want a BackendConnector interface specification,
So that I can implement connectors for different backends.

**Acceptance Criteria:**
1. BackendConnector interface defined with methods:
   - getProperty, getProperties, searchProperties
   - getAvailability, createAppointment, getGoogleCalendarAvailability, createGoogleCalendarEvent
   - checkProspectQualification, storeQualificationResults
   - getApplicationFormLink, checkApplicationStatus
   - getUser, getContacts, linkIdentity
   - getCustomData, updateCustomData
2. Interface error handling specified
3. Interface retry logic specified
4. Interface timeout handling specified
5. Interface documented with examples

**Prerequisites:** None

---

### Story 6.2: Backend Connector Base Implementation

As a developer,
I want a base BackendConnector implementation,
So that connector implementations have common functionality.

**Acceptance Criteria:**
1. Base BackendConnector class created
2. Base class includes error handling
3. Base class includes retry logic
4. Base class includes timeout handling
5. Base class includes circuit breaker pattern
6. Base class includes caching
7. Base class documented

**Prerequisites:** Story 6.1

---

### Story 6.3: Firebase/Firestore Connector (Default)

As a developer,
I want a Firebase connector as the default backend,
So that Communexus works out of the box with Firebase.

**Acceptance Criteria:**
1. FirebaseConnector extends base connector
2. Implements all BackendConnector interface methods
3. Connects to Firestore for property data
4. Connects to Firebase for user data
5. Error handling for Firebase errors
6. Connector tested and documented

**Prerequisites:** Story 6.2

---

### Story 6.4: REST API Connector

As a developer,
I want a REST API connector,
So that I can integrate with any REST-based backend.

**Acceptance Criteria:**
1. RESTConnector extends base connector
2. Connector accepts base URL and API credentials
3. Connector implements all BackendConnector methods via REST calls
4. Connector handles REST errors (4xx, 5xx)
5. Connector handles authentication (API key, OAuth)
6. Connector handles rate limiting
7. Connector tested and documented

**Prerequisites:** Story 6.2

---

### Story 6.5: GraphQL Connector

As a developer,
I want a GraphQL connector,
So that I can integrate with GraphQL-based backends.

**Acceptance Criteria:**
1. GraphQLConnector extends base connector
2. Connector accepts GraphQL endpoint and credentials
3. Connector implements all BackendConnector methods via GraphQL queries/mutations
4. Connector handles GraphQL errors
5. Connector handles authentication
6. Connector tested and documented

**Prerequisites:** Story 6.2

---

### Story 6.6: Connector Registry System

As a system,
I want a connector registry system,
So that connectors can be registered and retrieved by organization.

**Acceptance Criteria:**
1. Connector registry service created
2. Can register connector per organization
3. Can retrieve connector for organization
4. Connector configuration stored securely
5. Connector configuration encrypted
6. Registry handles connector lifecycle (create, update, delete)
7. Registry documented

**Prerequisites:** Story 6.1

---

### Story 6.7: Connector Configuration UI

As an administrator,
I want to configure backend connectors,
So that Communexus can access my property management system.

**Acceptance Criteria:**
1. Connector configuration UI created
2. Can select connector type (Firebase, REST, GraphQL, Custom)
3. Can enter connector credentials
4. Can test connector connection
5. Configuration validation
6. Secure credential storage
7. Configuration UI responsive

**Prerequisites:** Story 6.6

---

### Story 6.8: Google Calendar Integration in Connector

As a property manager,
I want AI to access my Google Calendar for scheduling,
So that property showings can be scheduled automatically.

**Acceptance Criteria:**
1. Google Calendar API integration in connector
2. Connector method: getGoogleCalendarAvailability(calendarId, dateRange)
3. Connector method: createGoogleCalendarEvent(event)
4. OAuth 2.0 authentication for Google Calendar
5. Calendar availability returned as time slots
6. Calendar events created with property details
7. Error handling for calendar API failures

**Prerequisites:** Story 6.2, Epic 3 (AI agent)

---

### Story 6.9: Property Data Integration

As an AI agent,
I want to fetch property data from backend connector,
So that I can answer property questions accurately.

**Acceptance Criteria:**
1. Connector method: getProperty(propertyId) implemented in all connectors
2. Connector method: getProperties(organizationId) implemented
3. Connector method: searchProperties(criteria) implemented
4. Property data normalized to Communexus format
5. Error handling if property not found
6. Caching for frequently accessed properties

**Prerequisites:** Story 6.3, Story 6.4, Story 6.5

---

### Story 6.10: Prospect Qualification Integration

As an AI agent,
I want to store qualification results in backend,
So that qualification data is persisted.

**Acceptance Criteria:**
1. Connector method: checkProspectQualification(prospectId, answers)
2. Connector method: storeQualificationResults(prospectId, results)
3. Qualification results stored in backend
4. Qualification results retrieved by AI agent
5. Qualification data format standardized
6. Error handling for qualification failures

**Prerequisites:** Story 6.2, Epic 3 (qualification system)

---

### Story 6.11: Application Form Integration

As an AI agent,
I want to get application form links from backend,
So that I can send application forms to prospects.

**Acceptance Criteria:**
1. Connector method: getApplicationFormLink(propertyId, prospectId)
2. Connector method: checkApplicationStatus(prospectId, applicationId)
3. Application form links retrieved from backend
4. Application status checked via backend
5. AI agent uses links in responses
6. Error handling if application system unavailable

**Prerequisites:** Story 6.2, Epic 3 (AI agent)

---

### Story 6.12: Custom Data Integration

As a developer,
I want to access custom data from backend via connector,
So that I can extend Communexus with custom functionality.

**Acceptance Criteria:**
1. Connector method: getCustomData(entityType, entityId)
2. Connector method: updateCustomData(entityType, entityId, data)
3. Custom data retrieved and stored via connector
4. Custom data format flexible (any JSON)
5. Error handling for custom data operations
6. Custom data documented

**Prerequisites:** Story 6.2

---

### Story 6.13: Connector Error Handling and Resilience

As a system,
I want robust error handling for backend connectors,
So that Communexus works even if backend is temporarily unavailable.

**Acceptance Criteria:**
1. Circuit breaker pattern implemented
2. Retry logic with exponential backoff
3. Timeout handling per method
4. Partial data handling (return partial data with warnings)
5. Authentication failure handling (token refresh)
6. Rate limiting handling
7. Fallback to cache when backend unavailable
8. Error handling documented

**Prerequisites:** Story 6.2

---

### Story 6.14: Connector Testing and Documentation

As a developer,
I want connector testing and documentation,
So that I can implement connectors correctly.

**Acceptance Criteria:**
1. Connector testing guide created
2. Mock connector for testing
3. Connector implementation examples
4. Connector best practices documented
5. Connector troubleshooting guide
6. Connector API reference

**Prerequisites:** Story 6.1-6.13

---

## Epic 7: Legal Compliance Export & Polish

**Goal:** Enable users to export and print complete communication threads for legal/dispute resolution, and polish all Phase 3 features.

**Expanded Goal:** Implement PDF/Text/JSON export functionality with legal compliance formatting, print-friendly layouts, and comprehensive export options. Polish all Phase 3 features with performance optimization, error handling improvements, and user experience enhancements.

**Value Proposition:** Property managers can export complete communication records for court-admissible documentation, ensuring legal compliance for dispute resolution.

**Estimated Story Count:** 8-12 stories

### Story 7.1: PDF Export Implementation

As a property manager,
I want to export threads as PDF,
So that I have court-admissible documentation.

**Acceptance Criteria:**
1. PDF export library integrated
2. PDF export function creates complete thread PDF
3. PDF includes all messages with channel indicators
4. PDF includes timestamps with timezone
5. PDF includes participant identities (phone, email, names)
6. PDF includes message status (sent, delivered, read)
7. PDF includes thread metadata (property address, dates, participants)
8. PDF formatted with legal headers
9. PDF print-friendly (page breaks, headers, footers)

**Prerequisites:** Epic 1-6 complete

---

### Story 7.2: Legal Header and Formatting

As a property manager,
I want exported PDFs to have legal headers,
So that they are suitable for court-admissible documentation.

**Acceptance Criteria:**
1. Legal header includes: Thread ID, Property address, Participants, Export date, Exported by
2. Legal header formatted consistently
3. Message list formatted chronologically
4. Channel indicators clearly visible
5. Page breaks between major sections
6. Footer with export timestamp and user information
7. Export format suitable for legal use

**Prerequisites:** Story 7.1

---

### Story 7.3: Text Export Implementation

As a property manager,
I want to export threads as plain text,
So that I can copy text easily or attach to emails.

**Acceptance Criteria:**
1. Text export function creates plain text file
2. Text includes all messages with channel indicators
3. Text includes timestamps
4. Text includes participant information
5. Text format suitable for email attachments
6. Text export performs well for large threads

**Prerequisites:** Story 7.1

---

### Story 7.4: JSON Export Implementation

As a developer,
I want to export threads as JSON,
So that I can import data into other systems.

**Acceptance Criteria:**
1. JSON export function creates machine-readable JSON file
2. JSON includes all message metadata
3. JSON includes thread metadata
4. JSON format structured and documented
5. JSON export suitable for legal document management systems
6. JSON export performs well for large threads

**Prerequisites:** Story 7.1

---

### Story 7.5: Bulk Export (All Threads for Property)

As a property manager,
I want to export all threads for a property at once,
So that I have complete property communication records.

**Acceptance Criteria:**
1. Bulk export function exports all threads for property
2. Export can be PDF, Text, or JSON format
3. Export organized by thread
4. Export includes property summary
5. Export performs well for properties with many threads
6. Export progress indication for large exports

**Prerequisites:** Story 7.1, Story 7.2, Story 7.3, Story 7.4

---

### Story 7.6: Large Thread Export Handling

As a property manager,
I want large thread exports to be handled efficiently,
So that I can export threads with thousands of messages.

**Acceptance Criteria:**
1. Export handles large threads (10,000+ messages)
2. Export pagination for PDF (100 messages per page)
3. Export chunking for very large threads (1000 messages per chunk)
4. Progress indication for long exports
5. Streaming export for very large threads (multiple PDF files)
6. Export timeout handling (5 minutes max)
7. Background export for large threads (notification when ready)

**Prerequisites:** Story 7.1

---

### Story 7.7: Media File Handling in Exports

As a property manager,
I want media files included in exports,
So that complete communication records include images and files.

**Acceptance Criteria:**
1. Images embedded in PDF exports
2. Videos included as links/thumbnails in PDF (PDF limitation)
3. Files included as links/thumbnails in PDF
4. Separate media export option (ZIP file with all media)
5. Media organized by date in separate export
6. Media size limits handled (50MB per file, 500MB total)
7. Oversized media skipped with warning

**Prerequisites:** Story 7.1

---

### Story 7.8: Export UI Components

As a property manager,
I want an export button and options dialog,
So that I can easily export threads.

**Acceptance Criteria:**
1. Export button in thread view
2. Export options dialog (format selection, date range, include media, include metadata)
3. Export progress indicator
4. Export completion notification
5. Export download link
6. Bulk export option in property dashboard
7. UI responsive and accessible

**Prerequisites:** Story 7.1, Story 7.5

---

### Story 7.9: Export Completeness Verification

As a system,
I want to verify export completeness,
So that all messages are included in exports.

**Acceptance Criteria:**
1. Export completeness check verifies all messages included
2. Missing messages warning displayed
3. Missing messages metadata included in export
4. Message ordering verified (chronological)
5. Duplicate detection and handling
6. Export completeness logged

**Prerequisites:** Story 7.1

---

### Story 7.10: Performance Optimization

As a property manager,
I want Phase 3 features to perform well,
So that the app is responsive and fast.

**Acceptance Criteria:**
1. Message list rendering optimized (virtualization for large lists)
2. Channel routing performance optimized
3. AI agent response time optimized (<5s for responses)
4. Property auto-assignment performance optimized
5. Export generation performance optimized (<10s for 1000 messages)
6. Database queries optimized
7. API calls optimized (batching, caching)

**Prerequisites:** Epic 1-6 complete

---

### Story 7.11: Error Handling Improvements

As a property manager,
I want robust error handling,
So that the app handles failures gracefully.

**Acceptance Criteria:**
1. Channel delivery failures handled gracefully
2. Backend connector failures handled gracefully
3. AI agent failures handled gracefully (fallback to human)
4. Export failures handled gracefully
5. User-friendly error messages
6. Error recovery mechanisms
7. Error logging for debugging

**Prerequisites:** Epic 1-6 complete

---

### Story 7.12: User Experience Polish

As a property manager,
I want a polished user experience,
So that Phase 3 features are easy to use.

**Acceptance Criteria:**
1. UI consistency across all Phase 3 features
2. Loading states for async operations
3. Success/error notifications
4. Tooltips and help text
5. Keyboard navigation support
6. Mobile responsiveness
7. Accessibility improvements (screen reader support)
8. User testing and feedback incorporation

**Prerequisites:** Epic 1-6 complete

---

## Story Guidelines Reference

**Story Format:**

```
**Story [EPIC.N]: [Story Title]**

As a [user type],
I want [goal/desire],
So that [benefit/value].

**Acceptance Criteria:**
1. [Specific testable criterion]
2. [Another specific criterion]
3. [etc.]

**Prerequisites:** [Dependencies on previous stories, if any]
```

**Story Requirements:**

- **Vertical slices** - Complete, testable functionality delivery
- **Sequential ordering** - Logical progression within epic
- **No forward dependencies** - Only depend on previous work
- **AI-agent sized** - Completable in 2-4 hour focused session
- **Value-focused** - Integrate technical enablers into value-delivering stories

---

**For implementation:** Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown.

