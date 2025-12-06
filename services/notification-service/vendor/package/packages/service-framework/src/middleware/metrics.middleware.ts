import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private httpDuration: promClient.Histogram<string>;
  private httpRequests: promClient.Counter<string>;

  constructor() {
    // Create metrics
    this.httpDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    });

    this.httpRequests = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
      };

      this.httpDuration.observe(labels, duration);
      this.httpRequests.inc(labels);
    });

    next();
  }
}
