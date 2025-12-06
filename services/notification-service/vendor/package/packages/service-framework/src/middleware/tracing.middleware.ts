import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { trace, context, SpanKind } from '@opentelemetry/api';

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  private tracer = trace.getTracer('http-middleware');

  use(req: Request, res: Response, next: NextFunction) {
    const span = this.tracer.startSpan(`${req.method} ${req.path}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.target': req.path,
        'http.host': req.hostname,
        'http.scheme': req.protocol,
        'http.user_agent': req.get('user-agent'),
        'http.request_content_length': req.get('content-length'),
        'net.peer.ip': req.ip,
      },
    });

    // Extract trace context from headers
    const traceParent = req.get('traceparent');
    const traceState = req.get('tracestate');
    
    if (traceParent) {
      span.setAttribute('http.request.header.traceparent', traceParent);
    }

    // Add request ID if present
    const requestId = req.get('x-request-id') || req.get('x-correlation-id');
    if (requestId) {
      span.setAttribute('request.id', requestId);
    }

    // Store span in request for later use
    (req as any).span = span;

    const originalSend = res.send;
    res.send = function(data: any) {
      span.setAttribute('http.status_code', res.statusCode);
      span.setAttribute('http.response_content_length', res.get('content-length') || 0);
      
      if (res.statusCode >= 400) {
        span.setStatus({
          code: res.statusCode >= 500 ? 2 : 1, // ERROR : OK
          message: `HTTP ${res.statusCode}`,
        });
      }
      
      span.end();
      return originalSend.call(this, data);
    };

    context.with(trace.setSpan(context.active(), span), () => {
      next();
    });
  }
}
