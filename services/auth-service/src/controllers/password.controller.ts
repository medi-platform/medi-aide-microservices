import { Controller, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('password')
@ApiTags('password')
export class PasswordController {
  @Post('forgot') @ApiOperation({ summary: 'Request password reset' })
  forgot(@Body('email') email: string) { return { message: 'Reset email sent if account exists' }; }

  @Post('reset') @ApiOperation({ summary: 'Reset password with token' })
  reset(@Body() dto: { token: string; password: string }) { return { message: 'Password reset successfully' }; }

  @Patch('change') @ApiOperation({ summary: 'Change password' })
  change(@Body() dto: { currentPassword: string; newPassword: string }) { return { message: 'Password changed' }; }

  @Post('validate-token') @ApiOperation({ summary: 'Validate reset token' })
  validateToken(@Body('token') token: string) { return { valid: true }; }
}


