import { Injectable, Logger } from '@nestjs/common';
import { Counter, Registry } from 'prom-client';
import { MigrationOptions, DualWriteResult, WriteActions } from './types';

@Injectable()
export class DualWriteService {
  private readonly logger = new Logger(DualWriteService.name);
  private readonly writeCounter: Counter<string>;

  constructor(private readonly options: MigrationOptions, private readonly registry?: Registry) {
    this.writeCounter = new Counter({
      name: `${options.serviceName}_dual_write_total`,
      help: 'Dual write attempts',
      labelNames: ['path', 'outcome'] as const,
      registers: registry ? [registry] : undefined,
    });
  }

  async write<TPrimary, TSecondary>(
    path: string,
    actions: WriteActions<TPrimary, TSecondary>
  ): Promise<DualWriteResult<TPrimary, TSecondary>> {
    const result: DualWriteResult<TPrimary, TSecondary> = {};
    const doSecondary = this.options.dualWriteEnabled && typeof actions.secondary === 'function';

    // Primary first
    try {
      result.primaryResult = await actions.primary();
      this.writeCounter.labels(path, 'primary_success').inc();
    } catch (err: any) {
      result.primaryError = err instanceof Error ? err : new Error(String(err));
      this.writeCounter.labels(path, 'primary_error').inc();
      this.logger.error(`Primary write failed for ${path}: ${result.primaryError.message}`);
    }

    // Secondary best-effort
    if (doSecondary) {
      try {
        result.secondaryResult = await actions.secondary!();
        this.writeCounter.labels(path, 'secondary_success').inc();
      } catch (err: any) {
        result.secondaryError = err instanceof Error ? err : new Error(String(err));
        this.writeCounter.labels(path, 'secondary_error').inc();
        // Do not throw; secondary failures should never fail the request
        this.logger.warn(`Secondary write failed for ${path}: ${result.secondaryError.message}`);
      }
    }

    // Throw only if primary failed
    if (result.primaryError) {
      throw result.primaryError;
    }
    return result;
  }
}



