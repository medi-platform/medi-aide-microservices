import { 
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StaffService } from '../services/staff.service';

@Controller('agencies/:agencyId/staff')
@ApiTags('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Add staff member to agency' })
  async create(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.staffService.create(agencyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List agency staff' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query() query: any
  ) {
    return this.staffService.findAll(agencyId, query);
  }

  @Get(':staffId')
  @ApiOperation({ summary: 'Get staff member details' })
  async findOne(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string
  ) {
    return this.staffService.findById(agencyId, staffId);
  }

  @Put(':staffId')
  @ApiOperation({ summary: 'Update staff member' })
  async update(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: any
  ) {
    return this.staffService.update(agencyId, staffId, dto);
  }

  @Patch(':staffId/role')
  @ApiOperation({ summary: 'Change staff role' })
  async changeRole(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body('role') role: string
  ) {
    return this.staffService.changeRole(agencyId, staffId, role);
  }

  @Patch(':staffId/permissions')
  @ApiOperation({ summary: 'Update staff permissions' })
  async updatePermissions(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body('permissions') permissions: string[]
  ) {
    return this.staffService.updatePermissions(agencyId, staffId, permissions);
  }

  @Delete(':staffId')
  @ApiOperation({ summary: 'Remove staff member' })
  async remove(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string
  ) {
    return this.staffService.remove(agencyId, staffId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite staff member' })
  async invite(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: { email: string; role: string; permissions?: string[] }
  ) {
    return this.staffService.invite(agencyId, dto);
  }
}

