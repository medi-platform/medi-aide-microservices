import { Controller, Get, Post, Delete, Body, Param, Req, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('sessions')
@ApiTags('sessions')
export class SessionController {
  @Get() @ApiOperation({ summary: 'List active sessions' })
  findAll(@Req() req: any) { return { userId: req.user?.id, sessions: [] }; }

  @Post('refresh') @ApiOperation({ summary: 'Refresh token' })
  refresh(@Body('refreshToken') token: string) { return { accessToken: 'new-token', refreshToken: 'new-refresh' }; }

  @Delete(':id') @ApiOperation({ summary: 'Revoke session' })
  revoke(@Param('id', ParseUUIDPipe) id: string) { return { revoked: true }; }

  @Delete() @ApiOperation({ summary: 'Revoke all sessions' })
  revokeAll(@Req() req: any) { return { revokedCount: 0 }; }
}

