import { Injectable, Logger } from '@nestjs/common';
import { ServiceAuthService } from './service-auth.service';

/**
 * Authenticated HTTP Client
 * 
 * Wraps fetch/axios with automatic service token injection.
 */
@Injectable()
export class AuthenticatedHttpClient {
  private readonly logger = new Logger(AuthenticatedHttpClient.name);
  
  constructor(private readonly authService: ServiceAuthService) {}
  
  /**
   * Make an authenticated GET request
   */
  async get<T>(
    targetService: string,
    url: string,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(targetService, url, {
      ...options,
      method: 'GET',
    });
  }
  
  /**
   * Make an authenticated POST request
   */
  async post<T>(
    targetService: string,
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(targetService, url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  
  /**
   * Make an authenticated PUT request
   */
  async put<T>(
    targetService: string,
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(targetService, url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  
  /**
   * Make an authenticated PATCH request
   */
  async patch<T>(
    targetService: string,
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(targetService, url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  
  /**
   * Make an authenticated DELETE request
   */
  async delete<T>(
    targetService: string,
    url: string,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(targetService, url, {
      ...options,
      method: 'DELETE',
    });
  }
  
  /**
   * Make a generic authenticated request
   */
  private async request<T>(
    targetService: string,
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const authHeader = this.authService.createAuthHeader(targetService);
    
    const headers = new Headers(options.headers);
    headers.set('Authorization', authHeader);
    headers.set('Content-Type', 'application/json');
    headers.set('X-Calling-Service', this.authService.getServiceName());
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      const duration = Date.now() - startTime;
      this.logger.debug(
        `${options.method} ${url} -> ${response.status} (${duration}ms)`
      );
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Service call failed: ${response.status} ${error}`);
      }
      
      return response.json();
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `${options.method} ${url} -> ERROR (${duration}ms)`,
        error
      );
      throw error;
    }
  }
}

