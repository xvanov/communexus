# Project Structure Classification

**Generated:** 2025-11-04T15:58:58Z  
**Scan Level:** Deep Scan  
**Repository Type:** Multi-part

## Project Overview

Communexus is a multi-part project consisting of:

1. **Mobile Application** - React Native/Expo cross-platform mobile app
2. **Backend Services** - Firebase Cloud Functions for server-side logic

## Part Classification

### Part 1: Mobile Application (`mobile`)

- **Root Path:** `/Users/kalin.ivanov/rep/communexus/main`
- **Project Type:** `mobile`
- **Display Name:** Mobile App (React Native/Expo)
- **Entry Point:** `index.js` → `App.tsx`
- **Key Technologies:**
  - React Native 0.81.5
  - Expo SDK 54.0.0
  - TypeScript 5.0.0
  - React 19.1.0

**Documentation Requirements:**
- ✅ API scan required
- ✅ Data models required
- ✅ State management required
- ✅ UI components required
- ✅ Deployment config required

**Critical Directories:**
- `src/` - Source code
- `src/screens/` - Screen components
- `src/components/` - Reusable UI components
- `src/services/` - Business logic and API clients
- `src/hooks/` - React hooks
- `src/stores/` - State management (Zustand)
- `src/types/` - TypeScript type definitions
- `ios/` - iOS native configuration
- `assets/` - Static assets

### Part 2: Backend Functions (`backend`)

- **Root Path:** `/Users/kalin.ivanov/rep/communexus/main/functions`
- **Project Type:** `backend`
- **Display Name:** Backend Functions (Firebase Cloud Functions)
- **Entry Point:** `src/index.ts`
- **Key Technologies:**
  - Firebase Cloud Functions
  - TypeScript 5.0.0
  - Node.js 22

**Documentation Requirements:**
- ✅ API scan required
- ✅ Data models required
- ❌ State management not required
- ❌ UI components not required
- ✅ Deployment config required

**Critical Directories:**
- `src/` - Source code
- `src/channels/` - Channel adapters (SMS, etc.)
- `src/types/` - TypeScript type definitions

## Integration Points

The mobile app communicates with backend functions through:
- Firebase Cloud Functions HTTP endpoints
- Firestore database (real-time sync)
- Firebase Authentication
- Firebase Storage (media files)

## Next Steps

Documentation will be generated separately for each part, with additional integration architecture documentation showing how the parts communicate.






