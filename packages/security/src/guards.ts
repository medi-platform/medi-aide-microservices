import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, Permission, UserRole } from './interfaces';

/**
 * JWT Authentication Guard
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Attach user to request
      request.user = payload;
      request.userId = payload.sub;
      request.userRole = payload.role;
      request.agencyId = payload.agencyId;

      return true;
    } catch (error: any) {
      this.logger.warn(`Invalid token: ${error.message}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}

/**
 * Role-based access guard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied');
    }

    // Super admin has access to everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Required role: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}

/**
 * Permission-based access guard
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const userPermissions = user.permissions || [];
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

/**
 * Agency-scoped access guard
 * Ensures users can only access resources within their agency
 */
@Injectable()
export class AgencyScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admin can access all agencies
    if (user?.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if requested agency matches user's agency
    const requestedAgencyId = 
      request.params?.agencyId || 
      request.query?.agencyId || 
      request.body?.agencyId;

    if (requestedAgencyId && requestedAgencyId !== user?.agencyId) {
      throw new ForbiddenException('Access denied to this agency');
    }

    return true;
  }
}

/**
 * PHI Access Guard
 * Ensures proper authorization for accessing Protected Health Information
 */
@Injectable()
export class PHIAccessGuard implements CanActivate {
  private readonly logger = new Logger(PHIAccessGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPHI = this.reflector.get<boolean>('requiresPHI', context.getHandler());

    if (!requiresPHI) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required for PHI access');
    }

    // Check if user has PHI access permission
    const permissions = user.permissions || [];
    const hasPHIPermission = permissions.includes(Permission.PATIENT_PHI_ACCESS);

    if (!hasPHIPermission && user.role !== UserRole.SUPER_ADMIN) {
      this.logger.warn(`PHI access denied for user ${user.sub}`);
      throw new ForbiddenException('PHI access not authorized');
    }

    // Log PHI access for HIPAA compliance
    this.logPHIAccess(request, user);

    return true;
  }

  private logPHIAccess(request: any, user: JwtPayload): void {
    const patientId = request.params?.patientId || request.body?.patientId;
    const accessReason = request.headers['x-access-reason'] || 'treatment';

    // This should be sent to audit service
    this.logger.log(
      `PHI Access: User ${user.sub} accessed patient ${patientId} for ${accessReason}`,
    );
  }
}

/**
 * Service-to-service authentication guard
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(ServiceAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-service-token'];

    if (!token) {
      throw new UnauthorizedException('Service authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('SERVICE_JWT_SECRET'),
      });

      request.service = payload;
      return true;
    } catch (error: any) {
      this.logger.warn(`Invalid service token: ${error.message}`);
      throw new UnauthorizedException('Invalid service token');
    }
  }
}

/**
 * Combined guard: Auth + Roles + Permissions
 */
@Injectable()
export class FullAuthGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly rolesGuard: RolesGuard,
    private readonly permissionsGuard: PermissionsGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, verify JWT
    const isAuthenticated = await this.jwtGuard.canActivate(context);
    if (!isAuthenticated) return false;

    // Then check roles
    const hasRole = this.rolesGuard.canActivate(context);
    if (!hasRole) return false;

    // Finally check permissions
    return this.permissionsGuard.canActivate(context);
  }
}
