// src/services/otpService.js
// In-memory OTP store with 10-minute TTL.
// Supports both signup OTPs and password-reset OTPs.
// No external dependency needed — OTPs are ephemeral.

const crypto = require('crypto');

// Map: `${purpose}:${email}` → { otp, expiresAt, attempts, createdAt, data }
const otpStore = new Map();

const OTP_TTL_MS     = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN = 30 * 1000;      // 30 seconds cooldown between resends
const MAX_ATTEMPTS   = 5;              // block brute force

/**
 * Generate a secure 6-digit OTP and store it with purpose and metadata.
 *
 * @param {string} email
 * @param {string} purpose - 'signup' | 'forgot_password'
 * @param {object} data - pending signup data or reset token data
 * @returns {string} The plain-text 6-digit OTP
 */
function generateAndStoreOtp(email, data = {}, purpose = 'signup') {
  const key = `${purpose}:${email.toLowerCase()}`;
  const otp = crypto.randomInt(100000, 999999).toString();

  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    createdAt: Date.now(),
    attempts:  0,
    data,
  });

  return otp;
}

/**
 * Verify OTP for an email and purpose.
 *
 * @param {string} email
 * @param {string} enteredOtp
 * @param {string} purpose - 'signup' | 'forgot_password'
 * @param {boolean} keepData - if true, don't delete immediately (e.g. for two-step reset)
 * @returns {{ success: boolean, data?: object, message?: string }}
 */
function verifyOtp(email, enteredOtp, purpose = 'signup', keepData = false) {
  const key    = `${purpose}:${email.toLowerCase()}`;
  const record = otpStore.get(key);

  if (!record) {
    return { success: false, message: 'OTP not found or expired. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { success: false, message: 'Verification code has expired (10 minutes). Please request a new one.' };
  }

  record.attempts += 1;

  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { success: false, message: 'Too many incorrect attempts. Please request a new verification code.' };
  }

  if (record.otp !== String(enteredOtp).trim()) {
    const remaining = MAX_ATTEMPTS - record.attempts;
    return { success: false, message: `Incorrect code. ${remaining} attempt(s) remaining.` };
  }

  // Correct OTP
  const data = record.data;
  if (!keepData) {
    otpStore.delete(key);
  } else {
    // Mark verified
    record.verified = true;
  }
  return { success: true, data, userData: data };
}

/**
 * Check if a pending OTP exists and whether it's within the resend cooldown window (30s)
 */
function isResendThrottled(email, purpose = 'signup') {
  const key = `${purpose}:${email.toLowerCase()}`;
  const record = otpStore.get(key);
  if (!record) return false;
  return (Date.now() - record.createdAt) < RESEND_COOLDOWN;
}

/**
 * Delete OTP for an email and purpose
 */
function clearOtp(email, purpose = 'signup') {
  otpStore.delete(`${purpose}:${email.toLowerCase()}`);
}

module.exports = {
  generateAndStoreOtp,
  verifyOtp,
  isResendThrottled,
  clearOtp,
};
