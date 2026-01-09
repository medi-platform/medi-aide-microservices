import { Injectable, LoggerService, Scope, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  traceId?: string;
  spanId?: string;
  requestId?: string;
  userId?: string;
  agencyId?: string;
  service?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  version: string;
  environment: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  [key: string]: any;
}

/**
 * Structured Logger Service
 * Outputs JSON-formatted logs for log aggregation (Loki, ELK)
 */
@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly serviceName: string;
  private readonly serviceVersion: string;
  private readonly environment: string;
  private readonly logLevel: LogLevel;
  private context: LogContext = {};

  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'unknown-service');
    this.serviceVersion = this.configService.get('SERVICE_VERSION', '1.0.0');
    this.environment = this.configService.get('NODE_ENV', 'development');
    this.logLevel = this.configService.get('LOG_LEVEL', 'info') as LogLevel;
  }

  /**
   * Set context for all subsequent log messages
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger(this.configService);
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  log(message: any, context?: string | LogContext): void {
    this.info(message, context);
  }

  debug(message: any, context?: string | LogContext): void {
    this.writeLog('debug', message, context);
  }

  info(message: any, context?: string | LogContext): void {
    this.writeLog('info', message, context);
  }

  warn(message: any, context?: string | LogContext): void {
    this.writeLog('warn', message, context);
  }

  error(message: any, trace?: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { component: context } : context;
    this.writeLog('error', message, logContext, trace);
  }

  fatal(message: any, context?: string | LogContext): void {
    this.writeLog('fatal', message, context);
  }

  verbose(message: any, context?: string | LogContext): void {
    this.debug(message, context);
  }

  private shouldLog(level: LogLevel): boolean {
    return this.LOG_LEVELS[level] >= this.LOG_LEVELS[this.logLevel];
  }

  private writeLog(
    level: LogLevel,
    message: any,
    context?: string | LogContext,
    trace?: string,
  ): void {
    if (!this.shouldLog(level)) return;

    const logContext = typeof context === 'string' ? { component: context } : context;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.formatMessage(message),
      service: this.serviceName,
      version: this.serviceVersion,
      environment: this.environment,
      context: { ...this.context, ...logContext },
    };

    if (trace) {
      entry.error = this.parseError(trace);
    }

    if (message instanceof Error) {
      entry.error = {
        name: message.name,
        message: message.message,
        stack: message.stack,
      };
      entry.message = message.message;
    }

    // Output as JSON for log aggregation
    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
      case 'fatal':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  private formatMessage(message: any): string {
    if (typeof message === 'string') return message;
    if (typeof message === 'object') return JSON.stringify(message);
    return String(message);
  }

  private parseError(trace: string): { name: string; message: string; stack?: string } {
    const lines = trace.split('\n');
    const firstLine = lines[0] || '';
    const [name, ...messageParts] = firstLine.split(':');
    return {
      name: name.trim(),
      message: messageParts.join(':').trim(),
      stack: trace,
    };
  }
}

/**
 * Request-scoped logger with automatic context
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedLogger extends StructuredLogger {
  constructor(
    configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    super(configService);

    // Auto-set request context
    this.setContext({
      requestId: (this.request as any).id || this.request.headers['x-request-id'] as string,
      traceId: this.request.headers['x-trace-id'] as string,
      userId: (this.request as any).user?.sub,
      agencyId: (this.request as any).user?.agencyId,
      method: this.request.method,
      path: this.request.path,
      ip: this.getClientIp(),
    });
  }

  private getClientIp(): string {
    return (
      (this.request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (this.request.headers['x-real-ip'] as string) ||
      this.request.socket?.remoteAddress ||
      ''
    );
  }
}

/**
 * Create a logger for a specific component
 */
export function createLogger(component: string, configService: ConfigService): StructuredLogger {
  const logger = new StructuredLogger(configService);
  logger.setContext({ component });
  return logger;
}

/**
 * Log decorator for automatic method logging
 */
export function LogMethod(options?: { level?: LogLevel; includeArgs?: boolean }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as StructuredLogger;
      if (!logger) {
        return originalMethod.apply(this, args);
      }

      const startTime = Date.now();
      const level = options?.level || 'debug';

      logger.debug(`${propertyKey} started`, {
        method: propertyKey,
        args: options?.includeArgs ? args : undefined,
      });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logger.debug(`${propertyKey} completed`, {
          method: propertyKey,
          duration,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error(`${propertyKey} failed: ${error.message}`, error.stack, {
          method: propertyKey,
          duration,
        });

        throw error;
      }
    };

    return descriptor;
  };
}
