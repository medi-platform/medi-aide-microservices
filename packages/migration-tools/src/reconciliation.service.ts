import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  async reconcile<T>(
    id: string,
    readMonolith: () => Promise<T | null>,
    readMicro: () => Promise<T | null>,
    repair: (args: { source: 'monolith' | 'micro'; value: T }) => Promise<void>
  ): Promise<'consistent' | 'repaired' | 'skipped'> {
    try {
      const [mono, micro] = await Promise.all([readMonolith(), readMicro()]);
      if (!mono && !micro) return 'skipped';
      if (JSON.stringify(mono) === JSON.stringify(micro)) return 'consistent';

      // Prefer micro as source of truth by default
      const source = micro ? 'micro' : 'monolith';
      const value = (micro || mono)!;
      await repair({ source, value });
      this.logger.log(`Reconciled ${id} from ${source}`);
      return 'repaired';
    } catch (e: any) {
      this.logger.warn(`Reconciliation error for ${id}: ${e?.message}`);
      return 'skipped';
    }
  }
}



