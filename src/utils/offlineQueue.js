import { openDB } from 'idb';

const DB_NAME = 'ojaame_offline';
const STORE_NAME = 'pending_sales';
const DB_VERSION = 1;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('storeId', 'storeId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    },
  });
}

/**
 * Add a sale payload to the offline queue.
 * Returns the generated record id.
 */
export async function enqueueSale(payload) {
  const db = await getDB();
  const record = {
    id: crypto.randomUUID(),
    payload,
    storeId: payload.store_id,
    timestamp: Date.now(),
    retries: 0,
    lastError: null,
  };
  await db.put(STORE_NAME, record);
  return record.id;
}

/**
 * Retrieve all pending sales ordered by oldest first.
 */
export async function getAllPendingSales() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Remove a sale record from the queue (call after successful sync).
 */
export async function removeSale(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Increment the retry counter and store the last error message.
 */
export async function incrementRetry(id, errorMessage) {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);
  if (!record) return;
  await db.put(STORE_NAME, {
    ...record,
    retries: (record.retries || 0) + 1,
    lastError: errorMessage || 'Unknown error',
  });
}

/**
 * Remove all pending sales from the queue.
 */
export async function clearAll() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/**
 * Get the count of pending sales without loading all records.
 */
export async function getPendingCount() {
  const db = await getDB();
  return db.count(STORE_NAME);
}
