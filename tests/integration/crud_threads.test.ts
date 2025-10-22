// tests/integration/crud_threads.test.ts
import { setupEmulator, withAuthedUser, clearEmulatorData, teardownEmulator } from '../utils/testEnv';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';


describe('CRUD Threads (T014)', () => {
beforeEach(async () => {
  await setupEmulator();
});

  afterEach(async () => {
    await clearEmulatorData();
  });

afterAll(async () => {
  await teardownEmulator();
});

  test('create thread and allow participant reads; non-participant denied', async () => {
    const alice = await withAuthedUser('alice');
    const bob = await withAuthedUser('bob');
    const eve = await withAuthedUser('eve');

    const tRef = await assertSucceeds(
      alice.firestore().collection('threads').add({ participants: ['alice', 'bob'], isGroup: false })
    );

    const tId = (tRef as any).id as string;

    await assertSucceeds(bob.firestore().doc(`threads/${tId}`).get());
    await assertFails(eve.firestore().doc(`threads/${tId}`).get());
  });
});
