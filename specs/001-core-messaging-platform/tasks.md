---
description: 'Task list template for feature implementation'
---

# Tasks: Communexus Core Messaging Platform

**Input**: Design documents from `/specs/001-core-messaging-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize React Native Expo project with TypeScript
- [x] T003 [P] Configure ESLint, Prettier, and TypeScript strict mode
- [x] T004 [P] Set up Firebase project with all required services
- [x] T005 [P] Configure environment variables and .env.example
- [x] T006 [P] Set up Git repository with proper .gitignore
- [x] T007 [P] Create folder structure per architecture plan
- [x] T008 [P] Setup GitHub Actions CI/CD pipeline

**Phase 1 Summary**: All setup tasks completed successfully including optimized CI/CD pipeline with parallel execution, caching, and ~60% faster performance. Ready for Phase 2 foundational work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Setup Firebase Firestore with security rules
- [x] T010 [P] Implement Firebase Authentication (email/password + Google)
- [x] T011 [P] Setup Firebase Cloud Functions structure and deployment
- [x] T012 [P] Configure Firebase Storage rules for media uploads
- [x] T013 Create TypeScript interfaces for all data models
- [x] T014 [P] Implement basic CRUD operations for core entities
- [x] T015 Setup Firebase Cloud Messaging (FCM) for push notifications
- [x] T016 [P] Configure Expo SQLite for local data persistence
- [x] T017 [P] Setup Firebase Hosting for web app deployment
- [x] T018 [P] Configure EAS Build for mobile app updates
- [x] T019 [P] Setup environment-specific deployments (staging/production)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Project Communication Hub (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: Centralized project messaging with media sharing and search

**Independent Test**: Create project thread with 3+ participants, exchange messages and media, then search for specific information

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US1] Contract test for message sending in tests/contract/test_messaging.py
- [ ] T017 [P] [US1] Integration test for project thread creation in tests/integration/test_project_threads.py
- [ ] T018 [P] [US1] Unit test for message search functionality in tests/unit/test_search.py

### Implementation for User Story 1 ✅ COMPLETE

- [x] T019 [P] [US1] Create User model in src/types/User.ts
- [x] T020 [P] [US1] Create Thread model in src/types/Thread.ts
- [x] T021 [P] [US1] Create Message model in src/types/Message.ts
- [x] T022 [P] [US1] Create Media model in src/types/Media.ts
- [x] T023 [US1] Implement Firestore real-time listeners in src/services/messaging.ts
- [x] T024 [US1] Implement message sending service in src/services/messaging.ts
- [x] T025 [US1] Create ChatListScreen in src/screens/ChatListScreen.tsx
- [x] T026 [US1] Create ChatScreen in src/screens/ChatScreen.tsx
- [x] T027 [US1] Implement ThreadItem component in src/components/thread/ThreadItem.tsx
- [x] T028 [US1] Implement MessageBubble component in src/components/chat/MessageBubble.tsx
- [x] T029 [US1] Implement ChatInput component in src/components/chat/ChatInput.tsx
- [x] T030 [US1] Add message search functionality in src/services/search.ts
- [x] T031 [US1] Implement media sharing in src/services/storage.ts
- [x] T032 [US1] Add message status tracking (sending/sent/delivered/read)
- [x] T033 [US1] Implement optimistic UI updates for messages
- [x] T034 [US1] Add message timestamps and sender attribution
- [x] T035 [US1] Create project thread creation flow in src/screens/GroupCreateScreen.tsx

**Additional Features Implemented**:
- [x] T036 [US1] User authentication with Firebase Auth in src/screens/AuthScreen.tsx
- [x] T037 [US1] Logout functionality with confirmation dialog
- [x] T038 [US1] Username display in ChatListScreen header
- [x] T039 [US1] Test user creation (a@test.com, b@test.com) for testing
- [x] T040 [US1] React Navigation setup for screen management
- [x] T041 [US1] Firebase emulator configuration for local development
- [x] T042 [US1] TypeScript strict mode configuration and error fixes
- [x] T043 [US1] Firebase v12 integration with proper module resolution

**Checkpoint**: ✅ User Story 1 is fully functional and testable independently

---

## Phase 3.5: Stability, Modernization & Automated Testing (Priority: P1.5) 🚨 CRITICAL

**Goal**: Fix critical bugs, implement proper notifications, prevent chat duplication, modernize UI, and establish automated testing

**Status**: ⚠️ REQUIRED - Phase 3 has critical bugs making app almost unusable

**Independent Test**: App should be fully usable without bugs, with proper notifications, no chat duplication, and automated tests preventing regression

### Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

- [ ] T044 [P] [US1.5] Install Appium server and dependencies (appium, webdriverio)
- [ ] T045 [P] [US1.5] Configure Appium for iOS and Android testing
- [ ] T046 [P] [US1.5] Create automated test suites for core user flows
- [ ] T047 [P] [US1.5] Implement CI/CD integration for automated testing
- [ ] T048 [P] [US1.5] Create test data management and cleanup utilities
- [ ] T049 [P] [US1.5] Add automated tests for authentication flow
- [ ] T050 [P] [US1.5] Add automated tests for thread creation and messaging
- [ ] T051 [P] [US1.5] Add automated tests for contact system
- [ ] T052 [P] [US1.5] Add automated tests for cross-platform consistency

### Phase 3.5.2: Critical Bug Fixes

- [ ] T053 [US1.5] Fix Firebase permission errors and security rules
- [ ] T054 [US1.5] Resolve thread creation inconsistencies and visibility issues
- [ ] T055 [US1.5] Fix contact system and online status bugs
- [ ] T056 [US1.5] Resolve infinite loading states in message scenarios
- [ ] T057 [US1.5] Fix contact navigation errors and crashes
- [ ] T058 [US1.5] Implement proper error handling and user feedback
- [ ] T059 [US1.5] Fix thread deduplication logic to prevent multiple chats
- [ ] T060 [US1.5] Resolve cross-platform behavior differences

### Phase 3.5.3: Notification System Implementation

- [ ] T061 [P] [US1.5] Implement real-time push notifications with FCM
- [ ] T062 [P] [US1.5] Add in-app notification handling and display
- [ ] T063 [P] [US1.5] Create notification preferences and settings UI
- [ ] T064 [P] [US1.5] Implement notification actions and deep linking
- [ ] T065 [P] [US1.5] Add notification history and management
- [ ] T066 [P] [US1.5] Implement notification sound and vibration
- [ ] T067 [P] [US1.5] Add notification badges and unread counts
- [ ] T068 [P] [US1.5] Create notification testing and validation

### Phase 3.5.4: Thread Management & Duplication Prevention

- [ ] T069 [US1.5] Implement proper thread deduplication logic
- [ ] T070 [US1.5] Fix thread visibility and access control
- [ ] T071 [US1.5] Add thread archiving and deletion functionality
- [ ] T072 [US1.5] Implement proper thread search and filtering
- [ ] T073 [US1.5] Add thread management UI improvements
- [ ] T074 [US1.5] Implement thread sorting and organization
- [ ] T075 [US1.5] Add thread metadata and context tracking

### Phase 3.5.5: UI/UX Modernization

- [ ] T076 [P] [US1.5] Update design system with modern components
- [ ] T077 [P] [US1.5] Improve loading states and error handling UI
- [ ] T078 [P] [US1.5] Add proper animations and transitions
- [ ] T079 [P] [US1.5] Implement dark mode support
- [ ] T080 [P] [US1.5] Improve accessibility features and compliance
- [ ] T081 [P] [US1.5] Add proper empty states and onboarding
- [ ] T082 [P] [US1.5] Implement responsive design improvements
- [ ] T083 [P] [US1.5] Add haptic feedback and micro-interactions

### Phase 3.5.6: Cross-Platform Consistency

- [ ] T084 [US1.5] Ensure identical behavior between web and mobile
- [ ] T085 [US1.5] Fix platform-specific bugs and inconsistencies
- [ ] T086 [US1.5] Implement consistent navigation patterns
- [ ] T087 [US1.5] Add platform-specific optimizations
- [ ] T088 [US1.5] Ensure feature parity across platforms
- [ ] T089 [US1.5] Test and validate cross-platform functionality

**Checkpoint**: ✅ App is fully usable without critical bugs, with proper notifications, no chat duplication, modern UI, and automated tests preventing regression

---

## Phase 4: User Story 2 - AI-Powered Project Intelligence (Priority: P2)

**Goal**: AI features for thread summarization, action extraction, priority detection, and decision tracking

**Independent Test**: Create thread with 20+ messages containing action items, decisions, and urgent issues, then use AI features

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T090 [P] [US2] Contract test for AI thread summarization in tests/contract/test_ai_summary.py
- [ ] T091 [P] [US2] Integration test for action item extraction in tests/integration/test_action_extraction.py
- [ ] T092 [P] [US2] Unit test for priority detection in tests/unit/test_priority_detection.py

### Implementation for User Story 2

- [ ] T093 [P] [US2] Create AI service abstraction in src/services/ai.ts
- [ ] T094 [P] [US2] Implement OpenAI API integration in functions/src/aiThreadSummary.ts
- [ ] T095 [P] [US2] Implement OpenAI API integration in functions/src/aiActionExtraction.ts
- [ ] T096 [P] [US2] Implement OpenAI API integration in functions/src/aiPriorityDetection.ts
- [ ] T097 [P] [US2] Implement OpenAI API integration in functions/src/aiSmartSearch.ts
- [ ] T098 [P] [US2] Implement OpenAI API integration in functions/src/aiDecisionTracking.ts
- [ ] T099 [US2] Create thread summarization UI in src/components/ai/SummaryModal.tsx
- [ ] T100 [US2] Create action item list UI in src/components/ai/ActionItemList.tsx
- [ ] T101 [US2] Create priority badge UI in src/components/common/PriorityBadge.tsx
- [ ] T102 [US2] Create decision tracking UI in src/components/ai/DecisionCard.tsx
- [ ] T103 [US2] Implement AI response caching and error handling
- [ ] T104 [US2] Add AI feature configuration and settings
- [ ] T105 [US2] Create AI feature loading states and error handling
- [ ] T106 [US2] Implement AI feature performance optimization
- [ ] T107 [US2] Add AI feature analytics and usage tracking

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Multi-Channel Integration (Priority: P3)

**Goal**: Unified threads combining SMS, email, and in-app messages

**Independent Test**: Set up SMS and email webhooks routing to existing threads, verify unified conversation history

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T108 [P] [US3] Contract test for SMS webhook handling in tests/contract/test_sms_webhook.py
- [ ] T109 [P] [US3] Integration test for email parsing in tests/integration/test_email_parsing.py
- [ ] T110 [P] [US3] Unit test for channel routing in tests/unit/test_channel_routing.py

### Implementation for User Story 3

- [ ] T111 [P] [US3] Create channel abstraction layer in src/services/channels.ts
- [ ] T112 [P] [US3] Implement Twilio SMS integration in functions/src/smsHandler.ts
- [ ] T113 [P] [US3] Implement SendGrid email integration in functions/src/emailHandler.ts
- [ ] T114 [P] [US3] Create message routing system in functions/src/messageRouter.ts
- [ ] T115 [US3] Implement SMS webhook handling and parsing
- [ ] T116 [US3] Implement email parsing and threading
- [ ] T117 [US3] Create channel-specific message formatting
- [ ] T118 [US3] Add channel status and health monitoring
- [ ] T119 [US3] Implement channel configuration management
- [ ] T120 [US3] Create multi-channel UI indicators
- [ ] T121 [US3] Add channel analytics and reporting
- [ ] T122 [US3] Implement channel-specific error handling

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Proactive Project Assistant (Priority: P3)

**Goal**: AI agent with proactive suggestions, message drafting, and follow-up detection

**Independent Test**: Create project threads with commitments and deadlines, verify AI assistant identifies follow-up needs

### Tests for User Story 4 (OPTIONAL - only if tests requested) ⚠️

- [ ] T123 [P] [US4] Contract test for LangChain agent in tests/contract/test_proactive_agent.py
- [ ] T124 [P] [US4] Integration test for follow-up detection in tests/integration/test_followup_detection.py
- [ ] T125 [P] [US4] Unit test for message drafting in tests/unit/test_message_drafting.py

### Implementation for User Story 4

- [ ] T126 [P] [US4] Set up LangChain framework in functions/src/aiProactiveAgent.ts
- [ ] T127 [P] [US4] Implement conversation memory and context management
- [ ] T128 [P] [US4] Create proactive suggestion system
- [ ] T129 [P] [US4] Implement message drafting capabilities
- [ ] T130 [P] [US4] Add follow-up detection and reminder system
- [ ] T131 [US4] Create AssistantScreen UI in src/screens/AssistantScreen.tsx
- [ ] T132 [US4] Implement assistant interaction flow
- [ ] T133 [US4] Add assistant learning and personalization
- [ ] T134 [US4] Create assistant suggestion UI components
- [ ] T135 [US4] Implement assistant notification system
- [ ] T136 [US4] Add assistant analytics and performance tracking

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T137 [P] Documentation updates in docs/
- [ ] T138 [P] Code cleanup and refactoring
- [ ] T139 [P] Performance optimization across all stories
- [ ] T140 [P] Additional unit tests in tests/unit/
- [ ] T141 [P] Security hardening and API key protection
- [ ] T142 [P] Error handling and recovery improvements
- [ ] T143 [P] Accessibility features and improvements
- [ ] T144 [P] Internationalization support
- [ ] T145 [P] Dark mode and theme support
- [ ] T146 [P] Offline-first architecture optimization
- [ ] T147 [P] Push notification optimization
- [ ] T148 [P] Real-time performance optimization
- [ ] T149 [P] AI feature response time optimization
- [ ] T150 [P] Multi-channel reliability improvements
- [ ] T151 [P] Assistant personalization improvements
- [ ] T152 [P] Run quickstart.md validation
- [ ] T153 [P] Demo video preparation and testing
- [ ] T154 [P] Final deployment and testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Depends on US2 AI infrastructure

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create User model in src/types/User.ts"
Task: "Create Thread model in src/types/Thread.ts"
Task: "Create Message model in src/types/Message.ts"
Task: "Create Media model in src/types/Media.ts"

# Launch all UI components for User Story 1 together:
Task: "Create ChatListScreen in src/screens/ChatListScreen.tsx"
Task: "Create ChatScreen in src/screens/ChatScreen.tsx"
Task: "Implement ThreadItem component in src/components/thread/ThreadItem.tsx"
Task: "Implement MessageBubble component in src/components/chat/MessageBubble.tsx"
Task: "Implement ChatInput component in src/components/chat/ChatInput.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Project Communication Hub)
   - Developer B: User Story 2 (AI Features)
   - Developer C: User Story 3 (Multi-Channel Integration)
   - Developer D: User Story 4 (Proactive Assistant)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
