class MockEmailProvider {
  constructor(name, failRate = 0.3) {
    this.name = name;
    this.failRate = failRate;
  }

  async send(email) {
    if (Math.random() < this.failRate) {
      throw new Error(`${this.name} failed to send email`);
    }
    console.log(`[${this.name}] Email sent to ${email.to}`);
  }
}

module.exports = { MockEmailProvider };
