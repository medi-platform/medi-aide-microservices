import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    // Accept either header or env-bypassed superuser for dev
    const role = (req.headers['x-admin-role'] as string) || '';
    const isDevBypass = process.env.ALLOW_DEV_ADMIN === 'true';
    return isDevBypass || role === 'admin' || role === 'superadmin';
  }
}


