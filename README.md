# Communexus - AI-Powered Project Communication Platform

**Communexus** is a comprehensive messaging platform designed specifically for contractors and service business operators. It combines real-time messaging, AI-powered project intelligence, and multi-channel communication to streamline project coordination and decision-making.

## 🚀 Features

### ✅ Phase 3: Core Messaging Platform (MVP) - COMPLETE

- **Real-time Messaging**: Instant message delivery with Firestore real-time listeners
- **Project Threads**: Create group conversations with multiple participants
- **Media Sharing**: Upload and share images, documents, and files
- **Message Search**: Find specific information across all conversations
- **User Authentication**: Secure sign-in/sign-up with Firebase Auth
- **Optimistic UI**: Messages appear immediately for better user experience
- **Message Status**: Track sending/sent/delivered/read status
- **Test Users**: Built-in test accounts for easy testing

### 🔄 Phase 4: AI-Powered Project Intelligence (Next)

- **Thread Summarization**: AI-generated summaries of long conversations
- **Action Item Extraction**: Automatically identify and track tasks
- **Smart Search**: AI-enhanced search with context understanding
- **Priority Detection**: Identify urgent messages and decisions
- **Decision Tracking**: Track important decisions and outcomes

### 🔄 Phase 5: Multi-Channel Integration (Future)

- **SMS Integration**: Send/receive messages via SMS (Twilio)
- **Email Integration**: Email notifications and responses (SendGrid)
- **Channel Abstraction**: Unified interface for all communication channels
- **Message Routing**: Intelligent routing based on context and urgency

### 🔄 Phase 6: Proactive Project Assistant (Future)

- **Proactive Suggestions**: AI suggests next steps and follow-ups
- **Message Drafting**: AI helps draft responses and updates
- **Follow-up Detection**: Automatically detect when follow-ups are needed
- **Assistant UI**: Interactive AI assistant for project management

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo SDK 54+)
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Language**: TypeScript with strict mode
- **Navigation**: React Navigation v7
- **State Management**: React Hooks (useState, useEffect)
- **Real-time**: Firestore real-time listeners
- **Authentication**: Firebase Auth (email/password)
- **Storage**: Firebase Storage for media files
- **Development**: Expo Go for mobile testing

## 📱 Getting Started

### Prerequisites

- **Node.js**: v18+ (recommended: v20+)
- **npm**: v8+ or **yarn**: v1.22+
- **Expo CLI**: `npm install -g @expo/cli`
- **Firebase CLI**: `npm install -g firebase-tools`
- **Git**: For version control

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd communexus/main
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_APP_ID=your_app_id

# Development Settings
EXPO_PUBLIC_USE_EMULATORS=true
EXPO_PUBLIC_EMULATOR_HOST=127.0.0.1

# Optional: Firebase Tokens (for CI/CD)
FIREBASE_TOKEN=your_firebase_token
EXPO_TOKEN=your_expo_token
```

#### 4. Start Firebase Emulators

```bash
# Start Firebase emulators for local development
npx firebase emulators:start --only functions,firestore,auth,storage
```

This will start:
- **Firestore**: `http://localhost:8080`
- **Auth**: `http://localhost:9099`
- **Storage**: `http://localhost:9199`
- **Functions**: `http://localhost:5001`

#### 5. Start the Development Server

```bash
# Start Expo development server
npx expo start -c
```

This will:
- Start Metro bundler
- Open Expo DevTools in your browser
- Provide QR code for Expo Go app
- Enable hot reloading for development

### 🧪 Testing the App

#### Option 1: Web Browser
- Open `http://localhost:8081` in your browser
- Test authentication and messaging features

#### Option 2: Mobile Device (Recommended)
- Install **Expo Go** app on your phone
- Scan the QR code from the terminal
- Test on real device for best experience

#### Option 3: iOS Simulator (macOS only)
- Press `i` in the terminal to open iOS Simulator
- Test iOS-specific features

#### Option 4: Android Emulator
- Press `a` in the terminal to open Android Emulator
- Test Android-specific features

### 👥 Test Users

The app includes built-in test users for easy testing:

#### Create Test Users
1. Open the app
2. On the AuthScreen, tap **"👥 Create Test Users"**
3. This creates two test accounts:
   - `a@test.com` / `password`
   - `b@test.com` / `password`

#### Demo Account
- `demo@communexus.com` / `demo123`

#### Test Multi-User Messaging
1. Sign in as `a@test.com`
2. Create a project thread
3. Add `b@test.com` as a participant
4. Send messages
5. Sign out and sign in as `b@test.com`
6. See the messages and reply

## 🔧 Development Commands

### Package Management
```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Development
```bash
# Start Expo development server
npx expo start

# Start with cleared cache
npx expo start -c

# Start for specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

### Firebase
```bash
# Start Firebase emulators
npx firebase emulators:start --only functions,firestore,auth,storage

# Deploy to Firebase
npx firebase deploy

# Deploy specific services
npx firebase deploy --only functions
npx firebase deploy --only firestore
npx firebase deploy --only storage
```

### Code Quality
```bash
# Run TypeScript type checking
npm run type-check

# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Testing
```bash
# Run tests
npm test

# Run tests with Firebase emulators
npm run test:emul
```

## 🏗️ Project Structure

```
communexus/main/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── chat/           # Chat-specific components
│   │   └── thread/         # Thread-specific components
│   ├── hooks/              # Custom React hooks
│   ├── screens/            # App screens
│   ├── services/           # Firebase and external services
│   └── types/             # TypeScript type definitions
├── specs/                  # Project specifications
├── memory-bank/           # Project documentation
├── tests/                 # Test files
├── .env                   # Environment variables
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 🔐 Authentication & Security

### Firebase Auth
- **Email/Password**: Primary authentication method
- **Security Rules**: Firestore rules prevent unauthorized access
- **User Management**: Automatic user creation and profile management

### Data Security
- **Firestore Rules**: Restrict access to user's own data
- **Storage Rules**: Secure media uploads with user validation
- **Environment Variables**: Sensitive data stored in `.env`

## 📊 Performance

### Real-time Updates
- **Sub-200ms**: Message delivery time
- **60 FPS**: Smooth scrolling performance
- **<2 seconds**: App launch time
- **Optimistic UI**: Immediate message display

### Firebase Optimization
- **Real-time Listeners**: Efficient data synchronization
- **Pagination**: Limit message history for performance
- **Caching**: Local data persistence with SQLite

## 🚀 Deployment

### Development
- **Local Emulators**: Full Firebase emulator suite
- **Expo Go**: Real device testing
- **Hot Reloading**: Instant code updates

### Production
- **Firebase Hosting**: Web app deployment
- **EAS Build**: Mobile app builds
- **CI/CD**: Automated testing and deployment

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** changes with tests
4. **Run** quality checks (`npm run lint`, `npm run type-check`)
5. **Test** on real devices
6. **Submit** a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React Native
- **Prettier**: Consistent code formatting
- **Comments**: Well-documented code with TODO markers

## 📚 Documentation

- **Specifications**: `/specs/` - Detailed feature specifications
- **Memory Bank**: `/memory-bank/` - Project documentation
- **API Docs**: Firebase services documentation
- **Expo Docs**: React Native and Expo documentation

## 🐛 Troubleshooting

### Common Issues

#### Firebase Connection Issues
```bash
# Check emulator status
npx firebase emulators:start --only firestore,auth,storage

# Verify environment variables
cat .env
```

#### Expo Issues
```bash
# Clear cache and restart
npx expo start -c

# Reset Metro bundler
npx expo start --clear
```

#### TypeScript Errors
```bash
# Run type checking
npm run type-check

# Check TypeScript configuration
cat tsconfig.json
```

### Getting Help
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check `/specs/` and `/memory-bank/`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Firebase**: Backend services and real-time database
- **Expo**: React Native development platform
- **React Navigation**: Navigation library
- **TypeScript**: Type-safe JavaScript development

---

**Communexus** - Streamlining project communication for contractors and service businesses. 🚀