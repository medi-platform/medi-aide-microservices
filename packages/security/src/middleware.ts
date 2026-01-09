import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

/**
 * Security Headers Middleware
 * Sets security headers for all responses
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly helmetMiddleware: any;

  constructor() {
    this.helmetMiddleware = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply helmet headers
    this.helmetMiddleware(req, res, () => {
      // Additional custom headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      next();
    });
  }
}

/**
 * Request ID Middleware
 * Adds a unique request ID to each request for tracing
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    (req as any).id = requestId;
    next();
  }
}

/**
 * Correlation ID Middleware
 * Propagates correlation ID for distributed tracing
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    (req as any).correlationId = correlationId;
    next();
  }
}

/**
 * Request Logger Middleware
 * Logs all requests with sanitized data
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.headers['user-agent'] || '';
    const requestId = (req as any).id;

    // Log request
    this.logger.log(
      `[${requestId}] --> ${method} ${originalUrl} - ${ip} - ${userAgent.substring(0, 50)}`,
    );

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
      this.logger[logLevel](
        `[${requestId}] <-- ${method} ${originalUrl} ${statusCode} ${duration}ms`,
      );
    });

    next();
  }
}

/**
 * IP Filtering Middleware
 * Blocks requests from blacklisted IPs
 */
@Injectable()
export class IpFilterMiddleware implements NestMiddleware {
  private readonly logger = new Logger('IPFilter');
  private readonly blacklistedIps: Set<string> = new Set();
  private readonly whitelistedIps: Set<string> = new Set();

  constructor() {
    // Load from environment or config
    const blacklist = process.env.IP_BLACKLIST?.split(',') || [];
    const whitelist = process.env.IP_WHITELIST?.split(',') || [];

    blacklist.forEach((ip) => this.blacklistedIps.add(ip.trim()));
    whitelist.forEach((ip) => this.whitelistedIps.add(ip.trim()));
  }

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = this.getClientIp(req);

    // Check whitelist first
    if (this.whitelistedIps.size > 0 && !this.whitelistedIps.has(clientIp)) {
      this.logger.warn(`Blocked non-whitelisted IP: ${clientIp}`);
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check blacklist
    if (this.blacklistedIps.has(clientIp)) {
      this.logger.warn(`Blocked blacklisted IP: ${clientIp}`);
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    next();
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      ''
    );
  }

  addToBlacklist(ip: string) {
    this.blacklistedIps.add(ip);
  }

  removeFromBlacklist(ip: string) {
    this.blacklistedIps.delete(ip);
  }
}

/**
 * Sanitize Input Middleware
 * Sanitizes request body, query, and params
 */
@Injectable()
export class SanitizeInputMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
      req.body = this.sanitize(req.body);
    }
    if (req.query) {
      req.query = this.sanitize(req.query) as any;
    }
    if (req.params) {
      req.params = this.sanitize(req.params) as any;
    }
    next();
  }

  private sanitize(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitizeString(key)] = this.sanitize(value);
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    // Remove null bytes
    str = str.replace(/\0/g, '');

    // Basic XSS prevention
    str = str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return str.trim();
  }
}

/**
 * Session Timeout Middleware
 * Enforces session timeout for security
 */
@Injectable()
export class SessionTimeoutMiddleware implements NestMiddleware {
  private readonly timeoutMs: number;

  constructor() {
    this.timeoutMs = parseInt(process.env.SESSION_TIMEOUT_MS || '1800000', 10); // 30 min default
  }

  use(req: Request, res: Response, next: NextFunction) {
    const session = (req as any).session;

    if (session) {
      const lastActivity = session.lastActivity;
      const now = Date.now();

      if (lastActivity && now - lastActivity > this.timeoutMs) {
        // Session expired
        session.destroy(() => {
          res.status(401).json({ error: 'Session expired' });
        });
        return;
      }

      session.lastActivity = now;
    }

    next();
  }
}
