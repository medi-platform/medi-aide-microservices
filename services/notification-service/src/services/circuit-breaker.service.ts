import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  halfOpenRetries: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreaker>();

  getCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreaker(name, {
        failureThreshold: options?.failureThreshold ?? 5,
        resetTimeout: options?.resetTimeout ?? 60000, // 1 minute
        monitoringPeriod: options?.monitoringPeriod ?? 10000, // 10 seconds
        halfOpenRetries: options?.halfOpenRetries ?? 3,
      }));
    }
    return this.circuits.get(name)!;
  }

  getStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    this.circuits.forEach((circuit, name) => {
      status[name] = {
        state: circuit.getState(),
        failures: circuit.getFailureCount(),
        lastFailure: circuit.getLastFailureTime(),
        successRate: circuit.getSuccessRate(),
      };
    });
    return status;
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private halfOpenAttempts = 0;
  private readonly logger = new Logger(CircuitBreaker.name);

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (new Date() < this.nextAttemptTime!) {
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenAttempts = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successes++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.options.halfOpenRetries) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.logger.log(`Circuit ${this.name} is now CLOSED`);
      }
    } else {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN || this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
      this.logger.warn(`Circuit ${this.name} is now OPEN until ${this.nextAttemptTime.toISOString()}`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }

  getLastFailureTime(): Date | undefined {
    return this.lastFailureTime;
  }

  getSuccessRate(): number {
    const total = this.successes + this.failures;
    return total === 0 ? 100 : (this.successes / total) * 100;
  }
}
