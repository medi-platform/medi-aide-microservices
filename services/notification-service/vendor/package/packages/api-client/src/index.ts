import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiClientConfig, RateLimitPolicy, CircuitBreakerPolicy, DedupePolicy, RetryStrategy } from './types';
import { TokenBucket } from './tokenBucket';
import { CircuitBreaker } from './circuitBreaker';

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function withJitter(base: number) {
  const rand = Math.random();
  return base + rand * base;
}

export class ApiClient {
  private axios: AxiosInstance;
  private bucket?: TokenBucket;
  private breaker?: CircuitBreaker;
  private pendingMap: Map<string, Promise<AxiosResponse>> = new Map();
  private cache: Map<string, { expires: number; value: AxiosResponse } > = new Map();
  private dedupe?: DedupePolicy;
  private retry?: RetryStrategy;
  private getTraceHeaders?: () => Record<string,string> | undefined;
  private getCorrelationId?: () => string | undefined;
  private simulation?: ApiClientConfig['simulation'];

  constructor(private cfg: ApiClientConfig) {
    this.axios = axios.create({ baseURL: cfg.baseURL, headers: cfg.defaultHeaders });

    if (cfg.rateLimit) this.setupRateLimit(cfg.rateLimit);
    if (cfg.circuitBreaker) this.setupCircuitBreaker(cfg.circuitBreaker);

    this.dedupe = cfg.dedupe;
    this.retry = cfg.retry;
    this.simulation = cfg.simulation;
    this.getTraceHeaders = cfg.getTraceHeaders;
    this.getCorrelationId = cfg.getCorrelationId;

    this.axios.interceptors.request.use((request) => {
      // Inject correlation/trace headers
      request.headers = request.headers || {};
      const trace = this.getTraceHeaders?.();
      if (trace) Object.assign(request.headers, trace);
      const corr = this.getCorrelationId?.();
      if (corr) request.headers['x-request-id'] = corr;
      return request;
    });
  }

  private setupRateLimit(policy: RateLimitPolicy) {
    const capacity = policy.burst ?? policy.requestsPerInterval;
    this.bucket = new TokenBucket(capacity, policy.requestsPerInterval, policy.intervalMs);
  }

  private setupCircuitBreaker(policy: CircuitBreakerPolicy) {
    this.breaker = new CircuitBreaker(policy.failureThreshold, policy.successThreshold, policy.timeoutMs);
  }

  private getDedupeKey(config: AxiosRequestConfig) {
    if (!this.dedupe?.enabled) return undefined;
    const fn = this.dedupe.keyFn || ((m,u,b) => `${m}:${u}:${JSON.stringify(b||{})}`);
    return fn((config.method||'GET').toUpperCase(), new URL(config.url!, config.baseURL).toString(), config.data);
  }

  private getCacheKey(config: AxiosRequestConfig) {
    if ((config.method||'GET').toUpperCase() !== 'GET') return undefined;
    return new URL(config.url!, config.baseURL).toString();
  }

  private async applySimulation() {
    if (!this.simulation?.enabled) return;
    const min = this.simulation.minLatencyMs ?? 0;
    const max = this.simulation.maxLatencyMs ?? 0;
    if (min || max) {
      const delay = min + Math.random() * (Math.max(max - min, 0));
      await sleep(delay);
    }
    if (this.simulation.errorRate && Math.random() < this.simulation.errorRate) {
      const err = new Error('Simulated network error');
      (err as any).isSimulated = true;
      throw err;
    }
  }

  private async execute<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Client-side GET cache (simple TTL)
    const cacheKey = this.getCacheKey(config);
    if (cacheKey && (config as any).ttlMs) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.value as AxiosResponse<T>;
      }
    }

    // Rate limit
    if (this.bucket && !this.bucket.tryRemoveTokens(1)) {
      throw new Error('Rate limit exceeded');
    }

    // Circuit breaker
    if (this.breaker && !this.breaker.canRequest()) {
      throw new Error('Circuit breaker open');
    }

    // Dedupe
    const key = this.getDedupeKey(config);
    if (key && this.pendingMap.has(key)) {
      return this.pendingMap.get(key)! as Promise<AxiosResponse<T>>;
    }

    const doRequest = async () => {
      await this.applySimulation();
      return this.axios.request<T>(config);
    };

    const requestPromise = this.performWithRetry<T>(doRequest);

    if (key) {
      this.pendingMap.set(key, requestPromise);
    }

    try {
      const response = await requestPromise;
      this.breaker?.recordSuccess();
      if (cacheKey && (config as any).ttlMs) {
        const ttl = Number((config as any).ttlMs) || 0;
        if (ttl > 0) {
          this.cache.set(cacheKey, { expires: Date.now() + ttl, value: response });
        }
      }
      return response;
    } catch (err) {
      this.breaker?.recordFailure();
      throw err;
    } finally {
      if (key) this.pendingMap.delete(key);
    }
  }

  private async performWithRetry<T>(fn: () => Promise<AxiosResponse<T>>): Promise<AxiosResponse<T>> {
    const retry = this.retry || { maxRetries: 0 };
    let attempt = 0;
    let lastError: any;

    while (attempt <= retry.maxRetries) {
      try {
        const res = await fn();
        return res;
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        const shouldRetry = retry.retryOn
          ? retry.retryOn(status, error)
          : status >= 500 || status === 429 || !status; // network errors or server/429

        if (!shouldRetry || attempt === retry.maxRetries) break;

        const base = retry.baseDelayMs ?? 200;
        const delay = Math.min((2 ** attempt) * base, retry.maxDelayMs ?? 5000);
        await sleep(retry.jitter ? withJitter(delay) : delay);
        attempt++;
      }
    }

    throw lastError;
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.execute<T>({ ...config, method: 'GET', url });
  }
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.execute<T>({ ...config, method: 'POST', url, data });
  }
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.execute<T>({ ...config, method: 'PUT', url, data });
  }
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.execute<T>({ ...config, method: 'PATCH', url, data });
  }
  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.execute<T>({ ...config, method: 'DELETE', url });
  }
}

export * from './types';
