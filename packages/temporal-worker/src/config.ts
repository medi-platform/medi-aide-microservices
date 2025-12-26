/**
 * Temporal Worker Configuration
 */
export interface TemporalWorkerConfig {
  /** Temporal server address */
  serverAddress: string;
  
  /** Namespace to use */
  namespace: string;
  
  /** Task queue name */
  taskQueue: string;
  
  /** Service name for identification */
  serviceName: string;
  
  /** Maximum concurrent activities */
  maxConcurrentActivities?: number;
  
  /** Maximum concurrent workflows */
  maxConcurrentWorkflows?: number;
  
  /** Activity timeout defaults */
  activityDefaults?: {
    startToCloseTimeout?: string;
    scheduleToCloseTimeout?: string;
    heartbeatTimeout?: string;
    retry?: {
      maximumAttempts?: number;
      initialInterval?: string;
      backoffCoefficient?: number;
      maximumInterval?: string;
    };
  };
  
  /** TLS configuration */
  tls?: {
    enabled: boolean;
    serverName?: string;
    cert?: string;
    key?: string;
    ca?: string;
  };
  
  /** Enable metrics */
  metricsEnabled?: boolean;
  
  /** Metrics port */
  metricsPort?: number;
}

/**
 * Default configuration
 */
export const defaultConfig: Partial<TemporalWorkerConfig> = {
  serverAddress: 'temporal:7233',
  namespace: 'default',
  taskQueue: 'medi-aide-main',
  maxConcurrentActivities: 100,
  maxConcurrentWorkflows: 100,
  activityDefaults: {
    startToCloseTimeout: '1m',
    heartbeatTimeout: '30s',
    retry: {
      maximumAttempts: 3,
      initialInterval: '1s',
      backoffCoefficient: 2,
      maximumInterval: '1m',
    },
  },
  metricsEnabled: true,
  metricsPort: 9090,
};

/**
 * Get configuration from environment
 */
export function getConfigFromEnv(): TemporalWorkerConfig {
  return {
    serverAddress: process.env.TEMPORAL_ADDRESS || 'temporal:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'medi-aide-main',
    serviceName: process.env.SERVICE_NAME || 'temporal-worker',
    maxConcurrentActivities: parseInt(process.env.TEMPORAL_MAX_ACTIVITIES || '100', 10),
    maxConcurrentWorkflows: parseInt(process.env.TEMPORAL_MAX_WORKFLOWS || '100', 10),
    metricsEnabled: process.env.METRICS_ENABLED !== 'false',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
    tls: {
      enabled: process.env.TEMPORAL_TLS_ENABLED === 'true',
      serverName: process.env.TEMPORAL_TLS_SERVER_NAME,
    },
  };
}

