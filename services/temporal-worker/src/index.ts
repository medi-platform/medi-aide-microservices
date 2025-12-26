/**
 * Temporal Worker Service
 * 
 * Production-ready Temporal worker that executes workflows and activities
 * for the MediAide platform.
 */

import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '@medi-aide/temporal-workflows-examples/activities';
import express from 'express';
import { Counter, Histogram, register } from 'prom-client';

const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'medi-aide-care-workflows';
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'temporal:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
const METRICS_PORT = parseInt(process.env.METRICS_PORT || '9000', 10);
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || '8080', 10);

// Metrics
const workflowsStarted = new Counter({
  name: 'temporal_workflows_started_total',
  help: 'Total workflows started',
  labelNames: ['workflow'],
});

const activitiesExecuted = new Counter({
  name: 'temporal_activities_executed_total',
  help: 'Total activities executed',
  labelNames: ['activity', 'status'],
});

const activityDuration = new Histogram({
  name: 'temporal_activity_duration_seconds',
  help: 'Activity execution duration',
  labelNames: ['activity'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

let worker: Worker | null = null;
let isHealthy = false;

async function startWorker(): Promise<void> {
  console.log(`Connecting to Temporal at ${TEMPORAL_ADDRESS}...`);
  
  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
  });

  worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: TASK_QUEUE,
    workflowsPath: require.resolve('@medi-aide/temporal-workflows-examples'),
    activities,
    maxConcurrentActivityTaskExecutions: 100,
    maxConcurrentWorkflowTaskExecutions: 100,
  });

  console.log(`Temporal worker started, listening on task queue: ${TASK_QUEUE}`);
  isHealthy = true;

  // Run the worker
  await worker.run();
}

function startHealthServer(): void {
  const app = express();

  app.get('/health', (_req, res) => {
    if (isHealthy) {
      res.json({ status: 'healthy', taskQueue: TASK_QUEUE });
    } else {
      res.status(503).json({ status: 'unhealthy' });
    }
  });

  app.get('/ready', (_req, res) => {
    if (worker && isHealthy) {
      res.json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  });

  app.listen(HEALTH_PORT, () => {
    console.log(`Health server listening on port ${HEALTH_PORT}`);
  });
}

function startMetricsServer(): void {
  const app = express();

  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end();
    }
  });

  app.listen(METRICS_PORT, () => {
    console.log(`Metrics server listening on port ${METRICS_PORT}`);
  });
}

async function shutdown(): Promise<void> {
  console.log('Shutting down Temporal worker...');
  isHealthy = false;
  if (worker) {
    await worker.shutdown();
  }
  process.exit(0);
}

// Handle signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start everything
async function main(): Promise<void> {
  console.log('Starting MediAide Temporal Worker Service...');
  console.log(`Task Queue: ${TASK_QUEUE}`);
  console.log(`Temporal Address: ${TEMPORAL_ADDRESS}`);
  console.log(`Namespace: ${TEMPORAL_NAMESPACE}`);

  startHealthServer();
  startMetricsServer();

  try {
    await startWorker();
  } catch (error) {
    console.error('Failed to start Temporal worker:', error);
    isHealthy = false;
    // Keep health server running to report unhealthy status
    // In production, you might want to exit and let the orchestrator restart
  }
}

main().catch(console.error);

