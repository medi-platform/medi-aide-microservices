import { Injectable, Inject, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { 
  ServiceAuthConfig, 
  ServiceIdentity, 
  ServiceToken, 
  SERVICE_AUTH_OPTIONS 
} from './interfaces';

/**
 * ServiceAuthService
 * 
 * Handles service-to-service JWT token generation and validation.
 * Implements zero-trust authentication between microservices.
 */
@Injectable()
export class ServiceAuthService {
  private readonly logger = new Logger(ServiceAuthService.name);
  private readonly tokenCache = new Map<string, ServiceToken>();

  constructor(
    @Inject(SERVICE_AUTH_OPTIONS)
    private readonly config: ServiceAuthConfig,
  ) {
    this.logger.log(`Service auth initialized for: ${config.serviceName}`);
  }

  /**
   * Generate a service token for calling another service
   */
  generateServiceToken(): ServiceToken {
    const now = Math.floor(Date.now() / 1000);
    const ttl = this.config.tokenTtlSeconds || 3600;
    const expiresAt = now + ttl;

    const identity: ServiceIdentity = {
      serviceId: this.config.serviceId,
      serviceName: this.config.serviceName,
      version: this.config.serviceVersion || '1.0.0',
      permissions: this.config.permissions || [],
      issuedAt: now,
      expiresAt,
    };

    const token = jwt.sign(identity, this.config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: ttl,
    });

    return {
      token,
      expiresAt: new Date(expiresAt * 1000),
      serviceIdentity: identity,
    };
  }

  /**
   * Get a cached token or generate a new one
   */
  getServiceToken(): string {
    const cacheKey = 'service-token';
    const cached = this.tokenCache.get(cacheKey);

    // Return cached token if still valid (with 60s buffer)
    if (cached && cached.expiresAt.getTime() > Date.now() + 60000) {
      return cached.token;
    }

    // Generate new token
    const newToken = this.generateServiceToken();
    this.tokenCache.set(cacheKey, newToken);
    return newToken.token;
  }

  /**
   * Validate an incoming service token
   */
  validateServiceToken(token: string): ServiceIdentity | null {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ['HS256'],
      }) as ServiceIdentity;

      // Check if service is allowed (if strict mode)
      if (this.config.strictMode && this.config.allowedServices) {
        if (!this.config.allowedServices.includes(decoded.serviceName)) {
          this.logger.warn(`Rejected call from unauthorized service: ${decoded.serviceName}`);
          return null;
        }
      }

      return decoded;
    } catch (error) {
      this.logger.warn(`Invalid service token: ${error}`);
      return null;
    }
  }

  /**
   * Create headers for service-to-service calls
   */
  createServiceHeaders(correlationId?: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.getServiceToken()}`,
      'X-Service-Name': this.config.serviceName,
      'X-Service-Version': this.config.serviceVersion || '1.0.0',
      'X-Correlation-ID': correlationId || this.generateCorrelationId(),
      'X-Request-ID': this.generateRequestId(),
    };
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a correlation ID for distributed tracing
   */
  private generateCorrelationId(): string {
    return `cor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

