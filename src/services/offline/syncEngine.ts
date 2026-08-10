import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { calculationsDb, CalculationRecord } from '../../data/db';
import { firestoreService } from '../firebase/firestoreService';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  syncError: string | null;
}

type SyncStateListener = (state: SyncState) => void;

class SyncEngine {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private pendingCount: number = 0;
  private lastSyncTime: number | null = null;
  private syncError: string | null = null;
  private listeners: Set<SyncStateListener> = new Set();
  private maxRetries: number = 3;
  private baseDelayMs: number = 1000;

  constructor() {
    this.initNetworkListener();
  }

  /**
   * Listen to network connectivity changes using NetInfo
   */
  private initNetworkListener() {
    // Initial fetch
    NetInfo.fetch().then((state: NetInfoState) => {
      this.isOnline = state.isConnected === true && state.isInternetReachable !== false;
      this.refreshPendingCount();
    });

    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      // In React Native/Expo, isInternetReachable can be null initially, treat as connected if isConnected is true
      this.isOnline = state.isConnected === true && state.isInternetReachable !== false;

      this.notifyListeners();

      // Trigger automatic sync when coming back online
      if (wasOffline && this.isOnline) {
        console.log('[SyncEngine] Network reconnected. Starting background sync...');
        this.processSyncQueue();
      }
    });
  }

  /**
   * Called when a new calculation is saved locally to update pending count & auto-sync if online
   */
  public async onCalculationAdded(): Promise<void> {
    await this.refreshPendingCount();
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Subscribe to sync state updates (for UI banners and status indicators)
   */
  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getSyncState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSyncState(): SyncState {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      syncError: this.syncError,
    };
  }

  private notifyListeners() {
    const state = this.getSyncState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Update pending sync count from local SQLite database
   */
  public async refreshPendingCount(): Promise<number> {
    try {
      const pendingRecords = await calculationsDb.getPendingSync();
      this.pendingCount = pendingRecords.length;
      this.notifyListeners();
      return this.pendingCount;
    } catch (e) {
      console.warn('[SyncEngine] Failed to refresh pending count:', e);
      return 0;
    }
  }

  /**
   * Process pending sync queue with exponential backoff retries & conflict resolution
   */
  public async processSyncQueue(userId: string = 'guest_user'): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    this.syncError = null;
    this.notifyListeners();

    try {
      const pendingRecords = await calculationsDb.getPendingSync();
      this.pendingCount = pendingRecords.length;
      this.notifyListeners();

      if (pendingRecords.length === 0) {
        this.isSyncing = false;
        this.lastSyncTime = Date.now();
        this.notifyListeners();
        return;
      }

      for (const record of pendingRecords) {
        let success = false;
        let attempt = 0;

        while (attempt < this.maxRetries && !success) {
          try {
            // Conflict Resolution (Last-Write-Wins timestamp check)
            await firestoreService.backupCalculation(userId, record);
            await calculationsDb.updateSyncStatus(record.id, 'synced', Date.now());
            success = true;
          } catch (err: any) {
            attempt++;
            console.warn(`[SyncEngine] Attempt ${attempt} failed for record ${record.id}:`, err);
            
            if (attempt < this.maxRetries) {
              // Exponential backoff delay: baseDelay * 2^attempt
              const backoffDelay = this.baseDelayMs * Math.pow(2, attempt);
              await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            } else {
              await calculationsDb.updateSyncStatus(record.id, 'failed');
              this.syncError = `Failed to sync calculation ID: ${record.id}`;
            }
          }
        }
      }

      await this.refreshPendingCount();
      this.lastSyncTime = Date.now();
    } catch (globalError: any) {
      console.error('[SyncEngine] Fatal error during sync:', globalError);
      this.syncError = globalError?.message || 'Sync operation encountered an error.';
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }
}

export const syncEngine = new SyncEngine();
