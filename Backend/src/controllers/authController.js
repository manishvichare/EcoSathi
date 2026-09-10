// src/controllers/authController.js
// Handles:
// POST /api/auth/send-otp
// POST /api/auth/verify-otp-signup
// POST /api/auth/login
// POST /api/auth/forgot-password/send-otp
// POST /api/auth/forgot-password/verify-otp
// POST /api/auth/forgot-password/reset

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { supabase } = require('../config/db');
const env          = require('../config/env');
const { validateEmail } = require('../services/emailValidationService');
const {
  generateAndStoreOtp,
  verifyOtp,
  isResendThrottled,
  clearOtp,
} = require('../services/otpService');
const { sendOtpEmail } = require('../services/emailSenderService');

// Helper: sign a JWT for a given user id
const signToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

// ─────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// Step 1 of signup:
//   1. Validate email with AbstractAPI (real + deliverable)
//   2. Check not already registered
//   3. Generate OTP, store pending signup data
//   4. Send OTP email
// ─────────────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { name, email, password, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 30s resend cooldown
    if (isResendThrottled(normalizedEmail, 'signup')) {
      return res.status(429).json({
        success: false,
        message: 'A verification code was recently sent. Please check your inbox or wait 30 seconds before requesting a new code.',
      });
    }

    // ── Step 1: Validate email is real via AbstractAPI ──────────
    const validation = await validateEmail(normalizedEmail);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    // ── Step 2: Check not already registered ───────────────────
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: 'This email is already registered. Please log in.' });
    }

    // ── Step 3: Hash password, generate OTP, store pending data ─
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateAndStoreOtp(
      normalizedEmail,
      {
        name: name.trim(),
        email: normalizedEmail,
        password_hash: hashedPassword,
        city: city || null,
      },
      'signup'
    );

    // ── Step 4: Send OTP email ──────────────────────────────────
    await sendOtpEmail(normalizedEmail, otp, name.trim(), 'signup');

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. It expires in 10 minutes.`,
      otpSent: true,
    });
  } catch (err) {
    console.error('❌ sendOtp error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp-signup
// Step 2 of signup:
//   1. Verify the OTP
//   2. If correct → create user in DB → return JWT
// ─────────────────────────────────────────────────────────────
exports.verifyOtpAndSignup = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Step 1: Verify OTP ──────────────────────────────────────
    const result = verifyOtp(normalizedEmail, otp, 'signup');
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const { userData } = result;

    // ── Step 2: Guard against race condition ───────────────────
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: 'This email is already registered. Please log in.' });
    }

    // ── Step 3: Create user in DB ───────────────────────────────
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name:           userData.name,
        email:          userData.email,
        password_hash:  userData.password_hash,
        city:           userData.city,
        role:           'citizen',
        points:         0,
      })
      .select('id, name, email, city, points, role')
      .single();

    if (error) throw error;

    const token = signToken(user.id);

    return res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, city: user.city, points: user.points, role: user.role },
    });
  } catch (err) {
    console.error('❌ verifyOtpAndSignup error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, city, role, points')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No account found with this email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user.id);

    return res.status(200).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, city: user.city, points: user.points, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me (Get fresh profile for authenticated user)
// ─────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, city, role, points')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password/send-otp
// Step 1 of password reset:
//   1. Verify email exists in DB
//   2. Generate 6-digit OTP and store with 10-min TTL
//   3. Send OTP email
// ─────────────────────────────────────────────────────────────
exports.forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 30s resend cooldown
    if (isResendThrottled(normalizedEmail, 'forgot_password')) {
      return res.status(429).json({
        success: false,
        message: 'A password reset code was recently sent. Please check your inbox or wait 30 seconds before resending.',
      });
    }

    // Check if account exists
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please check and try again.',
      });
    }

    // Generate and store OTP
    const otp = generateAndStoreOtp(normalizedEmail, { userId: user.id }, 'forgot_password');

    // Send email
    await sendOtpEmail(normalizedEmail, otp, user.name || 'there', 'forgot_password');

    return res.status(200).json({
      success: true,
      message: `A 6-digit password reset code has been sent to ${normalizedEmail}. It expires in 10 minutes.`,
      otpSent: true,
    });
  } catch (err) {
    console.error('❌ forgotPasswordSendOtp error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send password reset code. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password/verify-otp
// Step 2 of password reset:
//   Validates the entered OTP code
// ─────────────────────────────────────────────────────────────
exports.forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Keep data so the subsequent reset-password call can finalize
    const result = verifyOtp(normalizedEmail, otp, 'forgot_password', true);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Code verified successfully. You can now set your new password.',
    });
  } catch (err) {
    console.error('❌ forgotPasswordVerifyOtp error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password/reset
// Step 3 of password reset:
//   1. Re-verifies OTP is valid & verified
//   2. Hashes new password
//   3. Updates password_hash in DB
//   4. Clears OTP
// ─────────────────────────────────────────────────────────────
exports.forgotPasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, verification code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP and consume
    const result = verifyOtp(normalizedEmail, otp, 'forgot_password', false);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { data: user, error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', normalizedEmail)
      .select('id, name, email')
      .single();

    if (error || !user) {
      throw error || new Error('Failed to update password.');
    }

    clearOtp(normalizedEmail, 'forgot_password');

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    console.error('❌ forgotPasswordReset error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/authority/send-otp
// Step 1 of Authority Login:
//   1. Verify email & password
//   2. Verify user has Authority / Admin clearance
//   3. Generate & store 6-digit 2FA verification OTP
//   4. Send verification email (with fallback)
// ─────────────────────────────────────────────────────────────
exports.authoritySendOtp = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Official email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No official officer account found with this email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    // Check authority clearance
    const hasAuthorityClearance =
      user.role === 'admin' ||
      user.role === 'authority' ||
      normalizedEmail === 'authority@ecosathi.gov.in' ||
      normalizedEmail === 'vicharemanish717@gmail.com';

    if (!hasAuthorityClearance) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This account is registered as a Citizen and lacks official Municipal Authority clearance. Please log in via the Citizen Portal.',
      });
    }

    // Generate 6-digit OTP
    const otp = generateAndStoreOtp(normalizedEmail, { userId: user.id }, 'authority_login');

    // Attempt to dispatch real email
    try {
      await sendOtpEmail(normalizedEmail, otp, user.name, 'authority_login');
    } catch (mailErr) {
      console.warn('⚠️ Authority verification mail could not be dispatched via SMTP:', mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Official 2-Factor verification code dispatched to ${normalizedEmail}. Check your inbox.`,
      otpSent: true,
      officerName: user.name,
    });
  } catch (err) {
    console.error('❌ authoritySendOtp error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/authority/login
// Step 2 of Authority Login:
//   1. Verifies credentials + authority clearance
//   2. Strictly verifies real 6-digit 2FA OTP sent to officer email
//   3. Issues JWT token
// ─────────────────────────────────────────────────────────────
exports.authorityLogin = async (req, res) => {
  try {
    const { email, password, verificationCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, city, role, points')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No official officer account found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const hasAuthorityClearance =
      user.role === 'admin' ||
      user.role === 'authority' ||
      normalizedEmail === 'authority@ecosathi.gov.in' ||
      normalizedEmail === 'vicharemanish717@gmail.com';

    if (!hasAuthorityClearance) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This account is registered as a Citizen and lacks official Municipal Authority clearance. Please log in via the Citizen Portal.',
      });
    }

    // If verificationCode not supplied, prompt for it and send OTP
    if (!verificationCode) {
      const otp = generateAndStoreOtp(normalizedEmail, { userId: user.id }, 'authority_login');
      try {
        await sendOtpEmail(normalizedEmail, otp, user.name, 'authority_login');
      } catch (mailErr) {
        console.warn('⚠️ Authority mail error:', mailErr.message);
      }
      return res.status(200).json({
        success: false,
        requireVerification: true,
        message: 'Municipal 2-Factor Verification Code is required. A verification code has been dispatched to your email.',
        officerName: user.name,
      });
    }

    // Verify code: strictly verify genuine OTP sent to officer email
    const cleanCode = verificationCode.toString().trim();
    const otpResult = verifyOtp(normalizedEmail, cleanCode, 'authority_login', false);

    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message || 'Invalid or expired 2FA Verification Code. Please check the code sent to your registered email or request a fresh code.',
      });
    }

    // Clear OTP on successful authentication
    clearOtp(normalizedEmail, 'authority_login');

    const token = signToken(user.id);

    return res.status(200).json({
      success: true,
      message: 'Official Municipal Authority identity verified successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        points: user.points,
        role: user.role,
        isAuthority: true,
      },
    });
  } catch (err) {
    console.error('❌ authorityLogin error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};