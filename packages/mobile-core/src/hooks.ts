/**
 * React Hooks for Mobile Features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getOfflineQueue, OfflineAction } from './offline';
import { isOnline, getNetworkInfo, onNetworkChange, NetworkInfo } from './network';
import { getCurrentLocation, LocationData, watchLocation } from './location';
import { LocalStorage } from './storage';
import { isBiometricAvailable, hasBiometricEnrolled } from './biometric';
import { getNotificationPermission } from './notifications';

/**
 * Hook for offline queue status
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    const offlineQueue = getOfflineQueue();

    const update = () => {
      setQueue(offlineQueue.getAll());
      setPending(offlineQueue.getPending().length);
      setFailed(offlineQueue.getFailed().length);
    };

    update();
    const unsubscribe = offlineQueue.subscribe(update);

    return unsubscribe;
  }, []);

  return { queue, pending, failed };
}

/**
 * Hook for network status
 */
export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(getNetworkInfo);
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    const unsubscribe = onNetworkChange((info) => {
      setNetworkInfo(info);
      setOnline(info.status !== 'offline');
    });

    return unsubscribe;
  }, []);

  return { ...networkInfo, online };
}

/**
 * Hook for current location
 */
export function useLocation(options?: { watch?: boolean; highAccuracy?: boolean }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loc = await getCurrentLocation({
        enableHighAccuracy: options?.highAccuracy ?? true,
      });
      setLocation(loc);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [options?.highAccuracy]);

  useEffect(() => {
    refresh();

    if (options?.watch) {
      const stop = watchLocation(
        (loc) => setLocation(loc),
        (err) => setError(err),
        { enableHighAccuracy: options?.highAccuracy ?? true },
      );

      return stop;
    }
  }, [refresh, options?.watch, options?.highAccuracy]);

  return { location, error, loading, refresh };
}

/**
 * Hook for local storage data
 */
export function useLocalData<T>(
  key: keyof typeof LocalStorage,
  ...args: any[]
): { data: T | null; loading: boolean; error: Error | null; refresh: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const method = LocalStorage[key] as Function;
      const result = await method(...args);
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [key, ...args]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

/**
 * Hook for today's shifts
 */
export function useTodayShifts() {
  return useLocalData<Awaited<ReturnType<typeof LocalStorage.getTodayShifts>>>('getTodayShifts');
}

/**
 * Hook for patient data
 */
export function usePatient(patientId: string) {
  return useLocalData<Awaited<ReturnType<typeof LocalStorage.getPatient>>>('getPatient', patientId);
}

/**
 * Hook for biometric availability
 */
export function useBiometric(userId?: string) {
  const [available, setAvailable] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      setLoading(true);
      const isAvailable = await isBiometricAvailable();
      setAvailable(isAvailable);

      if (userId) {
        setEnrolled(hasBiometricEnrolled(userId));
      }

      setLoading(false);
    }

    check();
  }, [userId]);

  return { available, enrolled, loading };
}

/**
 * Hook for notification permission
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  return permission;
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for pull-to-refresh
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    currentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(async () => {
    const pullDistance = currentY.current - startY.current;

    if (pullDistance > 100 && window.scrollY === 0) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { refreshing };
}

/**
 * Hook for orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
      ? 'portrait'
      : 'landscape',
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return orientation;
}

/**
 * Hook for viewport size
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}
