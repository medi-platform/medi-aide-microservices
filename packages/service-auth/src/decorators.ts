import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ServiceCallContext, SERVICE_CALL_CONTEXT } from './interfaces';

/**
 * Metadata keys
 */
export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @RequirePermissions decorator
 * 
 * Specifies which permissions the calling service must have.
 * 
 * @example
 * @RequirePermissions('patients:read', 'patients:write')
 * @Get('patients')
 * getPatients() {}
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/**
 * @Public decorator
 * 
 * Marks a route as public (no service auth required).
 * Use for health checks and other public endpoints.
 * 
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * @ServiceCaller decorator
 * 
 * Injects the calling service's context into a controller method.
 * 
 * @example
 * @Get('data')
 * getData(@ServiceCaller() caller: ServiceCallContext) {
 *   console.log(`Called by: ${caller.caller.serviceName}`);
 * }
 */
export const ServiceCaller = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ServiceCallContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request[SERVICE_CALL_CONTEXT];
  },
);

/**
 * @CallerServiceName decorator
 * 
 * Injects just the calling service's name.
 * 
 * @example
 * @Get('data')
 * getData(@CallerServiceName() serviceName: string) {
 *   console.log(`Called by: ${serviceName}`);
 * }
 */
export const CallerServiceName = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const context = request[SERVICE_CALL_CONTEXT] as ServiceCallContext | undefined;
    return context?.caller?.serviceName;
  },
);

/**
 * @CorrelationId decorator
 * 
 * Injects the correlation ID for distributed tracing.
 * 
 * @example
 * @Get('data')
 * getData(@CorrelationId() correlationId: string) {
 *   // Pass to downstream calls
 * }
 */
export const CorrelationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-correlation-id'] || 
           (request[SERVICE_CALL_CONTEXT] as ServiceCallContext)?.correlationId;
  },
);

