import api from './api';

/**
 * Auth Service
 *
 * Handles user authentication with backend endpoints.
 */

/**
 * Log in user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} { token, user }
 */
export async function loginUser(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

/**
 * Fetch current user profile from server
 * @returns {Promise<object>} { user }
 */
export async function getMe() {
  const response = await api.get('/auth/me');
  return response.data;
}

/**
 * Step 1 of signup — validate email via AbstractAPI + send OTP
 * @param {{ name, email, password, city }} userData
 * @returns {Promise<{ success, message, otpSent }>}
 */
export async function sendSignupOtp(userData) {
  const response = await api.post('/auth/send-otp', userData);
  return response.data;
}

/**
 * Step 2 of signup — verify OTP and create account
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{ token, user }>}
 */
export async function verifyOtpSignup(email, otp) {
  const response = await api.post('/auth/verify-otp-signup', { email, otp });
  return response.data;
}

/**
 * Forgot Password Step 1 — send OTP to registered email
 * @param {string} email
 * @returns {Promise<{ success, message, otpSent }>}
 */
export async function sendForgotPasswordOtp(email) {
  const response = await api.post('/auth/forgot-password/send-otp', { email });
  return response.data;
}

/**
 * Forgot Password Step 2 — verify OTP code
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{ success, message }>}
 */
export async function verifyForgotPasswordOtp(email, otp) {
  const response = await api.post('/auth/forgot-password/verify-otp', { email, otp });
  return response.data;
}

/**
 * Forgot Password Step 3 — reset to new password
 * @param {string} email
 * @param {string} otp
 * @param {string} newPassword
 * @returns {Promise<{ success, message }>}
 */
export async function resetPasswordWithOtp(email, otp, newPassword) {
  const response = await api.post('/auth/forgot-password/reset', { email, otp, newPassword });
  return response.data;
}

/**
 * @deprecated Use sendSignupOtp + verifyOtpSignup instead.
 * Kept for backwards compatibility.
 */
export async function signupUser(userData) {
  return sendSignupOtp(userData);
}

/**
 * Request Authority Login 2FA Verification Code
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} { success, message, otpSent, officerName, devCode }
 */
export async function sendAuthorityOtp(email, password) {
  const response = await api.post('/auth/authority/send-otp', { email, password });
  return response.data;
}

/**
 * Log in Authority Officer with Verification Code
 * @param {string} email
 * @param {string} password
 * @param {string} verificationCode
 * @returns {Promise<object>} { success, token, user }
 */
export async function loginAuthorityUser(email, password, verificationCode) {
  const response = await api.post('/auth/authority/login', { email, password, verificationCode });
  return response.data;
}
