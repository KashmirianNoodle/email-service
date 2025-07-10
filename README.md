# Email Service API

A robust email sending service with:

- Provider fallback and retry
- Exponential backoff
- Circuit breaker
- Idempotency
- Rate limiting
- Status tracking
- Mock email provider integration (Mailroo or similar)

## 🔧 Setup

```bash
npm install
```

Create a `.env` file:

```env
MAILROO_API_KEY=your-mailroo-api-key
PORT=3000
```

## 🚀 Run the API

```bash
node api.js
```

## 📮 API Endpoints

### POST `/send-email`
Send an email.

**Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Hello",
  "body": "Welcome aboard!",
  "idempotencyKey": "unique-key-123"
}
```

### GET `/status/:key`
Check the status of an email by idempotency key.

## ✅ Tests

Run unit tests using Jest:

```bash
npm install --save-dev jest
npx jest email-service.test.js
```

## 🤖 Assumptions
- Mailroo is a mock provider with a REST API.
- Email uniqueness is enforced via `idempotencyKey`.
- Limited to 5 emails every 10 seconds.

## 📁 Structure
```
├── api.js               # Express API
├── email-service.js     # Core email logic
├── email-service.test.js# Unit tests
├── .env                 # Config
├── README.md            # Documentation
```

---

Built with ❤️ for reliability, fault tolerance, and real-world simulations.