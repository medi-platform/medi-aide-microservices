import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(input: { to: string; subject: string; body: string; variables?: Record<string, any> }): Promise<void> {
    // TODO: integrate provider (e.g., SendGrid). For now, log and resolve.
    this.logger.log(`Email queued → to=${input.to} subject=${input.subject}`);
  }
}
