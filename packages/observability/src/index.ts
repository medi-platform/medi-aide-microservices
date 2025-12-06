// Tracing exports
export { WebTracerService, WebTracerConfig } from './tracing/web-tracer';
export { 
  TracingProvider, 
  TracingProviderProps,
  useTracing,
  useTrace 
} from './tracing/react-hooks';

// Metrics exports
export { WebVitalsService, WebVitalsConfig } from './metrics/web-vitals';

// Utils exports
export { createTracedAxios, TracedAxiosConfig } from './utils/traced-axios';

// Re-export OpenTelemetry types
export { 
  trace, 
  context, 
  SpanKind, 
  SpanStatusCode,
  Span,
  SpanContext 
} from '@opentelemetry/api';

// Re-export web-vitals types
export type { Metric } from 'web-vitals';
