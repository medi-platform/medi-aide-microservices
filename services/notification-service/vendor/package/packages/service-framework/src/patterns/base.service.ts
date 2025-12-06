import { Logger } from '@nestjs/common';
import { TracerService } from '../tracing/tracer';

export abstract class BaseService {
  protected readonly logger: Logger;
  protected readonly tracer: TracerService;

  constructor(serviceName: string, tracer?: TracerService) {
    this.logger = new Logger(serviceName);
    this.tracer = tracer || new TracerService({ serviceName });
  }

  protected async executeWithTracing<T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    return this.tracer.withSpan(
      operationName,
      async (span) => {
        try {
          this.logger.debug(`Starting ${operationName}`);
          const result = await operation();
          this.logger.debug(`Completed ${operationName}`);
          return result;
        } catch (error) {
          this.logger.error(`Error in ${operationName}:`, error);
          throw error;
        }
      },
      attributes
    );
  }

  protected handleError(error: Error, context: string): never {
    this.logger.error(`Error in ${context}:`, error.stack);
    throw error;
  }
}
