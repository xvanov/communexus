// offlineQueue.ts - SQLite-backed offline message queue (skeleton)
import * as SQLite from 'expo-sqlite';

type QueueItem = {
  id?: number;
  threadId: string;
  payload: string; // JSON string of message or action
  createdAt: number;
};

const DB_NAME = 'communexus.db';

function open(): SQLite.SQLiteDatabase {
  // @ts-ignore expo-sqlite typings
  return SQLite.openDatabase(DB_NAME);
}

export function initQueue(): void {
  const db = open();
  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS offline_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, threadId TEXT, payload TEXT, createdAt INTEGER)'
    );
  });
}

export function enqueue(threadId: string, payload: object): Promise<void> {
  const db = open();
  const createdAt = Date.now();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO offline_queue (threadId, payload, createdAt) VALUES (?, ?, ?)',
        [threadId, JSON.stringify(payload), createdAt],
        () => resolve(),
        (_t, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

export function dequeueBatch(limit = 20): Promise<QueueItem[]> {
  const db = open();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id, threadId, payload, createdAt FROM offline_queue ORDER BY createdAt ASC LIMIT ?',
        [limit],
        (_t, res) => {
          const items: QueueItem[] = [];
          for (let i = 0; i < res.rows.length; i++) {
            const row = res.rows.item(i) as any;
            items.push({ id: row.id, threadId: row.threadId, payload: row.payload, createdAt: row.createdAt });
          }
          resolve(items);
        },
        (_t, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

export function removeByIds(ids: number[]): Promise<void> {
  if (ids.length === 0) return Promise.resolve();
  const db = open();
  const placeholders = ids.map(() => '?').join(',');
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM offline_queue WHERE id IN (${placeholders})`,
        ids as any,
        () => resolve(),
        (_t, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}


