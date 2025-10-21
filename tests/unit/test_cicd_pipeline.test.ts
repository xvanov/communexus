import { existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from '@jest/globals';

const projectRoot = join(__dirname, '../../');

describe('T008: GitHub Actions CI/CD Pipeline', () => {
  describe('Pipeline Configuration', () => {
    it('should have .github/workflows directory', () => {
      const workflowsDir = join(projectRoot, '.github/workflows');
      expect(existsSync(workflowsDir)).toBe(true);
    });

    it('should have ci-cd.yml workflow file', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      expect(existsSync(workflowFile)).toBe(true);
    });
  });

  describe('Pipeline Jobs', () => {
    it('should have test job configuration', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      expect(existsSync(workflowFile)).toBe(true);

      // Read and verify workflow content
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('test:');
      expect(workflowContent).toContain('Test Suite');
      expect(workflowContent).toContain('npm run lint');
      expect(workflowContent).toContain('npm run format:check');
      expect(workflowContent).toContain('npm run type-check');
      expect(workflowContent).toContain('npm test');
    });

    it('should have build job configuration', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('build:');
      expect(workflowContent).toContain('Build Project');
      expect(workflowContent).toContain('needs: [lint, test]');
      expect(workflowContent).toContain('npm run build');
      expect(workflowContent).toContain('firebase deploy');
    });

    it('should have deploy job configuration', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('deploy-firebase:');
      expect(workflowContent).toContain('Deploy Firebase Functions');
      expect(workflowContent).toContain("if: github.ref == 'refs/heads/main'");
      expect(workflowContent).toContain('firebase deploy --only functions');
    });

    it('should have security scan job configuration', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('security-scan:');
      expect(workflowContent).toContain('Security Scan');
      expect(workflowContent).toContain('npm audit');
    });
  });

  describe('Pipeline Triggers', () => {
    it('should trigger on push to main and develop branches', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('on:');
      expect(workflowContent).toContain('push:');
      expect(workflowContent).toContain('branches: [main, develop]');
    });

    it('should trigger on pull requests to main branch', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('pull_request:');
      expect(workflowContent).toContain('branches: [main]');
    });
  });

  describe('Pipeline Steps', () => {
    it('should include code quality checks', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('Run ESLint');
      expect(workflowContent).toContain('Check Prettier formatting');
      expect(workflowContent).toContain('Run TypeScript type checking');
    });

    it('should include testing steps', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('Run Jest tests');
      expect(workflowContent).toContain('Upload test results');
    });

    it('should include build steps', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('Build Firebase Functions');
      expect(workflowContent).toContain('Build Expo project');
      expect(workflowContent).toContain('Upload build artifacts');
    });

    it('should include deployment steps', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('Setup Firebase CLI');
      expect(workflowContent).toContain('Deploy Firebase Functions');
      expect(workflowContent).toContain('FIREBASE_TOKEN');
    });
  });

  describe('Pipeline Security', () => {
    it('should use secrets for sensitive data', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('secrets.FIREBASE_TOKEN');
      expect(workflowContent).toContain('${{ secrets.FIREBASE_TOKEN }}');
    });

    it('should include security scanning', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('npm audit');
    });
  });

  describe('Pipeline Dependencies', () => {
    it('should have proper job dependencies', () => {
      const workflowFile = join(projectRoot, '.github/workflows/ci-cd.yml');
      const fs = require('fs');
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');

      expect(workflowContent).toContain('needs: [lint, test]');
      expect(workflowContent).toContain('needs: [lint, test, build]');
      expect(workflowContent).toContain(
        'needs: [lint, test, build, deploy-firebase, deploy-staging, security-scan]'
      );
    });
  });
});
