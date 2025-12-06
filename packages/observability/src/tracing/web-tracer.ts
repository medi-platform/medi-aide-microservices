import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
// Use BatchSpanProcessor from sdk-trace-web to align types with WebTracerProvider
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { trace, context, Span, SpanStatusCode } from '@opentelemetry/api';

export interface WebTracerConfig {
  serviceName: string;
  serviceVersion?: string;
  endpoint?: string;
  environment?: string;
  userId?: string;
}

export class WebTracerService {
  private provider!: WebTracerProvider;
  private tracer: any;

  constructor(private config: WebTracerConfig) {
    this.initializeTracing();
  }

  private initializeTracing() {
    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment || 'development',
        'browser.user_agent': navigator.userAgent,
        'browser.language': navigator.language,
      })
    );

    this.provider = new WebTracerProvider({
      resource,
    });

    const exporter = new OTLPTraceExporter({
      url: this.config.endpoint || '/v1/traces',
      headers: {
        'X-Service-Name': this.config.serviceName,
      },
    });

    this.provider.addSpanProcessor(new BatchSpanProcessor(exporter as any));
    
    this.provider.register({
      contextManager: new ZoneContextManager(),
    });

    // Register instrumentations
    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [/.*/], // Propagate to all URLs
          clearTimingResources: true,
        }),
        new XMLHttpRequestInstrumentation({
          propagateTraceHeaderCorsUrls: [/.*/],
        }),
        new DocumentLoadInstrumentation(),
      ],
    });

    this.tracer = trace.getTracer(this.config.serviceName);
  }

  startSpan(name: string, attributes?: Record<string, any>) {
    const span = this.tracer.startSpan(name, { attributes });
    if (this.config.userId) {
      span.setAttribute('user.id', this.config.userId);
    }
    return span;
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

  setUserId(userId: string) {
    this.config.userId = userId;
  }

  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  addEvent(name: string, attributes?: Record<string, any>) {
    const span = this.getCurrentSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }
}
