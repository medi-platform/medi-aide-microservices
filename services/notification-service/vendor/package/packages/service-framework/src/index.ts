// Tracing exports
export { TracerService, TracerConfig } from './tracing/tracer';
export { TracingMiddleware } from './middleware/tracing.middleware';

// Metrics exports
export { MetricsMiddleware } from './middleware/metrics.middleware';
export * as promClient from 'prom-client';

// Service discovery exports
export { ConsulService, ConsulConfig } from './utils/consul';

// Re-export OpenTelemetry types for convenience
export { 
  trace, 
  context, 
  SpanKind, 
  SpanStatusCode,
  Span,
  SpanContext 
} from '@opentelemetry/api';

// Common patterns
export { BaseService } from './patterns/base.service';
export { HealthController } from './patterns/health.controller';
export { MetricsController } from './patterns/metrics.controller';
