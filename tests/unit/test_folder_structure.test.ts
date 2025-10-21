import { existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from '@jest/globals';

const projectRoot = join(__dirname, '../../');

describe('T007: Folder Structure per Architecture Plan', () => {
  describe('Root Structure', () => {
    it('should have src/ directory', () => {
      expect(existsSync(join(projectRoot, 'src'))).toBe(true);
    });

    it('should have functions/ directory', () => {
      expect(existsSync(join(projectRoot, 'functions'))).toBe(true);
    });

    it('should have tests/ directory', () => {
      expect(existsSync(join(projectRoot, 'tests'))).toBe(true);
    });

    it('should have specs/ directory', () => {
      expect(existsSync(join(projectRoot, 'specs'))).toBe(true);
    });
  });

  describe('Mobile App Structure (src/)', () => {
    describe('Screens Directory', () => {
      const screensDir = join(projectRoot, 'src/screens');
      const requiredScreens = [
        'AuthScreen.tsx',
        'ChatListScreen.tsx',
        'ChatScreen.tsx',
        'GroupCreateScreen.tsx',
        'SettingsScreen.tsx',
        'AssistantScreen.tsx',
      ];

      it('should have screens/ directory', () => {
        expect(existsSync(screensDir)).toBe(true);
      });

      requiredScreens.forEach(screen => {
        it(`should have ${screen}`, () => {
          expect(existsSync(join(screensDir, screen))).toBe(true);
        });
      });
    });

    describe('Components Directory', () => {
      const componentsDir = join(projectRoot, 'src/components');
      const requiredComponentDirs = ['chat', 'thread', 'ai', 'common'];

      it('should have components/ directory', () => {
        expect(existsSync(componentsDir)).toBe(true);
      });

      requiredComponentDirs.forEach(dir => {
        it(`should have components/${dir}/ directory`, () => {
          expect(existsSync(join(componentsDir, dir))).toBe(true);
        });
      });
    });

    describe('Services Directory', () => {
      const servicesDir = join(projectRoot, 'src/services');
      const requiredServices = [
        'firebase.ts',
        'auth.ts',
        'messaging.ts',
        'storage.ts',
        'ai.ts',
        'notifications.ts',
      ];

      it('should have services/ directory', () => {
        expect(existsSync(servicesDir)).toBe(true);
      });

      requiredServices.forEach(service => {
        it(`should have services/${service}`, () => {
          expect(existsSync(join(servicesDir, service))).toBe(true);
        });
      });
    });

    describe('Hooks Directory', () => {
      const hooksDir = join(projectRoot, 'src/hooks');
      const requiredHooks = [
        'useMessages.ts',
        'useThreads.ts',
        'usePresence.ts',
        'useTyping.ts',
        'useOfflineQueue.ts',
      ];

      it('should have hooks/ directory', () => {
        expect(existsSync(hooksDir)).toBe(true);
      });

      requiredHooks.forEach(hook => {
        it(`should have hooks/${hook}`, () => {
          expect(existsSync(join(hooksDir, hook))).toBe(true);
        });
      });
    });

    describe('Stores Directory', () => {
      const storesDir = join(projectRoot, 'src/stores');
      const requiredStores = [
        'userStore.ts',
        'chatStore.ts',
        'offlineStore.ts',
      ];

      it('should have stores/ directory', () => {
        expect(existsSync(storesDir)).toBe(true);
      });

      requiredStores.forEach(store => {
        it(`should have stores/${store}`, () => {
          expect(existsSync(join(storesDir, store))).toBe(true);
        });
      });
    });

    describe('Types Directory', () => {
      const typesDir = join(projectRoot, 'src/types');
      const requiredTypes = [
        'User.ts',
        'Thread.ts',
        'Message.ts',
        'AIFeatures.ts',
      ];

      it('should have types/ directory', () => {
        expect(existsSync(typesDir)).toBe(true);
      });

      requiredTypes.forEach(type => {
        it(`should have types/${type}`, () => {
          expect(existsSync(join(typesDir, type))).toBe(true);
        });
      });
    });

    describe('Utils Directory', () => {
      const utilsDir = join(projectRoot, 'src/utils');
      const requiredUtils = [
        'dateFormat.ts',
        'messageHelpers.ts',
        'validation.ts',
      ];

      it('should have utils/ directory', () => {
        expect(existsSync(utilsDir)).toBe(true);
      });

      requiredUtils.forEach(util => {
        it(`should have utils/${util}`, () => {
          expect(existsSync(join(utilsDir, util))).toBe(true);
        });
      });
    });
  });

  describe('Backend Structure (functions/)', () => {
    describe('Functions Source Directory', () => {
      const functionsSrcDir = join(projectRoot, 'functions/src');
      const requiredFunctions = [
        'index.ts',
        'aiThreadSummary.ts',
        'aiActionExtraction.ts',
        'aiPriorityDetection.ts',
        'aiSmartSearch.ts',
        'aiProactiveAgent.ts',
        'sendNotification.ts',
      ];

      it('should have functions/src/ directory', () => {
        expect(existsSync(functionsSrcDir)).toBe(true);
      });

      requiredFunctions.forEach(func => {
        it(`should have functions/src/${func}`, () => {
          expect(existsSync(join(functionsSrcDir, func))).toBe(true);
        });
      });
    });

    describe('Functions Configuration', () => {
      it('should have functions/package.json', () => {
        expect(existsSync(join(projectRoot, 'functions/package.json'))).toBe(
          true
        );
      });

      it('should have functions/tsconfig.json', () => {
        expect(existsSync(join(projectRoot, 'functions/tsconfig.json'))).toBe(
          true
        );
      });
    });
  });

  describe('Test Structure (tests/)', () => {
    const testDirs = ['contract', 'integration', 'unit'];

    testDirs.forEach(dir => {
      it(`should have tests/${dir}/ directory`, () => {
        expect(existsSync(join(projectRoot, 'tests', dir))).toBe(true);
      });
    });
  });

  describe('Documentation Structure (specs/)', () => {
    const specsDir = join(projectRoot, 'specs/001-core-messaging-platform');
    const requiredDocs = ['plan.md', 'spec.md', 'tasks.md'];

    it('should have specs/001-core-messaging-platform/ directory', () => {
      expect(existsSync(specsDir)).toBe(true);
    });

    requiredDocs.forEach(doc => {
      it(`should have specs/001-core-messaging-platform/${doc}`, () => {
        expect(existsSync(join(specsDir, doc))).toBe(true);
      });
    });
  });

  describe('Configuration Files', () => {
    const requiredConfigFiles = [
      'package.json',
      'tsconfig.json',
      'app.json',
      'firebase.json',
      '.firebaserc',
      '.gitignore',
      'eslint.config.js',
      '.prettierrc',
      '.prettierignore',
    ];

    requiredConfigFiles.forEach(file => {
      it(`should have ${file}`, () => {
        expect(existsSync(join(projectRoot, file))).toBe(true);
      });
    });
  });

  describe('Architecture Compliance', () => {
    it('should follow Mobile + Backend architecture pattern', () => {
      // Verify we have both mobile (src/) and backend (functions/) structures
      expect(existsSync(join(projectRoot, 'src'))).toBe(true);
      expect(existsSync(join(projectRoot, 'functions'))).toBe(true);
    });

    it('should have modular structure for future SDK extraction', () => {
      // Verify clear separation between core engine, business logic, and UI
      expect(existsSync(join(projectRoot, 'src/services'))).toBe(true); // Core engine
      expect(existsSync(join(projectRoot, 'src/stores'))).toBe(true); // Business logic
      expect(existsSync(join(projectRoot, 'src/screens'))).toBe(true); // UI
    });

    it('should support parallel development', () => {
      // Verify structure supports independent development of different components
      expect(existsSync(join(projectRoot, 'src/components'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/hooks'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/types'))).toBe(true);
    });
  });
});
