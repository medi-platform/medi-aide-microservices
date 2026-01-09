import { SetMetadata, createParamDecorator, ExecutionContext, applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole, Permission, JwtPayload } from './interfaces';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, PHIAccessGuard, AgencyScopeGuard } from './guards';

/**
 * Set required roles for a route
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

/**
 * Set required permissions for a route
 */
export const Permissions = (...permissions: Permission[]) => SetMetadata('permissions', permissions);

/**
 * Mark route as requiring PHI access
 */
export const RequiresPHI = () => SetMetadata('requiresPHI', true);

/**
 * Mark route as public (no auth required)
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Get current user from request
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);

/**
 * Get current user ID
 */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub;
  },
);

/**
 * Get current user's agency ID
 */
export const AgencyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.agencyId;
  },
);

/**
 * Get IP address from request
 */
export const IpAddress = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.ip
    );
  },
);

/**
 * Get user agent from request
 */
export const UserAgent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'];
  },
);

/**
 * Get request ID
 */
export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-request-id'] || request.id;
  },
);

/**
 * Combined decorator for authenticated routes with roles
 */
export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...roles),
  );
}

/**
 * Combined decorator for admin-only routes
 */
export function AdminOnly() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  );
}

/**
 * Combined decorator for agency-scoped routes
 */
export function AgencyScoped() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, AgencyScopeGuard),
  );
}

/**
 * Combined decorator for PHI access routes
 */
export function PHIAccess() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, PHIAccessGuard),
    RequiresPHI(),
  );
}

/**
 * Combined decorator for routes requiring specific permissions
 */
export function RequirePermissions(...permissions: Permission[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, PermissionsGuard),
    Permissions(...permissions),
  );
}

/**
 * Audit log decorator - marks method for audit logging
 */
export function AuditLog(eventType: string) {
  return SetMetadata('auditLog', { eventType });
}

/**
 * Rate limit decorator
 */
export function RateLimit(limit: number, windowSeconds: number = 60) {
  return SetMetadata('rateLimit', { limit, windowSeconds });
}

/**
 * Mark sensitive data fields
 */
export function SensitiveField() {
  return (target: any, propertyKey: string) => {
    const sensitiveFields = Reflect.getMetadata('sensitiveFields', target) || [];
    Reflect.defineMetadata('sensitiveFields', [...sensitiveFields, propertyKey], target);
  };
}
