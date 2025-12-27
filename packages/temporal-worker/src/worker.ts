import { NativeConnection, Worker, Runtime } from '@temporalio/worker';
import { Counter, Registry, collectDefaultMetrics } from 'prom-client';
import * as http from 'http';
import { TemporalWorkerConfig, getConfigFromEnv } from './config';
import { activities } from './activities';

/**
 * Enterprise Temporal Worker
 * 
 * Production-ready worker with:
 * - Automatic activity registration
 * - Health checks
 * - Prometheus metrics
 * - Graceful shutdown
 * - Connection retry
 */

// Metrics
const workerStartCounter = new Counter({
  name: 'temporal_worker_starts_total',
  help: 'Total number of worker starts',
});

const workflowsProcessed = new Counter({
  name: 'temporal_workflows_processed_total',
  help: 'Total number of workflows processed',
  labelNames: ['workflow', 'status'],
});

let isRunning = false;
let worker: Worker | null = null;

/**
 * Create and start the Temporal worker
 */
export async function startWorker(config?: TemporalWorkerConfig): Promise<void> {
  const cfg = config || getConfigFromEnv();
  
  console.log(`Starting Temporal worker...`);
  console.log(`  Server: ${cfg.serverAddress}`);
  console.log(`  Namespace: ${cfg.namespace}`);
  console.log(`  Task Queue: ${cfg.taskQueue}`);
  
  // Configure runtime
  Runtime.install({
    logger: {
      log(level, message, meta) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level}] ${message}`, meta || '');
      },
      trace: (message, meta) => {},
      debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta || ''),
      info: (message, meta) => console.info(`[INFO] ${message}`, meta || ''),
      warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
      error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    },
  });
  
  // Connect to Temporal server with retry
  let connection: NativeConnection | null = null;
  let retries = 0;
  const maxRetries = 10;
  
  while (!connection && retries < maxRetries) {
    try {
      connection = await NativeConnection.connect({
        address: cfg.serverAddress,
        tls: cfg.tls?.enabled ? {
          serverNameOverride: cfg.tls.serverName,
        } : undefined,
      });
      console.log('Connected to Temporal server');
    } catch (error) {
      retries++;
      console.warn(`Failed to connect to Temporal (attempt ${retries}/${maxRetries}):`, error);
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  if (!connection) {
    throw new Error(`Failed to connect to Temporal after ${maxRetries} attempts`);
  }
  
  // Create worker
  worker = await Worker.create({
    connection,
    namespace: cfg.namespace,
    taskQueue: cfg.taskQueue,
    workflowsPath: require.resolve('@medi-aide/temporal-workflows'),
    activities,
    maxConcurrentActivityTaskExecutions: cfg.maxConcurrentActivities,
    maxConcurrentWorkflowTaskExecutions: cfg.maxConcurrentWorkflows,
  });
  
  // Start metrics server if enabled
  if (cfg.metricsEnabled) {
    startMetricsServer(cfg.metricsPort || 9090);
  }
  
  // Handle shutdown signals
  setupGracefulShutdown();
  
  // Start worker
  workerStartCounter.inc();
  isRunning = true;
  
  console.log(`Temporal worker started on task queue: ${cfg.taskQueue}`);
  
  await worker.run();
}

/**
 * Start Prometheus metrics server
 */
function startMetricsServer(port: number): void {
  collectDefaultMetrics();
  
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      const registry = new Registry();
      collectDefaultMetrics({ register: registry });
      
      res.setHeader('Content-Type', registry.contentType);
      res.end(await registry.metrics());
    } else if (req.url === '/health') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: isRunning ? 'healthy' : 'unhealthy',
        worker: isRunning ? 'running' : 'stopped',
      }));
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });
  
  server.listen(port, () => {
    console.log(`Metrics server listening on port ${port}`);
  });
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    isRunning = false;
    
    if (worker) {
      try {
        // Worker will finish current tasks before shutting down
        await Promise.race([
          worker.shutdown(),
          new Promise(resolve => setTimeout(resolve, 30000)), // 30s timeout
        ]);
        console.log('Worker shut down successfully');
      } catch (error) {
        console.error('Error during worker shutdown:', error);
      }
    }
    
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Check if worker is healthy
 */
export function isWorkerHealthy(): boolean {
  return isRunning && worker !== null;
}

// Run worker if executed directly
if (require.main === module) {
  startWorker().catch((error) => {
    console.error('Failed to start worker:', error);
    process.exit(1);
  });
}

