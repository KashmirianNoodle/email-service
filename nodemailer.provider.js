const nodemailer = require("nodemailer");

class NodemailerMockProvider {
  constructor() {
    this.name = "NodemailerMock";

    // Using Ethereal for mock SMTP testing
    this.transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  }

  async send(email) {
    const transporter = await this.transporterPromise;

    const mailOptions = {
      from: '"MockMailer" <mock@example.com>',
      to: email.to,
      subject: email.subject,
      text: email.body,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[NodemailerMock] Email sent to ${email.to}`);
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      console.error("[NodemailerMock] Send failed:", err.message);
      throw new Error(`[NodemailerMock] ${err.message}`);
    }
  }
}

class NodemailerRealProvider {
  constructor({ host, port, secure, user, pass }) {
    this.name = "NodemailerReal";

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async send(email) {
    const mailOptions = {
      from: `"YourApp" <${this.transporter.options.auth.user}>`,
      to: email.to,
      subject: email.subject,
      text: email.body,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[NodemailerReal] Email sent to ${email.to}`);
      console.log(`Message ID: ${info.messageId}`);
    } catch (err) {
      console.error("[NodemailerReal] Send failed:", err.message);
      throw new Error(`[NodemailerReal] ${err.message}`);
    }
  }
}

module.exports = { NodemailerMockProvider, NodemailerRealProvider };
