import React, { useCallback } from 'react';
import { useOfflineQueue, useNetworkStatus } from '../hooks';
import { getOfflineQueue } from '../offline';

interface SyncStatusProps {
  className?: string;
  onRetry?: () => Promise<void>;
}

/**
 * Sync status display component
 */
export function SyncStatus({ className = '', onRetry }: SyncStatusProps) {
  const { queue, pending, failed } = useOfflineQueue();
  const { online } = useNetworkStatus();

  const handleRetryAll = useCallback(async () => {
    getOfflineQueue().retryAll();
    onRetry?.();
  }, [onRetry]);

  const handleClearFailed = useCallback(() => {
    getOfflineQueue().clear('failed');
  }, []);

  if (queue.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <span className="text-2xl mb-2 block">✓</span>
          All changes synced
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Sync Status</h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-yellow-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          <div className="text-sm text-yellow-800">Pending</div>
        </div>
        <div className="bg-red-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{failed}</div>
          <div className="text-sm text-red-800">Failed</div>
        </div>
        <div className="bg-gray-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-600">{queue.length}</div>
          <div className="text-sm text-gray-800">Total</div>
        </div>
      </div>

      {/* Actions */}
      {failed > 0 && online && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleRetryAll}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
          >
            🔄 Retry All
          </button>
          <button
            onClick={handleClearFailed}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
          >
            🗑️ Clear Failed
          </button>
        </div>
      )}

      {!online && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 text-sm">
          ⚠️ You're offline. Changes will sync when you're back online.
        </div>
      )}

      {/* Queue items */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {queue.slice(0, 10).map((action) => (
          <div
            key={action.id}
            className={`p-3 rounded-lg border ${
              action.status === 'failed'
                ? 'bg-red-50 border-red-200'
                : action.status === 'syncing'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium capitalize">{action.type.toLowerCase()}</span>
                <span className="text-gray-500 mx-1">•</span>
                <span className="text-gray-600">{action.entity}</span>
              </div>
              <span
                className={`text-sm ${
                  action.status === 'failed'
                    ? 'text-red-600'
                    : action.status === 'syncing'
                      ? 'text-blue-600'
                      : 'text-yellow-600'
                }`}
              >
                {action.status === 'failed' && '❌'}
                {action.status === 'syncing' && '🔄'}
                {action.status === 'pending' && '⏳'}
              </span>
            </div>
            {action.error && (
              <div className="text-sm text-red-600 mt-1">{action.error}</div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              {new Date(action.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
        {queue.length > 10 && (
          <div className="text-center text-gray-500 text-sm py-2">
            +{queue.length - 10} more items
          </div>
        )}
      </div>
    </div>
  );
}
