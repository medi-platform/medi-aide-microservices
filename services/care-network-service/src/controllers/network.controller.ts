import { Body, Controller, Post } from '@nestjs/common';

@Controller('care-network')
export class NetworkController {
  @Post('groups')
  createGroup(@Body() body: any) {
    const id = Math.random().toString(36).slice(2);
    return { id, name: body?.name || 'Untitled Group', createdAt: new Date().toISOString() };
  }
}


