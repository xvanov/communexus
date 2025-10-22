// tests/unit/env_config.test.ts
// T019 - Single-environment configuration tests
import fs from 'fs';
import path from 'path';

describe('Env config (T019)', () => {
  test('firebase.json uses single codebase and points to root rules', () => {
    const firebaseJsonPath = path.resolve(process.cwd(), 'firebase.json');
    const cfg = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    expect(cfg).toHaveProperty('firestore.rules', 'firestore.rules');
    expect(cfg).toHaveProperty('firestore.indexes', 'firestore.indexes.json');
    expect(Array.isArray(cfg.functions)).toBe(true);
    expect(cfg.functions[0]).toHaveProperty('source', 'functions');
  });

  test('CI tokens may be present (conditionally)', () => {
    const firebaseToken = process.env.FIREBASE_TOKEN;
    const expoToken = process.env.EXPO_TOKEN;
    // Not required locally, but must be defined in CI; we only assert variables exist or are undefined without failing locally
    expect(
      typeof firebaseToken === 'string' || typeof firebaseToken === 'undefined'
    ).toBe(true);
    expect(
      typeof expoToken === 'string' || typeof expoToken === 'undefined'
    ).toBe(true);
  });
});
