/**
 * Tenant Middleware
 * Resolves and sets tenant context for each request
 */

import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { TenantContextService, runWithTenant, TenantContext } from './tenant.context';

export interface TenantRequest extends Request {
  tenant?: TenantContext;
  tenantId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private tenantService: TenantService,
    private tenantContextService: TenantContextService,
  ) {}

  async use(req: TenantRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = this.extractTenantId(req);

      if (!tenantId) {
        // Allow some paths without tenant context
        if (this.isPublicPath(req.path)) {
          return next();
        }
        throw new NotFoundException('Tenant not specified');
      }

      const context = await this.tenantService.getTenantContext(tenantId);

      if (!context) {
        throw new NotFoundException('Tenant not found');
      }

      // Check tenant status
      if (context.settings && this.isTenantSuspended(context)) {
        throw new NotFoundException('Tenant is suspended');
      }

      // Set context
      req.tenant = context;
      req.tenantId = context.tenantId;
      this.tenantContextService.setContext(context);

      // Run the rest of the request in tenant context
      runWithTenant(context, () => {
        next();
      });
    } catch (error) {
      next(error);
    }
  }

  private extractTenantId(req: Request): string | undefined {
    // Priority 1: X-Tenant-ID header
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) return headerTenantId;

    // Priority 2: Subdomain (e.g., acme.medi-aide.com)
    const host = req.headers.host || '';
    const subdomain = this.extractSubdomain(host);
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }

    // Priority 3: Query parameter
    const queryTenantId = req.query.tenantId as string;
    if (queryTenantId) return queryTenantId;

    // Priority 4: JWT token claim (if available)
    const user = (req as any).user;
    if (user?.tenantId) return user.tenantId;

    return undefined;
  }

  private extractSubdomain(host: string): string | undefined {
    const parts = host.split('.');
    if (parts.length >= 3) {
      // Remove port if present
      return parts[0].split(':')[0];
    }
    return undefined;
  }

  private isPublicPath(path: string): boolean {
    const publicPaths = [
      '/health',
      '/metrics',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/tenants/check-availability',
      '/docs',
      '/swagger',
    ];
    return publicPaths.some((p) => path.startsWith(p));
  }

  private isTenantSuspended(context: TenantContext): boolean {
    // Check if tenant has a suspended status in settings
    return (context as any).status === 'suspended';
  }
}

/**
 * Custom domain tenant resolver middleware
 */
@Injectable()
export class CustomDomainMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const host = req.headers.host || '';
    
    // Check if it's a custom domain (not *.medi-aide.com)
    if (!host.includes('medi-aide.com') && !host.includes('localhost')) {
      const tenant = await this.tenantService.getTenantByDomain(host);
      if (tenant) {
        req.headers['x-tenant-id'] = tenant.tenantId;
      }
    }

    next();
  }
}
