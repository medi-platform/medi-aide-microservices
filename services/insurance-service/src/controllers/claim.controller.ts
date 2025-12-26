import { Controller, Get, Post, Put, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClaimService } from '../services/claim.service';

@Controller('claims')
@ApiTags('claims')
export class ClaimController {
  constructor(private readonly service: ClaimService) {}

  @Get() @ApiOperation({ summary: 'List claims' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Post() @ApiOperation({ summary: 'Submit claim' })
  submit(@Body() dto: any) { return this.service.submit(dto); }

  @Get(':id') @ApiOperation({ summary: 'Get claim' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findById(id); }

  @Put(':id') @ApiOperation({ summary: 'Update claim' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/status') @ApiOperation({ summary: 'Update status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string) { return this.service.updateStatus(id, status); }

  @Post(':id/resubmit') @ApiOperation({ summary: 'Resubmit claim' })
  resubmit(@Param('id', ParseUUIDPipe) id: string) { return this.service.resubmit(id); }

  @Get(':id/status') @ApiOperation({ summary: 'Check claim status' })
  checkStatus(@Param('id', ParseUUIDPipe) id: string) { return this.service.checkStatus(id); }

  @Get('batch') @ApiOperation({ summary: 'List batch submissions' })
  getBatches(@Query() query: any) { return this.service.getBatches(query); }

  @Post('batch') @ApiOperation({ summary: 'Submit batch' })
  submitBatch(@Body() dto: any) { return this.service.submitBatch(dto); }
}

