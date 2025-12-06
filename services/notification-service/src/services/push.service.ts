import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async send(input: { to: string; body: string; variables?: Record<string, any> }): Promise<void> {
    // TODO: integrate provider (e.g., FCM). For now, log and resolve.
    this.logger.log(`Push queued → to=${input.to}`);
  }
}
