# Communexus - AI-Powered Project Communication Platform

**Communexus** is a cross-platform messaging application designed for contractors and service business operators. It combines real-time messaging, AI-powered project intelligence, and multi-channel communication to streamline project coordination and decision-making.

## Overview

Communexus is a React Native mobile application built with Firebase backend services, featuring:

- **Real-time messaging** with Firestore for instant communication
- **Project threads** supporting multiple participants and group conversations
- **Media sharing** for images, documents, and files
- **AI-powered features** including thread summarization, action extraction, and smart search
- **Cross-platform support** for iOS, Android, and Web
- **Modern UI/UX** with dark theme and accessibility support
- **Offline capabilities** for working without internet connection

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v20+ (required for latest dependencies)
- **npm**: v10+
- **Xcode**: 16.1+ (for iOS development)
- **macOS**: 14.5+ Sonoma (for Xcode 16.1)

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd communexus/main

# 2. Install dependencies
npm install

# 3. Start development
npm start
# Press 'i' for iOS, 'a' for Android, 'w' for web
```

### Development with EAS Build

```bash
# First time setup (already done!)
npx expo prebuild --platform ios
npx expo run:ios

# Daily development (hot reload works!)
npm start  # Just like Expo Go!
```

## 🧪 Testing

### Running Tests Locally

Before committing any code, you should run all CI/CD checks locally to ensure everything passes:

```bash
# Run all CI/CD pipeline checks
npm run lint           # ESLint code quality
npm run format:check   # Prettier formatting
npm run type-check     # TypeScript type checking
npm test               # Unit and integration tests
npm run build          # Verify build works
```

### E2E Tests

End-to-end tests use Appium and WebDriverIO to test the app in a real simulator:

```bash
# Terminal 1: Start Appium server
npm run appium:server

# Terminal 2: Start the app
npm start
# Press 'i' for iOS simulator

# Terminal 3: Run E2E tests
npm run test:e2e:ios

# Run quick smoke tests
npm run test:e2e:ios:simple

# Run with Claude AI visual verification (optional)
ENABLE_VISUAL_CHECKS=true npm run test:e2e:ios:visual
```

### Unit Tests

```bash
# Run all unit and integration tests
npm test

# Run tests with Firebase emulators
npm run test:emul

# Run tests in watch mode
npm test -- --watch
```

## 📁 Project Structure

```
communexus/main/
├── src/                      # Source code
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── screens/             # App screens
│   ├── services/            # Firebase services
│   ├── stores/              # State management
│   └── types/               # TypeScript types
├── tests/                   # Test suites
│   ├── e2e/                # Appium E2E tests
│   │   ├── config/         # WebDriverIO configs
│   │   ├── helpers/        # Test utilities
│   │   ├── pages/          # Page objects
│   │   └── specs/          # Test specifications
│   ├── computer-use/       # Claude AI testing
│   ├── integration/        # Integration tests
│   └── unit/               # Unit tests
├── functions/              # Firebase Cloud Functions
├── docs/                   # Documentation
│   ├── project/           # Project specs
│   ├── CI-CD-Pipeline.md  # CI/CD documentation
│   └── EAS-SETUP.md       # EAS build guide
├── specs/                  # Feature specifications
├── memory-bank/           # Project context
├── ios/                   # Native iOS project (EAS build)
└── .github/workflows/     # CI/CD pipelines
```

## 🛠️ Tech Stack

### Frontend

- **React Native**: 0.81.5
- **Expo**: SDK 54
- **TypeScript**: 5.0+ (strict mode)
- **React Navigation**: v7
- **State**: React Hooks + Zustand

### Backend

- **Firebase Firestore**: Real-time database
- **Firebase Auth**: User authentication
- **Firebase Storage**: Media storage
- **Firebase Functions**: Cloud functions

### Testing

- **E2E**: Appium + WebDriverIO
- **Unit**: Jest + React Native Testing Library
- **AI Testing**: Claude Sonnet 4 (Computer Use)
- **CI/CD**: GitHub Actions

### Development

- **EAS Development Build**: Production-like environment
- **Hot Reload**: Instant code updates
- **Firebase Emulators**: Local development
- **Appium**: UI automation

## 🎯 Key Features

### Messaging

- Real-time chat with Firestore listeners
- Group conversations with multiple participants
- Media sharing (images, documents, files)
- Message status tracking and read receipts
- Optimistic UI updates for instant feedback
- Offline support and message queuing

### Authentication

- Email/password authentication
- Secure Firebase Auth integration
- Test user creation for development
- Demo user quick login

### AI-Powered Intelligence

- Thread summarization with OpenAI GPT-4
- Automatic action item extraction
- Priority message detection
- Smart search with semantic understanding
- Proactive assistant suggestions

### UI/UX

- Modern dark theme design
- Accessibility labels and support
- Cross-platform consistency (iOS, Android, Web)
- Responsive design for all screen sizes

## 🚀 Deployment

### CI/CD Pipeline

The project uses GitHub Actions for automated CI/CD. On every push to `main`:

1. Code quality checks (ESLint, Prettier, TypeScript)
2. Test suite execution (Jest unit/integration tests)
3. Build verification (Firebase Functions, Expo app)
4. Deployment to Firebase services

See `.github/workflows/ci-cd.yml` for complete pipeline configuration.

### Manual Deployment

```bash
# Deploy Firebase services
firebase deploy

# Build mobile apps with EAS
eas build --platform ios
eas build --platform android
eas build --platform all
```

## 📖 Documentation

- **[EAS Setup Guide](docs/EAS-SETUP.md)** - Development build setup
- **[CI/CD Pipeline](docs/CI-CD-Pipeline.md)** - GitHub Actions workflow
- **[E2E Testing](tests/e2e/README.md)** - Appium test documentation
- **[Computer Use Testing](tests/computer-use/README.md)** - AI-powered testing
- **[Specifications](specs/)** - Feature specs and tasks
- **[Memory Bank](memory-bank/)** - Project context and decisions

## 🐛 Troubleshooting

### E2E Tests Not Running

```bash
# Make sure Appium server is running
npm run appium:server

# Make sure app is running
npm start  # Press 'i' for iOS

# Check Firebase emulators
firebase emulators:start --only auth,firestore,storage --project demo-communexus
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules dist ios/build
npm install
npx expo prebuild --clean
npx expo run:ios
```

### Firebase Emulator Issues

```bash
# Kill existing emulators
pkill -f firebase

# Restart
firebase emulators:start --only auth,firestore,storage --project demo-communexus
```

## 🛡️ Security

- Firebase Security Rules configured
- API keys secured in environment variables
- User data isolated per account
- Storage access restricted to authenticated users

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/xvanov/communexus/issues)
- **Documentation**: See `/docs/` and `/specs/`
- **Memory Bank**: Project context in `/memory-bank/`

---

**Built with ❤️ for contractors and service professionals**

🚀 Streamlining project communication, one message at a time.
