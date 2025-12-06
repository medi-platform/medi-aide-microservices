import { Body, Controller, Post } from '@nestjs/common';

@Controller('mentorship')
export class MentorshipController {
  @Post('match')
  match(@Body() body: any) {
    const mentorId = Math.random().toString(36).slice(2);
    return { mentorId, menteeId: body?.menteeId || null, score: 0.8 };
  }
}


