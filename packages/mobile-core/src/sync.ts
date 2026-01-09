/**
 * Data Synchronization Module
 * Handles syncing offline data with server
 */

import { OfflineQueue, OfflineAction, getOfflineQueue } from './offline';
import { isOnline, onOnline } from './network';

export interface SyncConfig {
  apiBaseUrl: string;
  getAuthToken: () => Promise<string>;
  onSyncStart?: () => void;
  onSyncComplete?: (results: SyncResult[]) => void;
  onSyncError?: (error: Error) => void;
  onConflict?: (action: OfflineAction, serverData: any) => Promise<'local' | 'server' | 'merge'>;
}

export interface SyncResult {
  actionId: string;
  success: boolean;
  error?: string;
  serverResponse?: any;
}

/**
 * Sync Manager
 */
export class SyncManager {
  private queue: OfflineQueue;
  private config: SyncConfig;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(config: SyncConfig) {
    this.config = config;
    this.queue = getOfflineQueue();

    // Auto-sync when coming online
    onOnline(() => {
      this.sync();
    });
  }

  /**
   * Start automatic sync
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      return;
    }

    this.syncInterval = setInterval(() => {
      if (isOnline() && this.queue.hasPending) {
        this.sync();
      }
    }, intervalMs);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Manual sync
   */
  async sync(): Promise<SyncResult[]> {
    if (this.isSyncing || !isOnline()) {
      return [];
    }

    this.isSyncing = true;
    this.config.onSyncStart?.();

    const results: SyncResult[] = [];
    const pending = this.queue.getPending();

    try {
      const token = await this.config.getAuthToken();

      for (const action of pending) {
        const result = await this.syncAction(action, token);
        results.push(result);
      }

      this.config.onSyncComplete?.(results);
    } catch (error: any) {
      this.config.onSyncError?.(error);
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  /**
   * Sync single action
   */
  private async syncAction(action: OfflineAction, token: string): Promise<SyncResult> {
    this.queue.markSyncing(action.id);

    try {
      const endpoint = this.getEndpoint(action);
      const method = this.getMethod(action);

      const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Offline-Sync': 'true',
          'X-Action-Timestamp': action.timestamp.toString(),
        },
        body: method !== 'DELETE' ? JSON.stringify(action.data) : undefined,
      });

      if (response.status === 409) {
        // Conflict - server has newer data
        const serverData = await response.json();
        const resolution = await this.config.onConflict?.(action, serverData);

        if (resolution === 'local') {
          // Force push local data
          return this.forcePush(action, token);
        } else if (resolution === 'server') {
          // Discard local changes
          this.queue.markCompleted(action.id);
          return { actionId: action.id, success: true, serverResponse: serverData };
        }
        // merge handled by caller
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const serverResponse = await response.json();
      this.queue.markCompleted(action.id);

      return { actionId: action.id, success: true, serverResponse };
    } catch (error: any) {
      this.queue.markFailed(action.id, error.message);
      return { actionId: action.id, success: false, error: error.message };
    }
  }

  /**
   * Force push local data (overwrite server)
   */
  private async forcePush(action: OfflineAction, token: string): Promise<SyncResult> {
    const endpoint = this.getEndpoint(action);

    const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Force-Overwrite': 'true',
      },
      body: JSON.stringify(action.data),
    });

    if (!response.ok) {
      const error = await response.text();
      this.queue.markFailed(action.id, error);
      return { actionId: action.id, success: false, error };
    }

    const serverResponse = await response.json();
    this.queue.markCompleted(action.id);
    return { actionId: action.id, success: true, serverResponse };
  }

  /**
   * Get API endpoint for action
   */
  private getEndpoint(action: OfflineAction): string {
    const entityEndpoints: Record<string, string> = {
      shift: '/api/v1/shifts',
      clockIn: '/api/v1/shifts/clock-in',
      clockOut: '/api/v1/shifts/clock-out',
      note: '/api/v1/clinical-notes',
      vital: '/api/v1/vitals',
      medication: '/api/v1/medications/administer',
      task: '/api/v1/tasks',
      message: '/api/v1/messages',
      incident: '/api/v1/incidents',
    };

    const baseEndpoint = entityEndpoints[action.entity] || `/api/v1/${action.entity}s`;

    if (action.type === 'UPDATE' || action.type === 'DELETE') {
      return `${baseEndpoint}/${action.data.id}`;
    }

    return baseEndpoint;
  }

  /**
   * Get HTTP method for action
   */
  private getMethod(action: OfflineAction): string {
    switch (action.type) {
      case 'CREATE':
        return 'POST';
      case 'UPDATE':
        return 'PUT';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'POST';
    }
  }

  /**
   * Get sync status
   */
  get status(): { isSyncing: boolean; pending: number; failed: number } {
    return {
      isSyncing: this.isSyncing,
      pending: this.queue.getPending().length,
      failed: this.queue.getFailed().length,
    };
  }
}

/**
 * Create sync manager
 */
export function createSyncManager(config: SyncConfig): SyncManager {
  return new SyncManager(config);
}
