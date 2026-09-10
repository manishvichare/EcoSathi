// src/services/emailSenderService.js
// Sends OTP verification and password reset emails using Gmail SMTP via Nodemailer.
// Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env

const nodemailer = require('nodemailer');

// Create a reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        // App Passwords are shown with spaces by Google — strip them for SMTP
        pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, ''),
      },
    });
  }
  return transporter;
}

/**
 * Send a 6-digit OTP email for Signup, Password Reset, or Authority Login.
 *
 * @param {string} toEmail - Recipient email
 * @param {string} otp     - 6-digit OTP code
 * @param {string} name    - Recipient's name
 * @param {'signup' | 'forgot_password' | 'authority_login'} purpose
 */
async function sendOtpEmail(toEmail, otp, name = 'there', purpose = 'signup') {
  const mail = getTransporter();

  const isReset = purpose === 'forgot_password';
  const isAuthority = purpose === 'authority_login';

  const title = isAuthority
    ? 'Official Authority 2FA Verification'
    : isReset
    ? 'Reset Your Password'
    : 'Verify Your Email Address';

  const intro = isAuthority
    ? 'An official login attempt was initiated for the EcoSathi Municipal Authority Portal. Enter the 6-digit officer verification code below to authorize terminal access:'
    : isReset
    ? 'We received a request to reset your EcoSathi account password. Use the verification code below to set a new password:'
    : 'Use the verification code below to complete your EcoSathi registration:';

  const subject = isAuthority
    ? `🛡️ ${otp} - EcoSathi Municipal Authority Verification Code`
    : isReset
    ? `${otp} is your EcoSathi password reset code`
    : `${otp} is your EcoSathi verification code`;

  const recipients = [toEmail];
  if (toEmail.toLowerCase().includes('@ecosathi.gov.in') && process.env.GMAIL_USER && !recipients.includes(process.env.GMAIL_USER)) {
    recipients.push(process.env.GMAIL_USER);
  }

  const mailOptions = {
    from: `"EcoSathi 🌿" <${process.env.GMAIL_USER}>`,
    to: recipients.join(', '),
    subject,
    text: `Hi ${name},\n\nYour EcoSathi verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n— The EcoSathi Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #065f46; font-size: 24px; margin: 0;">🌿 EcoSathi</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">${title}</p>
        </div>

        <div style="background: white; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 20px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">
            ${intro}
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #ecfdf5; border: 2px dashed #10b981; border-radius: 10px; padding: 16px 36px;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #065f46;">${otp}</span>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 13px; margin: 20px 0 0; text-align: center;">
            ⏱ This code expires in <strong>10 minutes</strong>.<br/>
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          © EcoSathi — Empowering Environmental Action
        </p>
      </div>
    `,
  };

  await mail.sendMail(mailOptions);
  console.log(`✅ ${isReset ? 'Password reset' : 'Signup'} OTP email sent to ${toEmail}`);
}

module.exports = { sendOtpEmail };
