# Deployment Guide: Communexus

This guide covers deploying the Communexus messaging app to various platforms including TestFlight, App Store, Play Store, and Firebase.

## Prerequisites

### Required Tools

1. **EAS CLI** - For building and submitting mobile apps
   ```bash
   npm install -g @expo/eas-cli
   eas login
   ```

2. **Firebase CLI** - For deploying backend services
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Node.js 20+** - Required for all build processes
   ```bash
   node --version  # Should be 20.0.0 or higher
   ```

### Required Accounts

- **Expo Account** - For EAS builds and app distribution
- **Apple Developer Account** - For iOS App Store and TestFlight
- **Google Play Console Account** - For Android Play Store
- **Firebase Project** - For backend services

## Environment Setup

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
# Expo Configuration
EXPO_PROJECT_ID=your-expo-project-id

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-firebase-app-id

# OpenAI Configuration (for Cloud Functions)
OPENAI_API_KEY=sk-your-openai-api-key

# Apple Configuration (for App Store)
APPLE_ID=your-apple-id@example.com
APPLE_TEAM_ID=ABCD123456
ASC_APP_ID=1234567890

# Google Play Configuration
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=./path-to-service-account-key.json
```

### 2. Firebase Configuration

1. Initialize Firebase in your project:
   ```bash
   firebase init
   ```

2. Configure Firebase Functions:
   ```bash
   cd functions
   npm install
   npm run build
   ```

3. Set up Firebase project:
   ```bash
   firebase use your-project-id
   ```

### 3. EAS Configuration

1. Configure EAS project:
   ```bash
   eas init
   ```

2. Update `eas.json` with your Apple and Google credentials

3. Configure app.json with proper bundle identifiers

## Deployment Workflows

### Quick Development Deployment

For rapid development and testing:

```bash
./scripts/deploy.sh deploy-dev
```

This will:
- Run tests and linting
- Build development version
- Deploy Firebase Functions
- Skip store submissions

### Production Deployment

For full production deployment:

```bash
./scripts/deploy.sh deploy-all
```

This will:
- Run all validation checks
- Build production version
- Deploy all Firebase services
- Submit to TestFlight and Play Store

### Individual Commands

#### Building

```bash
# Development build
./scripts/deploy.sh build-dev

# Preview build
./scripts/deploy.sh build-preview

# Production build
./scripts/deploy.sh build-prod

# TestFlight build
./scripts/deploy.sh build-testflight
```

#### Deploying Backend

```bash
# Deploy only Firebase Functions
./scripts/deploy.sh deploy-functions

# Deploy all Firebase services
./scripts/deploy.sh deploy-firebase
```

#### Submitting to Stores

```bash
# Submit to TestFlight
./scripts/deploy.sh submit-testflight

# Submit to App Store
./scripts/deploy.sh submit-appstore

# Submit to Play Store
./scripts/deploy.sh submit-playstore
```

## Platform-Specific Instructions

### iOS Deployment

#### TestFlight

1. **Build for TestFlight:**
   ```bash
   eas build --platform ios --profile testflight
   ```

2. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios --profile testflight
   ```

3. **Configure TestFlight:**
   - Add test users in App Store Connect
   - Set up test groups
   - Configure test information

#### App Store

1. **Build for App Store:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios --profile production
   ```

3. **App Store Connect:**
   - Complete app information
   - Upload screenshots
   - Set up app review information
   - Submit for review

### Android Deployment

#### Play Store Internal Testing

1. **Build AAB:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Play Store:**
   ```bash
   eas submit --platform android --profile production
   ```

3. **Play Console:**
   - Upload to internal testing track
   - Add test users
   - Configure release notes

#### Play Store Production

1. **Complete Play Console setup:**
   - App information
   - Store listing
   - Content rating
   - Privacy policy

2. **Submit for review:**
   - Upload to production track
   - Complete review questionnaire
   - Submit for review

### Firebase Deployment

#### Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

#### Firestore Rules

```bash
firebase deploy --only firestore:rules
```

#### Storage Rules

```bash
firebase deploy --only storage
```

#### All Firebase Services

```bash
firebase deploy
```

## Testing Before Deployment

### Automated Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Manual Testing

1. **Development Build Testing:**
   ```bash
   eas build --platform all --profile development
   ```

2. **Preview Build Testing:**
   ```bash
   eas build --platform all --profile preview
   ```

3. **Test on Real Devices:**
   - Install development build
   - Test all features
   - Verify offline functionality
   - Test AI features

### Performance Testing

```bash
# Run performance tests
npm run test:performance

# Check bundle size
npx expo export --platform all
```

## Troubleshooting

### Common Issues

#### Build Failures

1. **Check EAS CLI version:**
   ```bash
   eas --version
   ```

2. **Clear build cache:**
   ```bash
   eas build --clear-cache
   ```

3. **Check environment variables:**
   ```bash
   eas env:list
   ```

#### Firebase Deployment Issues

1. **Check Firebase CLI version:**
   ```bash
   firebase --version
   ```

2. **Re-authenticate:**
   ```bash
   firebase logout
   firebase login
   ```

3. **Check project configuration:**
   ```bash
   firebase projects:list
   firebase use --add
   ```

#### Store Submission Issues

1. **Check Apple Developer Account:**
   - Verify certificates
   - Check provisioning profiles
   - Validate app identifiers

2. **Check Google Play Console:**
   - Verify service account
   - Check app signing
   - Validate package name

### Debug Commands

```bash
# Check EAS build status
eas build:list

# Check Firebase deployment status
firebase functions:log

# Check app store submission status
eas submission:list
```

## Security Considerations

### API Keys

- Never commit API keys to version control
- Use environment variables for all secrets
- Rotate keys regularly
- Use least privilege access

### Firebase Security

- Review Firestore security rules
- Validate Cloud Function permissions
- Monitor Firebase usage
- Set up alerts for unusual activity

### App Store Security

- Enable App Transport Security (ATS)
- Use certificate pinning for critical APIs
- Implement proper authentication
- Regular security audits

## Monitoring and Analytics

### Firebase Analytics

- Track user engagement
- Monitor app performance
- Set up crash reporting
- Configure custom events

### App Store Analytics

- Monitor download metrics
- Track user reviews
- Analyze crash reports
- Review performance metrics

## Rollback Procedures

### Firebase Rollback

```bash
# Rollback to previous version
firebase functions:rollback

# Rollback Firestore rules
firebase firestore:rules:rollback
```

### App Store Rollback

1. **iOS:**
   - Revert to previous build in App Store Connect
   - Submit new version with fixes

2. **Android:**
   - Upload previous AAB to Play Console
   - Release to production track

## Best Practices

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Linting clean
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Firebase rules tested
- [ ] App store metadata complete
- [ ] Screenshots uploaded
- [ ] Privacy policy updated

### Post-Deployment Monitoring

- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Monitor Firebase usage
- [ ] Track app performance
- [ ] Verify AI features working
- [ ] Test offline functionality

### Version Management

- Use semantic versioning
- Tag releases in Git
- Document changes in CHANGELOG
- Maintain backward compatibility
- Plan migration strategies

## Support and Resources

### Documentation

- [Expo EAS Documentation](https://docs.expo.dev/build/introduction/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

### Community

- [Expo Discord](https://discord.gg/expo)
- [Firebase Community](https://firebase.community/)
- [React Native Community](https://reactnative.dev/community/overview)

### Support Channels

- GitHub Issues for bugs
- Discord for community support
- Firebase Support for backend issues
- Apple Developer Support for iOS issues
- Google Play Support for Android issues
