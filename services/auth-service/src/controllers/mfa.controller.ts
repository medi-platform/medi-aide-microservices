import { Controller, Get, Post, Delete, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('mfa')
@ApiTags('mfa')
export class MfaController {
  @Get('status') @ApiOperation({ summary: 'Get MFA status' })
  getStatus(@Req() req: any) { return { enabled: false, methods: [] }; }

  @Post('setup/totp') @ApiOperation({ summary: 'Setup TOTP' })
  setupTotp(@Req() req: any) { return { secret: 'XXXX', qrCode: 'data:image/png;base64,...', backupCodes: [] }; }

  @Post('verify/totp') @ApiOperation({ summary: 'Verify TOTP setup' })
  verifyTotp(@Body('code') code: string) { return { verified: true }; }

  @Post('setup/sms') @ApiOperation({ summary: 'Setup SMS MFA' })
  setupSms(@Body('phone') phone: string) { return { sent: true }; }

  @Delete('disable') @ApiOperation({ summary: 'Disable MFA' })
  disable(@Body('password') password: string) { return { disabled: true }; }
}


