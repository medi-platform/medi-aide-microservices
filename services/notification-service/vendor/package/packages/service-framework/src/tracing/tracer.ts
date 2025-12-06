import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';

export interface TracerConfig {
  serviceName: string;
  serviceVersion?: string;
  jaegerEndpoint?: string;
  environment?: string;
}

export class TracerService {
  private sdk: NodeSDK | null = null;
  private tracer: any;

  constructor(private config: TracerConfig) {
    this.initializeTracing();
  }

  private initializeTracing() {
    const jaegerExporter = new JaegerExporter({
      endpoint: this.config.jaegerEndpoint || 'http://stage3-jaeger:14268/api/traces',
    });

    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment || 'development',
      })
    );

    this.sdk = new NodeSDK({
      resource,
      traceExporter: jaegerExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
    });

    this.sdk.start();
    this.tracer = trace.getTracer(this.config.serviceName);
  }

  async shutdown() {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }

  getTracer() {
    return this.tracer;
  }

  startSpan(name: string, attributes?: Record<string, any>) {
    return this.tracer.startSpan(name, { attributes });
  }

  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    try {
      const result = await context.with(
        trace.setSpan(context.active(), span),
        () => fn(span)
      );
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  }

  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  setSpanAttributes(attributes: Record<string, any>) {
    const span = this.getCurrentSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }
}
