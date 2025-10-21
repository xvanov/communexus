<!--
Sync Impact Report:
Version change: 1.0.0 → 1.1.0 (added CI/CD verification requirement)
Modified principles: Quality Gates - Added Task Completion Verification requirement
Added sections: Task Completion Verification (detailed CI/CD pipeline checks)
Removed sections: N/A
Templates requiring updates:
  ✅ plan-template.md - Constitution Check section updated
  ⚠ pending - spec-template.md (no constitution references found)
  ⚠ pending - tasks-template.md (no constitution references found)
Follow-up TODOs: None
-->

# Communexus Constitution

## Core Principles

### I. Assignment-First Development (NON-NEGOTIABLE)

Every feature MUST directly contribute to achieving 90+ points on the GauntletAI MessageAI project rubric. Features that don't score points are deferred to Phase 3. The MVP gate (24-hour requirement) takes absolute priority over all other considerations. All development decisions must be justified against rubric scoring criteria.

### II. Three-Phase Architecture

Development MUST follow the three-phase approach: Phase 1 (MVP Gate), Phase 2 (Assignment Submission), Phase 3 (Platform Evolution). Each phase has distinct goals and deliverables. Phase 1 focuses on core messaging infrastructure, Phase 2 adds AI features for scoring, Phase 3 evolves into embeddable multi-channel platform. No phase can be skipped or merged.

### III. Real-Time Messaging Excellence

Message delivery MUST achieve sub-200ms latency on good networks. Offline support MUST queue messages locally and sync seamlessly on reconnection. Group chat MUST support 3+ users with clear attribution and read receipts. All messaging features MUST be tested on 2+ physical devices before submission.

### IV. AI Feature Integration

All 5 required AI features MUST be implemented: Thread Summarization, Action Item Extraction, Smart Search, Priority Message Detection, Decision Tracking. The Proactive Assistant MUST use LangChain agent framework for advanced capability scoring. AI features MUST have <5s response times and natural user interactions.

### V. Mobile-First Performance

App launch MUST complete in <2 seconds. Scrolling MUST maintain 60 FPS through 1000+ messages using FlashList. Lifecycle handling MUST gracefully manage background/foreground transitions without message loss. Push notifications MUST work when app is closed.

## Technical Standards

### Technology Stack Requirements

- **Mobile**: React Native (Expo SDK 54+), TypeScript strict mode
- **Backend**: Firebase (Firestore, Cloud Functions, Auth, Storage, FCM)
- **AI**: OpenAI GPT-4 API via Cloud Functions, LangChain for Proactive Assistant
- **State**: Zustand for global state, React Query for server state
- **Testing**: Physical devices required, Expo Go for distribution
- **CI/CD**: GitHub Actions pipeline for automated testing, building, and deployment

### Code Organization

- **Structure**: Modular architecture with clear separation between core engine, business logic, and UI
- **Folder Layout**: `/src/core` (future SDK), `/src/business` (persona logic), `/src/ui` (presentation)
- **Documentation**: All code MUST be well-commented with TODO markers for extensions
- **Environment**: API keys MUST be secured in Cloud Functions, never exposed in mobile app

### Data Schema Compliance

- **Users**: Must include presence tracking (online, lastSeen, typing)
- **Threads**: Must support group chat with participant details and unread counts
- **Messages**: Must track delivery status (sending/sent/delivered/read) with timestamps
- **AI Features**: Must store summaries, decisions, and action items with metadata

## Development Workflow

### Phase Gate Requirements

- **Phase 1 Gate**: All 10 core messaging features functional, tested on 2+ devices
- **Phase 2 Gate**: 90+ rubric points achieved, demo video complete, all deliverables submitted
- **Phase 3 Gate**: Multi-channel integration working, SDK extraction possible

### Testing Mandates

- **Real-Time Test**: Two devices messaging with <200ms delivery
- **Offline Test**: 5 messages queued offline, all deliver on reconnect
- **Lifecycle Test**: Background/foreground transitions without message loss
- **Group Test**: 3+ users with clear attribution and read receipts
- **AI Test**: All 5 features working with <5s response times

### Quality Gates

- **Performance**: 60 FPS scrolling, <2s launch, sub-200ms messaging
- **Reliability**: Zero message loss, graceful error handling, offline resilience
- **User Experience**: Optimistic UI updates, clear status indicators, natural interactions
- **Documentation**: Clear README, setup instructions, demo video, persona brainlift
- **CI/CD**: Automated testing, linting, type checking, and deployment on every push/PR
- **Task Completion Verification**: Before declaring any task complete, ALL CI/CD pipeline checks MUST pass locally:
  - ESLint (no errors, warnings acceptable)
  - Prettier formatting check
  - TypeScript compilation check
  - Jest test suite (all tests passing)
  - Firebase Functions build
  - Expo app build
  - Security audit (npm audit)
  - Full pipeline simulation must complete successfully

## Governance

Constitution supersedes all other development practices. Amendments require documentation of impact on rubric scoring and platform evolution path. All PRs must verify compliance with phase requirements and performance targets. Complexity must be justified against assignment scoring criteria.

**Version**: 1.1.0 | **Ratified**: 2024-12-19 | **Last Amended**: 2024-12-19
