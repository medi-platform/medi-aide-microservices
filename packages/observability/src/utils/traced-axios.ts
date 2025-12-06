import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';

export interface TracedAxiosConfig extends AxiosRequestConfig {
  tracingEnabled?: boolean;
  spanAttributes?: Record<string, any>;
}

export function createTracedAxios(
  serviceName: string,
  baseConfig?: AxiosRequestConfig
): AxiosInstance {
  const instance = axios.create(baseConfig);
  const tracer = trace.getTracer(serviceName);

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      const span = tracer.startSpan(
        `HTTP ${config.method?.toUpperCase()} ${config.url}`,
        {
          kind: SpanKind.CLIENT,
          attributes: {
            'http.method': config.method?.toUpperCase(),
            'http.url': config.url,
            'http.target': new URL(config.url!, config.baseURL).pathname,
            ...(config as TracedAxiosConfig).spanAttributes,
          },
        }
      );

      // Inject trace context into headers
      const spanContext = span.spanContext();
      if (spanContext.traceId && spanContext.spanId) {
        config.headers['traceparent'] = `00-${spanContext.traceId}-${spanContext.spanId}-01`;
      }

      // Store span in config for response interceptor
      (config as any)._span = span;
      (config as any)._ctx = context.active();

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const span = (response.config as any)._span;
      if (span) {
        span.setAttributes({
          'http.status_code': response.status,
          'http.response_content_length': response.headers['content-length'] || 0,
        });
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
      }
      return response;
    },
    (error) => {
      const span = (error.config as any)?._span;
      if (span) {
        span.setAttributes({
          'http.status_code': error.response?.status || 0,
          'http.error_message': error.message,
        });
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.end();
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
