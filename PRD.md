# Communexus - Phased Development PRD
**AI-Powered Messaging for Contractors**

## Executive Summary

Communexus is a production-quality messaging app designed for contractors and service business operators to centralize communication with clients, team members, and vendors. The app combines real-time chat infrastructure with AI-powered features for task extraction, priority detection, and decision tracking.

**Primary Goal:** Achieve 90+ points on GauntletAI MessageAI project rubric  
**Long-term Vision:** Evolve into a multi-channel communication platform embeddable in vertical apps

---

## Persona: Service Business Operator (Contractor Focus)

**Who:** Independent contractors, sub-contractors, and small construction businesses

**Core Pain Points:**
- Fragmented communication across SMS, phone, and multiple apps
- Missed tasks and follow-ups buried in long message threads
- Difficulty tracking client decisions and agreements
- Manual organization of project-related conversations
- Lost context when switching between job sites or clients

**Daily Scenarios:**
- Client requests: "Can you start the tile work tomorrow?"
- Vendor updates: "Material delivery delayed to Friday"
- Team coordination: "Need measurements for the kitchen install"
- Payment discussions: "Invoice received, will pay by end of week"

---

## Three-Phase Development Plan

### PHASE 1: MVP Gate
**Goal:** Pass hard gate with all 10 core messaging features

**Deliverables:**
- ✅ One-on-one chat with real-time delivery
- ✅ Group chat (3+ users)
- ✅ Message persistence (offline support)
- ✅ Optimistic UI updates
- ✅ User authentication
- ✅ Online/offline presence
- ✅ Typing indicators
- ✅ Timestamps & read receipts
- ✅ Push notifications (foreground minimum)
- ✅ Basic image sharing

**Tech Approach:** Direct Firebase integration, minimal AI (defer to Phase 2)

**Success Criteria:** All core messaging works reliably on 2+ devices

---

### PHASE 2: Assignment Submission
**Goal:** Achieve 90+ points on rubric with polished AI features

**Enhancements:**
- ✅ All 5 required AI features fully implemented
- ✅ Advanced AI capability (Proactive Assistant with LangChain)
- ✅ Performance optimization (60fps, <2s launch)
- ✅ Lifecycle handling (background/foreground)
- ✅ Background push notifications
- ✅ Demo video with all test scenarios
- ✅ Clean documentation and README

**Tech Upgrades:**
- LangChain agent framework for Proactive Assistant
- OpenAI GPT-4 API for all AI features
- Performance profiling and optimization
- Error handling and recovery

**Target Scoring:**
- Messaging Infrastructure: 33/35 points
- Mobile App Quality: 18/20 points
- AI Features: 28/30 points
- Technical Implementation: 9/10 points
- Documentation: 5/5 points
- **Total: 93/100 points**

---

### PHASE 3: Post-Assignment (Platform Evolution)
**Goal:** Transform into embeddable multi-channel communication platform

**Features:**
- 🔄 Multi-channel integration (SMS via Twilio, WhatsApp, email)
- 🔄 Channel abstraction layer (unified thread model)
- 🔄 Multi-tenancy and organization isolation
- 🔄 Embeddable SDK and UI components
- 🔄 REST/WebSocket API for third-party integration
- 🔄 Identity linking (same person across channels)
- 🔄 White-label customization
- 🔄 Encryption and data ownership
- 🔄 Integration connectors (CRM, property management systems)

**Architecture Evolution:**
- Extract `/src/core` → `@communexus/engine` npm package
- Build channel adapters (SMS, WhatsApp, Email, Voice)
- Create embeddable React component library
- Add REST API layer for external apps
- Implement proper multi-tenancy

---

## MVP & Assignment Requirements

### Core Messaging Infrastructure (Target: 33/35 points)

#### Real-Time Message Delivery (12 points target: 11)
- Sub-200ms message delivery on good network
- Firestore realtime listeners for instant updates
- Optimistic UI: messages appear immediately before server confirmation
- Typing indicators with 3-second debounce
- Presence system: online/offline/away states
- Zero lag during rapid messaging (20+ consecutive messages)

**Implementation:**
```typescript
// Firestore realtime listener
onSnapshot(messagesQuery, (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      updateUIWithNewMessage(change.doc.data());
    }
  });
});
```

#### Offline Support & Persistence (12 points target: 11)
- Local SQLite cache via Expo SQLite
- Message queue for offline sends
- Auto-reconnection with exponential backoff
- Full sync on reconnection (<1 second)
- Clear UI indicators: "Offline", "Connecting", "Sending..."
- Pending message status display

**Test Scenarios:**
1. Send 5 messages while offline → go online → all deliver in order
2. Force quit mid-send → reopen → message completes
3. Network drop for 30s → auto-reconnect → seamless sync
4. Receive messages while offline → see them on reconnect

**Implementation:**
```typescript
// Offline queue
if (!navigator.onLine) {
  await saveToLocalQueue(message);
  showOptimisticUI(message);
} else {
  await sendToFirestore(message);
}
```

#### Group Chat Functionality (11 points target: 10)
- Support 3+ simultaneous users
- Clear message attribution (avatar + name)
- Read receipts show all readers
- Typing indicators: "Alice and Bob are typing..."
- Group member list with online status
- Performance: smooth with 5+ active participants

**Implementation:**
```typescript
// Group thread structure
threads: {
  id: string;
  participants: string[]; // user IDs
  participantDetails: { id, name, avatarUrl }[];
  isGroup: boolean;
  groupName?: string;
}
```

---

### Mobile App Quality (Target: 18/20 points)

#### Lifecycle Handling (8 points target: 7)
- App backgrounding: WebSocket graceful disconnect
- Foregrounding: instant reconnect + message sync
- Push notifications when app closed
- No message loss during transitions
- Battery efficient (no excessive polling)

**Implementation:**
```typescript
AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    gracefulDisconnect();
  } else if (state === 'active') {
    reconnectAndSync();
  }
});
```

#### Performance & UX (12 points target: 11)
- App launch to chat list: <2 seconds
- 60 FPS scrolling through 1000+ messages (FlashList)
- Optimistic UI: messages appear instantly
- Images: progressive loading with blur placeholder
- Keyboard handling: smooth without UI jank
- Animations: native driver for 60fps

**Optimizations:**
- FlashList for message rendering
- Image lazy loading
- Message pagination (50 messages per load)
- Memoized components

---

### AI Features Implementation (Target: 28/30 points)

All AI features use OpenAI GPT-4 API called from Firebase Cloud Functions to keep API keys secure.

#### 1. Thread Summarization (3 points)

**User Flow:**
1. User long-presses on a thread in chat list
2. Context menu appears with "Summarize Thread" option
3. Loading indicator shows (skeleton)
4. AI generates 3-5 bullet point summary
5. Summary appears in modal overlay

**Output Format:**
- **Key Decisions:** [list]
- **Action Items:** [list]
- **Unresolved Issues:** [list]
- **Next Steps:** [list]

**Performance Target:** <3 seconds  
**UI Location:** Long-press thread → "Summarize"  
**Implementation:** Direct GPT-4 API call from Cloud Function

**Prompt Template:**
```
Summarize this contractor conversation thread:
[last 50 messages]

Format:
Key Decisions: [bullet points]
Action Items: [bullet points]
Unresolved Issues: [bullet points]
Next Steps: [bullet points]

Be concise. Focus on actionable information.
```

---

#### 2. Action Item Extraction (3 points)

**User Flow:**
1. User opens thread settings (⚙️ icon)
2. Taps "Extract Action Items"
3. AI scans entire thread for tasks
4. Returns list of actionable items with status

**Output Format:**
```
□ Schedule plumber for Friday 2pm
□ Send updated quote to client
□ Order tile materials from supplier
✓ Collect deposit (completed - mentioned on 10/15)
```

**Performance Target:** <4 seconds  
**UI Location:** Thread menu → "Extract Actions"  
**Auto-detection:** Phrases like "need to", "must", "don't forget", "schedule"

**Prompt Template:**
```
Extract all action items from this contractor conversation:
[all messages]

For each action:
- What needs to be done
- Who is responsible (if mentioned)
- When (if mentioned)
- Status (pending or completed based on context)

Return as checkbox list.
```

---

#### 3. Smart Search (3 points)

**User Flow:**
1. User taps search icon (🔍) in header
2. Types natural language query: "when is the tile delivery?"
3. AI interprets intent and searches messages
4. Returns relevant messages with context

**Search Capabilities:**
- Semantic understanding: "payment" finds "invoice", "balance due"
- Date comprehension: "last week" searches date range
- Entity recognition: "plumber" finds related conversations
- Question answering: pulls specific info from threads

**Performance Target:** <2 seconds  
**UI Location:** Global search bar  
**Phase 2 Implementation:** Firestore text queries + GPT-4 intent parsing  
**Phase 3 Enhancement:** Vector embeddings for true semantic search

**Implementation (Simplified):**
```typescript
// Firestore text search + AI enhancement
const results = await firestore
  .collection('messages')
  .where('text', 'contains', extractKeywords(query))
  .get();

// GPT-4 ranks relevance
const ranked = await rankByRelevance(query, results);
```

---

#### 4. Priority Message Detection (3 points)

**User Flow:**
1. System automatically scans incoming messages
2. Urgent messages tagged with 🔥 badge
3. Push notification priority elevated
4. Thread moves to top of list

**Urgency Indicators:**
- ⚠️ Problem reports: "leak", "broken", "emergency"
- 💰 Payment issues: "payment overdue", "invoice due"
- ⏰ Time-sensitive: "ASAP", "urgent", "today"
- 😠 Client frustration: negative sentiment analysis

**Performance Target:** Real-time (<1s after message received)  
**UI Location:** Automatic badge on thread  
**False Positive Handling:** User can dismiss/train

**Prompt Template:**
```
Is this message urgent for a contractor? Reply YES or NO.

Message: "[message text]"

Urgent if:
- Emergency (leak, break, safety)
- Payment issue
- Deadline today/tomorrow
- Client frustration

Reply: YES/NO + brief reason
```

---

#### 5. Decision Tracking (3 points)

**User Flow:**
1. User long-presses message with a decision
2. Taps "Mark as Decision"
3. AI extracts decision details
4. Stored in "Decisions" tab

**Tracked Information:**
- What was decided
- Who agreed
- When (timestamp)
- Related context

**Use Cases:**
- "Agreed on $5,500 for the job"
- "Start date confirmed: Monday Nov 4"
- "Client approved tile design #3"

**Performance Target:** <2 seconds  
**UI Location:** Long-press message → "Mark as Decision" + Decisions tab  
**Protection:** Exportable for dispute resolution

**Auto-Detection Keywords:**
- "agreed", "confirmed", "approved", "decided"
- "let's go with", "sounds good", "deal"

---

#### 6. Advanced Feature: Proactive Assistant (10 points)

**Description:**
AI agent that monitors conversations and proactively suggests follow-ups, drafts messages, and identifies action needs without being asked.

**Capabilities:**

**A) Follow-up Detection:**
- Identifies unanswered questions
- Detects commitments without confirmation
- Flags approaching deadlines
- Suggests: "Client asked about start date 2 days ago - remind them?"

**B) Message Drafting:**
- Learns user's communication style
- Generates contextual responses
- Example: "Draft reply to client about material delay"
- User can edit before sending

**C) Smart Reminders:**
- "Invoice sent 7 days ago - send payment reminder?"
- "Quote sent Monday - follow up if no response"
- "Promised update by Friday - prepare status message"

**D) Workflow Automation:**
- Detects: "Can you come Thursday at 2pm?"
- Suggests: "Add to calendar? Draft confirmation message?"

**Implementation:** LangChain agent with:
- Conversation history retrieval (RAG)
- Function calling (calendar, message draft, reminder)
- Memory across interactions
- User preference learning

**Performance Target:** <5s for suggestions, <8s for drafts  
**UI Location:** Dedicated "Assistant" tab + proactive notifications  

**LangChain Tools:**
```typescript
tools = [
  searchConversationHistory(),
  draftMessage(),
  extractEntities(),
  checkCalendar(),
  setReminder()
]

agent = createReactAgent({
  llm: ChatOpenAI(gpt-4),
  tools: tools,
  memory: ConversationBufferMemory()
});
```

**Prompt Example:**
```
You are a proactive assistant for contractors.

Review recent conversations and:
1. Identify missed follow-ups
2. Suggest messages to send
3. Flag upcoming commitments
4. Draft responses if requested

Be helpful but not annoying. Only suggest when truly useful.

Recent conversations: [context]
```

---

## Technical Architecture

### Tech Stack

**Mobile App:**
- React Native (Expo SDK 50+)
- Expo Router (file-based navigation)
- Zustand (global state management)
- React Query (server state caching)
- FlashList (optimized message rendering)
- Expo SQLite (local persistence)
- Expo Notifications (push notifications)

**Backend:**
- Firebase Firestore (real-time database)
- Firebase Cloud Functions (Node.js 18, AI integration)
- Firebase Authentication (email/password + Google)
- Firebase Cloud Storage (image uploads)
- Firebase Cloud Messaging (push notifications)

**AI Integration:**
- OpenAI GPT-4 API (via Cloud Functions)
- LangChain (for Proactive Assistant in Phase 2)
- Function calling / tool use

**Development Tools:**
- TypeScript strict mode
- ESLint + Prettier
- Environment variables (.env + .env.example)

---

### Data Schema (Rubric-Compliant)

```typescript
// Firestore collections

users: {
  id: string;                    // Firebase Auth UID
  email: string;
  name: string;
  phone?: string;
  role: 'contractor' | 'client' | 'vendor';
  photoUrl?: string;
  
  // Presence
  online: boolean;
  lastSeen: Timestamp;
  typing: { threadId: string; timestamp: Timestamp } | null;
  
  // Push notifications
  pushToken?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

threads: {
  id: string;
  
  // Participants
  participants: string[];        // Array of user IDs
  participantDetails: {          // Denormalized for quick display
    id: string;
    name: string;
    photoUrl?: string;
  }[];
  
  // Group chat
  isGroup: boolean;
  groupName?: string;
  groupPhotoUrl?: string;
  
  // Last message (denormalized for list view)
  lastMessage: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
  };
  
  // Unread tracking
  unreadCount: { [userId: string]: number };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

messages: {
  id: string;
  threadId: string;
  
  // Sender
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string;
  
  // Content
  text: string;
  mediaUrl?: string;             // Firebase Storage URL
  mediaType?: 'image' | 'video' | 'file';
  
  // Status tracking
  status: 'sending' | 'sent' | 'delivered' | 'read';
  
  // Delivery tracking
  deliveredTo: string[];         // User IDs
  readBy: string[];              // User IDs with timestamps
  readTimestamps: { [userId: string]: Timestamp };
  
  // Timestamps
  createdAt: Timestamp;
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  
  // AI metadata
  priority?: 'urgent' | 'high' | 'normal';
  isDecision?: boolean;
  
  // Soft delete
  deleted: boolean;
}

aiSummaries: {
  id: string;
  threadId: string;
  
  // Summary content
  summary: string;
  keyDecisions: string[];
  actionItems: string[];
  unresolvedIssues: string[];
  nextSteps: string[];
  
  // Metadata
  generatedAt: Timestamp;
  messageCount: number;          // How many messages summarized
  lastMessageId: string;         // Track freshness
}

decisions: {
  id: string;
  threadId: string;
  messageId: string;
  
  // Decision content
  decision: string;
  context: string;
  participants: string[];
  
  // Metadata
  decidedAt: Timestamp;
  markedBy: string;              // User who marked it
  createdAt: Timestamp;
}

// Phase 3: Multi-channel additions
organizations: {
  id: string;
  name: string;
  settings: object;
  createdAt: Timestamp;
}

channels: {
  id: string;
  type: 'in-app' | 'sms' | 'whatsapp' | 'email';
  config: object;                // Twilio settings, etc.
}
```

---

### Folder Structure

```
/communexus
  /src
    /screens
      - AuthScreen.tsx           # Email/password + Google login
      - ChatListScreen.tsx       # Thread list with unread badges
      - ChatScreen.tsx           # Message thread view
      - GroupCreateScreen.tsx    # Create group chat
      - SettingsScreen.tsx       # Profile, logout
      - AssistantScreen.tsx      # Proactive Assistant (Phase 2)
      
    /components
      /chat
        - MessageBubble.tsx      # Individual message
        - ChatInput.tsx          # Text input + media button
        - TypingIndicator.tsx
        - MessageStatus.tsx      # Sent/Delivered/Read icons
      /thread
        - ThreadItem.tsx         # List item with preview
        - ThreadHeader.tsx
        - ParticipantList.tsx
      /ai
        - SummaryModal.tsx
        - ActionItemList.tsx
        - DecisionCard.tsx
        - AssistantSuggestion.tsx
      /common
        - Avatar.tsx
        - PresenceIndicator.tsx
        - LoadingState.tsx
        
    /services
      - firebase.ts              # Firebase initialization
      - auth.ts                  # Authentication methods
      - messaging.ts             # Send/receive messages
      - storage.ts               # Image upload
      - ai.ts                    # AI feature calls
      - notifications.ts         # Push notification setup
      
    /hooks
      - useMessages.ts           # Subscribe to messages
      - useThreads.ts            # Subscribe to threads
      - usePresence.ts           # Online/offline tracking
      - useTyping.ts             # Typing indicators
      - useOfflineQueue.ts       # Offline message handling
      
    /stores (Zustand)
      - userStore.ts             # Current user state
      - chatStore.ts             # Active thread, draft messages
      - offlineStore.ts          # Pending messages queue
      
    /types
      - User.ts
      - Thread.ts
      - Message.ts
      - AIFeatures.ts
      
    /utils
      - dateFormat.ts
      - messageHelpers.ts
      - validation.ts
      
  /functions (Firebase Cloud Functions)
    /src
      - index.ts                 # All function exports
      - aiThreadSummary.ts
      - aiActionExtraction.ts
      - aiPriorityDetection.ts
      - aiSmartSearch.ts
      - aiProactiveAgent.ts      # LangChain agent
      - sendNotification.ts
      
  /docs
    - README.md
    - SETUP.md
    - ARCHITECTURE.md
    - API.md
    
  - .env.example
  - app.json
  - package.json
  - tsconfig.json
```

---

## Deployment Strategy

### Mobile App
**Platform:** Expo Go  
**Testing:** 2+ physical devices (iOS and/or Android)  
**Distribution:** Expo QR code for testing, published to Expo

**Setup:**
```bash
# Install Expo CLI
npm install -g expo-cli

# Start development
expo start

# Scan QR code on physical devices
```

### Backend
**Platform:** Firebase (deployed, not localhost)  
**Requirements:** Must be publicly accessible for push notifications and device sync

**Deployment:**
```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

**Firebase Project Setup:**
- Enable Firestore in production mode
- Enable Authentication (Email + Google provider)
- Enable Cloud Storage
- Enable Cloud Messaging (FCM)
- Deploy Cloud Functions to us-central1 region

---

## Demo Test Scenarios (Rubric Requirements)

### Test 1: Real-Time Messaging (2 Devices)
**Setup:** Two physical devices, both logged in, Device A and Device B  
**Steps:**
1. Device A sends message "Hello from A"
2. Device B receives instantly (<200ms)
3. Device B replies "Got it!"
4. Device A receives instantly
5. Send 20 rapid messages from Device A
6. Device B shows all messages with no lag

**Pass Criteria:** Sub-200ms delivery, smooth 60fps scrolling

---

### Test 2: Offline Scenario
**Setup:** Single device  
**Steps:**
1. Turn on Airplane Mode
2. Send 5 messages (show "Sending..." status)
3. Turn off Airplane Mode
4. Messages deliver automatically (<1 second)
5. Other device receives all 5 messages in order

**Pass Criteria:** All messages delivered, no loss, clear status indicators

---

### Test 3: App Lifecycle Handling
**Setup:** Single device with active conversation  
**Steps:**
1. Background app (home button)
2. Other device sends message
3. Push notification appears
4. Foreground app
5. Message already visible (synced)

**Pass Criteria:** Instant sync, push notification works

---

### Test 4: Force Quit Recovery
**Setup:** Single device  
**Steps:**
1. Send message in active conversation
2. Force quit app immediately (swipe up)
3. Reopen app
4. Check conversation history intact
5. Verify sent message delivered

**Pass Criteria:** No message loss, full history preserved

---

### Test 5: Group Chat (3+ Users)
**Setup:** Three devices (or Device A + B + emulator)  
**Steps:**
1. Device A creates group with B and C
2. All three devices see group
3. A sends message
4. B and C receive instantly
5. B and C send simultaneously
6. All messages attributed correctly (name + avatar)
7. Check read receipts show who's read

**Pass Criteria:** Clear attribution, smooth performance, read tracking

---

### Test 6: AI Features Demo
**Setup:** Thread with 20+ messages about a contracting job  
**Steps:**

**Thread Summarization:**
1. Long-press thread → "Summarize"
2. Show loading (<3s)
3. Display summary with key decisions, actions, issues

**Action Extraction:**
1. Thread menu → "Extract Actions"
2. Show checkbox list of tasks
3. Verify accuracy (correctly identified todos)

**Smart Search:**
1. Search bar → "when is tile delivery?"
2. Returns relevant messages with context

**Priority Detection:**
1. Send urgent message: "URGENT: pipe leak in unit 5"
2. Shows 🔥 badge automatically
3. Thread moves to top

**Decision Tracking:**
1. Long-press message with agreement
2. "Mark as Decision"
3. Appears in Decisions tab

**Proactive Assistant:**
1. Open Assistant tab
2. Show proactive suggestion (e.g., "Follow up on quote from 3 days ago")
3. Tap suggestion → draft message appears
4. Edit and send

**Pass Criteria:** All features work reliably, <5s response times, natural interactions

---

## Environment Variables

`.env.example`:
```bash
# Firebase
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your_app_id

# OpenAI
OPENAI_API_KEY=sk-...

# Expo
EXPO_PROJECT_ID=your_expo_project_id
```

---

## Success Metrics

### MVP Gate
- [ ] All 10 core features functional
- [ ] Tested on 2+ physical devices
- [ ] No critical bugs
- [ ] Messages never lost

### Assignment Submission
**Target: 90+ points**

| Category | Target | Requirements |
|----------|--------|--------------|
| Messaging | 33/35 | Real-time <200ms, offline works, group chat smooth |
| Mobile Quality | 18/20 | Lifecycle handled, 60fps, <2s launch |
| AI Features | 28/30 | All 5 working well, assistant impressive |
| Technical | 9/10 | Clean code, secure keys, good architecture |
| Documentation | 5/5 | Clear README, setup works, demo video complete |

**Deliverables:**
- ✅ GitHub repo with clear README
- ✅ Demo video (5-7 min) showing all test scenarios
- ✅ Deployed app (Expo Go accessible)
- ✅ Persona Brainlift document
- ✅ Social post with @GauntletAI tag

---

## Post-MVP: Phase 3 Roadmap (Platform Evolution)

### Multi-Channel Foundation
- Twilio SMS integration
- Webhook endpoint for inbound SMS
- Channel abstraction layer
- Identity linking (phone → user)

### Platform Features
- WhatsApp Business API
- Email channel (SendGrid)
- Multi-tenancy (organization isolation)
- Channel routing logic

### SDK Development
- Extract communication engine
- Create `@communexus/engine` npm package
- Build embeddable React components
- REST API for third-party apps

### Integrations
- Property management connectors
- CRM integrations (HubSpot)
- Job management systems
- Payment system hooks

### Beyond
- Voice message support
- Video calling
- End-to-end encryption
- White-label customization
- Enterprise features

---

## Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Firebase cold start latency | AI features >5s | Pre-warm functions, use callable functions |
| OpenAI API rate limits | Features fail | Implement retry logic, caching |
| Expo push notification delays | Poor UX | Test early, fallback to local notifications |
| Offline sync conflicts | Data loss | Implement conflict resolution, last-write-wins |
| MVP scope too ambitious | Fail gate | Cut group chat to 2 users if needed, defer media |

---

## Out of Scope (Explicitly Deferred)

**Not in MVP or Assignment:**
- ❌ SMS/Twilio integration
- ❌ WhatsApp channel
- ❌ Email integration
- ❌ Voice messages
- ❌ Video calling
- ❌ Message encryption (beyond Firebase default)
- ❌ Multi-tenancy
- ❌ Admin dashboard
- ❌ Analytics
- ❌ Payment integration
- ❌ Vector search (use simple search)

---

## Final Notes

This PRD balances **pragmatic execution** (winning the assignment) with **strategic vision** (building toward Communexus platform). 

**Phase 1-2 focus:** Ship a polished, high-scoring messaging app  
**Phase 3 focus:** Evolve into embeddable communication platform

The three-phase approach ensures you can:
1. ✅ Pass the MVP gate
2. ✅ Achieve 90+ points on final rubric
3. ✅ Have a clear path to your long-term vision

**Key principle:** Build modular from day one, but don't over-engineer for future that may change.

---

**Ready to build? This PRD is your north star. Follow it Phase by Phase.**
