/**
 * Service Authentication Configuration
 */
export interface ServiceAuthConfig {
  /** This service's name */
  serviceName: string;
  
  /** JWT secret for signing/verifying tokens */
  jwtSecret: string;
  
  /** Token expiration in seconds (default: 300) */
  tokenExpirationSeconds?: number;
  
  /** List of services allowed to call this service (empty = allow all) */
  allowedServices?: string[];
  
  /** Default scopes for generated tokens */
  defaultScopes?: string[];
  
  /** Enable strict audience validation */
  strictAudience?: boolean;
}

/**
 * JWT Payload for service tokens
 */
export interface ServiceTokenPayload {
  /** Issuer - the calling service */
  iss: string;
  
  /** Subject - the calling service */
  sub: string;
  
  /** Audience - the target service */
  aud: string;
  
  /** Issued at timestamp */
  iat: number;
  
  /** Expiration timestamp */
  exp: number;
  
  /** JWT ID for tracking */
  jti: string;
  
  /** Granted scopes */
  scope: string[];
  
  /** Additional claims */
  [key: string]: any;
}

/**
 * Service Context extracted from token
 */
export interface ServiceContext {
  /** Name of the calling service */
  serviceName: string;
  
  /** Name of the target service */
  targetService: string;
  
  /** Granted scopes */
  scopes: string[];
  
  /** Unique token ID */
  tokenId: string;
  
  /** When token was issued */
  issuedAt: Date;
  
  /** When token expires */
  expiresAt: Date;
  
  /** Full token claims */
  claims: ServiceTokenPayload;
}

/**
 * Service call options
 */
export interface ServiceCallOptions {
  /** Target service name */
  service: string;
  
  /** Required scopes for this call */
  requiredScopes?: string[];
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Number of retries */
  retries?: number;
}
