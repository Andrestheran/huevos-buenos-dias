import { openDB, type IDBPDatabase } from 'idb';
import type { ProductionRecordCreate } from '@/features/production/types';
import { productionService } from '@/features/production/services/productionService';
import { useSyncStore } from '@/shared/stores/syncStore';

const DB_NAME = 'huevos-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-records';

interface PendingRecord extends ProductionRecordCreate {
  id: string;
  created_at: string;
}

/**
 * Offline service using IndexedDB
 *
 * Handles:
 * - Saving records offline
 * - Syncing when connection is restored
 * - Tracking pending records
 */
export const offlineService = {
  db: null as IDBPDatabase | null,

  /**
   * Initialize IndexedDB
   */
  async init() {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create object store for pending records
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: 'id'
            });
            store.createIndex('created_at', 'created_at');
            store.createIndex('user_id', 'user_id');
          }
        }
      });

      console.log('✓ Offline service initialized');

      // Update pending count on init
      await this.updatePendingCount();

      // Start sync interval if online
      if (navigator.onLine) {
        this.startSyncInterval();
      }

      // Listen for online events
      window.addEventListener('online', () => {
        console.log('Connection restored, starting sync...');
        this.syncPendingRecords();
      });
    } catch (error) {
      console.error('Error initializing offline service:', error);
    }
  },

  /**
   * Save record offline
   */
  async saveRecord(record: ProductionRecordCreate): Promise<void> {
    if (!this.db) await this.init();

    const pendingRecord: PendingRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    await this.db!.add(STORE_NAME, pendingRecord);

    // Update count
    await this.updatePendingCount();

    console.log('✓ Record saved offline:', pendingRecord.id);
  },

  /**
   * Get all pending records
   */
  async getPendingRecords(): Promise<PendingRecord[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll(STORE_NAME);
  },

  /**
   * Delete synced record
   */
  async deleteRecord(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete(STORE_NAME, id);
    await this.updatePendingCount();
  },

  /**
   * Sync all pending records
   */
  async syncPendingRecords(): Promise<void> {
    if (!navigator.onLine) {
      console.log('⚠ Cannot sync: offline');
      return;
    }

    const { setSyncing, setSyncError, setLastSyncAt, decrementPending } = useSyncStore.getState();

    try {
      setSyncing(true);
      setSyncError(null);

      const pending = await this.getPendingRecords();

      if (pending.length === 0) {
        console.log('✓ No pending records to sync');
        setLastSyncAt(new Date());
        return;
      }

      console.log(`Syncing ${pending.length} pending record(s)...`);

      // Sync each record
      const results = await Promise.allSettled(
        pending.map(async (record) => {
          try {
            // Create in Supabase
            await productionService.createRecord({
              barn: record.barn,
              a: record.a,
              aa: record.aa,
              b: record.b,
              extra: record.extra,
              jumbo: record.jumbo,
              frozen: record.frozen,
              mortality: record.mortality,
              user_id: record.user_id,
              synced: true
            });

            // Delete from IndexedDB
            await this.deleteRecord(record.id);
            decrementPending();

            console.log('✓ Synced record:', record.id);
          } catch (error: any) {
            console.error('✗ Error syncing record:', record.id, error);

            // If it's a duplicate error, delete from IndexedDB
            if (error.message?.includes('Ya registraste')) {
              await this.deleteRecord(record.id);
              decrementPending();
            } else {
              throw error;
            }
          }
        })
      );

      // Check for failures
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        setSyncError(`${failures.length} registro(s) no pudieron sincronizarse`);
      } else {
        console.log('✓ All records synced successfully');
      }

      setLastSyncAt(new Date());
    } catch (error: any) {
      console.error('Error syncing records:', error);
      setSyncError(error.message || 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  },

  /**
   * Update pending count in store
   */
  async updatePendingCount(): Promise<void> {
    if (!this.db) return;

    const count = await this.db.count(STORE_NAME);
    useSyncStore.getState().setPendingCount(count);
  },

  /**
   * Start automatic sync interval
   */
  startSyncInterval() {
    // Sync every 30 seconds if online and has pending records
    setInterval(async () => {
      if (navigator.onLine) {
        const { pendingCount, isSyncing } = useSyncStore.getState();
        if (pendingCount > 0 && !isSyncing) {
          await this.syncPendingRecords();
        }
      }
    }, 30000); // 30 seconds
  },

  /**
   * Clear all offline data (for testing)
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear(STORE_NAME);
    await this.updatePendingCount();
    console.log('✓ All offline data cleared');
  }
};

// Initialize on import
if (typeof window !== 'undefined') {
  offlineService.init();
}
