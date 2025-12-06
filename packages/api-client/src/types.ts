export type RetryStrategy = {
  maxRetries: number;
  retryOn?: (status: number, error?: any) => boolean;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
};

export type RateLimitPolicy = {
  requestsPerInterval: number; // tokens per interval
  intervalMs: number; // refill interval
  burst?: number; // bucket capacity
};

export type CircuitBreakerPolicy = {
  failureThreshold: number; // failures before opening
  successThreshold: number; // successes to close from half-open
  timeoutMs: number; // time to stay open
};

export type SimulationPolicy = {
  enabled: boolean;
  errorRate?: number; // 0..1
  minLatencyMs?: number;
  maxLatencyMs?: number;
};

export type DedupePolicy = {
  enabled: boolean;
  keyFn?: (method: string, url: string, body?: any) => string;
};

export type ApiClientConfig = {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  retry?: RetryStrategy;
  rateLimit?: RateLimitPolicy;
  circuitBreaker?: CircuitBreakerPolicy;
  dedupe?: DedupePolicy;
  simulation?: SimulationPolicy;
  getTraceHeaders?: () => Record<string, string> | undefined;
  getCorrelationId?: () => string | undefined;
};
