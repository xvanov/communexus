# System Patterns: Communexus Architecture

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │    Firebase    │    │   OpenAI API    │
│   Mobile App    │◄──►│    Backend     │◄──►│   (via Cloud    │
│   (Expo)        │    │   Services     │    │   Functions)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Local Cache   │    │   Cloud Storage │
│   (SQLite)     │    │   (Media)       │
└─────────────────┘    └─────────────────┘
```

### Component Architecture
```
src/
├── core/           # Future SDK extraction
├── business/        # Persona logic
├── ui/             # Presentation layer
├── services/        # External integrations
├── hooks/          # React hooks
├── stores/         # State management
└── types/          # TypeScript definitions
```

## Key Technical Decisions

### 1. Real-Time Messaging Pattern
- **Firestore Realtime Listeners**: For instant message updates
- **Optimistic UI Updates**: Messages appear immediately before server confirmation
- **Offline Queue**: Local SQLite queue for offline message handling
- **Auto-Reconnection**: Exponential backoff for network recovery

### 2. State Management Pattern
- **Zustand**: Global app state (user, active thread, offline queue)
- **React Query**: Server state caching and synchronization
- **Local State**: Component-level state for UI interactions

### 3. AI Integration Pattern
- **Cloud Functions**: Secure API key handling
- **Abstraction Layer**: Consistent AI service interface
- **Caching**: Response caching for performance
- **Error Handling**: Graceful degradation when AI unavailable

### 4. Offline-First Pattern
- **Local SQLite**: Primary data store for offline access
- **Sync Strategy**: Conflict resolution with last-write-wins
- **Queue Management**: Offline message queuing with retry logic
- **UI Indicators**: Clear offline/online status indicators

## Component Relationships

### Core Services
```
messaging.ts ←→ firebase.ts ←→ auth.ts
     ↓              ↓           ↓
storage.ts ←→ notifications.ts ←→ ai.ts
```

### UI Components
```
ChatListScreen → ThreadItem → ChatScreen
     ↓              ↓           ↓
ChatInput → MessageBubble → TypingIndicator
```

### Data Flow
```
User Action → Service Layer → Firebase → Real-time Update → UI Update
     ↓              ↓           ↓           ↓              ↓
Local Cache ← Sync Logic ← Firestore ← Cloud Function ← Push Notification
```

## Design Patterns in Use

### 1. Repository Pattern
- Abstract data access layer
- Consistent interface for local and remote data
- Easy testing and mocking

### 2. Observer Pattern
- Firestore real-time listeners
- Zustand state subscriptions
- React Query cache updates

### 3. Command Pattern
- Message sending operations
- AI feature requests
- Offline queue operations

### 4. Factory Pattern
- Component creation for different message types
- Service instantiation based on environment
- AI feature factory for different capabilities

## Performance Patterns

### 1. Lazy Loading
- Message pagination (50 messages per load)
- Image progressive loading
- Component lazy loading

### 2. Memoization
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers

### 3. Virtualization
- FlashList for message rendering
- Virtual scrolling for large lists
- Image lazy loading with blur placeholders

## Security Patterns

### 1. API Key Protection
- Keys stored in Cloud Functions only
- Never exposed in mobile app
- Environment variable management

### 2. Data Validation
- TypeScript strict mode
- Runtime validation for user inputs
- Firestore security rules

### 3. Authentication Flow
- Firebase Auth integration
- JWT token management
- Secure user session handling

