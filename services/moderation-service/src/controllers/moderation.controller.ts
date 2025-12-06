import { Body, Controller, Post } from '@nestjs/common';

@Controller('moderation')
export class ModerationController {
  @Post('classify')
  async classify(@Body() body: any) {
    const text: string = body?.text || '';
    // Stub classification; integrate AI Gateway later
    const isToxic = /hate|abuse|harass/i.test(text);
    const containsPHI = /ssn|dob|address|mrn/i.test(text);
    return {
      labels: {
        toxicity: isToxic ? 'likely' : 'unlikely',
        phi: containsPHI ? 'possible' : 'unlikely',
        misinformation: 'unknown',
      },
      confidence: 0.5,
    };
  }
}


