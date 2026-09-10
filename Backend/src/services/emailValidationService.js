// src/services/emailValidationService.js
// Uses AbstractAPI Email Validation to check if an email address is real and deliverable.
// Docs: https://www.abstractapi.com/api/email-verification-validation-api

const axios = require('axios');

const ABSTRACT_API_URL = 'https://emailvalidation.abstractapi.com/v1/';

/**
 * Validates an email address using AbstractAPI.
 *
 * @param {string} email
 * @returns {Promise<{ valid: boolean, reason: string }>}
 */
async function validateEmail(email) {
  const apiKey = process.env.ABSTRACT_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  ABSTRACT_API_KEY not set — skipping email validation');
    return { valid: true, reason: 'validation_skipped' };
  }

  try {
    const { data } = await axios.get(ABSTRACT_API_URL, {
      params: { api_key: apiKey, email },
      timeout: 8000, // 8-second timeout
    });

    // AbstractAPI fields we care about:
    // deliverability: "DELIVERABLE" | "UNDELIVERABLE" | "RISKY" | "UNKNOWN"
    // is_valid_format.value: boolean
    // is_disposable_email.value: boolean
    // is_mx_found.value: boolean  (mail server exists)
    // is_smtp_valid.value: boolean (SMTP connection OK)

    const fmt       = data.is_valid_format?.value;
    const disposable = data.is_disposable_email?.value;
    const mxFound   = data.is_mx_found?.value;
    const smtpValid = data.is_smtp_valid?.value;
    const deliverability = data.deliverability; // "DELIVERABLE" | "UNDELIVERABLE" | "RISKY" | "UNKNOWN"

    if (!fmt) {
      return { valid: false, reason: 'Invalid email format.' };
    }
    if (disposable) {
      return { valid: false, reason: 'Disposable/temporary email addresses are not allowed.' };
    }
    if (!mxFound) {
      return { valid: false, reason: 'Email domain has no mail server. Please use a real email.' };
    }
    if (deliverability === 'UNDELIVERABLE') {
      return { valid: false, reason: 'This email address does not exist or cannot receive mail.' };
    }
    if (!smtpValid && deliverability !== 'DELIVERABLE') {
      return { valid: false, reason: 'Could not verify this email address. Please use a real email.' };
    }

    return { valid: true, reason: 'ok' };
  } catch (err) {
    // If AbstractAPI is unreachable, fail-open (allow signup) to not block users
    console.warn('⚠️  AbstractAPI email validation failed:', err.message);
    return { valid: true, reason: 'validation_api_unreachable' };
  }
}

module.exports = { validateEmail };
