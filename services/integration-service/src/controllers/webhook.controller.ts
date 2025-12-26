import { Controller, Get, Post, Body, Param, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';

@Controller('webhooks')
@ApiTags('webhooks')
export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  @Post(':provider') @ApiOperation({ summary: 'Receive webhook' })
  receive(@Param('provider') provider: string, @Body() payload: any, @Headers() headers: any) { return this.service.receive(provider, payload, headers); }

  @Get('events') @ApiOperation({ summary: 'Get webhook events' })
  getEvents(@Query() query: any) { return this.service.getEvents(query); }

  @Post(':provider/verify') @ApiOperation({ summary: 'Verify webhook' })
  verify(@Param('provider') provider: string, @Body() dto: any) { return this.service.verify(provider, dto); }
}

