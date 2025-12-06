import { Inject } from '@nestjs/common';
import { ConsulService } from './consul.service';

/**
 * Decorator to inject ConsulService
 */
export const InjectConsul = () => Inject(ConsulService);

/**
 * Decorator to mark a method as a health check endpoint
 */
export function HealthCheck(options?: { 
  path?: string; 
  description?: string;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // Store metadata for health check registration
    const metadata = {
      path: options?.path || '/health',
      description: options?.description || 'Health check endpoint',
      handler: propertyKey,
    };
    
    Reflect.defineMetadata('health-check', metadata, target.constructor);
    
    return descriptor;
  };
}

/**
 * Decorator to enable service discovery for a class
 */
export function EnableServiceDiscovery(serviceName?: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('service-discovery', {
      enabled: true,
      serviceName: serviceName || target.name.toLowerCase().replace('service', ''),
    }, target);
  };
}
