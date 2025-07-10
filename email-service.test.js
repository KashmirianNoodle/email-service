// email-service.test.js

const { EmailService } = require('./email-service');

class FakeProvider {
  constructor(name, shouldFail = false) {
    this.name = name;
    this.shouldFail = shouldFail;
    this.sentEmails = [];
  }

  async send(email) {
    if (this.shouldFail) {
      throw new Error(`${this.name} failed intentionally`);
    }
    this.sentEmails.push(email);
  }
}

describe('EmailService', () => {
  test('should send email successfully with one provider', async () => {
    const provider = new FakeProvider('FakeA');
    const service = new EmailService([provider]);
    const email = { to: 'x@y.com', subject: 'Hi', body: 'Hello', idempotencyKey: 'abc' };

    await service.sendEmail(email);
    const status = service.getStatus('abc');

    expect(status.status).toBe('SUCCESS');
    expect(status.provider).toBe('FakeA');
  });

  test('should retry and fallback to second provider on failure', async () => {
    const providerA = new FakeProvider('FailingProvider', true);
    const providerB = new FakeProvider('WorkingProvider');
    const service = new EmailService([providerA, providerB]);

    const email = { to: 'x@y.com', subject: 'Test', body: 'Backup', idempotencyKey: 'xyz' };
    await service.sendEmail(email);

    const status = service.getStatus('xyz');
    expect(status.status).toBe('SUCCESS');
    expect(status.provider).toBe('WorkingProvider');
  });

  test('should not send duplicate email if idempotencyKey already used', async () => {
    const provider = new FakeProvider('OnceProvider');
    const service = new EmailService([provider]);

    const email = { to: 'a@b.com', subject: 'First', body: 'Test', idempotencyKey: 'dupe' };
    await service.sendEmail(email);
    await service.sendEmail(email);

    expect(provider.sentEmails.length).toBe(1);
  });
});