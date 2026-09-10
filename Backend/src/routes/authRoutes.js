// src/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// ── Current user profile ────────────────────────────────────
router.get('/me', authMiddleware.protect, authController.getMe);

// ── Signup — two-step OTP flow ──────────────────────────────
// Step 1: validate email + send OTP
router.post('/send-otp', authController.sendOtp);

// Step 2: verify OTP + create account
router.post('/verify-otp-signup', authController.verifyOtpAndSignup);

// ── Login ───────────────────────────────────────────────────
router.post('/login', authController.login);

// ── Authority Login with 2-Factor Verification ──────────────
router.post('/authority/send-otp', authController.authoritySendOtp);
router.post('/authority/login', authController.authorityLogin);

// ── Forgot Password OTP Flow ─────────────────────────────────
// Step 1: Send OTP to registered email
router.post('/forgot-password/send-otp', authController.forgotPasswordSendOtp);

// Step 2: Verify OTP
router.post('/forgot-password/verify-otp', authController.forgotPasswordVerifyOtp);

// Step 3: Reset password with OTP
router.post('/forgot-password/reset', authController.forgotPasswordReset);

// Legacy signup route kept for backwards compatibility (redirects to send-otp)
router.post('/signup', authController.sendOtp);

module.exports = router;