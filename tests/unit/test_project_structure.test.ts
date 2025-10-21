import { existsSync } from 'fs';
import { join } from 'path';

describe('T001: Project Structure', () => {
  const projectRoot = process.cwd();

  describe('Mobile App Structure', () => {
    const mobileStructure = [
      // Screens
      'src/screens/AuthScreen.tsx',
      'src/screens/ChatListScreen.tsx',
      'src/screens/ChatScreen.tsx',
      'src/screens/GroupCreateScreen.tsx',
      'src/screens/SettingsScreen.tsx',
      'src/screens/AssistantScreen.tsx',
      
      // Components directories
      'src/components/chat',
      'src/components/thread',
      'src/components/ai',
      'src/components/common',
      
      // Services
      'src/services/firebase.ts',
      'src/services/auth.ts',
      'src/services/messaging.ts',
      'src/services/storage.ts',
      'src/services/ai.ts',
      'src/services/notifications.ts',
      
      // Hooks
      'src/hooks/useMessages.ts',
      'src/hooks/useThreads.ts',
      'src/hooks/usePresence.ts',
      'src/hooks/useTyping.ts',
      'src/hooks/useOfflineQueue.ts',
      
      // Stores
      'src/stores/userStore.ts',
      'src/stores/chatStore.ts',
      'src/stores/offlineStore.ts',
      
      // Types
      'src/types/User.ts',
      'src/types/Thread.ts',
      'src/types/Message.ts',
      'src/types/AIFeatures.ts',
      
      // Utils
      'src/utils/dateFormat.ts',
      'src/utils/messageHelpers.ts',
      'src/utils/validation.ts'
    ];

    mobileStructure.forEach(path => {
      it(`should have ${path}`, () => {
        const fullPath = join(projectRoot, path);
        expect(existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Backend Structure', () => {
    const backendStructure = [
      'functions/src/index.ts',
      'functions/src/aiThreadSummary.ts',
      'functions/src/aiActionExtraction.ts',
      'functions/src/aiPriorityDetection.ts',
      'functions/src/aiSmartSearch.ts',
      'functions/src/aiProactiveAgent.ts',
      'functions/src/sendNotification.ts'
    ];

    backendStructure.forEach(path => {
      it(`should have ${path}`, () => {
        const fullPath = join(projectRoot, path);
        expect(existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Test Structure', () => {
    const testStructure = [
      'tests/contract',
      'tests/integration',
      'tests/unit'
    ];

    testStructure.forEach(path => {
      it(`should have ${path} directory`, () => {
        const fullPath = join(projectRoot, path);
        expect(existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Root Configuration Files', () => {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      '.env.example',
      'app.json'
    ];

    configFiles.forEach(file => {
      it(`should have ${file}`, () => {
        const fullPath = join(projectRoot, file);
        expect(existsSync(fullPath)).toBe(true);
      });
    });
  });
});

