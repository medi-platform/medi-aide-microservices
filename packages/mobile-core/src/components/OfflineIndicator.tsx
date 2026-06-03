import React from 'react';
import { useNetworkStatus, useOfflineQueue } from '../hooks';

interface OfflineIndicatorProps {
  className?: string;
  showPending?: boolean;
}

/**
 * Offline status indicator component
 */
export function OfflineIndicator({ className = '', showPending = true }: OfflineIndicatorProps) {
  const { online, status, effectiveType } = useNetworkStatus();
  const { pending, failed } = useOfflineQueue();

  if (online && pending === 0 && failed === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {!online && (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-sm font-medium">
          <span className="mr-2">📡</span>
          You're offline. Changes will sync when connected.
        </div>
      )}

      {online && status === 'slow' && (
        <div className="bg-yellow-500 text-black text-center py-2 px-4 text-sm font-medium">
          <span className="mr-2">⚠️</span>
          Slow connection detected ({effectiveType})
        </div>
      )}

      {showPending && (pending > 0 || failed > 0) && online && (
        <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-4">
          {pending > 0 && (
            <span>
              <span className="mr-2">🔄</span>
              {pending} pending sync{pending !== 1 ? 's' : ''}
            </span>
          )}
          {failed > 0 && (
            <span className="text-red-200">
              <span className="mr-2">❌</span>
              {failed} failed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
