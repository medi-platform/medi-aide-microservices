import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TrainingService {
  constructor(private readonly config: ConfigService) {}

  async generateRedirectUrl(email: string, name?: string): Promise<string> {
    const base = this.config.get<string>('lms.baseUrl') || '';
    if (!base) {
      throw new Error('LMS_BASE_URL not configured');
    }
    const url = new URL(base.replace(/\/$/, '') + '/index');
    // TalentLMS redirect mode pattern (example; adapt when API is enabled)
    url.searchParams.set('user_login', email);
    if (name) url.searchParams.set('name', name);
    return url.toString();
  }
}


