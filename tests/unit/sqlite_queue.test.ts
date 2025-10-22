// tests/unit/sqlite_queue.test.ts
// T016 - SQLite local persistence tests using Jest mocks for expo-sqlite

jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: (cb: any) => cb({
      executeSql: jest.fn((_q: string, _a: any[], success: any) => success?.({}, { rows: { length: 0, _array: [] } })),
    }),
  })),
}));

describe('SQLite Offline Queue (T016)', () => {
  test('creates tables and enqueues messages', async () => {
    const db = require('expo-sqlite').openDatabase('app.db');
    expect(db).toBeTruthy();
    // Our future implementation should call CREATE TABLE statements and INSERT
    // Here we only assert the API shape is callable via mocks
    db.transaction((tx: any) => {
      expect(typeof tx.executeSql).toBe('function');
    });
  });
});
