// email-service.js

/**
 * Email sending service with support for:
 * - Retry logic (exponential backoff)
 * - Fallback between providers
 * - Idempotency
 * - Rate limiting
 * - Status tracking
 */

class CircuitBreaker {
  constructor() {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.failureThreshold = 3;
    this.cooldownPeriod = 10000;
  }

  canRequest() {
    const now = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      if (now - this.lastFailureTime > this.cooldownPeriod) {
        this.reset();
        return true;
      }
      return false;
    }
    return true;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  reset() {
    this.failureCount = 0;
  }
}

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  isAllowed() {
    const now = Date.now();
    this.requests = this.requests.filter((ts) => now - ts < this.windowMs);
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }
}

class EmailService {
  constructor(providers) {
    this.providers = providers;
    this.providerStates = new Map();
    this.rateLimiter = new RateLimiter(5, 10000);
    this.statusMap = new Map();

    for (const provider of providers) {
      this.providerStates.set(provider.name, new CircuitBreaker());
    }
  }

  getStatus(idempotencyKey) {
    return this.statusMap.get(idempotencyKey);
  }

  async sendEmail(email) {
    if (!this.rateLimiter.isAllowed()) {
      throw new Error("Rate limit exceeded");
    }

    const existing = this.statusMap.get(email.idempotencyKey);
    if (existing && existing.status === "SUCCESS") {
      console.log("Skipping duplicate email send");
      return;
    }

    for (const provider of this.providers) {
      const breaker = this.providerStates.get(provider.name);
      if (!breaker.canRequest()) continue;

      let attempt = 0;
      let delay = 500;

      while (attempt < 3) {
        try {
          this.statusMap.set(email.idempotencyKey, {
            status: "RETRYING",
            provider: provider.name,
            attempts: attempt + 1,
          });
          await provider.send(email);
          this.statusMap.set(email.idempotencyKey, {
            status: "SUCCESS",
            provider: provider.name,
            attempts: attempt + 1,
          });
          return;
        } catch (err) {
          breaker.recordFailure();
          attempt++;
          this.statusMap.set(email.idempotencyKey, {
            status: "FAILED",
            provider: provider.name,
            attempts: attempt,
            lastError: err.message,
          });
          console.warn(`[Retry ${attempt}] ${err.message}`);
          await new Promise((res) => setTimeout(res, delay));
          delay *= 2;
        }
      }
    }

    throw new Error("All providers failed to send email");
  }
}

module.exports = {
  EmailService
};
