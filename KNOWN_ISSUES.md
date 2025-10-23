# Known Issues - Communexus Notification System

**Branch**: `001-notifications-system`  
**Date**: October 23, 2025  
**Status**: Stable but incomplete

---

## 🚨 Critical Issues (Blocking Full Functionality)

### 1. Automatic Notifications Not Triggering

**Status**: BLOCKED  
**Priority**: HIGH  
**Impact**: Users don't receive notifications when messages are sent

#### What Works ✅

- Settings screen with notification preferences
- Test notification button (manual trigger)
- Badge count syncing with unread messages
- Deep linking from notifications to chats
- Notification sound and vibration settings

#### What's Broken ❌

- Cloud Function `sendMessageNotification` doesn't trigger on message creation
- In-app local notifications (useInAppNotifications) shows empty messages
- Users must manually check for new messages

#### Root Causes

1. **Eventarc Permissions (Production)**:
   - First-time 2nd gen Cloud Function deployment
   - Eventarc Service Agent needs permissions
   - Google Cloud setup takes 5-10 minutes
   - Error: "Permission denied while using the Eventarc Service Agent"
2. **Trigger Not Firing (Development)**:
   - Cloud Function compiles and deploys to emulator
   - Trigger path: `threads/{threadId}/messages/{messageId}`
   - Function appears in emulator startup logs
   - But doesn't execute when messages are created
   - Need to verify trigger sees Firestore events

3. **Empty Message Text (In-App)**:
   - useInAppNotifications hook triggers
   - Logs show: "📬 Local notification shown: -"
   - thread.lastMessage.text is empty
   - Need to investigate message data structure

#### Temporary Workaround

- Commented out `sendMessageNotification` export in functions/src/index.ts
- Allows CI/CD to pass without Eventarc permissions
- Re-enable after Google Cloud finishes permission setup (5-10 minutes)

#### Next Steps to Fix

1. **For Production**: Wait 10 minutes, uncomment export, redeploy
2. **For Development**: Debug why emulator trigger doesn't fire
3. **For In-App**: Fix empty message text in useInAppNotifications
4. **Alternative**: Implement client-side notification trigger (simpler)

---

### 2. Real-Time Presence Updates Not Working

**Status**: PARTIAL  
**Priority**: MEDIUM  
**Impact**: Users can't see real-time online/offline status changes

#### What Works ✅

- Green/gray circles show online status on Contacts screen load
- Correct status displayed initially
- "Online" vs "Last seen X ago" text accurate

#### What's Broken ❌

- Status doesn't update when users log in/out
- Must exit and re-enter Contacts screen to see changes
- Not truly "real-time"

#### Root Cause

- `subscribeToContacts` uses onSnapshot on contacts subcollection
- Fetches user online status via getDoc (one-time fetch)
- Not subscribing to user documents for status changes
- Need nested real-time listeners

#### Next Steps to Fix

1. Add onSnapshot listener for each contact's user document
2. Update contact status when user.online field changes
3. Balance performance (multiple listeners) vs real-time updates
4. Consider debouncing or batching status updates

---

## ⚠️ Minor Issues (Low Priority)

### 3. Login Screen Flicker

**Status**: COSMETIC  
**Priority**: LOW  
**Impact**: Slight visual distraction during demo user login

#### Issue

- Demo user login shows brief flash/flicker
- Caused by autoCreateTestUsers checking Auth status
- Not a functional problem, just UX polish

#### Next Steps

- Optimize demo user creation flow
- Consider caching demo user existence
- Low priority - doesn't affect functionality

### 4. AsyncStorage Persistence Warning

**Status**: EXPECTED IN DEVELOPMENT  
**Priority**: LOW  
**Impact**: Users re-login after app restart (development only)

#### Issue

```
Warning: You are initializing Firebase Auth for React Native without
providing AsyncStorage. Auth state will default to memory persistence...
```

#### Explanation

- Expected in development with simulators
- Users stay logged in during hot reload
- Only affects full app restart
- Production builds handle persistence differently

#### Next Steps

- Can be ignored for now
- Fix before production release if needed

---

## 📝 Implementation Notes

### sendMessageNotification Cloud Function

**File**: `functions/src/sendMessageNotification.ts`  
**Status**: Code complete, deployment blocked

**Function**: Firestore trigger on message creation

```javascript
onDocumentCreated('threads/{threadId}/messages/{messageId}', async event => {
  // Get thread participants
  // Fetch push tokens
  // Check notification preferences
  // Send FCM notifications
});
```

**Deployment Issue**:

- First time using 2nd gen Firestore triggers
- Requires Eventarc Service Agent permissions
- Google Cloud auto-setup takes 5-10 minutes
- Deploy will succeed after permission propagation

**Temporary State**:

- Export commented out in functions/src/index.ts
- Allows CI/CD to pass
- Re-enable when permissions ready

### useInAppNotifications Hook

**File**: `src/hooks/useInAppNotifications.ts`  
**Status**: Code complete, not working correctly

**Purpose**: Show local notifications when messages received (simulator workaround)

**Issue**: Messages appear empty in notifications

```javascript
// Current behavior:
📬 Local notification shown:  -  // Empty message!
```

**Investigation Needed**:

- Verify thread.lastMessage.text structure
- Check if lastMessage updates before notification fires
- May need slight delay or better timestamp tracking

---

## 🎯 Priority Fix Order

1. **HIGH**: Fix Eventarc deployment (wait 10 min or use workaround)
2. **HIGH**: Debug why emulator trigger doesn't fire
3. **HIGH**: Fix empty message text in useInAppNotifications
4. **MEDIUM**: Implement real-time presence listeners
5. **LOW**: Optimize demo user login (reduce flicker)
6. **LOW**: AsyncStorage persistence (production only)

---

## ✅ What's Confirmed Working

Despite the above issues, these features are solid:

- ✅ Core messaging (send/receive in real-time)
- ✅ Contact system (proper UIDs, no duplicates)
- ✅ Settings screen (all toggles functional)
- ✅ Badge counts (sync with unread)
- ✅ UI/UX improvements (clean, professional)
- ✅ Multi-simulator testing
- ✅ All CI/CD checks passing (after workaround)

---

**Current Recommendation**: Temporarily disable sendMessageNotification export for CI/CD, document as known issue, fix Eventarc permissions, then re-enable and implement proper notification triggering.
