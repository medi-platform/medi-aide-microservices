/**
 * Offline Support Module
 * Handles offline data storage and queue management
 */

import { v4 as uuidv4 } from 'uuid';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface OfflineConfig {
  maxRetries: number;
  retryDelayMs: number;
  maxQueueSize: number;
  syncIntervalMs: number;
}

const DEFAULT_CONFIG: OfflineConfig = {
  maxRetries: 3,
  retryDelayMs: 5000,
  maxQueueSize: 1000,
  syncIntervalMs: 30000,
};

/**
 * Offline Queue Manager
 */
export class OfflineQueue {
  private queue: OfflineAction[] = [];
  private config: OfflineConfig;
  private storageKey = 'medi-aide-offline-queue';
  private listeners: Set<(queue: OfflineAction[]) => void> = new Set();

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
  }

  /**
   * Add action to offline queue
   */
  enqueue(type: OfflineAction['type'], entity: string, data: any): string {
    const action: OfflineAction = {
      id: uuidv4(),
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Offline queue is full');
    }

    this.queue.push(action);
    this.saveToStorage();
    this.notifyListeners();

    return action.id;
  }

  /**
   * Get pending actions
   */
  getPending(): OfflineAction[] {
    return this.queue.filter((a) => a.status === 'pending');
  }

  /**
   * Get failed actions
   */
  getFailed(): OfflineAction[] {
    return this.queue.filter((a) => a.status === 'failed');
  }

  /**
   * Get all actions
   */
  getAll(): OfflineAction[] {
    return [...this.queue];
  }

  /**
   * Mark action as syncing
   */
  markSyncing(id: string): void {
    const action = this.queue.find((a) => a.id === id);
    if (action) {
      action.status = 'syncing';
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Mark action as completed
   */
  markCompleted(id: string): void {
    const index = this.queue.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.queue.splice(index, 1);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Mark action as failed
   */
  markFailed(id: string, error: string): void {
    const action = this.queue.find((a) => a.id === id);
    if (action) {
      action.status = 'failed';
      action.error = error;
      action.retryCount++;

      if (action.retryCount >= this.config.maxRetries) {
        // Keep in failed state for manual retry
      } else {
        // Reset to pending for auto-retry
        action.status = 'pending';
      }

      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Retry failed action
   */
  retry(id: string): void {
    const action = this.queue.find((a) => a.id === id);
    if (action && action.status === 'failed') {
      action.status = 'pending';
      action.error = undefined;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Retry all failed actions
   */
  retryAll(): void {
    this.queue
      .filter((a) => a.status === 'failed')
      .forEach((action) => {
        action.status = 'pending';
        action.error = undefined;
      });
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Clear completed/failed actions
   */
  clear(status?: OfflineAction['status']): void {
    if (status) {
      this.queue = this.queue.filter((a) => a.status !== status);
    } else {
      this.queue = [];
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: OfflineAction[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue has pending actions
   */
  get hasPending(): boolean {
    return this.queue.some((a) => a.status === 'pending');
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.queue]));
  }
}

/**
 * Create singleton offline queue
 */
let offlineQueue: OfflineQueue | null = null;

export function getOfflineQueue(config?: Partial<OfflineConfig>): OfflineQueue {
  if (!offlineQueue) {
    offlineQueue = new OfflineQueue(config);
  }
  return offlineQueue;
}
