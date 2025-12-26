import { Controller, Get, Post, Put, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IncidentService } from '../services/incident.service';

@Controller('incidents')
@ApiTags('incidents')
export class IncidentController {
  constructor(private readonly service: IncidentService) {}

  @Post() @ApiOperation({ summary: 'Report incident' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get() @ApiOperation({ summary: 'List incidents' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get incident' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findById(id); }

  @Put(':id') @ApiOperation({ summary: 'Update incident' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/status') @ApiOperation({ summary: 'Update status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string) { return this.service.updateStatus(id, status); }

  @Patch(':id/assign') @ApiOperation({ summary: 'Assign investigator' })
  assign(@Param('id', ParseUUIDPipe) id: string, @Body('userId') userId: string) { return this.service.assign(id, userId); }

  @Post(':id/follow-up') @ApiOperation({ summary: 'Add follow-up' })
  addFollowUp(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.addFollowUp(id, dto); }

  @Get(':id/follow-ups') @ApiOperation({ summary: 'Get follow-ups' })
  getFollowUps(@Param('id', ParseUUIDPipe) id: string) { return this.service.getFollowUps(id); }

  @Patch(':id/close') @ApiOperation({ summary: 'Close incident' })
  close(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.close(id, dto); }
}


