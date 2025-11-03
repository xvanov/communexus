# Communexus Phase 3 - Platform Evolution Addendum

**Document Type:** PRD Addendum  
**Phase:** Phase 3 - Platform Evolution  
**Status:** Draft for Review  
**Date:** 2025-01-02  
**Related Document:** [PRD.md](./PRD.md)

---

## Overview

This addendum expands the Phase 3 roadmap from the base PRD with detailed specifications for transforming Communexus into a **multi-channel messaging wrapper platform** that can be **embedded in vertical applications** (rental management, contractor tools, etc.).

**Key Phase 3 Goals:**

1. **Multi-Channel Messaging Wrapper** - Unified interface for SMS, Messenger, WhatsApp, Email, etc.
2. **AI Agent Participation** - AI agent can actively participate in conversations on behalf of users
3. **Property/Project Organization** - Hierarchical organization system for managing communications by location/project
4. **Web Embeddable Architecture** - SDK and components for embedding into web applications
5. **Flexible Backend Integration** - Pluggable backend connector system for external data systems
6. **Legal Compliance Export** - Print/export functionality for court-admissible documentation

---

## Expanded Persona: Multi-Vertical Support

### Primary Persona 1: Property Manager / Rental Operator

**Who:** Property managers, landlords, rental operators managing multiple properties

**Core Pain Points:**

- Fragmented communication across Facebook Marketplace, SMS, email, and phone
- Potential tenants responding to listings via different channels (FB Messenger, text, email)
- Need to answer repetitive questions about properties automatically
- Schedule property viewings across multiple channels
- Organize communications by property address for legal/documentation purposes
- Need to print full communication history for court/dispute resolution

**Daily Scenarios:**

- **Facebook Marketplace Inquiry:** Potential tenant responds to rental listing via Messenger
- **AI Agent Handles:** Automatically answers questions about rent, utilities, pet policy, move-in date
- **Channel Transition:** Exchange phone numbers, continue conversation via SMS
- **Viewing Scheduling:** AI agent helps schedule property viewing across both channels
- **Organization:** All communications automatically organized under "123 Main St, Durham NC"
- **Legal Export:** When needed, export full communication thread with timestamps for court

**User Flow Example:**

1. **Post on Facebook Marketplace:** "Room for rent at 123 Main St, Durham NC - $800/month"
2. **Inquiry via Messenger:** Potential tenant asks "Is the room still available?"
3. **AI Agent Responds:** Automatically answers with property details, availability, and next steps
4. **Follow-up Questions:** AI continues conversation, answering rent, utilities, pet policy questions
5. **Phone Number Exchange:** User and potential tenant exchange contact info
6. **SMS Channel:** Conversation continues via SMS, all messages appear in same thread
7. **Thread View Shows:**
   - Message 1: Incoming from [Facebook Messenger ID] - "Is room available?"
   - Message 2: Outgoing to [Facebook Messenger ID] (via AI) - "Yes, available! Details..."
   - Message 3: Incoming from [Phone: +1-555-0123] - "What's the rent?"
   - Message 4: Outgoing to [Phone: +1-555-0123] (via AI) - "$800/month..."
8. **Viewing Scheduled:** AI helps schedule viewing time via SMS
9. **Property Folder:** All communications organized under "123 Main St, Durham NC"
10. **Export for Legal:** User can print full thread with all channels, timestamps, and participant info

### Primary Persona 2: Service Business Operator (Existing - Enhanced)

**Who:** Contractors, service providers (enhanced with multi-channel support)

**Enhanced Scenarios:**

- Client starts inquiry via website contact form (email) → continues via SMS → finalizes in app
- Worker sends SMS update from job site → appears in app thread
- Vendor sends WhatsApp quote → appears alongside in-app messages
- All communications organized by project location/address

---

## Phase 3 Feature Specifications

### Feature 3.1: Multi-Channel Messaging Wrapper

**Goal:** Transform Communexus into a unified wrapper around existing messaging platforms (SMS, Messenger, WhatsApp, Email)

#### Requirements

**3.1.1 Channel Integration**

- **SMS (Twilio)** - **PRIMARY CHANNEL**
  - Send/receive SMS messages
  - Webhook for inbound SMS routing
  - Phone number mapping to user identities
  - Support for international numbers

- **Facebook Messenger** - **PRIMARY CHANNEL**
  - Facebook Messenger API integration
  - Connect to Facebook Pages
  - Webhook handling for inbound messages
  - Page-scoped user ID mapping
  - Primary channel for Marketplace post responses
  - Migrate to SMS for ongoing conversations

- **Email (SendGrid/SMTP)** - **PRIMARY CHANNEL**
  - Send/receive emails via dedicated addresses
  - Email threading and conversation linking
  - HTML and plain text email support
  - Email-to-thread routing logic
  - Preferred for formal communications and detailed information

- **Roomies.com** - **OPTIONAL**
  - Integration if API available and implementation is straightforward
  - Lower priority than primary channels

- **WhatsApp Business API** - **DEFERRED**
  - Not included in Phase 3 scope
  - May be added in future phases if needed

**3.1.2 Unified Thread Model**

- Single thread can contain messages from multiple channels
- Each message displays:
  - **Channel indicator icon** (📱 SMS, 💬 Messenger, 📧 Email, ✅ WhatsApp)
  - **Direction indicator** ("Incoming from [Phone: +1-555-0123]" or "Outgoing to [Messenger: John Doe]")
  - **Timestamp** with channel-specific timezone handling
  - **Status** (sent, delivered, read) per channel capabilities

**3.1.3 Channel Abstraction Layer**

```typescript
// Channel abstraction interface
interface ChannelAdapter {
  id: string;
  type: 'sms' | 'messenger' | 'whatsapp' | 'email' | 'in-app';
  
  // Send message via this channel
  send(message: ChannelMessage): Promise<ChannelMessageResult>;
  
  // Receive webhook and convert to unified format
  receive(webhookPayload: any): UnifiedMessage;
  
  // Get message status
  getStatus(messageId: string): Promise<MessageStatus>;
}

// Unified message format
interface UnifiedMessage {
  id: string;
  threadId: string;
  channel: 'sms' | 'messenger' | 'email' | 'roomies' | 'in-app'; // WhatsApp deferred
  direction: 'incoming' | 'outgoing';
  senderIdentifier: string; // Phone number, email, Facebook ID, etc.
  recipientIdentifier: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    channelSpecific?: any;
  };
}
```

**3.1.4 Message Routing Logic**

- **Identity Linking:** Link external identities (phone, email, Facebook ID) to internal user IDs
- **Thread Matching:** Route inbound messages to correct thread based on:
  - Participant identity matching
  - Thread metadata (property address, project ID)
  - Conversation context (keyword matching, AI classification)
  - Manual thread assignment fallback

**3.1.4.1 Channel Selection for Outbound Messages**

- **Default Channel:** Last-used channel in the thread (if thread exists)
- **Context-Based Exceptions:**
  - **Lease Signing Links:** Send via **both** SMS and Email (redundancy for important documents)
  - **Facebook Marketplace Responses:** Messenger for initial post responses, then switch to SMS
  - **Property Tours/Scheduling:** Prefer SMS over Messenger (easier for coordination)
  - **Detailed Information:** Email for longer responses (better formatting support)
  
- **Channel Usage Guidelines:**
  - **Messenger:** Primary channel for Facebook Marketplace initial inquiries, then migrate to SMS
  - **SMS:** Preferred for ongoing conversations, scheduling, quick updates
  - **Email:** Preferred for formal communications (lease agreements, detailed information)

- **Channel Priority Logic:**
```typescript
function selectChannel(thread: Thread, messageType: string): Channel {
  // Context-based exceptions
  if (messageType === 'lease_link') {
    return 'both_sms_email'; // Send to both channels
  }
  
  if (thread.sourceChannel === 'messenger' && thread.isInitialInquiry) {
    // Initial inquiry on Messenger, continue there
    return 'messenger';
  }
  
  if (messageType === 'property_tour' || messageType === 'scheduling') {
    // Tours and scheduling prefer SMS
    return 'sms';
  }
  
  if (messageType === 'formal_document' || messageType === 'detailed_info') {
    // Formal communications prefer Email
    return 'email';
  }
  
  // Default: Last used channel in thread
  return thread.lastUsedChannel || 'sms';
}
```

**3.1.5 UI Components**

- **Channel Badge Component:** Display channel icon + identifier
  ```tsx
  <ChannelBadge 
    channel="sms" 
    identifier="+1-555-0123" 
    direction="incoming" 
  />
  ```

- **Unified Message List:** Show messages from all channels in chronological order
- **Channel Filter:** Filter messages by channel
- **Send Channel Selector:** Choose which channel to send message via

---

### Feature 3.2: AI Agent Participation

**Goal:** Enable AI agent to actively participate in conversations on behalf of the user

#### Requirements

**3.2.1 AI Agent Capabilities**

- **Automatic Response Mode:** AI can respond to messages without user intervention
- **Scheduled Response:** AI handles initial responses, escalates to human when needed
- **Context-Aware Responses:** AI uses property/project context, conversation history, and user preferences
- **Natural Language Understanding:** Handles questions, scheduling requests, information requests

**3.2.2 Use Cases**

**Use Case 1: Property Inquiry & Sales Flow (Prospect Phase)**

**Phase 1.1: Initial Inquiry & Property Information**
- Potential tenant asks: "Is the room still available?"
- Marketing Agent responds: "Yes! The room at 123 Main St is available for $800/month. Would you like to know more?"
- Prospect asks follow-up questions (utilities, pet policy, amenities, etc.)
- Marketing Agent answers using property data from backend system
- Marketing Agent highlights property benefits and selling points

**Phase 1.2: Cross-Selling if Prospect Shows Disinterest**
- If prospect indicates disinterest ("Too expensive", "Too far", "Not what I'm looking for"):
  - Marketing Agent acknowledges: "I understand. Let me check what else we have available..."
  - Marketing Agent searches for alternative properties matching stated preferences
  - Marketing Agent presents 2-3 alternatives with brief descriptions
  - Marketing Agent: "Would any of these work better for you?"
- If prospect interested in alternative: Continue with Phase 2

**Phase 1.3: Qualification Check (Before Scheduling)**
- Once prospect is interested, Marketing Agent initiates qualification:
  - "Great! Before we schedule a showing, I'd like to confirm a few quick questions to make sure this is a good fit:"
  - Qualification questions (as a list or conversation):
    1. **No past evictions** - "Have you ever been evicted from a property?"
    2. **No past problems** - "Have you had any issues with previous landlords or housemates?"
    3. **No criminal record** - "Do you have any criminal record we should be aware of?"
    4. **Move-in amount** - "The move-in amount is [deposit + rent]. Can you confirm this works for you?"
    5. **Respectful behavior** - "We expect all housemates to be respectful to others. Does that work for you?"
    6. **Cleanliness** - "We ask that common areas (kitchen, living room, etc.) be kept clean. Is that something you can commit to?"
  - Marketing Agent waits for responses
  - If all qualifications met → Proceed to Phase 2 (Scheduling)
  - If any qualification not met → Politely decline: "Thanks for your interest, but this property may not be the best fit. Good luck with your search!"

**Phase 2: Property Showing Scheduling**
- Marketing Agent: "Perfect! Let me check our available showing times."
- Marketing Agent queries Google Calendar (via backend connector) for available slots
- Marketing Agent presents available time slots: "I have these times available: [list options]"
- Prospect selects preferred time: "How about Thursday at 2pm?"
- Marketing Agent confirms: "Thursday at 2pm works! I've added it to your calendar and mine. Should I send a confirmation message?"
- Marketing Agent sends confirmation via original channel (SMS/Messenger/Email)

**Phase 3: Property Showing & Mode Switching**
- **During Showing (Manual Mode):**
  - Property Manager switches thread from Auto to Manual mode
  - Property Manager takes over conversation: "I'm at the property, are you here?"
  - Property Manager handles real-time showing coordination
  - Property Manager answers on-site questions
  
- **After Showing (Back to Auto):**
  - Property Manager switches thread back to Auto mode
  - AI Agent (Marketing) receives full context:
    - Previous conversation history (inquiry phase)
    - Property showing occurred
    - Any context Property Manager added during showing
    - Current stage: Post-showing follow-up
  
  - AI Agent continues conversation:
    - If Property Manager didn't already send application: "Thanks for coming! If you're interested in moving forward, here's the application form: [link to platform]"
    - If Property Manager already sent application: AI acknowledges and follows up
    - AI handles application questions or next steps

**Phase 4: Move-in Application**
- After showing confirmed, Marketing Agent sends application form:
  - "Great! If you'd like to proceed, please fill out our application form here: [link to external platform]"
  - Link opens application form in external platform (rental management system)
  - Marketing Agent can answer questions about application process
  - Marketing Agent follows up on application status if needed

**Phase 5: Action List Generation (Automatic)**
- **AI Action Item Extraction** automatically analyzes conversation and generates actionable tasks for Property Manager
- Action list generated at key stages:
  - **After showing:** Tasks like "Schedule follow-up call", "Review application when submitted"
  - **After application approved:** Tasks like "Prepare lease agreement", "Schedule key handoff", "Take move-in pictures", "Verify move-in checklist"
  - **Before move-in:** Tasks like "Clean property", "Replace batteries in smoke detectors", "Update property inventory"
  - **During move-in:** Tasks like "Give keys to tenant", "Upload move-in pictures", "Complete move-in inspection", "Collect deposit"
  - **After move-in:** Tasks like "Welcome email/package", "Schedule orientation meeting"
  
- **Action List Features:**
  - Tasks automatically extracted from conversation context
  - Checkbox interface for Property Manager to mark tasks complete
  - Tasks linked to thread and property
  - Property Manager can add custom tasks manually
  - Action list visible in thread view and property dashboard
  
- **Example Generated Action Lists:**
  ```
  After Application Approved:
  ☐ Prepare lease agreement for 123 Main St
  ☐ Schedule key handoff appointment
  ☐ Take move-in pictures (before tenant arrives)
  ☐ Verify move-in checklist items
  ☐ Confirm move-in date with tenant
  
  During Move-in:
  ☐ Give keys to [Tenant Name]
  ☐ Upload move-in pictures to property file
  ☐ Complete move-in inspection checklist
  ☐ Collect deposit and first month rent
  ☐ Update tenant contact information
  
  After Move-in:
  ☐ Send welcome email to tenant
  ☐ Schedule property orientation meeting
  ☐ Provide emergency contact numbers
  ```

**Use Case 2: Mid-Conversation Mode Switching**
- Thread starts in Auto mode (AI handling)
- Property Manager switches to Manual mode mid-conversation
- Property Manager adds context: "I'm at the property, are you here?" or other real-time updates
- Property Manager switches back to Auto mode
- AI Agent reads full conversation context (including Property Manager's messages)
- AI Agent continues seamlessly: "Based on our conversation, here's the application form..." or appropriate next step

**Use Case 3: Information Answering (Tenant Phase)**
- Tenant: "What's the pet policy?"
- Property Management Agent: "Pets are allowed with a $200 deposit. Maximum 2 pets, no aggressive breeds."
- Information pulled from property management backend

**Use Case 4: Maintenance Request (Tenant Phase)**
- Tenant: "There's a leak in the bathroom"
- Property Management Agent: "I'll schedule a plumber for you. When would be a good time for maintenance?"
- Property Management Agent creates maintenance request in backend system
- Property Management Agent schedules repair based on tenant availability
- **Action List Generated:** AI automatically creates action items:
  - ☐ Schedule plumber for leak repair
  - ☐ Confirm repair appointment with tenant
  - ☐ Verify repair completion after visit
  - ☐ Update property maintenance log

**Use Case 5: Action List Generation (Automatic)**
- **Automatic Generation:** AI analyzes conversation context and automatically generates action items
- **Trigger Points:**
  - After property showing scheduled → Generate pre-showing action list
  - After application approved → Generate move-in preparation action list
  - During move-in conversation → Generate move-in action list (give keys, upload pictures, etc.)
  - During maintenance request → Generate repair action list
  - During lease renewal conversation → Generate renewal action list
  
- **Action List Types:**
  - **Prospect Stage Actions:** Follow-up, application review, qualification verification
  - **Move-in Preparation:** Lease preparation, key handoff scheduling, property cleaning, pictures
  - **Move-in Execution:** Give keys, upload move-in pictures, collect deposit, inspection
  - **Tenant Management:** Welcome package, orientation meeting, emergency contacts
  - **Maintenance Actions:** Schedule repair, verify completion, update logs
  
- **Action List Management:**
  - Property Manager can check off completed tasks
  - Tasks automatically marked when conversation indicates completion (e.g., "Keys given" message)
  - Property Manager can add custom tasks manually
  - Action list visible in thread view sidebar
  - Action list also visible in property dashboard
  
- **Example: Automatic Generation from Conversation:**
  ```
  Conversation: 
  Tenant: "I got the keys, thanks!"
  PM: "Great! Don't forget to upload the move-in pictures"
  
  AI Generates/Updates Action List:
  ☑ Give keys to tenant (completed - mentioned in conversation)
  ☐ Upload move-in pictures
  ☐ Complete move-in inspection
  ☐ Collect deposit and first month rent
  ```

**3.2.3 AI Agent Configuration**

```typescript
interface AIAgentConfig {
  enabled: boolean;
  mode: 'auto' | 'manual'; // Conversation-level toggle
  // Per-conversation override (stored in thread)
  threadMode?: 'auto' | 'manual';
  
  contextSources: {
    propertyData?: boolean; // Pull from property backend
    calendar?: boolean; // Check availability
    conversationHistory?: boolean; // Use past messages
    userPreferences?: boolean; // User communication style
  };
  escalationRules: {
    triggerKeywords: string[]; // Escalate to human if mentioned
    complexityThreshold: number; // Escalate if question too complex
    sensitiveTopics: string[]; // Escalate for legal/financial topics
  };
  responseStyle: 'professional' | 'casual' | 'custom';
  languages: string[]; // Supported languages
}
```

**3.2.3.1 Conversation-Level Toggle**

- Each thread (one-on-one or group chat) has independent AI mode toggle
- Toggle displayed at top of conversation view
- **Auto Mode:** AI responds automatically (full auto-mode)
- **Manual Mode:** AI generates suggestions but requires human approval before sending
- Toggle persists per thread (user preference saved)
- Can be changed mid-conversation

**3.2.4 AI Agent Architecture**

- **Dual Agent System:**
  - **Marketing Agent (Prospect Phase):** Friendly, customer-facing agent for potential tenants
    - Personality: Welcoming, helpful, sales-focused
    - Capabilities: 
      - Answer property questions using backend property data
      - Cross-sell alternative properties when prospect shows disinterest
      - Conduct qualification interview (6 key questions) before scheduling
      - Check Google Calendar availability for property showings
      - Schedule viewing appointments via Google Calendar
      - Send move-in application form link after showing
      - Resume conversation seamlessly after Property Manager mode switches
    - Used when: User status is "potential_tenant" or inquiry phase
  
  - **Property Management Agent (Tenant Phase):** Professional, operational agent for existing tenants
    - Personality: Professional, efficient, problem-solving focused
    - Capabilities: Handle maintenance requests, explain house rules, schedule repairs, handle lease questions
    - Used when: User status is "tenant"

- **Qualification Questions Template:**
  ```typescript
  const qualificationQuestions = [
    {
      id: 'evictions',
      question: 'Have you ever been evicted from a property?',
      acceptableAnswer: 'no',
      required: true
    },
    {
      id: 'past_problems',
      question: 'Have you had any issues with previous landlords or housemates?',
      acceptableAnswer: 'no',
      required: true
    },
    {
      id: 'criminal_record',
      question: 'Do you have any criminal record we should be aware of?',
      acceptableAnswer: 'no',
      required: true
    },
    {
      id: 'move_in_amount',
      question: 'The move-in amount is [deposit + rent]. Can you confirm this works for you?',
      acceptableAnswer: 'yes',
      required: true,
      dynamicAmount: true // Pull from property backend
    },
    {
      id: 'respectful_behavior',
      question: 'We expect all housemates to be respectful to others. Does that work for you?',
      acceptableAnswer: 'yes',
      required: true
    },
    {
      id: 'cleanliness',
      question: 'We ask that common areas (kitchen, living room, etc.) be kept clean. Is that something you can commit to?',
      acceptableAnswer: 'yes',
      required: true
    }
  ];
  ```

- **LangChain Agents** with extended tool sets:
  ```typescript
  // Marketing Agent Tools
  marketingAgentTools = [
    getPropertyDetails(propertyId),
    searchAvailableProperties(criteria),
    checkCalendarAvailability(userId, dateRange), // Google Calendar integration
    scheduleViewing(appointmentDetails), // Google Calendar booking
    crossSellSimilarProperties(propertyId, preferences),
    checkProspectQualification(prospectId), // Qualification check before scheduling
    conductQualificationInterview(questions), // Ask qualification questions
    sendApplicationForm(propertyId, prospectId), // Send move-in application link
    extractActionItems(threadId, conversationStage), // Generate action list from conversation
    generateActionListForStage(stage, propertyId, context), // Generate stage-specific actions
    sendMessage(channel, message),
    escalateToHuman(threadId, reason),
    searchConversationHistory(query),
    detectModeSwitch(threadId), // Detect when Property Manager switches modes
    resumeConversationFromContext(threadId), // Resume after manual mode switch
  ];
  
  // Property Management Agent Tools
  propertyManagementAgentTools = [
    getPropertyRules(propertyId),
    createMaintenanceRequest(propertyId, issue),
    scheduleRepair(propertyId, repairType, preferredTime),
    getLeaseInfo(propertyId, tenantId),
    extractActionItems(threadId, conversationStage), // Generate action list from conversation
    generateActionListForStage(stage, propertyId, context), // Generate stage-specific actions
    updateActionItemStatus(actionItemId, status), // Mark action items complete
    sendMessage(channel, message),
    escalateToHuman(threadId, reason),
    searchConversationHistory(query),
  ];
  ```

- **Agent Selection Logic:**
  - Check user status in thread (potential_tenant vs tenant)
  - Route to appropriate agent based on status
  - Agents share conversation history but use different personalities/capabilities

- **Message Routing:**
  - Incoming message → Check thread mode (auto/manual)
  - If auto: AI Agent generates and sends response immediately
  - If manual: AI Agent generates response, shows preview, waits for user approval
  - Response sent via original channel (or channel routing logic)

- **Mode Switching & Context Preservation:**
  - When Property Manager switches from Auto to Manual:
    - AI Agent pauses responses
    - Property Manager messages stored in conversation history
    - Thread context preserved (prospect stage, property ID, etc.)
  
  - When Property Manager switches back to Auto:
    - AI Agent reads full conversation context (including Property Manager messages)
    - AI Agent determines current stage (pre-showing, post-showing, application sent, etc.)
    - AI Agent continues seamlessly with appropriate next action:
      - "Based on our conversation during the showing, here's the application form..."
      - Or acknowledges if Property Manager already handled next step

**3.2.5 UI Components**

- **AI Mode Toggle:** Conversation-level toggle at top of thread
  ```tsx
  <AIModeToggle
    mode={thread.mode} // 'auto' | 'manual'
    onChange={(mode) => updateThreadMode(threadId, mode)}
    disabled={!aiAgentEnabled}
  />
  // Displays: [🔄 Auto] [✋ Manual] (current mode highlighted)
  ```

- **AI Agent Status Indicator:** Show when AI is responding
  ```tsx
  <AIAgentBadge 
    status="responding" 
    message="AI is drafting a response..."
    agentType="marketing" | "property_management"
  />
  ```

- **Message Attribution:** Show which messages were sent by AI vs human
  ```tsx
  <MessageBubble 
    text="Yes, the room is available!"
    sentBy="ai"
    agentType="marketing"
    approvedBy="user@example.com" // Only if manual mode
  />
  ```

- **AI Response Preview (Manual Mode):** Show AI draft with approve/reject/edit options
  ```tsx
  <AIResponsePreview
    draft={aiGeneratedResponse}
    onApprove={() => sendMessage(aiGeneratedResponse)}
    onReject={() => dismissPreview()}
    onEdit={(edited) => sendMessage(edited)}
  />
  ```

- **Agent Type Indicator:** Show which agent is handling conversation
  ```tsx
  <AgentTypeBadge 
    type="marketing" // or "property_management"
    message="Marketing Assistant" // or "Property Management Assistant"
  />
  ```

- **Action List Component:** Display automatically generated action items
  ```tsx
  <ActionList
    threadId={threadId}
    propertyId={propertyId}
    actions={actionItems}
    onToggleComplete={(actionId, completed) => updateActionStatus(actionId, completed)}
    onAddCustom={(task) => addCustomAction(task)}
    autoGenerated={true} // Shows badge if auto-generated
  />
  // Displays checkbox list:
  // ☑ Give keys to tenant (completed)
  // ☐ Upload move-in pictures
  // ☐ Complete move-in inspection
  // + Add custom task
  ```

- **Action List Sidebar:** Show action list in thread view sidebar
  ```tsx
  <ActionListSidebar
    threadId={threadId}
    propertyId={propertyId}
    collapsed={false}
    onToggleCollapse={() => toggleCollapse()}
  />
  // Shows action list in collapsible sidebar
  // Also shows in property dashboard view
  ```

- **Action Item Badge:** Show action count in thread list
  ```tsx
  <ActionItemBadge
    pendingCount={actionItems.filter(a => !a.completed).length}
    totalCount={actionItems.length}
  />
  // Shows: "5 actions (3 pending)"
  ```

---

### Feature 3.3: Property/Project Organization System

**Goal:** Organize all communications by property address, project location, or other hierarchical structure

#### Requirements

**3.3.1 Organization Hierarchy**

```
Organization
  └── Property (123 Main St, Durham NC)
      ├── Thread 1: Tenant A (SMS + Messenger)
      ├── Thread 2: Tenant B (Email + WhatsApp)
      └── Thread 3: Maintenance Request (SMS)
  
Project (Kitchen Renovation - 456 Oak Ave)
  ├── Thread 1: Client Communications
  ├── Thread 2: Vendor Coordination
  └── Thread 3: Team Updates
```

**3.3.2 Data Model**

```typescript
interface Organization {
  id: string;
  name: string;
  type: 'property_management' | 'contractor' | 'custom';
  createdAt: Date;
}

interface Property {
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
  metadata?: {
    units?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    // Custom fields
  };
  threads: string[]; // Thread IDs associated with this property
  createdAt: Date;
}

interface Thread {
  // Existing thread fields...
  organizationId?: string;
  propertyId?: string; // Link to property
  projectId?: string; // Link to project (alternative to property)
  tags: string[]; // Flexible tagging system
  customMetadata?: Record<string, any>;
}
```

**3.3.3 UI Components**

- **Property/Project Folder View:**
  ```
  📁 Properties
    📍 123 Main St, Durham NC
      ├── 💬 Tenant Inquiry (2 messages)
      ├── 📱 Maintenance Request (5 messages)
      └── 📧 Lease Agreement Discussion (12 messages)
    📍 456 Oak Ave, Raleigh NC
      └── 💬 New Tenant Screening (8 messages)
  ```

- **Thread Property Assignment:**
  - When creating thread, user can assign to property
  - Existing threads can be moved to properties
  - Auto-assignment based on address detection in messages

- **Property Details Panel:**
  - Show all threads for a property
  - Property metadata (address, type, units)
  - Quick actions (create thread, export all communications)

**3.3.4 Property Auto-Assignment with AI**

- **Property Detection Logic:**
  - **Facebook Marketplace:** If conversation starts on Messenger responding to post, property is automatically identified from post link/metadata
  - **Craigslist/Other Listings:** AI analyzes message content to identify property
    - Extract address if mentioned in message
    - Extract property link/URL if provided
    - Match against existing properties in database
  - **Context Clues:** AI uses conversation history to infer property
    - References to property features (e.g., "3 bedrooms", "downtown location")
    - Mention of nearby landmarks
    - Comparison to other properties
  
- **AI Property Disambiguation:**
  - If AI detects unclear property reference, ask user for clarification:
    - "Which property are you interested in? 123 Main St or 456 Oak Ave?"
  - If multiple properties match criteria, present options for user selection

- **Cross-Selling Intelligence:**
  - **Property Interest Detection:** AI monitors conversation for signs of disinterest
    - "Too expensive", "Too far", "Not what I'm looking for", etc.
  - **Automatic Cross-Selling:** When user shows disinterest, Marketing Agent suggests alternative properties:
    - Search available properties matching user's stated preferences
    - Present 2-3 alternative options with brief descriptions
    - "This one doesn't work for you? I have similar properties at [other addresses] that might be a better fit..."

**3.3.5 Search and Filtering**

- Filter threads by property address
- Filter threads by project
- Search across all properties
- Export all communications for a property

---

### Feature 3.4: Legal Compliance Export & Print

**Goal:** Enable users to export and print complete communication threads for legal/dispute resolution

#### Requirements

**3.4.1 Export Formats**

- **PDF Export:** **PRIMARY FORMAT** (Sufficient for legal compliance)
  - Complete thread with all messages
  - Channel indicators for each message
  - Timestamps with timezone
  - Participant identities (phone numbers, email addresses, names)
  - Message status (sent, delivered, read) where available
  - Thread metadata (property address, dates, participants)
  - Print-friendly formatting with legal headers
  - Suitable for court-admissible documentation

- **Text Export:** (Optional - for convenience)
  - Plain text format for easy copying
  - Same information as PDF but plain text
  - Suitable for email attachments

- **JSON Export:** (Optional - for technical use)
  - Machine-readable format
  - Includes all metadata
  - Suitable for legal document management systems

**3.4.2 Export Content**

For each message, include:
- Message ID (unique identifier)
- Timestamp (ISO 8601 with timezone)
- Sender identity (phone number, email, name, user ID)
- Recipient identity
- Channel (SMS, Messenger, Email, etc.)
- Message content (text, media references)
- Message status (sent, delivered, read timestamps)
- Direction (incoming/outgoing)
- AI attribution (if message sent by AI agent)

Thread-level information:
- Thread ID
- Participants (all identities across channels)
- Property/Project association
- Creation date
- Last activity date
- Total message count

**3.4.3 Print Formatting**

- **Print-Friendly Layout:**
  - Clear headers with thread metadata
  - Chronological message list
  - Channel indicators clearly visible
  - Page breaks between major sections
  - Footer with export timestamp and user information

- **Legal Header:**
  ```
  COMMUNICATION RECORD
  Thread ID: [thread-id]
  Property: 123 Main St, Durham NC
  Participants: [List all phone numbers, emails, names]
  Export Date: [ISO timestamp]
  Exported By: [User name and email]
  ```

**3.4.4 UI Components**

- **Export Button:** In thread view, "Export Thread" button
- **Export Options Dialog:**
  - Format selection (PDF, Text, JSON)
  - Date range (if partial export needed)
  - Include media references (yes/no)
  - Include metadata (yes/no)
- **Bulk Export:** Export all threads for a property/project

---

### Feature 3.5: Web Embeddable Architecture

**Goal:** Enable Communexus to be embedded into web applications (rental management platforms, contractor tools, etc.)

#### Requirements

**3.5.1 Embeddable SDK Components**

**React Component Library:**
```typescript
// Main embeddable component
<CommunexusEmbedded
  apiKey={string}
  userId={string}
  organizationId={string}
  backendConnector={BackendConnector} // Custom backend
  config={{
    theme: 'light' | 'dark' | 'custom',
    showChannelSelectors: boolean,
    enableAI: boolean,
    defaultChannel: 'sms' | 'messenger' | 'email',
  }}
/>
```

**Standalone JavaScript SDK:**
```javascript
// Vanilla JS integration
const communexus = new CommunexusSDK({
  apiKey: 'your-api-key',
  userId: 'user-id',
  backendConnector: customBackendConnector,
});

communexus.embed('#communexus-container', {
  theme: 'light',
  organizationId: 'org-123',
});
```

**3.5.2 Embedding Modes**

- **Full Embedding:** Complete messaging interface embedded in web app
- **Widget Mode:** Floating chat widget (like Intercom)
- **Thread View Only:** Show single thread in embedded view
- **Property Folder View:** Show property-specific threads

**3.5.3 Theming & Customization**

- **White-Label Support:**
  - Custom logo
  - Custom color scheme
  - Custom fonts
  - Branding removal option

- **Theme Configuration:**
```typescript
interface EmbedTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  logoUrl?: string;
  showBranding?: boolean;
}
```

**3.5.4 Integration Points**

- **Authentication:** Web app handles auth, passes user token to SDK
- **Data Sync:** SDK connects to Communexus backend + custom backend via connector
- **Event Callbacks:**
  ```typescript
  onMessageSent?: (message: Message) => void;
  onThreadCreated?: (thread: Thread) => void;
  onPropertySelected?: (propertyId: string) => void;
  ```
- **API Methods:**
  ```typescript
  createThread(participants, propertyId): Promise<Thread>;
  sendMessage(threadId, text, channel): Promise<Message>;
  getThreads(propertyId?): Promise<Thread[]>;
  ```

---

### Feature 3.6: Flexible Backend Connector System

**Goal:** Enable Communexus to integrate with external backends (property management systems, CRM, etc.)

#### Requirements

**3.6.1 Backend Connector Interface**

```typescript
interface BackendConnector {
  // Property/Project Data
  getProperty(propertyId: string): Promise<Property>;
  getProperties(organizationId: string): Promise<Property[]>;
  searchProperties(query: string): Promise<Property[]>;
  
  // Calendar/Availability (Google Calendar Integration)
  getAvailability(userId: string, dateRange: DateRange): Promise<TimeSlot[]>;
  createAppointment(appointment: Appointment): Promise<Appointment>;
  // Google Calendar specific methods
  getGoogleCalendarAvailability(calendarId: string, dateRange: DateRange): Promise<TimeSlot[]>;
  createGoogleCalendarEvent(event: CalendarEvent): Promise<CalendarEvent>;
  
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
  
  // Custom Data
  getCustomData(entityType: string, entityId: string): Promise<any>;
  updateCustomData(entityType: string, entityId: string, data: any): Promise<void>;
}
```

**3.6.2 Connector Implementation Example**

```typescript
// Example: Property Management System Connector
class PropertyManagementConnector implements BackendConnector {
  constructor(private apiKey: string, private baseUrl: string) {}
  
  async getProperty(propertyId: string): Promise<Property> {
    const response = await fetch(`${this.baseUrl}/properties/${propertyId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    const data = await response.json();
    
    return {
      id: data.id,
      address: {
        street: data.address_line_1,
        city: data.city,
        state: data.state,
        zip: data.zip,
      },
      metadata: {
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        rent: data.monthly_rent,
      },
    };
  }
  
  async getAvailability(userId: string, dateRange: DateRange): Promise<TimeSlot[]> {
    // Fetch calendar availability from property management system
    // Return available time slots
  }
}
```

**3.6.3 Built-in Connectors**

- **Firebase/Firestore:** Default connector (existing system)
- **REST API Connector:** Generic connector for REST APIs
- **GraphQL Connector:** Generic connector for GraphQL APIs
- **Database Connector:** Direct database connections (PostgreSQL, MySQL)

**3.6.4 Connector Registry**

- Web app registers connector during SDK initialization
- AI Agent uses connector to fetch property data, check availability, etc.
- Thread routing can use connector to match external identities

---

## Updated Data Schema

### New Collections

```typescript
// Organizations (Single-tenant model)
organizations: {
  id: string;
  name: string;
  type: 'property_management' | 'contractor' | 'custom';
  settings: {
    backendConnector?: BackendConnectorConfig;
    aiAgentEnabled?: boolean;
    defaultChannels?: string[];
  };
  billingAccountId?: string; // Single billing account per organization
  createdAt: Timestamp;
}

// Properties (or Projects)
properties: {
  id: string;
  organizationId: string; // Belongs to single organization
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  propertyType: 'residential' | 'commercial' | 'mixed';
  metadata?: Record<string, any>;
  threadIds: string[]; // Associated threads
  externalId?: string; // ID in external backend
  tenants: string[]; // User IDs who are tenants at this property
  potentialTenants: string[]; // User IDs shopping/deciding on this property
  createdAt: Timestamp;
}

// Extended Users with Property Association
users: {
  // ... existing fields ...
  organizationId: string; // Belongs to single organization
  status: 'potential_tenant' | 'tenant' | 'property_manager' | 'admin';
  propertyId?: string; // Current property if tenant (single property once lease signed)
  shoppingProperties?: string[]; // Property IDs if potential_tenant shopping
  previousProperties?: string[]; // Historical property associations
}

// Extended Threads
threads: {
  // ... existing fields ...
  organizationId?: string;
  propertyId?: string;
  projectId?: string;
  channelSources: ('sms' | 'messenger' | 'whatsapp' | 'email' | 'in-app')[];
  tags: string[];
}

// Extended Messages
messages: {
  // ... existing fields ...
  channel: 'sms' | 'messenger' | 'whatsapp' | 'email' | 'in-app';
  channelMessageId?: string; // ID in external channel (Twilio message SID, etc.)
  senderIdentifier: string; // Phone, email, Facebook ID
  recipientIdentifier: string;
  direction: 'incoming' | 'outgoing';
  sentByAI?: boolean;
  aiApprovedBy?: string; // User ID if human approved AI response
  channelMetadata?: Record<string, any>;
}

// Identity Linking
identityLinks: {
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

// Channel Configurations
channelConfigs: {
  id: string;
  organizationId: string;
  channelType: 'sms' | 'messenger' | 'whatsapp' | 'email';
  provider: 'twilio' | 'facebook' | 'sendgrid' | 'custom';
  config: {
    apiKey?: string;
    apiSecret?: string;
    webhookUrl?: string;
    // Channel-specific settings
  };
  enabled: boolean;
  createdAt: Timestamp;
}

// Action Items (Auto-generated Task Lists)
actionItems: {
  id: string;
  threadId: string;
  propertyId?: string;
  organizationId: string;
  
  // Action item content
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  // Generation metadata
  autoGenerated: boolean; // True if generated by AI, false if manually added
  generatedBy: 'marketing_agent' | 'property_management_agent' | 'user';
  generatedAt: Timestamp;
  conversationStage?: 'prospect' | 'showing' | 'application' | 'move_in_prep' | 'move_in' | 'post_move_in' | 'maintenance' | 'renewal';
  
  // Completion tracking
  completedBy?: string; // User ID who marked complete
  completedAt?: Timestamp;
  autoCompleted: boolean; // True if AI detected completion in conversation
  
  // Assignment
  assignedTo?: string; // User ID (typically Property Manager)
  dueDate?: Timestamp;
  
  // Context
  relatedMessageIds?: string[]; // Messages that triggered this action
  notes?: string; // Additional notes from Property Manager
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Action Item Templates (Stage-specific)
actionItemTemplates: {
  id: string;
  organizationId: string;
  stage: 'prospect' | 'showing' | 'application' | 'move_in_prep' | 'move_in' | 'post_move_in' | 'maintenance' | 'renewal';
  title: string;
  description?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  required: boolean; // If true, always included when stage reached
  conditions?: {
    propertyType?: string[];
    // Other conditions for when to include
  };
  order: number; // Display order in action list
}
```

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  Web Application                         │
│  (Rental Management Platform / Contractor Tool)        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Communexus Embedded SDK / Components          │  │
│  │  - React Components                               │  │
│  │  - JavaScript SDK                                 │  │
│  │  - Backend Connector Interface                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ API Calls
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Communexus Platform                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web API    │  │  WebSocket   │  │  Cloud Funcs │ │
│  │  (REST)      │  │  (Real-time) │  │  (AI/Logic)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Channel Abstraction Layer                │  │
│  │  - SMS Adapter (Twilio)                          │  │
│  │  - Messenger Adapter (Facebook API)              │  │
│  │  - WhatsApp Adapter (Twilio/WhatsApp Business)   │  │
│  │  - Email Adapter (SendGrid/SMTP)                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           AI Agent System                        │  │
│  │  - LangChain Agent                               │  │
│  │  - Backend Connector Integration                 │  │
│  │  - Auto-Response Engine                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Firebase Backend                        │  │
│  │  - Firestore (Threads, Messages, Properties)    │  │
│  │  - Cloud Functions                               │  │
│  │  - Cloud Storage (Media)                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Backend Connector
                        ▼
┌─────────────────────────────────────────────────────────┐
│        External Backend System                          │
│  (Property Management / CRM / Custom)                   │
│  - Property Data                                        │
│  - Calendar/Availability                               │
│  - User/Contact Data                                    │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

**Channel Adapters:**
- Each channel (SMS, Messenger, etc.) has adapter implementing `ChannelAdapter` interface
- Adapters handle webhook receiving, message sending, status checking
- Unified message format conversion

**Message Router:**
- Routes inbound messages to correct thread
- Uses identity linking, thread metadata, AI classification
- Creates new threads if no match found

**AI Agent Engine:**
- LangChain-based agent with tool calling
- Integrates with backend connector for data
- Auto-response or approval workflow

**Backend Connector System:**
- Pluggable interface for external backends
- Web app provides connector implementation
- AI Agent and message routing use connector

---

## Implementation Phases

### Phase 3.1: Foundation (Weeks 1-4)
- Channel abstraction layer
- Basic SMS integration (Twilio)
- Unified thread model with channel indicators
- Identity linking system

### Phase 3.2: Multi-Channel Expansion (Weeks 5-8)
- Facebook Messenger integration
- Email channel integration (SendGrid/SMTP)
- Roomies.com integration (if feasible)
- Enhanced message routing
- **Note:** WhatsApp deferred - focusing on Messenger, Email, and SMS as primary channels

### Phase 3.3: AI Agent Participation (Weeks 9-12)
- AI agent auto-response system
- Backend connector integration
- Approval workflow for AI responses
- Scheduling and information answering

### Phase 3.4: Organization System (Weeks 13-16)
- Property/Project hierarchy
- Property assignment UI
- Folder view components
- Property-based filtering

### Phase 3.5: Web Embeddable (Weeks 17-20)
- React component library
- JavaScript SDK
- Theming system
- Integration documentation

### Phase 3.6: Backend Connector (Weeks 21-24)
- Connector interface specification
- Built-in connectors (Firebase, REST, GraphQL)
- Connector registry system
- Documentation and examples

### Phase 3.7: Export & Polish (Weeks 25-28)
- PDF/Text/JSON export
- Print formatting
- Legal compliance features
- Performance optimization

---

## Success Metrics

### Functional Metrics
- **Multi-Channel Support:** 4+ channels integrated (SMS, Messenger, WhatsApp, Email)
- **Channel Routing Accuracy:** 95%+ messages routed to correct thread
- **AI Response Accuracy:** 80%+ responses don't require human intervention
- **Export Completeness:** 100% of messages included in export

### Performance Metrics
- **Message Delivery:** <2s latency for cross-channel message delivery
- **AI Response Time:** <5s for AI agent responses
- **Export Generation:** <10s for 1000-message thread export

### Business Metrics
- **Embedding Adoption:** 3+ web applications successfully embedded
- **Backend Integration:** 2+ custom backend connectors implemented
- **User Satisfaction:** 90%+ users can successfully use multi-channel features

---

## Design Decisions & Resolutions

### 1. AI Agent Approval ✅

**Decision:** Full auto-mode with conversation-level toggle

- Each thread (one-on-one or group chat) has independent AI mode toggle at top of conversation
- **Auto Mode:** AI responds automatically (full auto-mode)
- **Manual Mode:** AI generates suggestions but requires human approval before sending
- Toggle persists per thread and can be changed mid-conversation

### 2. Property Auto-Assignment ✅

**Decision:** AI-driven property detection with fallback to user clarification

- **Facebook Marketplace:** Auto-identify property from post link/metadata
- **Other Listings:** AI analyzes message content to identify property (address, link, context)
- **Cross-Selling:** Marketing Agent automatically suggests alternative properties when user shows disinterest
- **Disambiguation:** If unclear, AI asks user for clarification

### 3. Channel Priority ✅

**Decision:** Last-used channel with context-based exceptions

- Default: Last-used channel in thread
- **Exceptions:**
  - **Lease links:** Send via both SMS and Email (redundancy)
  - **Facebook Marketplace:** Messenger for initial responses, migrate to SMS for tours/scheduling
  - **Tours/Scheduling:** Prefer SMS over Messenger
  - **Formal Documents:** Prefer Email

### 4. Legal Export Format ✅

**Decision:** PDF format sufficient for legal compliance

- PDF includes all required information (messages, timestamps, channel indicators, participant identities)
- Print-friendly formatting with legal headers
- Suitable for court-admissible documentation

### 5. Backend Connector Security ✅

**Security Best Practices:**

- **API Key Storage:**
  - Store encrypted credentials in secure environment variables (Firebase Config/Secrets Manager)
  - Never store credentials in client-side code or git repositories
  - Use per-organization credential isolation
  
- **Authentication:**
  - Use OAuth 2.0 where possible for external backends
  - Implement token refresh mechanisms
  - Store refresh tokens securely, never expose access tokens
  
- **Network Security:**
  - Use HTTPS for all API calls
  - Implement request signing for sensitive operations
  - Rate limiting to prevent abuse
  
- **Access Control:**
  - Credentials scoped to organization level
  - Role-based access control for credential management
  - Audit logging for credential access
  
- **Implementation:**
```typescript
// Secure credential storage
interface SecureCredentialStore {
  getCredentials(organizationId: string): Promise<EncryptedCredentials>;
  storeCredentials(organizationId: string, credentials: Credentials): Promise<void>;
  rotateCredentials(organizationId: string): Promise<void>;
}

// Credentials encrypted at rest
// Decrypted only when needed for API calls
// Credentials never logged or exposed in responses
```

### 6. Multi-Tenancy ✅

**Decision:** Single organization with multiple properties

- **Organization Model:**
  - Single organization account (all billing to one account)
  - Organization has multiple properties
  - Users belong to organization, not to multiple organizations
  
- **Property Association:**
  - **Potential Tenants:** Can be associated with multiple properties (shopping/deciding)
  - **Tenants:** Belong to single property once lease is signed
  - **Tenant Migration:** Tenants can move from one property to another within same organization
  
- **Data Isolation:**
  - All data scoped to organization level
  - Properties are sub-units within organization
  - Threads linked to properties for organization

### 7. Channel Channels & Priorities ✅

**Decision:** Focus on primary channels, defer others

- **Primary Channels:**
  - SMS (Twilio) - Primary ongoing communication
  - Facebook Messenger - Primary for Marketplace inquiries
  - Email (SendGrid/SMTP) - Primary for formal communications
  
- **Optional Channels:**
  - Roomies.com - Include if API available and straightforward
  
- **Deferred:**
  - WhatsApp Business API - Not in Phase 3 scope

### 8. Billing & Channel Costs ✅

**Billing Model:** Single organization account

- **Account Structure:**
  - Single organization account (not per-property billing)
  - All channel costs (SMS, email) billed to organization account
  - Usage tracking per property for internal reporting
  
- **Channel Cost Handling:**
  - **SMS (Twilio):** Per-message pricing tracked at organization level
  - **Email (SendGrid):** Based on plan (free tier or paid)
  - **Facebook Messenger:** Free (no per-message costs)
  
- **Billing Implementation:**
  - Track usage at organization level
  - Provide usage reports per property for internal analysis
  - Alert when approaching plan limits
  - Upgrade prompts if limits exceeded
  
- **Cost Tracking:**
```typescript
interface BillingUsage {
  organizationId: string;
  period: 'monthly' | 'weekly';
  smsMessages: number;
  emailMessages: number;
  messengerMessages: number;
  totalCost: number;
  costByProperty: { [propertyId: string]: number }; // Internal tracking
}
```

---

## Next Steps

1. ✅ **All design questions answered** - Specifications finalized
2. **Final review** - Verify all requirements captured correctly
3. **Merge into main PRD** - Integrate Phase 3 addendum into base PRD document
4. **Begin Phase 3.1 implementation** (Foundation) - Start with channel abstraction layer

---

**Document Status:** ✅ Complete - All Specifications Finalized  
**Next Action:** Merge into PRD → Begin Phase 3 Implementation Planning

