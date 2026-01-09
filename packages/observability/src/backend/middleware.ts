import { Injectable, NestMiddleware, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { MetricsService, createTimer } from './metrics';
import { StructuredLogger } from './logging';
import { TracingService } from './tracing';

/**
 * Request Metrics Middleware
 * Records HTTP request metrics for Prometheus
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const timer = createTimer();

    // Track in-progress requests
    this.metricsService.httpRequestsInProgress.inc({ method: req.method });

    res.on('finish', () => {
      const duration = timer();
      const path = this.normalizePath(req.path);

      // Record metrics
      this.metricsService.recordHttpRequest(req.method, path, res.statusCode, duration);
      this.metricsService.httpRequestsInProgress.dec({ method: req.method });

      // Record response size if available
      const contentLength = res.get('content-length');
      if (contentLength) {
        this.metricsService.httpResponseSize.observe(
          { method: req.method, path },
          parseInt(contentLength, 10),
        );
      }
    });

    next();
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }
}

/**
 * Request Logging Middleware
 * Logs all HTTP requests with structured logging
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: StructuredLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    const startTime = Date.now();

    // Add request ID to request object
    (req as any).id = requestId;

    // Log incoming request
    this.logger.info('Incoming request', {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      this.logger[level]('Request completed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('content-length'),
      });
    });

    next();
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress ||
      ''
    );
  }
}

/**
 * Tracing Middleware
 * Extracts and propagates trace context
 */
@Injectable()
export class TracingMiddleware implements NestMiddleware {
  constructor(private readonly tracingService: TracingService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Extract trace context from incoming headers
    const traceContext = this.tracingService.extractTraceContext();

    // Add trace IDs to request
    (req as any).traceId = this.tracingService.getCurrentTraceId();
    (req as any).spanId = this.tracingService.getCurrentSpanId();

    // Add trace ID to response headers
    const traceId = this.tracingService.getCurrentTraceId();
    if (traceId) {
      res.setHeader('X-Trace-Id', traceId);
    }

    next();
  }
}

/**
 * Observability Interceptor
 * Combines metrics, logging, and tracing for controller methods
 */
@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: StructuredLogger,
    private readonly tracingService: TracingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    const timer = createTimer();

    // Add span attributes
    this.tracingService.addSpanAttributes({
      'http.handler': handler,
      'http.controller': controller,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = timer();

          // Record business operation
          this.metricsService.recordBusinessOperation(handler, controller, true);

          // Log successful operation
          this.logger.debug(`${controller}.${handler} completed`, {
            controller,
            handler,
            duration: Math.round(duration * 1000),
          });
        },
        error: (error) => {
          const duration = timer();

          // Record failed operation
          this.metricsService.recordBusinessOperation(handler, controller, false);
          this.metricsService.errorsTotal.inc({
            type: error.name || 'Error',
            code: error.status || 500,
          });

          // Log error
          this.logger.error(`${controller}.${handler} failed`, error.stack, {
            controller,
            handler,
            duration: Math.round(duration * 1000),
            errorMessage: error.message,
          });
        },
      }),
    );
  }
}

/**
 * Error Tracking Interceptor
 */
@Injectable()
export class ErrorTrackingInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: StructuredLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        error: (error) => {
          // Track exception
          this.metricsService.exceptionsTotal.inc({
            exception_type: error.constructor.name,
          });

          // Log with full context
          this.logger.error('Unhandled exception', error.stack, {
            exceptionType: error.constructor.name,
            exceptionMessage: error.message,
          });
        },
      }),
    );
  }
}
