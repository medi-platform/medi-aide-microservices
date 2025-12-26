import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ServiceAuthService } from './service-auth.service';
import { ServiceContext } from './interfaces';

/**
 * Metadata key for required scopes
 */
export const REQUIRED_SCOPES_KEY = 'requiredScopes';
export const ALLOW_SERVICES_KEY = 'allowServices';
export const PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark endpoint as public (no auth required)
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/**
 * Decorator to require specific scopes
 */
export const RequireScopes = (...scopes: string[]) =>
  SetMetadata(REQUIRED_SCOPES_KEY, scopes);

/**
 * Decorator to allow only specific services
 */
export const AllowServices = (...services: string[]) =>
  SetMetadata(ALLOW_SERVICES_KEY, services);

/**
 * Service Authentication Guard
 * 
 * Validates service-to-service JWT tokens on incoming requests.
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(
    private readonly authService: ServiceAuthService,
    private readonly reflector: Reflector,
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    
    // Extract token from header
    const authHeader = request.headers['authorization'];
    const token = this.authService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      throw new UnauthorizedException('No service token provided');
    }
    
    // Get required scopes from decorator
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    ) || [];
    
    // Validate token
    let serviceContext: ServiceContext;
    
    if (requiredScopes.length > 0) {
      serviceContext = this.authService.validateTokenWithScopes(token, requiredScopes);
    } else {
      serviceContext = this.authService.validateToken(token);
    }
    
    // Check allowed services
    const allowedServices = this.reflector.getAllAndOverride<string[]>(
      ALLOW_SERVICES_KEY,
      [context.getHandler(), context.getClass()],
    );
    
    if (allowedServices?.length) {
      if (!allowedServices.includes(serviceContext.serviceName)) {
        throw new UnauthorizedException(
          `Service ${serviceContext.serviceName} is not allowed to access this endpoint`
        );
      }
    }
    
    // Attach service context to request
    request.serviceContext = serviceContext;
    request.callingService = serviceContext.serviceName;
    
    return true;
  }
}
