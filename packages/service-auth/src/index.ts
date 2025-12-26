/**
 * @medi-aide/service-auth
 * 
 * Enterprise-grade service-to-service JWT authentication.
 * 
 * Features:
 * - Secure JWT token generation and validation
 * - Scope-based authorization
 * - Service allowlist support
 * - Token caching for performance
 * - NestJS guard integration
 * - Decorators for easy configuration
 */

export * from './service-auth.module';
export * from './service-auth.service';
export * from './service-auth.guard';
export * from './interfaces';
export * from './decorators';
export * from './http-client';
