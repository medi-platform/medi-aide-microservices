import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  trace,
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  Tracer,
  Span,
  Context,
} from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';
import { KafkaJsInstrumentation } from '@opentelemetry/instrumentation-kafkajs';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

export interface TracingConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  jaegerEndpoint?: string;
  otlpEndpoint?: string;
  samplingRatio?: number;
  enabled?: boolean;
}

/**
 * OpenTelemetry Tracing Service
 */
@Injectable()
export class TracingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TracingService.name);
  private sdk: NodeSDK | null = null;
  private tracer: Tracer;
  private readonly config: TracingConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      serviceName: this.configService.get('SERVICE_NAME', 'unknown-service'),
      serviceVersion: this.configService.get('SERVICE_VERSION', '1.0.0'),
      environment: this.configService.get('NODE_ENV', 'development'),
      otlpEndpoint: this.configService.get(
        'OTEL_EXPORTER_OTLP_ENDPOINT',
        'http://otel-collector:4318',
      ),
      samplingRatio: parseFloat(this.configService.get('OTEL_SAMPLING_RATIO', '1.0')),
      enabled: this.configService.get('TRACING_ENABLED', 'true') === 'true',
    };

    this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.log('Tracing is disabled');
      return;
    }

    try {
      const exporter = new OTLPTraceExporter({
        url: `${this.config.otlpEndpoint}/v1/traces`,
      });

      this.sdk = new NodeSDK({
        resource: new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
          [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
          [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
        }),
        spanProcessor: new BatchSpanProcessor(exporter),
        instrumentations: [
          new HttpInstrumentation({
            ignoreIncomingPaths: ['/health', '/ping', '/metrics'],
          }),
          new ExpressInstrumentation(),
          new NestInstrumentation(),
          new PgInstrumentation(),
          new RedisInstrumentation(),
          new KafkaJsInstrumentation(),
        ],
      });

      await this.sdk.start();
      this.logger.log(`Tracing initialized for ${this.config.serviceName}`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize tracing: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.sdk) {
      await this.sdk.shutdown();
      this.logger.log('Tracing shutdown complete');
    }
  }

  /**
   * Start a new span
   */
  startSpan(name: string, options?: { kind?: SpanKind; attributes?: Record<string, any> }): Span {
    return this.tracer.startSpan(name, {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
    });
  }

  /**
   * Execute a function within a span
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: { kind?: SpanKind; attributes?: Record<string, any> },
  ): Promise<T> {
    const span = this.startSpan(name, options);

    try {
      const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Add attributes to current span
   */
  addSpanAttributes(attributes: Record<string, any>): void {
    const span = trace.getSpan(context.active());
    if (span) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Record an event on current span
   */
  addSpanEvent(name: string, attributes?: Record<string, any>): void {
    const span = trace.getSpan(context.active());
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Get current trace ID
   */
  getCurrentTraceId(): string | undefined {
    const span = trace.getSpan(context.active());
    return span?.spanContext().traceId;
  }

  /**
   * Get current span ID
   */
  getCurrentSpanId(): string | undefined {
    const span = trace.getSpan(context.active());
    return span?.spanContext().spanId;
  }

  /**
   * Extract trace context for propagation
   */
  extractTraceContext(): Record<string, string> {
    const carrier: Record<string, string> = {};
    propagation.inject(context.active(), carrier);
    return carrier;
  }

  /**
   * Inject trace context from incoming request
   */
  injectTraceContext(headers: Record<string, string>): Context {
    return propagation.extract(context.active(), headers);
  }
}
