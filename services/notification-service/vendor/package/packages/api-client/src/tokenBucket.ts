export class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillIntervalMs: number;
  private tokensPerInterval: number;
  private lastRefill: number;

  constructor(capacity: number, tokensPerInterval: number, intervalMs: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.tokensPerInterval = tokensPerInterval;
    this.refillIntervalMs = intervalMs;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed <= 0) return;
    const tokensToAdd = Math.floor((elapsed / this.refillIntervalMs) * this.tokensPerInterval);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  tryRemoveTokens(count: number = 1): boolean {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
}
