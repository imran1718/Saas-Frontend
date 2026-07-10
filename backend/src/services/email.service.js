const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

const sendEmail = async ({ to, subject, templateName, data }) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Replace {{ key }} with data[key]
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, value);
    }

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`[EmailService] Sent email to ${to}`, { messageId: info.messageId });
    
    // For Ethereal, log the preview URL
    if (config.email.host.includes('ethereal')) {
      logger.info(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    logger.error('[EmailService] Failed to send email', { error: error.message, to, templateName });
    // Don't throw to avoid breaking the calling flow (e.g., registration)
    return false;
  }
};

module.exports = {
  sendEmail,
};
