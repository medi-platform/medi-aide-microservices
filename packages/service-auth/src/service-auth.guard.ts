import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ServiceAuthService } from './service-auth.service';
import { ServiceCallContext, SERVICE_CALL_CONTEXT } from './interfaces';
import { REQUIRED_PERMISSIONS_KEY, IS_PUBLIC_KEY } from './decorators';

/**
 * ServiceAuthGuard
 * 
 * Guards routes that require service-to-service authentication.
 * Validates incoming service tokens and sets the call context.
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(ServiceAuthGuard.name);

  constructor(
    private readonly authService: ServiceAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing service authentication token');
    }

    const token = authHeader.substring(7);
    const serviceIdentity = this.authService.validateServiceToken(token);

    if (!serviceIdentity) {
      throw new UnauthorizedException('Invalid service authentication token');
    }

    // Check required permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((perm) =>
        serviceIdentity.permissions.includes(perm),
      );

      if (!hasAllPermissions) {
        this.logger.warn(
          `Service ${serviceIdentity.serviceName} lacks required permissions: ${requiredPermissions.join(', ')}`,
        );
        throw new UnauthorizedException('Insufficient service permissions');
      }
    }

    // Set the service call context
    const callContext: ServiceCallContext = {
      caller: serviceIdentity,
      requestId: request.headers['x-request-id'] || this.generateRequestId(),
      correlationId: request.headers['x-correlation-id'],
      timestamp: new Date(),
    };

    request[SERVICE_CALL_CONTEXT] = callContext;

    this.logger.debug(
      `Authenticated call from ${serviceIdentity.serviceName} (${serviceIdentity.serviceId})`,
    );

    return true;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

