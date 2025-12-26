import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ServiceContext } from './interfaces';

/**
 * Extract service context from request
 * 
 * @example
 * ```typescript
 * @Get('data')
 * getData(@CallingService() context: ServiceContext) {
 *   console.log(`Called by: ${context.serviceName}`);
 * }
 * ```
 */
export const CallingService = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ServiceContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.serviceContext;
  },
);

/**
 * Extract calling service name
 */
export const ServiceName = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.callingService;
  },
);
