const axios = require("axios");
const FormData = require('form-data');

class MailrooProvider {
  constructor(apiKey) {
    this.name = "Mailroo";
    this.apiKey = apiKey;
    this.endpoint = "https://api.mailroo.com/send"; // Hypothetical endpoint
  }

  async send(email) {
    try {
      const response = await axios.post(
        this.endpoint,
        {
          to: email.to,
          subject: email.subject,
          body: email.body,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status !== 200) {
        throw new Error(`Mailroo failed: ${response.statusText}`);
      }
      console.log(`[Mailroo] Email sent to ${email.to}`);
    } catch (error) {
      throw new Error(`[Mailroo] ${error.message}`);
    }
  }
}

class MailrooFormProvider {
  constructor(apiKey) {
    this.name = "MailrooForm";
    this.url = "https://smtp.maileroo.com/send"; // Hypothetical Mailroo endpoint
    this.apiKey = apiKey;
  }

  async send(email) {
    const formData = new FormData();
    formData.append("from", `Newboard <no-reply@notify.newboard.io>`);
    formData.append("to", email.to);
    formData.append("subject", email.subject);
    formData.append("body", email.body);

    try {
      const response = await axios.post(this.url, formData, {
        headers: {
          "X-API-Key": this.apiKey,
          ...formData.getHeaders(),
        },
      });

      if (response.status === 200 || response.status === 202) {
        console.log(`[MailrooForm] Email sent to ${email.to}`);
        return;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error("MailrooForm Error:", error.response?.data || error.message);
      throw new Error(`[MailrooForm] ${error.message}`);
    }
  }
}

module.exports = { MailrooFormProvider, MailrooProvider };
