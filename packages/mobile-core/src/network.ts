/**
 * Network Status Module
 * Handles online/offline detection and network quality
 */

export type NetworkStatus = 'online' | 'offline' | 'slow';

export interface NetworkInfo {
  status: NetworkStatus;
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

type NetworkListener = (info: NetworkInfo) => void;

const listeners: Set<NetworkListener> = new Set();
const currentStatus: NetworkInfo = {
  status: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
};

/**
 * Initialize network monitoring
 */
export function initNetworkMonitoring(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Monitor connection quality if available
  const connection = (navigator as any).connection;
  if (connection) {
    connection.addEventListener('change', updateConnectionInfo);
    updateConnectionInfo();
  }
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return currentStatus.status !== 'offline';
}

/**
 * Check if network is slow
 */
export function isSlowNetwork(): boolean {
  return currentStatus.status === 'slow' ||
         currentStatus.effectiveType === '2g' ||
         currentStatus.effectiveType === 'slow-2g';
}

/**
 * Get current network info
 */
export function getNetworkInfo(): NetworkInfo {
  return { ...currentStatus };
}

/**
 * Subscribe to online events
 */
export function onOnline(callback: () => void): () => void {
  const listener: NetworkListener = (info) => {
    if (info.status === 'online') {
      callback();
    }
  };
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Subscribe to offline events
 */
export function onOffline(callback: () => void): () => void {
  const listener: NetworkListener = (info) => {
    if (info.status === 'offline') {
      callback();
    }
  };
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Subscribe to network changes
 */
export function onNetworkChange(callback: NetworkListener): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Wait for network
 */
export function waitForNetwork(timeoutMs: number = 30000): Promise<void> {
  if (isOnline()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error('Network timeout'));
    }, timeoutMs);

    const unsubscribe = onOnline(() => {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve();
    });
  });
}

/**
 * Check network connectivity with fetch
 */
export async function checkConnectivity(url: string = '/api/health'): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Measure network latency
 */
export async function measureLatency(url: string = '/api/health'): Promise<number> {
  const start = performance.now();

  try {
    await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
    });
    return Math.round(performance.now() - start);
  } catch {
    return -1;
  }
}

// Internal handlers
function handleOnline(): void {
  currentStatus.status = 'online';
  updateConnectionInfo();
  notifyListeners();
}

function handleOffline(): void {
  currentStatus.status = 'offline';
  notifyListeners();
}

function updateConnectionInfo(): void {
  const connection = (navigator as any).connection;
  if (!connection) return;

  currentStatus.effectiveType = connection.effectiveType;
  currentStatus.downlink = connection.downlink;
  currentStatus.rtt = connection.rtt;
  currentStatus.saveData = connection.saveData;

  // Determine if slow
  if (
    currentStatus.effectiveType === '2g' ||
    currentStatus.effectiveType === 'slow-2g' ||
    (currentStatus.rtt && currentStatus.rtt > 500)
  ) {
    currentStatus.status = 'slow';
  } else if (navigator.onLine) {
    currentStatus.status = 'online';
  }
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener({ ...currentStatus }));
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initNetworkMonitoring();
}
