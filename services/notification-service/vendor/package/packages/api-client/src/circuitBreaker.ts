export class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastOpened = 0;

  constructor(
    private failureThreshold: number,
    private successThreshold: number,
    private timeoutMs: number
  ) {}

  canRequest(): boolean {
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastOpened > this.timeoutMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  recordFailure() {
    if (this.state === 'half-open') {
      this.trip();
      return;
    }

    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.trip();
    }
  }

  private reset() {
    this.failures = 0;
    this.successes = 0;
    this.state = 'closed';
  }

  private trip() {
    this.state = 'open';
    this.lastOpened = Date.now();
    this.successes = 0;
  }
}
