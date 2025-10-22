// tests/utils/testEnv.ts
// Firebase Emulator test harness utilities

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  RulesTestContext,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import path from 'path';

let testEnv: RulesTestEnvironment | null = null;

export async function setupEmulator(): Promise<RulesTestEnvironment> {
  if (testEnv) return testEnv;
  const projectId = 'demo-communexus';
  const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(firestoreRulesPath, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    // Omit storage config to avoid emulator conflicts in non-storage tests
  });

  return testEnv;
}

export async function withAuthedUser(
  uid: string,
  claims: Record<string, unknown> = {}
): Promise<RulesTestContext> {
  if (!testEnv) await setupEmulator();
  return (testEnv as RulesTestEnvironment).authenticatedContext(uid, claims);
}

export async function withUnauthed(): Promise<RulesTestContext> {
  if (!testEnv) await setupEmulator();
  return (testEnv as RulesTestEnvironment).unauthenticatedContext();
}

export async function clearEmulatorData(): Promise<void> {
  if (!testEnv) return;
  await (testEnv as any).clearFirestore();
}

export async function teardownEmulator(): Promise<void> {
  if (!testEnv) return;
  await testEnv.cleanup();
  testEnv = null;
}
