import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CareRequestService } from '../services/care-request.service';

@Controller('care-requests')
@ApiTags('care-requests')
export class CareRequestController {
  constructor(private readonly service: CareRequestService) {}

  @Post() @ApiOperation({ summary: 'Create care request' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get() @ApiOperation({ summary: 'List care requests' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get care request' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findById(id); }

  @Put(':id') @ApiOperation({ summary: 'Update care request' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/status') @ApiOperation({ summary: 'Update status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string) { return this.service.updateStatus(id, status); }

  @Patch(':id/assign') @ApiOperation({ summary: 'Assign caregiver' })
  assignCaregiver(@Param('id', ParseUUIDPipe) id: string, @Body('caregiverId') caregiverId: string) { return this.service.assignCaregiver(id, caregiverId); }

  @Delete(':id') @ApiOperation({ summary: 'Cancel care request' })
  cancel(@Param('id', ParseUUIDPipe) id: string) { return this.service.cancel(id); }

  @Get(':id/history') @ApiOperation({ summary: 'Get request history' })
  getHistory(@Param('id', ParseUUIDPipe) id: string) { return this.service.getHistory(id); }
}


