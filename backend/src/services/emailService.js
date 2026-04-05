const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendInvitationEmail(email, token, adminName, organizationName) {
  const appUrl = process.env.APP_URL || 'https://accounting-app-teal.vercel.app';
  const companyName = process.env.COMPANY_NAME || 'Accounting System';
  const acceptLink = `${appUrl}/accept-invite?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #163C6C; color: white; padding: 20px; text-align: center; border-radius: 4px; }
          .content { padding: 20px; border: 1px solid #ddd; margin-top: 20px; }
          .button { display: inline-block; background: #1A80AA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; text-align: center; }
          .warning { color: #d9534f; font-size: 12px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${email}</strong>,</p>
            <p><strong>${adminName}</strong> has invited you to join the <strong>${organizationName}</strong> accounting system.</p>
            <p>Click the link below to create your account:</p>
            <div style="text-align: center;">
              <a href="${acceptLink}" class="button">Create Account</a>
            </div>
            <p style="color: #666; margin-top: 20px;">Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
              <a href="${acceptLink}">${acceptLink}</a>
            </p>
            <div class="warning">
              ⚠️ This link expires in 48 hours.
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: `You've been invited to ${organizationName} - ${companyName}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

/**
 * Send welcome email to newly registered user
 * @param {Object} user - User object with name and email
 * @param {string} temporaryPassword - Temporary password for the user
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function sendWelcomeEmail(user, temporaryPassword) {
  try {
    // Render email template with user data
    const templatePath = path.join(__dirname, '../templates/welcomeEmail.ejs');
    const html = await ejs.renderFile(templatePath, {
      userName: user.name,
      userEmail: user.email,
      temporaryPassword: temporaryPassword,
      companyName: process.env.COMPANY_NAME || 'Our Company',
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
    });

    // Send email
    const result = await transporter.sendMail({
      from: `${process.env.COMPANY_NAME || 'Our Company'} <${process.env.SMTP_FROM_EMAIL}>`,
      to: user.email,
      subject: `Welcome to ${process.env.COMPANY_NAME || 'Our Company'}`,
      html: html,
    });

    console.log(`Welcome email sent successfully to ${user.email}`);
    return { success: true, error: null };
  } catch (error) {
    console.error(`Failed to send welcome email to ${user.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendInvitationEmail, sendWelcomeEmail };
