/**
 * Service-to-Service Authentication Interfaces
 */

export interface ServiceIdentity {
  serviceId: string;
  serviceName: string;
  version: string;
  permissions: string[];
  issuedAt: number;
  expiresAt: number;
}

export interface ServiceAuthConfig {
  /** Secret key for signing service tokens */
  jwtSecret: string;
  
  /** Token expiration time in seconds (default: 3600) */
  tokenTtlSeconds?: number;
  
  /** This service's identity */
  serviceId: string;
  serviceName: string;
  serviceVersion?: string;
  
  /** Permissions this service has */
  permissions?: string[];
  
  /** Services this service is allowed to call */
  allowedServices?: string[];
  
  /** Enable strict mode - reject unknown services */
  strictMode?: boolean;
}

export interface ServiceToken {
  token: string;
  expiresAt: Date;
  serviceIdentity: ServiceIdentity;
}

export interface ServiceCallContext {
  /** The calling service's identity */
  caller: ServiceIdentity;
  
  /** Request ID for tracing */
  requestId: string;
  
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  
  /** Timestamp of the call */
  timestamp: Date;
}

export const SERVICE_AUTH_OPTIONS = 'SERVICE_AUTH_OPTIONS';
export const SERVICE_CALL_CONTEXT = 'SERVICE_CALL_CONTEXT';

