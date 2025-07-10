// api.js

const express = require('express');
const { EmailService } = require('./email-service');
const { MailrooFormProvider } = require('./maileroo.provider')
const { NodemailerMockProvider } = require('./nodemailer.provider')
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Setup email service with Mailroo mock provider
const mailrooProvider = new MailrooFormProvider(process.env.MAILROO_API_KEY || 'dummy-key');
const mockProvider = new NodemailerMockProvider();

const emailService = new EmailService([mailrooProvider, mockProvider]);


// Send email endpoint
app.post('/send-email', async (req, res) => {
  const { to, subject, body, idempotencyKey } = req.body;

  if (!to || !subject || !body || !idempotencyKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await emailService.sendEmail({ to, subject, body, idempotencyKey });
    const status = emailService.getStatus(idempotencyKey);
    res.status(200).json({ message: 'Email sent', status });
  } catch (err) {
    const status = emailService.getStatus(idempotencyKey);
    res.status(500).json({ error: err.message, status });
  }
});

// Status lookup endpoint
app.get('/status/:key', (req, res) => {
  const status = emailService.getStatus(req.params.key);
  if (!status) {
    return res.status(404).json({ error: 'Status not found' });
  }
  res.json(status);
});

app.listen(PORT, () => {
  console.log(`Email API running at http://localhost:${PORT}`);
});