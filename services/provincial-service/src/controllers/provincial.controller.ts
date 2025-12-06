import { Body, Controller, Post } from '@nestjs/common';

@Controller('provincial')
export class ProvincialController {
  @Post('settings')
  setRegionSettings(@Body() body: any) {
    const region = body?.region || 'ON';
    return { region, saved: true, timestamp: new Date().toISOString() };
  }
}


