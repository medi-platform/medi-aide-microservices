// Tracing exports
export { WebTracerService } from './tracing/web-tracer';
export type { WebTracerConfig } from './tracing/web-tracer';
export {
  TracingProvider,
  useTracing,
  useTrace
} from './tracing/react-hooks';
export type { TracingProviderProps } from './tracing/react-hooks';

// Metrics exports
export { WebVitalsService } from './metrics/web-vitals';
export type { WebVitalsConfig } from './metrics/web-vitals';

// Utils exports
export { createTracedAxios } from './utils/traced-axios';
export type { TracedAxiosConfig } from './utils/traced-axios';

// Re-export OpenTelemetry types
export {
  trace,
  context,
  SpanKind,
  SpanStatusCode
} from '@opentelemetry/api';
export type {
  Span,
  SpanContext,
} from '@opentelemetry/api';

// Re-export web-vitals types
export type { Metric } from 'web-vitals';
