const { EmailService } = require("./email-service");
const { NodemailerMockProvider } = require('./nodemailer.provider')
require("dotenv").config();

// const mailrooProvider = new MailrooFormProvider(process.env.MAILROO_API_KEY || "dummy-key");
// const emailService = new EmailService([mailrooProvider]);

const mockProvider = new NodemailerMockProvider();
const emailService = new EmailService([mockProvider]);

(async () => {
  try {
    const to = "spotifyblackbeard6@gmail.com";
    const subject = "Test Email";
    const body = "Test Body";
    const idempotencyKey = "email-123";
    await emailService.sendEmail({ to, subject, body, idempotencyKey });
  } catch (error) {
    console.log(error);
  }
})();
