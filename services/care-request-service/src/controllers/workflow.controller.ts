import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowService } from '../services/workflow.service';

@Controller('care-requests/:requestId/workflow')
@ApiTags('workflow')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Get('status') @ApiOperation({ summary: 'Get workflow status' })
  getStatus(@Param('requestId', ParseUUIDPipe) requestId: string) { return this.service.getStatus(requestId); }

  @Post('advance') @ApiOperation({ summary: 'Advance workflow' })
  advance(@Param('requestId', ParseUUIDPipe) requestId: string) { return this.service.advance(requestId); }

  @Post('approve') @ApiOperation({ summary: 'Approve step' })
  approve(@Param('requestId', ParseUUIDPipe) requestId: string, @Body() dto: any) { return this.service.approve(requestId, dto); }

  @Post('reject') @ApiOperation({ summary: 'Reject step' })
  reject(@Param('requestId', ParseUUIDPipe) requestId: string, @Body('reason') reason: string) { return this.service.reject(requestId, reason); }
}


