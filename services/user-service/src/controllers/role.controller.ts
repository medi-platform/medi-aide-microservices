import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('roles')
@ApiTags('roles')
export class RoleController {
  @Get() @ApiOperation({ summary: 'List roles' })
  findAll(@Query() query: any) { return { items: [], total: 0 }; }

  @Post() @ApiOperation({ summary: 'Create role' })
  create(@Body() dto: any) { return { id: 'role-id', ...dto }; }

  @Get(':id') @ApiOperation({ summary: 'Get role' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return { id }; }

  @Put(':id') @ApiOperation({ summary: 'Update role' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return { id, ...dto }; }

  @Delete(':id') @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return { deleted: true }; }

  @Get(':id/permissions') @ApiOperation({ summary: 'Get role permissions' })
  getPermissions(@Param('id', ParseUUIDPipe) id: string) { return { roleId: id, permissions: [] }; }

  @Put(':id/permissions') @ApiOperation({ summary: 'Update role permissions' })
  updatePermissions(@Param('id', ParseUUIDPipe) id: string, @Body('permissions') permissions: string[]) { return { roleId: id, permissions }; }
}

