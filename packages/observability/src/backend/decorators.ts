import { SetMetadata } from '@nestjs/common';

/**
 * Mark a method for timing metrics
 */
export function Timed(metricName?: string) {
  return SetMetadata('timed', { metricName });
}

/**
 * Mark a method for tracing
 */
export function Traced(spanName?: string) {
  return SetMetadata('traced', { spanName });
}

/**
 * Skip observability for a route
 */
export function SkipObservability() {
  return SetMetadata('skipObservability', true);
}

/**
 * Custom metric labels
 */
export function MetricLabels(labels: Record<string, string>) {
  return SetMetadata('metricLabels', labels);
}

/**
 * Mark sensitive operation for audit
 */
export function AuditOperation(operationType: string) {
  return SetMetadata('auditOperation', { operationType });
}

/**
 * Custom span attributes
 */
export function SpanAttributes(attributes: Record<string, string | number | boolean>) {
  return SetMetadata('spanAttributes', attributes);
}
