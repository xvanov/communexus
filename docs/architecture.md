# Decision Architecture

## Executive Summary

This architecture document defines the technical decisions for Phase 3 of Communexus, transforming the existing messaging platform into a multi-channel communication wrapper with AI agent participation, property organization, and web embeddable capabilities. All decisions build upon the existing Phase 1 & 2 implementation (React Native/Expo, Firebase, AI features) while extending functionality for SMS, Messenger, Email channels, dual AI agents, and backend connector systems.

---

## Project Initialization

**Note:** This is Phase 3 architecture building on existing Phase 1 & 2 codebase. No new project initialization required.

Existing foundation:
- React Native (Expo SDK 54)
- Firebase (Firestore, Cloud Functions, Auth, Storage, FCM)
- TypeScript strict mode
- Zustand + React Query for state management
- Expo SQLite for local persistence

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| Channel Abstraction | Adapter Pattern with Unified Message Interface | N/A | All Phase 3 epics | Clean separation, extensible, treats existing in-app as channel |
| SMS Provider | Twilio | v4.19.0+ (Node.js SDK) | 3.1 Multi-Channel | Industry standard, comprehensive API, webhook support |
| Messenger Provider | Facebook Messenger API | Graph API v19.0+ | 3.1 Multi-Channel | Required for Marketplace integration, page-scoped user IDs |
| Email Provider | SendGrid | @sendgrid/mail v7.7.0+ | 3.1 Multi-Channel | Mature platform, inbound parsing, webhook support |
| Identity Linking | Firestore `identityLinks` collection | N/A | 3.1 Multi-Channel | Centralized identity mapping, supports multiple external IDs |
| Message Routing | Router service with identity matching + AI classification | N/A | 3.1 Multi-Channel | Routes inbound messages to correct threads via identity + context |
| AI Agent Architecture | Dual agent system (Marketing + Property Management) | LangChain v0.2.0+ | 3.2 AI Participation | Context-aware agents for prospect vs tenant phases |
| Organization Model | Single organization, multi-property hierarchy | N/A | 3.3 Property Organization | Simple tenancy model, all billing to one account |
| Backend Connector | Pluggable interface with secure credential storage | N/A | 3.6 Backend Connector | Flexible integration, encrypted credentials, OAuth support |
| Web Embeddable | React component library + JavaScript SDK | N/A | 3.5 Web Embeddable | Reusable components, white-label support |
| Export Format | PDF primary (pdfkit v0.13.0+), Text/JSON optional | pdfkit v0.13.0+ | 3.4 Legal Export | Court-admissible documentation, print-friendly |

---

## Project Structure

```
communexus/
├── src/
│   ├── components/
│   │   ├── ai/           # Existing AI components
│   │   ├── chat/        # Existing chat components
│   │   ├── common/      # Existing common components
│   │   ├── thread/      # Existing thread components
│   │   └── channels/    # NEW: Channel-specific components
│   │   └── organization/ # NEW: Property/Organization components
│   ├── services/
│   │   ├── messaging.ts # Existing - will be extended
│   │   ├── channels/     # NEW: Channel adapter implementations
│   │   │   ├── sms.ts
│   │   │   ├── messenger.ts
│   │   │   ├── email.ts
│   │   │   └── adapter.ts # Base adapter interface
│   │   ├── routing.ts    # NEW: Message routing logic
│   │   ├── identity.ts   # NEW: Identity linking system
│   │   ├── agents/       # NEW: AI agent system
│   │   │   ├── marketing.ts
│   │   │   ├── propertyManagement.ts
│   │   │   └── agentEngine.ts
│   │   ├── connectors/  # NEW: Backend connector system
│   │   │   ├── interface.ts
│   │   │   ├── firebase.ts
│   │   │   └── rest.ts
│   │   ├── organization.ts # NEW: Property/Organization service
│   │   └── export.ts     # NEW: Export functionality
│   ├── hooks/
│   │   ├── useChannels.ts # NEW: Channel management
│   │   ├── useAgents.ts   # NEW: AI agent hooks
│   │   └── useOrganization.ts # NEW: Property/Org hooks
│   ├── stores/
│   │   ├── channelStore.ts # NEW: Channel state
│   │   └── organizationStore.ts # NEW: Organization state
│   ├── types/
│   │   ├── Channel.ts    # NEW: Channel types
│   │   ├── Organization.ts # NEW: Organization types
│   │   └── Agent.ts      # NEW: Agent types
│   └── utils/
│       └── channelHelpers.ts # NEW: Channel utilities
├── functions/
│   └── src/
│       ├── channels/     # NEW: Channel webhook handlers
│       │   ├── sms.ts
│       │   ├── messenger.ts
│       │   └── email.ts
│       ├── agents/        # NEW: AI agent Cloud Functions
│       │   ├── marketingAgent.ts
│       │   └── propertyManagementAgent.ts
│       └── routing.ts    # NEW: Message routing function
├── sdk/                   # NEW: Web embeddable SDK
│   ├── react/
│   │   └── components/
│   ├── js/
│   │   └── index.ts
│   └── types/
└── docs/
    └── architecture.md   # This document
```

---

## Epic to Architecture Mapping

### Phase 3.1: Multi-Channel Foundation

**Epic 3.1.1: Channel Abstraction Layer**
- **Architecture Components**: `ChannelAdapter` interface, `UnifiedMessage` type
- **Services**: `src/services/channels/adapter.ts`, `src/services/channels/sms.ts`, `src/services/channels/messenger.ts`, `src/services/channels/email.ts`
- **Cloud Functions**: `functions/src/channels/` (webhook handlers)
- **Data Model**: Extended `messages` collection with `channel`, `channelMessageId`, `senderIdentifier`, `recipientIdentifier`

**Epic 3.1.2: SMS Integration (Twilio)**
- **Architecture Components**: `TwilioSMSAdapter` implementation
- **Services**: `src/services/channels/sms.ts`
- **Cloud Functions**: `functions/src/channels/sms.ts` (webhook handler)
- **Data Model**: `channelConfigs` collection for Twilio credentials

**Epic 3.1.3: Facebook Messenger Integration**
- **Architecture Components**: `FacebookMessengerAdapter` implementation
- **Services**: `src/services/channels/messenger.ts`
- **Cloud Functions**: `functions/src/channels/messenger.ts` (webhook handler)
- **Data Model**: `channelConfigs` collection for Facebook credentials

**Epic 3.1.4: Email Integration (SendGrid)**
- **Architecture Components**: `SendGridEmailAdapter` implementation
- **Services**: `src/services/channels/email.ts`
- **Cloud Functions**: `functions/src/channels/email.ts` (webhook handler)
- **Data Model**: `channelConfigs` collection for SendGrid credentials

### Phase 3.2: Identity Linking & Routing

**Epic 3.2.1: Identity Linking System**
- **Architecture Components**: `IdentityService`
- **Services**: `src/services/identity.ts`
- **Data Model**: `identityLinks` collection
- **Hooks**: `src/hooks/useIdentity.ts`

**Epic 3.2.2: Message Routing Logic**
- **Architecture Components**: `RoutingService`
- **Services**: `src/services/routing.ts`
- **Cloud Functions**: `functions/src/routing.ts`
- **Data Model**: Extended `threads` collection with `channelSources`

### Phase 3.3: AI Agent Participation

**Epic 3.3.1: Dual Agent System**
- **Architecture Components**: `MarketingAgent`, `PropertyManagementAgent`
- **Services**: `src/services/agents/marketing.ts`, `src/services/agents/propertyManagement.ts`, `src/services/agents/agentEngine.ts`
- **Cloud Functions**: `functions/src/agents/marketingAgent.ts`, `functions/src/agents/propertyManagementAgent.ts`
- **Data Model**: Extended `threads` collection with `aiMode`, `agentType`

**Epic 3.3.2: Auto-Response System**
- **Architecture Components**: AI Agent Engine with auto-response logic
- **Services**: `src/services/agents/agentEngine.ts`
- **Data Model**: Extended `messages` collection with `sentByAI`, `aiApprovedBy`

### Phase 3.4: Property Organization

**Epic 3.4.1: Organization/Property Hierarchy**
- **Architecture Components**: `OrganizationService`, `PropertyService`
- **Services**: `src/services/organization.ts`
- **Data Model**: `organizations`, `properties` collections
- **Hooks**: `src/hooks/useOrganization.ts`
- **Components**: `src/components/organization/`

**Epic 3.4.2: Property Auto-Assignment**
- **Architecture Components**: Property detection logic (AI-powered)
- **Services**: `src/services/organization.ts` (property detection)
- **Data Model**: Extended `threads` collection with `propertyId`

### Phase 3.5: Backend Connector

**Epic 3.5.1: Backend Connector Interface**
- **Architecture Components**: `BackendConnector` interface
- **Services**: `src/services/connectors/interface.ts`
- **Data Model**: `organizations.settings.backendConnector`

**Epic 3.5.2: Built-in Connectors**
- **Architecture Components**: `FirebaseConnector`, `RESTConnector`
- **Services**: `src/services/connectors/firebase.ts`, `src/services/connectors/rest.ts`

### Phase 3.6: Web Embeddable

**Epic 3.6.1: React Component Library**
- **Architecture Components**: React components for embedding
- **Location**: `sdk/react/components/`
- **Services**: `sdk/react/hooks/`

**Epic 3.6.2: JavaScript SDK**
- **Architecture Components**: Vanilla JavaScript SDK
- **Location**: `sdk/js/`
- **Services**: `sdk/js/index.ts`

### Phase 3.7: Export & Polish

**Epic 3.7.1: Legal Compliance Export**
- **Architecture Components**: Export service with PDF generation
- **Services**: `src/services/export.ts`
- **Data Model**: Export functionality for `messages`, `threads` collections

---

## Technology Stack Details

### Core Technologies (Existing)

- **Mobile**: React Native (Expo SDK 54), TypeScript 5.0+
- **Backend**: Firebase (Firestore, Cloud Functions Node.js 18, Auth, Storage, FCM)
- **State**: Zustand 5.0+, React Query
- **Local Storage**: Expo SQLite

### Phase 3 Additions

- **Channel Providers**: Twilio v4.19.0+ (SMS), Facebook Messenger API Graph v19.0+, SendGrid @sendgrid/mail v7.7.0+ (Email)
- **AI Framework**: LangChain v0.2.0+ (existing, extended for dual agents)
- **PDF Generation**: pdfkit v0.13.0+ or react-pdf for export functionality
- **Backend Connector**: Pluggable interface pattern
- **Web SDK**: React component library + vanilla JavaScript SDK

---

## Version Verification

**Last Verified:** 2025-01-02

### Channel Providers
- **Twilio SDK**: v4.19.0+ (`twilio` npm package)
  - Node.js SDK for SMS/voice integration
  - Webhook support for inbound messages
  - Verify compatibility: https://www.twilio.com/docs/libraries/node
  
- **Facebook Messenger API**: Graph API v19.0+
  - Page-scoped user IDs for Marketplace integration
  - Webhook support for inbound messages
  - Verify compatibility: https://developers.facebook.com/docs/messenger-platform
  
- **SendGrid SDK**: @sendgrid/mail v7.7.0+
  - Node.js SDK for email sending/receiving
  - Inbound parsing for email webhooks
  - Verify compatibility: https://github.com/sendgrid/sendgrid-nodejs

### AI Framework
- **LangChain**: v0.2.0+
  - Compatible with existing Phase 2 implementation
  - Extended for dual agent system (Marketing + Property Management)
  - Verify compatibility: https://github.com/langchain-ai/langchainjs

### PDF Generation
- **pdfkit**: v0.13.0+ (primary choice)
  - Server-side PDF generation for Cloud Functions
  - Alternative: react-pdf for client-side generation
  - Verify compatibility: https://github.com/foliojs/pdfkit

### Version Verification Process
- **Before Implementation**: Verify all versions are current and compatible
- **During Updates**: Check npm registry for latest stable versions
- **Version Strategy**: Prefer LTS/stable versions over latest bleeding edge
- **Compatibility Testing**: Test all integrations with verified versions before deployment
- **Documentation**: Update this section with actual verified versions during implementation

---

## Integration Points

### Channel Integration Flow

```
External Channel (SMS/Messenger/Email)
    ↓
Webhook Handler (Cloud Function)
    ↓
Channel Adapter (Normalize to UnifiedMessage)
    ↓
Identity Linking Service
    ↓
Message Router (Match to Thread)
    ↓
Firestore (Store in unified thread)
    ↓
Mobile App (Real-time listener)
```

### AI Agent Integration Flow

```
Incoming Message (Any Channel)
    ↓
Thread Mode Check (Auto/Manual)
    ↓
AI Agent Selection (Marketing/Property Management)
    ↓
Backend Connector (Fetch Property Data)
    ↓
LangChain Agent (Generate Response)
    ↓
Channel Adapter (Send via Original Channel)
    ↓
Firestore (Store message + AI metadata)
```

---

## Implementation Patterns

### Channel Adapter Pattern

**Pattern**: Adapter pattern for channel abstraction
**Implementation**:
- Base `ChannelAdapter` interface defines contract
- Each channel (SMS, Messenger, Email) implements adapter
- Adapters normalize external APIs to `UnifiedMessage` format
- Existing in-app messaging treated as "in-app" channel

**Example**:
```typescript
class TwilioSMSAdapter implements ChannelAdapter {
  async send(message: ChannelMessage): Promise<ChannelMessageResult> {
    // Convert UnifiedMessage to Twilio format
    // Call Twilio API
    // Return normalized result
  }
  
  receive(webhookPayload: TwilioWebhook): UnifiedMessage {
    // Convert Twilio webhook to UnifiedMessage
    // Extract sender/recipient identifiers
    // Normalize timestamp and status
  }
}
```

### Message Routing Pattern

**Pattern**: Multi-strategy routing with identity-based priority
**Implementation**: `RoutingService` (`src/services/routing.ts`)

**Routing Strategies** (executed in priority order):
1. **Identity-based routing** (highest priority)
   - Uses `IdentityService.lookupByIdentifier()` to resolve sender identifier to user ID
   - Queries threads by participant userId
   - Returns thread with highest confidence (most recent activity)
   - Confidence: 0.9 for recent threads (< 7 days), 0.7 for older threads (< 30 days), 0.5 for very old threads

2. **Metadata-based routing** (medium priority)
   - Extracts property address or project ID from message text or metadata
   - Queries threads by propertyId or projectId
   - Matches threads based on property address keywords
   - Confidence: 0.85 for direct property/project ID match, 0.6 for address keyword match

3. **Context-based routing** (fallback)
   - Extracts keywords from message text (filters stop words)
   - Scores threads based on keyword matches in recent messages
   - Scores threads based on conversation context (property mentions, names, etc.)
   - Returns thread with highest score above threshold (minimum score: 3)
   - Confidence: 0.75 for strong matches (>80% score ratio), 0.6 for moderate matches (>40%)

**Flow**:
```
Incoming UnifiedMessage → RoutingService.routeMessage()
  → Strategy 1: Identity-based routing
    → If match found (confidence > 0.8): Route to thread
    → If no match: Try Strategy 2
  → Strategy 2: Metadata-based routing
    → If match found (confidence > 0.8): Route to thread
    → If no match: Try Strategy 3
  → Strategy 3: Context-based routing
    → If match found (score >= threshold): Route to thread
    → If no match: Create new thread or manual assignment
```

**Manual Assignment Fallback**:
- Messages that cannot be routed automatically are stored in `pending_routing` collection
- UI can display pending messages for manual thread assignment
- `assignUnassignedMessage()` method assigns pending messages to threads

**Thread Creation**:
- If routing fails to find a match, `createThreadForMessage()` creates a new thread
- Uses `IdentityService` to get or create user for sender identifier
- Creates identity link if not already linked
- Initializes thread with `channelSources` array

**Routing Decision Logging**:
- All routing decisions are logged to `routing_logs` collection
- Logs include: method, confidence, reason, message details, thread ID
- Enables debugging, analytics, and improving routing accuracy over time

**Cloud Function Integration**:
- `routeWebhookMessage()` Cloud Function handles routing for webhook messages
- SMS webhook handler stores messages in `incomingMessages` collection for routing
- Routing can be done synchronously or asynchronously via Cloud Function triggers

**Collections**:
- `incomingMessages`: Temporary storage for incoming webhook messages (processed: false)
- `pending_routing`: Messages requiring manual assignment
- `routing_logs`: Routing decision logs for debugging and analytics

### Dual AI Agent Pattern

**Pattern**: Context-aware agent selection
**Implementation**:
- Marketing Agent: Handles prospect phase (inquiries, qualification, scheduling)
- Property Management Agent: Handles tenant phase (maintenance, lease questions)
- Agent selection based on user status (potential_tenant vs tenant)
- Mode switching preserves conversation context

**Agent Selection Logic**:
```typescript
function selectAgent(thread: Thread, user: User): AIAgent {
  if (user.status === 'tenant' || thread.propertyId) {
    return propertyManagementAgent;
  }
  return marketingAgent;
}
```

### Backend Connector Pattern

**Pattern**: Pluggable interface with secure credential storage
**Implementation**:
- Web app provides connector implementation
- Credentials encrypted at rest (Firebase Config/Secrets Manager)
- OAuth 2.0 for authentication where possible
- Circuit breaker pattern for resilience
- Retry logic with exponential backoff

### Property Auto-Assignment Pattern

**Pattern**: AI-driven property detection with manual fallback
**Implementation**:
1. Facebook Marketplace: Extract property from post metadata
2. Message content: AI analyzes address/context clues
3. Keyword matching: Match against existing properties
4. Manual override: User can assign/change property

### Export Pattern

**Pattern**: Streaming export for large threads
**Implementation**:
- PDF generation for threads < 5000 messages (direct)
- Chunked PDF for threads > 5000 messages (background job)
- Progress tracking for user feedback
- Media files exported separately (ZIP archive)

---

## Consistency Rules

### Naming Conventions

**Channel Adapters**: `{Provider}{Channel}Adapter`
- Example: `TwilioSMSAdapter`, `FacebookMessengerAdapter`, `SendGridEmailAdapter`

**Services**: `{Domain}Service`
- Example: `ChannelService`, `RoutingService`, `IdentityService`

**Cloud Functions**: `{Purpose}{Resource}`
- Example: `receiveSMSWebhook`, `processMessageRouting`, `handleAIResponse`

**TypeScript Types**: PascalCase with descriptive names
- Example: `UnifiedMessage`, `ChannelAdapter`, `BackendConnector`

**Firestore Collections**: camelCase, plural
- Example: `identityLinks`, `channelConfigs`, `actionItems`

### Code Organization

**Channel Adapters**: `src/services/channels/`
- One file per channel adapter
- Base interface in `adapter.ts`

**AI Agents**: `src/services/agents/`
- One file per agent type
- Shared engine logic in `agentEngine.ts`

**Backend Connectors**: `src/services/connectors/`
- Interface in `interface.ts`
- Implementations in separate files

**Cloud Functions**: `functions/src/`
- Webhook handlers in `channels/`
- Agent logic in `agents/`
- Routing in `routing.ts`

### Error Handling

**Channel Adapter Errors**:
- Retry with exponential backoff for transient failures
- Fallback to alternative channel if available
- Log errors with context for debugging

**Backend Connector Errors**:
- Circuit breaker pattern for repeated failures
- Cache fallback for read operations
- Graceful degradation when backend unavailable

**AI Agent Errors**:
- Escalate to human on complex errors
- Fallback to simple responses on timeout
- Log all errors for improvement

**Message Routing Errors**:
- Manual assignment fallback if routing fails
- Queue for retry if temporary failure
- Alert user if routing cannot be determined

---

## Data Architecture

### Extended Firestore Schema

#### New Collections (Phase 3)

**organizations**
```typescript
{
  id: string;
  name: string;
  type: 'property_management' | 'contractor' | 'custom';
  settings: {
    backendConnector?: BackendConnectorConfig;
    aiAgentEnabled?: boolean;
    defaultChannels?: string[];
  };
  billingAccountId?: string;
  createdAt: Timestamp;
}
```

**properties**
```typescript
{
  id: string;
  organizationId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  propertyType: 'residential' | 'commercial' | 'mixed';
  metadata?: Record<string, any>;
  threadIds: string[];
  externalId?: string;
  tenants: string[];
  potentialTenants: string[];
  createdAt: Timestamp;
}
```

**identityLinks**
```typescript
{
  id: string;
  userId: string;
  organizationId: string;
  externalIdentities: {
    type: 'phone' | 'email' | 'facebook_id' | 'whatsapp_id';
    value: string;
    verified: boolean;
  }[];
  createdAt: Timestamp;
}
```

**channelConfigs**
```typescript
{
  id: string;
  organizationId: string;
  channelType: 'sms' | 'messenger' | 'whatsapp' | 'email';
  provider: 'twilio' | 'facebook' | 'sendgrid' | 'custom';
  config: {
    apiKey?: string; // Encrypted
    apiSecret?: string; // Encrypted
    webhookUrl?: string;
  };
  enabled: boolean;
  createdAt: Timestamp;
}
```

**actionItems** (Extended from Phase 2)
```typescript
{
  id: string;
  threadId: string;
  propertyId?: string;
  organizationId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  autoGenerated: boolean;
  generatedBy: 'marketing_agent' | 'property_management_agent' | 'user';
  generatedAt: Timestamp;
  conversationStage?: 'prospect' | 'showing' | 'application' | 'move_in_prep' | 'move_in' | 'post_move_in' | 'maintenance' | 'renewal';
  completedBy?: string;
  completedAt?: Timestamp;
  autoCompleted: boolean;
  assignedTo?: string;
  dueDate?: Timestamp;
  relatedMessageIds?: string[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Extended Collections (Phase 3)

**users** (extended)
```typescript
{
  // ... existing fields ...
  organizationId: string;
  status: 'potential_tenant' | 'tenant' | 'property_manager' | 'admin';
  propertyId?: string;
  shoppingProperties?: string[];
  previousProperties?: string[];
}
```

**threads** (extended)
```typescript
{
  // ... existing fields ...
  organizationId?: string;
  propertyId?: string;
  projectId?: string;
  channelSources: ('sms' | 'messenger' | 'whatsapp' | 'email' | 'in-app')[];
  tags: string[];
  aiMode?: 'auto' | 'manual'; // Per-thread AI mode
  agentType?: 'marketing' | 'property_management'; // Current agent
}
```

**messages** (extended)
```typescript
{
  // ... existing fields ...
  channel: 'sms' | 'messenger' | 'whatsapp' | 'email' | 'in-app';
  channelMessageId?: string; // External channel message ID
  senderIdentifier: string; // Phone, email, Facebook ID
  recipientIdentifier: string;
  direction: 'incoming' | 'outgoing';
  sentByAI?: boolean;
  aiApprovedBy?: string; // User ID if human approved
  channelMetadata?: Record<string, any>;
}
```

---

## API Contracts

### Channel Adapter Interface

```typescript
interface ChannelAdapter {
  id: string;
  type: 'sms' | 'messenger' | 'email' | 'in-app';
  send(message: ChannelMessage): Promise<ChannelMessageResult>;
  receive(webhookPayload: any): UnifiedMessage;
  getStatus(messageId: string): Promise<MessageStatus>;
}
```

### Channel Adapter Interface

```typescript
interface ChannelAdapter {
  id: string;
  type: 'sms' | 'messenger' | 'email' | 'in-app';
  
  // Send message via this channel
  send(message: ChannelMessage): Promise<ChannelMessageResult>;
  
  // Receive webhook and convert to unified format
  receive(webhookPayload: any): UnifiedMessage;
  
  // Get message status
  getStatus(messageId: string): Promise<MessageStatus>;
}

interface UnifiedMessage {
  id: string;
  threadId: string;
  channel: 'sms' | 'messenger' | 'email' | 'in-app';
  direction: 'incoming' | 'outgoing';
  senderIdentifier: string; // Phone number, email, Facebook ID
  recipientIdentifier: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    channelSpecific?: any;
  };
}
```

### Backend Connector Interface

```typescript
interface BackendConnector {
  // Property/Project Data
  getProperty(propertyId: string): Promise<Property>;
  getProperties(organizationId: string): Promise<Property[]>;
  searchProperties(query: string): Promise<Property[]>;
  
  // Calendar/Availability (Google Calendar)
  getAvailability(userId: string, dateRange: DateRange): Promise<TimeSlot[]>;
  createAppointment(appointment: Appointment): Promise<Appointment>;
  
  // Prospect Qualification
  checkProspectQualification(prospectId: string, answers: QualificationAnswers): Promise<QualificationResult>;
  storeQualificationResults(prospectId: string, results: QualificationResult): Promise<void>;
  
  // Application Forms
  getApplicationFormLink(propertyId: string, prospectId: string): Promise<string>;
  checkApplicationStatus(prospectId: string, applicationId: string): Promise<ApplicationStatus>;
  
  // User/Contact Data
  getUser(userId: string): Promise<User>;
  getContacts(organizationId: string): Promise<Contact[]>;
  linkIdentity(externalId: string, communexusUserId: string): Promise<void>;
  
  // Error Handling
  handleError(error: BackendError, context: ConnectorContext): Promise<ConnectorResult>;
  retryPolicy: RetryPolicy;
  rateLimiting: RateLimitingConfig;
  circuitBreaker: CircuitBreakerConfig;
}
```

### AI Agent Interface

```typescript
interface AIAgent {
  id: string;
  type: 'marketing' | 'property_management';
  
  // Process incoming message and generate response
  processMessage(message: UnifiedMessage, context: AgentContext): Promise<AgentResponse>;
  
  // Tools available to agent
  tools: AgentTool[];
  
  // Configuration
  config: AIAgentConfig;
}

interface AIAgentConfig {
  enabled: boolean;
  mode: 'auto' | 'manual';
  threadMode?: 'auto' | 'manual';
  contextSources: {
    propertyData?: boolean;
    calendar?: boolean;
    conversationHistory?: boolean;
    userPreferences?: boolean;
  };
  escalationRules: {
    triggerKeywords: string[];
    complexityThreshold: number;
    sensitiveTopics: string[];
  };
  responseStyle: 'professional' | 'casual' | 'custom';
  languages: string[];
}
```

---

## Security Architecture

### Authentication Strategy

#### Channel API Authentication

**Twilio SMS Authentication:**
- **Method**: API Key + Auth Token (from Twilio Console)
- **Storage**: Firebase Secrets Manager (encrypted per organization)
  - Format: `{organizationId}/twilio/{accountSid}/{authToken}`
  - Encrypted at rest using Firebase Secrets Manager
- **Usage**: Initialize Twilio SDK with credentials in Cloud Functions
  ```typescript
  const twilio = require('twilio');
  const credentials = await getSecrets(organizationId, 'twilio');
  const client = twilio(credentials.accountSid, credentials.authToken);
  ```
- **Token Refresh**: N/A (API keys don't expire, but can be rotated)
- **Rotation**: Update credentials in Firebase Secrets Manager, redeploy Cloud Functions

**Facebook Messenger Authentication:**
- **Method**: Page Access Token (from Facebook Developer Console)
- **Storage**: Firebase Secrets Manager (encrypted per organization)
  - Format: `{organizationId}/facebook/{pageAccessToken}`
  - Encrypted at rest using Firebase Secrets Manager
- **Usage**: Include token in Messenger API requests
  ```typescript
  const response = await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
    headers: {
      'Authorization': `Bearer ${pageAccessToken}`,
      'Content-Type': 'application/json'
    }
  });
  ```
- **Token Refresh**: OAuth 2.0 refresh token flow (if using long-lived tokens)
  - Long-lived tokens: 60 days expiry, refresh before expiry
  - Short-lived tokens: 1 hour expiry, use refresh token to get new access token
- **Rotation**: Update page access token in Firebase Secrets Manager

**SendGrid Email Authentication:**
- **Method**: API Key (from SendGrid Dashboard)
- **Storage**: Firebase Secrets Manager (encrypted per organization)
  - Format: `{organizationId}/sendgrid/{apiKey}`
  - Encrypted at rest using Firebase Secrets Manager
- **Usage**: Initialize SendGrid SDK with API key in Cloud Functions
  ```typescript
  const sgMail = require('@sendgrid/mail');
  const apiKey = await getSecret(organizationId, 'sendgrid');
  sgMail.setApiKey(apiKey);
  ```
- **Token Refresh**: N/A (API keys don't expire, but can be rotated)
- **Rotation**: Update API key in Firebase Secrets Manager, redeploy Cloud Functions

#### Web Embeddable SDK Authentication

**Strategy**: JWT token-based authentication with web app integration

**Authentication Flow:**
1. Web app authenticates user (using its own auth system)
2. Web app generates JWT token for authenticated user
3. Web app passes token to Communexus SDK during initialization
4. SDK includes token in all API requests to Communexus backend
5. Backend validates token and authorizes requests

**Token Format:**
```typescript
interface JWTPayload {
  userId: string;
  organizationId: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  permissions: string[]; // Optional: specific permissions
}
```

**SDK Initialization:**
```typescript
// Web app provides token
const communexus = new CommunexusSDK({
  apiKey: 'communexus-api-key', // From Communexus dashboard
  userId: 'user-id-from-web-app',
  authToken: 'jwt-token-from-web-app', // Web app generates this
  organizationId: 'org-id-from-web-app',
});
```

**Token Refresh:**
- **Strategy**: Web app handles token refresh
- **Process**: 
  1. SDK detects token expiration (401 response)
  2. SDK notifies web app via callback: `onTokenExpired(callback)`
  3. Web app refreshes token using its own auth system
  4. Web app calls `sdk.updateToken(newToken)`
  5. SDK retries failed request with new token

**Implementation:**
```typescript
// SDK usage example
const communexus = new CommunexusSDK({
  apiKey: 'your-api-key',
  userId: 'user-id',
  authToken: 'jwt-token',
  onTokenExpired: async () => {
    // Web app refreshes token
    const newToken = await refreshToken();
    return newToken;
  }
});
```

**Backend Validation:**
- Cloud Functions validate JWT token on each request
- Token signature verified using shared secret
- Token expiration checked (reject expired tokens)
- Organization ID verified (user belongs to organization)
- Firestore security rules enforce organization boundaries

**Security Considerations:**
- Tokens have short expiration (1 hour default)
- Refresh tokens stored securely in web app
- Token rotation on refresh (old token invalidated)
- Rate limiting on token validation endpoints
- Token revocation support for security incidents

### Credential Storage

**Strategy**: Encrypted credentials at rest, never in client code
- Store channel API keys in Firebase Config/Secrets Manager
- Encrypt credentials using organization-specific keys
- Credentials decrypted only when needed for API calls
- Never log or expose credentials in responses

**Implementation**:
```typescript
interface SecureCredentialStore {
  getCredentials(organizationId: string): Promise<EncryptedCredentials>;
  storeCredentials(organizationId: string, credentials: Credentials): Promise<void>;
  rotateCredentials(organizationId: string): Promise<void>;
}
```

### Identity Verification

**Strategy**: Verify external identities before linking
- Phone numbers: Verify via SMS code
- Email addresses: Verify via email link
- Facebook IDs: Verify via OAuth flow
- Store verification status in `identityLinks` collection

### Access Control

**Strategy**: Organization-scoped data isolation
- All data queries filtered by `organizationId`
- Firestore security rules enforce organization boundaries
- Users can only access data from their organization
- Backend connectors scoped to organization

### Network Security

**Strategy**: HTTPS for all API calls, request signing for sensitive operations
- All external API calls use HTTPS
- Webhook handlers verify request signatures
- Rate limiting to prevent abuse
- Request signing for sensitive operations

### Data Privacy

**Strategy**: GDPR-compliant data handling
- User data encrypted at rest
- PII stored separately from message content
- Export functionality respects user privacy
- Data deletion capability for compliance

---

## Performance Considerations

### Message Delivery

**Target**: <2s latency for cross-channel message delivery
- Channel adapters process webhooks asynchronously
- Message routing uses Firestore indexes for fast lookups
- Identity linking cached for quick access
- Thread matching optimized with composite indexes

### AI Response Time

**Target**: <5s for AI agent responses
- LangChain agents with optimized prompts
- Property data cached to reduce backend calls
- Conversation history paginated (last N messages)
- Response streaming for better perceived performance

### Export Generation

**Target**: <10s for 1000-message thread export
- Background export for large threads (>5000 messages)
- Streaming PDF generation for memory efficiency
- Media files exported separately (async)
- Progress tracking for user feedback

### Database Optimization

**Strategy**: Composite indexes for common queries
- `identityLinks`: Index on `externalIdentities.value` and `userId`
- `threads`: Index on `organizationId`, `propertyId`, `participants`
- `messages`: Index on `threadId`, `channel`, `createdAt`
- `properties`: Index on `organizationId`, `address`

### Caching Strategy

**Strategy**: Multi-level caching for performance
- Identity linking cached in memory (TTL: 5 minutes)
- Property data cached in Firestore (denormalized)
- Channel configs cached (TTL: 1 hour)
- AI responses cached for similar queries (TTL: 24 hours)

---

## Deployment Architecture

### Mobile App

**Platform**: Expo Go / EAS Build
**Distribution**: 
- Development: Expo Go QR code
- Production: EAS Build (iOS/Android)
- Web: Expo web build

### Backend Services

**Platform**: Firebase Cloud Functions
**Deployment**: 
- Cloud Functions: `firebase deploy --only functions`
- Firestore Rules: `firebase deploy --only firestore:rules`
- Storage Rules: `firebase deploy --only storage:rules`
- Functions Region: `us-central1` (or closest to users)

### Channel Webhooks

**Strategy**: Firebase Cloud Functions as webhook endpoints
- Twilio SMS: `/webhooks/twilio/sms`
- Facebook Messenger: `/webhooks/facebook/messenger`
- SendGrid Email: `/webhooks/sendgrid/email`
- All webhooks verify request signatures

### Environment Variables

**Storage**: Firebase Config / Secrets Manager
- Channel API keys (Twilio, SendGrid, Facebook)
- OpenAI API key
- Webhook signing secrets
- Backend connector credentials (encrypted)

### Monitoring

**Strategy**: Firebase Performance Monitoring + Error Reporting
- Monitor Cloud Function execution times
- Track message delivery latency
- Alert on error rates
- Monitor AI agent response times

---

## Development Environment

### Prerequisites

- Node.js 18+
- Firebase CLI
- Expo CLI
- Twilio Account (for SMS)
- Facebook Developer Account (for Messenger)
- SendGrid Account (for Email)

---

## Architecture Decision Records (ADRs)

### ADR-001: Channel Abstraction Layer

**Decision**: Use Adapter Pattern with Unified Message Interface

**Context**: Need to integrate SMS, Messenger, and Email channels with existing in-app messaging while maintaining consistency.

**Options Considered**:
1. Unified message interface (extend existing Message type)
2. Channel-aware messaging layer (separate layer)
3. Adapter pattern with message factory

**Decision**: Option 3 - Adapter pattern with message factory

**Rationale**: 
- Clean separation of concerns
- Extensible for future channels
- Treats existing in-app messaging as just another channel
- No breaking changes to existing code

**Consequences**:
- All messages normalized to `UnifiedMessage` format
- Channel-specific logic isolated in adapters
- Easy to add new channels (e.g., WhatsApp)

---

### ADR-002: Dual AI Agent System

**Decision**: Implement Marketing Agent + Property Management Agent

**Context**: Different user phases (prospect vs tenant) require different AI personalities and capabilities.

**Options Considered**:
1. Single agent with mode switching
2. Dual agent system
3. Multi-agent system (future extensibility)

**Decision**: Option 2 - Dual agent system

**Rationale**:
- Clear separation of responsibilities
- Optimized prompts for each phase
- Better user experience (appropriate agent for context)
- Easier to maintain and improve

**Consequences**:
- Agent selection logic needed
- Context preservation during agent transitions
- Separate tool sets for each agent

---

### ADR-003: Organization Model

**Decision**: Single organization, multi-property hierarchy

**Context**: Need to organize communications by property while maintaining simple billing model.

**Options Considered**:
1. Multi-tenant SaaS (each org isolated)
2. Single organization with properties
3. Hierarchical organizations (orgs → properties)

**Decision**: Option 2 - Single organization with properties

**Rationale**:
- Simpler billing (one account per organization)
- Easier data model (no complex multi-tenancy)
- Sufficient for Phase 3 scope
- Can evolve to multi-tenant later if needed

**Consequences**:
- All data scoped to organization
- Properties are sub-units within organization
- Users belong to single organization

---

### ADR-004: Backend Connector Security

**Decision**: Encrypted credentials in Firebase Config/Secrets Manager

**Context**: Need to securely store external backend credentials (property management systems, CRMs).

**Options Considered**:
1. Environment variables (Firebase Config)
2. Encrypted in Firestore
3. OAuth 2.0 only (no stored credentials)

**Decision**: Option 1 with encryption - Firebase Config/Secrets Manager

**Rationale**:
- Firebase Secrets Manager provides encryption at rest
- Credentials never in client code
- Per-organization credential isolation
- OAuth 2.0 preferred where available

**Consequences**:
- Credentials decrypted only when needed
- Credential rotation requires Cloud Function update
- OAuth 2.0 implementation for supported backends

---

### ADR-005: Export Format

**Decision**: PDF primary format, Text/JSON optional

**Context**: Need legal compliance export for court-admissible documentation.

**Options Considered**:
1. PDF only
2. PDF + Text + JSON
3. HTML export

**Decision**: Option 2 - PDF primary, Text/JSON optional

**Rationale**:
- PDF sufficient for legal compliance
- Text format for easy copying
- JSON for technical/programmatic use
- Print-friendly formatting

**Consequences**:
- PDF generation library needed (pdfkit or react-pdf)
- Large thread handling (chunked export)
- Media file handling (separate ZIP archive)

---

_Generated by BMAD Decision Architecture Workflow v1.3.2_
_Date: 2025-01-02_
_For: BMad_

