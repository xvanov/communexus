// tests/integration/auth_emulator.test.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

// Minimal config for emulator-only usage
const app = initializeApp({
  apiKey: 'fake',
  authDomain: 'localhost',
  projectId: 'demo-communexus',
});
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

describe('Auth Emulator (T010) - integration', () => {
  afterAll(async () => {
    await signOut(auth);
  });

  test('can create and sign in user with email/password', async () => {
    const email = `user_${Date.now()}@example.com`;
    const password = 'password123';

    const created = await createUserWithEmailAndPassword(auth, email, password);
    expect(created.user.uid).toBeDefined();

    await signOut(auth);

    const signedIn = await signInWithEmailAndPassword(auth, email, password);
    expect(signedIn.user.email).toBe(email);
  });

  test('sign in with wrong password fails', async () => {
    const email = `user_${Date.now()}@example.com`;
    const password = 'password123';

    await createUserWithEmailAndPassword(auth, email, password);
    await expect(
      signInWithEmailAndPassword(auth, email, 'wrong')
    ).rejects.toBeTruthy();
  });
});
