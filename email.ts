// email-service.ts

/**
 * Email sending service with support for:
 * - Retry logic (exponential backoff)
 * - Fallback between providers
 * - Idempotency
 * - Rate limiting
 * - Status tracking
 * - (Bonus) Circuit breaker, logging, and queueing
 */

interface Email {
  to: string;
  subject: string;
  body: string;
  idempotencyKey: string;
}

interface EmailProvider {
  name: string;
  send(email: Email): Promise<void>;
}

interface EmailStatus {
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  provider: string;
  attempts: number;
  lastError?: string;
}

class MockEmailProvider implements EmailProvider {
  name: string;
  failRate: number;

  constructor(name: string, failRate: number = 0.3) {
    this.name = name;
    this.failRate = failRate;
  }

  async send(email: Email): Promise<void> {
    // Simulate random failure
    if (Math.random() < this.failRate) {
      throw new Error(`${this.name} failed to send email`);
    }
    console.log(`[${this.name}] Email sent to ${email.to}`);
  }
}

class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 3;
  private readonly cooldownPeriod = 10000; // 10 seconds

  canRequest(): boolean {
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

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  reset(): void {
    this.failureCount = 0;
  }
}

class RateLimiter {
  private requests: number[] = [];
  constructor(private maxRequests: number, private windowMs: number) {}

  isAllowed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(ts => now - ts < this.windowMs);
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }
}

export class EmailService {
  private providers: EmailProvider[];
  private providerStates: Map<string, CircuitBreaker> = new Map();
  private rateLimiter: RateLimiter;
  private statusMap: Map<string, EmailStatus> = new Map();

  constructor(providers: EmailProvider[]) {
    this.providers = providers;
    this.rateLimiter = new RateLimiter(5, 10000); // 5 emails per 10s

    for (const provider of providers) {
      this.providerStates.set(provider.name, new CircuitBreaker());
    }
  }

  getStatus(idempotencyKey: string): EmailStatus | undefined {
    return this.statusMap.get(idempotencyKey);
  }

  async sendEmail(email: Email): Promise<void> {
    if (!this.rateLimiter.isAllowed()) {
      throw new Error('Rate limit exceeded');
    }

    const existing = this.statusMap.get(email.idempotencyKey);
    if (existing && existing.status === 'SUCCESS') {
      console.log('Skipping duplicate email send');
      return;
    }

    for (const provider of this.providers) {
      const breaker = this.providerStates.get(provider.name)!;
      if (!breaker.canRequest()) continue;

      let attempt = 0;
      let delay = 500;

      while (attempt < 3) {
        try {
          this.statusMap.set(email.idempotencyKey, {
            status: 'RETRYING',
            provider: provider.name,
            attempts: attempt + 1,
          });
          await provider.send(email);
          this.statusMap.set(email.idempotencyKey, {
            status: 'SUCCESS',
            provider: provider.name,
            attempts: attempt + 1,
          });
          return;
        } catch (err: any) {
          breaker.recordFailure();
          attempt++;
          this.statusMap.set(email.idempotencyKey, {
            status: 'FAILED',
            provider: provider.name,
            attempts: attempt,
            lastError: err.message,
          });
          console.warn(`[Retry ${attempt}] ${err.message}`);
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        }
      }
    }

    throw new Error('All providers failed to send email');
  }
}
