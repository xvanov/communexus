# Active Context: Communexus Development

**Last Updated**: October 23, 2025 (Evening Session)  
**Current Phase**: Phase 3.5.3 - Notification System & UI Polish (In Progress)  
**Branch**: `001-notifications-system`  
**Next Phase**: Phase 3.5.4 - Thread Management & Phase 4 - AI Features

## 🎯 Current Focus

### Just Completed (This Session)

✅ **Notification System Implementation (Phase 3.5.3)**
- FCM integration and Cloud Function trigger
- Settings screen with notification preferences
- Badge management and unread count tracking
- Deep linking from notifications to chats
- Local in-app notifications (useInAppNotifications hook)
- Test notification button working

✅ **UI/UX Improvements**
- Demo users changed to Alice, Bob, Charlie with full names
- Clean login screen (logo only, no text)
- Simplified header (user name only)
- Name field added to sign up form
- Names displayed as primary identifier throughout app
- Settings screen accessible via gear icon (⚙️)

✅ **Bug Fixes & Infrastructure**
- Fixed duplicate chat creation (using Firebase UIDs)
- Updated Firestore security rules for proper access
- Fixed contact initialization with proper UIDs
- Multi-simulator testing documentation
- Physical iPhone testing setup (USB method)
- CI/CD fixes for Cloud Functions ESLint

### Active Issues (Known)

⚠️ **Notifications Not Triggering**
- Test notification button works ✅
- Manual notification via Settings works ✅
- Automatic notifications when messages sent NOT working ❌
- Cloud Function `sendMessageNotification` exists but not triggering
- In-app local notifications hook created but messages appear empty
- Needs investigation: Why notification trigger doesn't fire

⚠️ **Online Presence Doesn't Auto-Update**
- Green/gray circles show correctly on initial load ✅
- Status changes require leaving and re-entering Contacts screen ❌
- subscribeToContacts uses onSnapshot but doesn't re-fetch user status
- Needs real-time listener on users collection for each contact

⚠️ **Minor Issues**
- Login has slight screen flicker (demo user creation process)
- AsyncStorage persistence warning (users re-login after app restart)
- Some undefined email fields in Firestore (older user documents)

## 📋 Recent Changes (Current Session - Oct 23, 2025)

### Files Created

**New Services/Hooks**:
- `src/hooks/useInAppNotifications.ts` - Local notification trigger on new messages
- `src/hooks/useUnreadCount.ts` - Automatic badge count management
- `functions/src/sendMessageNotification.ts` - Cloud Function for push notifications
- `tests/integration/notifications.test.ts` - Notification test suite (10/10 passing)
- `tests/__mocks__/expo-notifications.js` - Expo notifications mock for testing

**Documentation**:
- `UI_IMPROVEMENTS_SUMMARY.md` - Complete summary of UI changes
- Updated `README.md` - Multi-simulator and physical iPhone testing guides
- Updated `.env.example` - Firebase emulator host configuration

### Files Modified (18 total)

**Notification System**:
- `src/services/notifications.ts` - Enhanced with preferences, badge management
- `src/screens/SettingsScreen.tsx` - Complete implementation with notification toggles
- `App.tsx` - Notification initialization and deep linking
- `app.json` - iOS/Android notification configuration
- `jest.config.cjs` - expo-notifications module mapping

**UI/UX Improvements**:
- `src/screens/AuthScreen.tsx` - Name field, clean UI, Alice/Bob/Charlie
- `src/screens/ChatListScreen.tsx` - Simplified header, Settings button, presence tracking
- `src/hooks/usePresence.ts` - Full online/offline presence implementation

**Contact System**:
- `src/services/contacts.ts` - Firebase UID-based contacts, demo user creation
- `src/screens/ContactsScreen.tsx` - Green circle indicators for online status

**Security & Config**:
- `firestore.rules` - Allow reading users collection for contacts
- `functions/eslint.config.js` - Added Node.js globals (console, process, etc.)
- `functions/package.json` - Removed problematic "type": "module"
- `tests/unit/test_enhanced_cicd.test.ts` - Updated for new rules structure

### Key Architectural Changes

**Demo Users**:
- Changed from john/jane/a/b to Alice Johnson, Bob Smith, Charlie Davis
- Emails: alice@demo.com, bob@demo.com, charlie@demo.com
- Password: password123 (consistent across all)
- Display names set in Firebase Auth
- Firestore documents created on first login

**Contact System**:
- Contact IDs now use Firebase Auth UIDs (not emails)
- Prevents duplicate thread creation
- Enables proper thread deduplication
- Real-time online status from users collection

**Notification Architecture**:
- Client: Local notifications via useInAppNotifications
- Server: Cloud Function trigger on message creation
- Settings: User preferences in notificationPreferences collection
- Badge: Auto-synced with unread counts via useUnreadCount

## 🔍 Current State

### What's Working Perfectly

✅ **Core Messaging**
- Send/receive messages in real-time
- One-on-one and group conversations
- Message bubbles with proper styling
- No duplicate chats (thread deduplication working)
- Chat input and message display functional

✅ **User Management**
- Login with demo users (Alice, Bob, Charlie)
- Sign up with name, email, password
- User profiles with display names
- Firebase Auth working correctly

✅ **Contacts System**
- Contact list displays properly
- Names shown first, email secondary
- Initialize Test Contacts button works
- Contacts use Firebase UIDs (not emails)
- Green/gray circles show online status (on initial load)

✅ **Settings & Preferences**
- Settings screen accessible via ⚙️ icon
- Notification preference toggles functional
- Test notification button works
- Clear notifications button works
- Preferences saved to Firestore

✅ **Development Experience**
- Hot reload works perfectly
- Multi-simulator testing (iPhone 15 + 15 Plus)
- Firebase emulators functional
- Fast development iteration
- Clean, minimal UI

✅ **Code Quality**
- TypeScript: 0 errors
- ESLint: 0 errors (168 warnings pre-existing)
- Prettier: All formatted
- Tests: 193/195 passing
- CI/CD: All checks green

### What's Not Working

❌ **Automatic Message Notifications**
- **Issue**: When User A sends message to User B, User B doesn't get notified
- **Status**: Cloud Function `sendMessageNotification` deployed but not triggering
- **Workaround**: Test notification button works for manual testing
- **Impact**: Users must manually check for new messages
- **Priority**: HIGH - Core feature for messaging app

❌ **Real-Time Presence Updates**
- **Issue**: Green/gray circles don't update when users log in/out
- **Behavior**: Shows correct status on Contacts screen load
- **Workaround**: Exit and re-enter Contacts to refresh status
- **Impact**: Can't tell if users are online without screen refresh
- **Priority**: MEDIUM - Nice-to-have for UX

⚠️ **Login Experience**
- **Issue**: Screen flickers during demo user login
- **Cause**: autoCreateTestUsers process creates Auth accounts
- **Impact**: Slightly confusing UX, but functional
- **Priority**: LOW - Cosmetic issue

### What Needs Investigation

🔍 **Why Notifications Don't Trigger**
- Cloud Function exists and compiles
- Firestore trigger path: `threads/{threadId}/messages/{messageId}`
- Function appears in emulator logs on startup
- But doesn't execute when messages created
- Need to verify: Function permissions, trigger configuration, emulator logs

🔍 **Why Presence Doesn't Update**
- `subscribeToContacts` uses onSnapshot on contacts subcollection
- Fetches user online status via getDoc (not real-time)
- Need nested listener on each user document
- Performance concern: Multiple listeners for multiple contacts

## 📝 Active Decisions

### Testing Strategy (FINALIZED)

**Decision**: Use EAS Development Build for E2E tests
**Rationale**:

- Expo Go has fundamental Appium incompatibility
- Development build fixes visibility detection
- Hot reload still works (no speed loss)
- Production-ready environment
- All tests passing

**Alternatives Considered**:

- ❌ Pure Expo Go (visibility issues persist)
- ❌ Computer Use only (too slow, $40-50/month)
- ❌ Fix Expo Go compatibility (not feasible)
- ✅ Hybrid Appium + Claude (best of both worlds)

### Test Scope (FINALIZED)

**Decision**: Focus on reliable, fast UI validation tests
**Tests Included**:

- Auth screen presence
- Element detection
- Text input functionality
- Button interactions
- Cross-platform consistency

**Tests Excluded** (manual testing):

- Demo user button flows (alert handling complex)
- Login navigation (timing unreliable)
- Error message display (Alert.alert not testable)
- Complex messaging flows (better manual)

**Rationale**: App works perfectly manually, automation should focus on what it can reliably test

### Node Version (FINALIZED)

**Decision**: Require Node 20+ for all environments
**Rationale**:

- Appium 3.x requires Node 20+
- Firebase SDK requires Node 20+
- React Native 0.81.5 requires Node 20+
- Metro bundler requires Node 20+

**Impact**: CI/CD workflows updated to Node 20

## 🎯 Next Actions

### Immediate (Next Session - HIGH PRIORITY)

1. **Fix Automatic Notifications**
   - Debug Cloud Function trigger (why doesn't it fire?)
   - Check emulator logs when messages are sent
   - Verify trigger sees message creation events
   - Alternative: Implement simpler notification approach

2. **Fix Real-Time Presence Updates**
   - Add nested onSnapshot listeners for each contact's user document
   - Green circles should update without leaving Contacts screen
   - Balance between real-time updates and performance

3. **Optimize Demo User Login**
   - Reduce/eliminate screen flicker
   - Faster login experience

### This Week (After Fixes)

1. **Merge Notification System**: Create PR for `001-notifications-system`
2. **Phase 3.5.4**: Thread Management & Duplication Prevention (T069-T075)
3. **Physical Device Testing**: Test on real iPhone via USB
4. **Performance Testing**: Measure notification latency

### This Month

1. **Phase 4**: AI-Powered Project Intelligence
   - Thread summarization
   - Action item extraction
   - Smart search
2. **Production Testing**: Push notifications on real devices
3. **User Feedback**: Test with actual contractors

## 💡 Key Insights (This Session)

### What We Learned

1. **Contact IDs Matter**: Must use Firebase UIDs, not emails, for thread deduplication
2. **Firestore Rejects Undefined**: Can't save `photoUrl: undefined` - must conditionally include fields
3. **Security Rules Require Restart**: Emulator changes need full restart, not just reload
4. **Complexity Creep**: Overcomplicated solutions (sign-in/sign-out loops) cause more problems
5. **Real-Time Challenges**: onSnapshot on subcollections + getDoc for related data isn't truly real-time
6. **Simulator Limitations**: Push notifications require real devices or local notification workarounds
7. **Hot Reload vs Rebuild**: Most changes just need 'r' key, only native/config changes need rebuild

### Mistakes & Lessons

❌ **Over-engineering**: Tried complex nested subscriptions for presence → broke contacts  
✅ **Lesson**: Keep it simple, optimize later

❌ **Sign-in/Sign-out Loop**: Created Firestore docs by signing in each demo user  
✅ **Lesson**: Create docs on first actual login, not during setup

❌ **Not Restarting Emulators**: Changed security rules but didn't restart  
✅ **Lesson**: Rule changes ALWAYS need emulator restart

### Best Practices Confirmed

- ✅ Use Firebase UIDs as primary identifiers (not emails)
- ✅ Conditional field inclusion (avoid undefined in Firestore)
- ✅ Test locally before pushing (all CI/CD checks)
- ✅ Hot reload for 99% of changes
- ✅ Clear Firestore data between major changes
- ✅ Comprehensive logging for debugging

## 📊 Branch Status

**Branch**: `001-notifications-system`  
**Commits**: 18 total (all pushed to GitHub)  
**Status**: Stable but incomplete

**What's Ready**:
- ✅ Notification infrastructure (Settings UI, preferences)
- ✅ Contact system (UIDs, names, initialization)
- ✅ UI improvements (clean login, names first)
- ✅ All CI/CD checks passing

**What Needs Work**:
- ❌ Automatic notifications (Cloud Function not triggering)
- ❌ Real-time presence (requires screen refresh)
- ⚠️ Login flicker (cosmetic)

## 📚 Documentation Updates

**Updated This Session**:
- **README.md**: Multi-simulator testing, physical iPhone setup
- **UI_IMPROVEMENTS_SUMMARY.md**: Complete UI change documentation
- **firestore.rules**: Security rules for contacts and notifications
- **functions/eslint.config.js**: Node.js globals for linting

**Needs Update**:
- memory-bank/progress.md (this update in progress)
- specs/001-core-messaging-platform/tasks.md (mark Phase 3.5.3 status)

---

**Status**: Phase 3.5.3 is 80% complete. Core functionality working, notifications and real-time presence need fixes. Branch is stable and ready for targeted bug fixes in next session. 🔧
