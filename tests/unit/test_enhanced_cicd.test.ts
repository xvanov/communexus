import { existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from '@jest/globals';

const projectRoot = join(__dirname, '../../');

describe('Enhanced CI/CD Pipeline for Phase 2', () => {
  describe('Firebase Configuration Files', () => {
    it('should have firestore.rules file', () => {
      const firestoreRules = join(projectRoot, 'firestore.rules');
      expect(existsSync(firestoreRules)).toBe(true);
    });

    it('should have storage.rules file', () => {
      const storageRules = join(projectRoot, 'storage.rules');
      expect(existsSync(storageRules)).toBe(true);
    });

    it('should have firestore.indexes.json file', () => {
      const firestoreIndexes = join(projectRoot, 'firestore.indexes.json');
      expect(existsSync(firestoreIndexes)).toBe(true);
    });

    it('should have eas.json file for mobile app builds', () => {
      const easConfig = join(projectRoot, 'eas.json');
      expect(existsSync(easConfig)).toBe(true);
    });
  });

  describe('Enhanced Firebase Configuration', () => {
    it('should have updated firebase.json with all services', () => {
      const firebaseConfig = join(projectRoot, 'firebase.json');
      expect(existsSync(firebaseConfig)).toBe(true);

      const fs = require('fs');
      const configContent = fs.readFileSync(firebaseConfig, 'utf8');
      const config = JSON.parse(configContent);

      expect(config.firestore).toBeDefined();
      expect(config.storage).toBeDefined();
      expect(config.hosting).toBeDefined();
      expect(config.emulators).toBeDefined();
    });

    it('should have Firestore rules configuration', () => {
      const firebaseConfig = join(projectRoot, 'firebase.json');
      const fs = require('fs');
      const configContent = fs.readFileSync(firebaseConfig, 'utf8');
      const config = JSON.parse(configContent);

      expect(config.firestore.rules).toBe('firestore.rules');
      expect(config.firestore.indexes).toBe('firestore.indexes.json');
    });

    it('should have Storage rules configuration', () => {
      const firebaseConfig = join(projectRoot, 'firebase.json');
      const fs = require('fs');
      const configContent = fs.readFileSync(firebaseConfig, 'utf8');
      const config = JSON.parse(configContent);

      expect(config.storage.rules).toBe('storage.rules');
    });

    it('should have Hosting configuration', () => {
      const firebaseConfig = join(projectRoot, 'firebase.json');
      const fs = require('fs');
      const configContent = fs.readFileSync(firebaseConfig, 'utf8');
      const config = JSON.parse(configContent);

      expect(config.hosting.public).toBe('dist');
      expect(config.hosting.rewrites).toBeDefined();
    });
  });

  describe('Enhanced CI/CD Pipeline', () => {
    it('should have enhanced deploy-firebase job', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('Deploy Firebase Services');
      expect(workflowContent).toContain('Deploy Firebase Functions');
      expect(workflowContent).toContain('Deploy Firebase Firestore Rules');
      expect(workflowContent).toContain('Deploy Firebase Storage Rules');
      expect(workflowContent).toContain('Deploy Firebase Hosting');
      // Note: EAS builds removed - done manually or in separate workflow
      expect(workflowContent).toContain('Mobile app builds (EAS) are done manually');
    });

    it('should have staging deployment job', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('deploy-staging:');
      expect(workflowContent).toContain('Deploy to Staging');
      expect(workflowContent).toContain(
        "if: github.ref == 'refs/heads/develop'"
      );
    });

    it('should have Expo CLI setup (for web export)', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('Setup Expo CLI');
      // Note: EAS builds removed from CI/CD - done manually
      // expect(workflowContent).toContain('eas build --platform all');
      // expect(workflowContent).toContain('EXPO_TOKEN');
    });

    it('should have enhanced notifications', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('Notify Production Deployment');
      expect(workflowContent).toContain('Notify Staging Deployment');
      expect(workflowContent).toContain('App updated automatically');
    });
  });

  describe('Security Rules Validation', () => {
    it('should have valid Firestore security rules', () => {
      const firestoreRules = join(projectRoot, 'firestore.rules');
      const fs = require('fs');
      const rulesContent = fs.readFileSync(firestoreRules, 'utf8');

      expect(rulesContent).toContain("rules_version = '2'");
      expect(rulesContent).toContain('service cloud.firestore');
      expect(rulesContent).toContain('match /users/{userId}');
      expect(rulesContent).toContain('match /threads/{threadId}');
      expect(rulesContent).toContain(
        'match /threads/{threadId}/messages/{messageId}'
      );
    });

    it('should have valid Storage security rules', () => {
      const storageRules = join(projectRoot, 'storage.rules');
      const fs = require('fs');
      const rulesContent = fs.readFileSync(storageRules, 'utf8');

      expect(rulesContent).toContain("rules_version = '2'");
      expect(rulesContent).toContain('service firebase.storage');
      expect(rulesContent).toContain(
        'match /users/{userId}/profile/{fileName}'
      );
      expect(rulesContent).toContain(
        'match /threads/{threadId}/media/{fileName}'
      );
    });
  });

  describe('EAS Build Configuration', () => {
    it('should have valid EAS configuration', () => {
      const easConfig = join(projectRoot, 'eas.json');
      const fs = require('fs');
      const configContent = fs.readFileSync(easConfig, 'utf8');
      const config = JSON.parse(configContent);

      expect(config.build).toBeDefined();
      expect(config.build.development).toBeDefined();
      expect(config.build.preview).toBeDefined();
      expect(config.build.production).toBeDefined();
    });

    it('should have proper build profiles', () => {
      const easConfig = join(projectRoot, 'eas.json');
      const fs = require('fs');
      const configContent = fs.readFileSync(easConfig, 'utf8');
      const config = JSON.parse(configContent);

      expect(config.build.development.developmentClient).toBe(true);
      expect(config.build.preview.distribution).toBe('internal');
      expect(config.build.production).toBeDefined();
    });
  });

  describe('Firestore Indexes', () => {
    it('should have proper Firestore indexes configuration', () => {
      const firestoreIndexes = join(projectRoot, 'firestore.indexes.json');
      const fs = require('fs');
      const indexesContent = fs.readFileSync(firestoreIndexes, 'utf8');
      const indexes = JSON.parse(indexesContent);

      expect(indexes.indexes).toBeDefined();
      expect(Array.isArray(indexes.indexes)).toBe(true);
      expect(indexes.indexes.length).toBeGreaterThan(0);
    });

    it('should have messages collection indexes', () => {
      const firestoreIndexes = join(projectRoot, 'firestore.indexes.json');
      const fs = require('fs');
      const indexesContent = fs.readFileSync(firestoreIndexes, 'utf8');
      const indexes = JSON.parse(indexesContent);

      const messagesIndex = indexes.indexes.find(
        (index: any) => index.collectionGroup === 'messages'
      );
      expect(messagesIndex).toBeDefined();
      expect(messagesIndex.fields).toBeDefined();
    });
  });
});
