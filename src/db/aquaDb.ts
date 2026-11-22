/**
 * AQUA-SPECTRA — src/db/aquaDb.ts
 * Dexie/IndexedDB persistence: scans, purification batches, Datalog runs and an
 * offline→online sync queue. Everything works with the network physically off,
 * which is the point of a survival instrument.
 */
import Dexie, { type Table } from 'dexie';
import type { ScanResult } from '../state/store';

export type PurificationBatch = {
  id?: number;
  createdAt: number;
  litres: number;
  ntu: number;
  tempC: number;
  elevationM: number;
  agent: string;
  doseMl: number;
  contactMin: number;
  boilMin: number;
  notes: string;
  sampleId: string;
};

export type DatalogRun = {
  id?: number;
  createdAt: number;
  sampleId: string;
  rules: number;
  derived: number;
  hazards: string;
  seal: string;
  elapsedMs: number;
};

export type SyncJob = {
  id?: number;
  createdAt: number;
  kind: 'scan' | 'batch' | 'datalog';
  payload: string;
  state: 'queued' | 'sending' | 'synced' | 'failed';
  attempts: number;
  syncedAt: number | null;
};

export type SettingRow = { key: string; value: string };

class AquaDatabase extends Dexie {
  scans!: Table<ScanResult, string>;
  batches!: Table<PurificationBatch, number>;
  datalogRuns!: Table<DatalogRun, number>;
  syncQueue!: Table<SyncJob, number>;
  settings!: Table<SettingRow, string>;

  constructor() {
    super('aquaspectra');
    this.version(1).stores({
      scans: 'id, sampleId, createdAt, ntu',
      batches: '++id, createdAt, sampleId, agent',
      datalogRuns: '++id, createdAt, sampleId, seal',
      syncQueue: '++id, createdAt, kind, state',
      settings: 'key',
    });
  }
}

export const db = new AquaDatabase();

const memoryFallback = {
  scans: new Map<string, ScanResult>(),
  batches: [] as PurificationBatch[],
  runs: [] as DatalogRun[],
  queue: [] as SyncJob[],
};

let dbAvailable = true;

export async function saveScan(scan: ScanResult): Promise<void> {
  if (dbAvailable) {
    try {
      await db.scans.put(scan);
      await db.syncQueue.add({
        createdAt: Date.now(),
        kind: 'scan',
        payload: JSON.stringify({ id: scan.id, sampleId: scan.sampleId, ntu: scan.ntu, lsi: scan.stability.lsi }),
        state: 'queued',
        attempts: 0,
        syncedAt: null,
      });
      return;
    } catch {
      dbAvailable = false;
    }
  }
  memoryFallback.scans.set(scan.id, scan);
}

export async function listScans(limit = 50): Promise<ScanResult[]> {
  if (dbAvailable) {
    try {
      return await db.scans.orderBy('createdAt').reverse().limit(limit).toArray();
    } catch {
      dbAvailable = false;
    }
  }
  return [...memoryFallback.scans.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function saveBatch(batch: PurificationBatch): Promise<void> {
  if (dbAvailable) {
    try {
      await db.batches.add(batch);
      await db.syncQueue.add({
        createdAt: Date.now(),
        kind: 'batch',
        payload: JSON.stringify({ litres: batch.litres, agent: batch.agent, doseMl: batch.doseMl }),
        state: 'queued',
        attempts: 0,
        syncedAt: null,
      });
      return;
    } catch {
      dbAvailable = false;
    }
  }
  memoryFallback.batches.push(batch);
}

export async function listBatches(limit = 50): Promise<PurificationBatch[]> {
  if (dbAvailable) {
    try {
      return await db.batches.orderBy('createdAt').reverse().limit(limit).toArray();
    } catch {
      dbAvailable = false;
    }
  }
  return [...memoryFallback.batches].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function saveDatalogRun(run: DatalogRun): Promise<void> {
  if (dbAvailable) {
    try {
      await db.datalogRuns.add(run);
      return;
    } catch {
      dbAvailable = false;
    }
  }
  memoryFallback.runs.push(run);
}

export async function listDatalogRuns(limit = 25): Promise<DatalogRun[]> {
  if (dbAvailable) {
    try {
      return await db.datalogRuns.orderBy('createdAt').reverse().limit(limit).toArray();
    } catch {
      dbAvailable = false;
    }
  }
  return [...memoryFallback.runs].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function queueDepth(): Promise<number> {
  if (dbAvailable) {
    try {
      return await db.syncQueue.where('state').equals('queued').count();
    } catch {
      dbAvailable = false;
    }
  }
  return memoryFallback.queue.filter((j) => j.state === 'queued').length;
}

/**
 * Drain the sync queue. There is no backend by design (offline-first), so a
 * successful drain marks jobs synced and reports the batch — the same code path
 * a municipal lab would point at its own REST endpoint.
 */
export async function drainSyncQueue(): Promise<{ synced: number; remaining: number }> {
  // No remote destination is configured. Never mark local jobs as uploaded.
  return { synced: 0, remaining: await queueDepth() };
}

export async function saveSetting(key: string, value: string): Promise<void> {
  if (dbAvailable) {
    try {
      await db.settings.put({ key, value });
      return;
    } catch {
      dbAvailable = false;
    }
  }
}

export async function readSetting(key: string): Promise<string | null> {
  if (dbAvailable) {
    try {
      const row = await db.settings.get(key);
      return row?.value ?? null;
    } catch {
      dbAvailable = false;
    }
  }
  return null;
}

export async function clearAll(): Promise<void> {
  if (!dbAvailable) return;
  try {
    await Promise.all([db.scans.clear(), db.batches.clear(), db.datalogRuns.clear(), db.syncQueue.clear()]);
  } catch {
    dbAvailable = false;
  }
}

export const isPersistent = () => dbAvailable;
