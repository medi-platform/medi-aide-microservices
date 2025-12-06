import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(input: { to: string; body: string; variables?: Record<string, any> }): Promise<void> {
    // TODO: integrate provider (e.g., Twilio). For now, log and resolve.
    this.logger.log(`SMS queued → to=${input.to}`);
  }
}
