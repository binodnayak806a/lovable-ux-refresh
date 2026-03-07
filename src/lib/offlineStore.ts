import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'wellnotes_offline';
const DB_VERSION = 1;

interface PendingRecord {
  id?: number;
  table: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface CachedPatient {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  age?: number;
  gender?: string;
  blood_group?: string | null;
  date_of_birth?: string;
  address?: string;
}

let dbInstance: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pending_records')) {
        db.createObjectStore('pending_records', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached_patients')) {
        const store = db.createObjectStore('cached_patients', { keyPath: 'id' });
        store.createIndex('uhid', 'uhid', { unique: false });
        store.createIndex('full_name', 'full_name', { unique: false });
      }
    },
  });
  return dbInstance;
}

export const offlineStore = {
  async addPendingRecord(table: string, data: Record<string, unknown>): Promise<void> {
    const db = await getDb();
    await db.add('pending_records', {
      table,
      data,
      createdAt: new Date().toISOString(),
    } as PendingRecord);
  },

  async getPendingRecords(): Promise<PendingRecord[]> {
    const db = await getDb();
    return db.getAll('pending_records');
  },

  async getPendingCount(): Promise<number> {
    const db = await getDb();
    return db.count('pending_records');
  },

  async clearSynced(ids: number[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('pending_records', 'readwrite');
    for (const id of ids) {
      await tx.store.delete(id);
    }
    await tx.done;
  },

  async clearAllPending(): Promise<void> {
    const db = await getDb();
    await db.clear('pending_records');
  },

  async cachePatients(patients: CachedPatient[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('cached_patients', 'readwrite');
    await tx.store.clear();
    for (const patient of patients) {
      await tx.store.put(patient);
    }
    await tx.done;
  },

  async getCachedPatients(): Promise<CachedPatient[]> {
    const db = await getDb();
    return db.getAll('cached_patients');
  },

  async searchCachedPatients(query: string): Promise<CachedPatient[]> {
    const db = await getDb();
    const all = await db.getAll('cached_patients');
    if (!query) return all;
    const lower = query.toLowerCase();
    return all.filter(
      (p) =>
        p.full_name.toLowerCase().includes(lower) ||
        p.uhid.toLowerCase().includes(lower) ||
        p.phone.includes(query)
    );
  },

  async getCachedPatientById(id: string): Promise<CachedPatient | undefined> {
    const db = await getDb();
    return db.get('cached_patients', id);
  },
};
