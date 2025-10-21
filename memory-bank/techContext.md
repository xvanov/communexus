# Technical Context: Communexus Development Environment

## Technologies Used

### Mobile Development

- **React Native**: Cross-platform mobile development
- **Expo SDK 54**: Development platform and tooling (upgraded from SDK 50)
- **TypeScript 5.0+**: Type-safe JavaScript with strict mode
- **Expo Router**: File-based navigation system

### Backend Services

- **Firebase Firestore**: Real-time NoSQL database
- **Firebase Cloud Functions**: Serverless backend (Node.js 18+)
- **Firebase Authentication**: User management (email/password + Google)
- **Firebase Storage**: Media file storage
- **Firebase Cloud Messaging**: Push notifications

### AI Integration

- **OpenAI GPT-4 API**: AI features and capabilities
- **LangChain**: Advanced AI agent framework for Proactive Assistant
- **Function Calling**: Tool use for AI capabilities

### State Management

- **Zustand**: Global state management
- **React Query**: Server state caching and synchronization
- **Expo SQLite**: Local data persistence

### UI and Performance

- **FlashList**: Optimized list rendering for messages
- **React Native Testing Library**: Component testing
- **Jest**: Unit testing framework

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Firebase CLI
- Git

### Environment Configuration

```bash
# Required environment variables
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your_app_id
OPENAI_API_KEY=sk-...
EXPO_PROJECT_ID=your_expo_project_id
```

### Development Commands

```bash
# Install dependencies
npm install

# Start Expo development server
expo start

# Deploy Firebase functions
firebase deploy --only functions

# Run tests
npm test
```

## Technical Constraints

### Performance Requirements

- **Message Delivery**: Sub-200ms on good networks
- **App Launch**: <2 seconds to chat list
- **Scrolling**: 60 FPS through 1000+ messages
- **AI Response**: <5 seconds for all AI features

### Platform Requirements

- **iOS**: iOS 13+ support
- **Android**: Android 8+ support
- **Expo Go**: Must work in Expo Go for testing
- **Physical Devices**: Testing required on 2+ devices

### Offline Requirements

- **Message Queuing**: Queue messages when offline
- **Data Persistence**: Maintain message history
- **Sync Recovery**: Seamless sync on reconnection
- **Conflict Resolution**: Handle offline conflicts

## Dependencies

### Core Dependencies

```json
{
  "expo": "~54.0.0",
  "react": "^19.1.0",
  "react-native": "^0.81.4",
  "typescript": "^5.0.0",
  "@expo/vector-icons": "^15.0.2",
  "expo-sqlite": "~13.0.0",
  "expo-notifications": "~0.27.0"
}
```

### Firebase Dependencies

```json
{
  "firebase": "^10.0.0",
  "firebase-admin": "^12.0.0",
  "firebase-functions": "^4.0.0"
}
```

### State Management

```json
{
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^5.0.0",
  "@shopify/flash-list": "^1.6.0"
}
```

### AI Dependencies

```json
{
  "openai": "^4.0.0",
  "langchain": "^0.1.0"
}
```

## Development Tools

### Code Quality

- **ESLint**: Code linting with React Native rules (v9 with modern config)
- **Prettier**: Code formatting with integration
- **TypeScript Strict**: Strict type checking with enhanced options
- **GitHub Actions**: Optimized CI/CD pipeline with parallel execution and caching

### Testing

- **Jest**: Unit testing framework with TypeScript support
- **React Native Testing Library**: Component testing
- **Firebase Emulator Suite**: Local Firebase testing
- **CI/CD Pipeline**: Automated testing on every push/PR with ~60% faster execution

### Deployment

- **Expo Go**: Development and testing
- **Firebase Hosting**: Web app deployment
- **Firebase Cloud Functions**: Backend API deployment
- **EAS Build**: Mobile app builds and updates
- **GitHub Actions**: Comprehensive CI/CD pipeline with automated testing, building, and deployment
- **Performance**: ~60% faster pipeline (4-6 minutes vs 8-12 minutes) with parallel jobs and caching

## Security Considerations

### API Key Management

- Keys stored in Cloud Functions only
- Environment variables for configuration
- Never commit keys to repository

### Data Security

- Firestore security rules
- User authentication required
- Input validation and sanitization

### Privacy

- User data encryption in transit
- Local data encryption at rest
- GDPR compliance considerations
