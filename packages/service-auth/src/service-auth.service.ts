import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { ServiceTokenPayload, ServiceContext, ServiceAuthConfig } from './interfaces';

/**
 * Enterprise Service Authentication Service
 * 
 * Provides secure service-to-service JWT authentication with:
 * - Token generation and validation
 * - Token rotation support
 * - Audience validation
 * - Rate limiting awareness
 * - Token caching
 */
@Injectable()
export class ServiceAuthService {
  private readonly logger = new Logger(ServiceAuthService.name);
  private readonly tokenCache = new Map<string, { token: string; expiresAt: number }>();
  
  constructor(private readonly config: ServiceAuthConfig) {}
  
  /**
   * Generate a service token for inter-service communication
   */
  generateServiceToken(
    targetService: string,
    additionalClaims?: Record<string, any>
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.tokenExpirationSeconds || 300; // 5 minutes default
    
    const payload: ServiceTokenPayload = {
      iss: this.config.serviceName,
      sub: this.config.serviceName,
      aud: targetService,
      iat: now,
      exp: now + expiresIn,
      jti: crypto.randomUUID(),
      scope: this.config.defaultScopes || ['service:call'],
      ...additionalClaims,
    };
    
    const token = jwt.sign(payload, this.config.jwtSecret, {
      algorithm: 'HS256',
    });
    
    this.logger.debug(`Generated service token for ${targetService}`);
    
    return token;
  }
  
  /**
   * Generate a cached service token (reuses valid tokens)
   */
  getServiceToken(targetService: string): string {
    const cacheKey = `${this.config.serviceName}:${targetService}`;
    const cached = this.tokenCache.get(cacheKey);
    
    // Return cached token if still valid (with 30s buffer)
    if (cached && cached.expiresAt > Date.now() + 30000) {
      return cached.token;
    }
    
    // Generate new token
    const token = this.generateServiceToken(targetService);
    const expiresIn = this.config.tokenExpirationSeconds || 300;
    
    this.tokenCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + expiresIn * 1000,
    });
    
    return token;
  }
  
  /**
   * Validate an incoming service token
   */
  validateToken(token: string): ServiceContext {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ['HS256'],
        audience: this.config.serviceName,
      }) as ServiceTokenPayload;
      
      // Validate issuer is in allowed list
      if (this.config.allowedServices?.length) {
        if (!this.config.allowedServices.includes(decoded.iss)) {
          throw new UnauthorizedException(
            `Service ${decoded.iss} is not allowed to call ${this.config.serviceName}`
          );
        }
      }
      
      return {
        serviceName: decoded.iss,
        targetService: decoded.aud,
        scopes: decoded.scope || [],
        tokenId: decoded.jti,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
        claims: decoded,
      };
      
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Service token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid service token');
      }
      throw error;
    }
  }
  
  /**
   * Validate token and check required scopes
   */
  validateTokenWithScopes(token: string, requiredScopes: string[]): ServiceContext {
    const context = this.validateToken(token);
    
    const hasAllScopes = requiredScopes.every(
      scope => context.scopes.includes(scope) || context.scopes.includes('*')
    );
    
    if (!hasAllScopes) {
      throw new UnauthorizedException(
        `Service ${context.serviceName} does not have required scopes: ${requiredScopes.join(', ')}`
      );
    }
    
    return context;
  }
  
  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
      return null;
    }
    
    return token;
  }
  
  /**
   * Create Authorization header value
   */
  createAuthHeader(targetService: string): string {
    const token = this.getServiceToken(targetService);
    return `Bearer ${token}`;
  }
  
  /**
   * Clear token cache (useful for key rotation)
   */
  clearTokenCache(): void {
    this.tokenCache.clear();
    this.logger.log('Token cache cleared');
  }
  
  /**
   * Get service name
   */
  getServiceName(): string {
    return this.config.serviceName;
  }
}
