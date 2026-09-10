import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';

/**
 * Signup Page — Two-step OTP verification flow with Resend timer & expiry
 *
 * Step 1: User fills form → "Create Account" → backend validates email
 *         → sends 6-digit OTP to user's inbox.
 * Step 2: OTP input appears in the same card → user enters 6-digit code
 *         → "Verify & Create Account" → account created, user logged in.
 */
export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
  });

  // OTP step state
  const [step, setStep]       = useState(1);   // 1 = form, 2 = OTP
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs               = useRef([]);

  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // ── Step 1: validate + send OTP ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await sendOtp({
        name:     formData.name,
        email:    formData.email,
        password: formData.password,
        city:     formData.city,
      });
      setInfo(`A 6-digit verification code was sent to ${formData.email}. Check your inbox (and spam folder).`);
      setStep(2);
      setResendCooldown(30);
    } catch (err) {
      setError(err.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP digit input handling ─────────────────────────────────
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');

    // Auto-advance to next box
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Support paste: user pastes 6-digit code into any box
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    [...pasted].forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Step 2: verify OTP + create account ─────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(formData.email, code);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Re-trigger OTP email directly without wiping inputs
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await sendOtp({
        name:     formData.name,
        email:    formData.email,
        password: formData.password,
        city:     formData.city,
      });
      setInfo(`New 6-digit verification code sent to ${formData.email}.`);
      setResendCooldown(30);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Allow user to go back and re-enter details
  const handleEditDetails = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setInfo('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 text-4xl font-bold text-emerald-800 mb-4">
            <img src="/ecosathi-logo.jpg" alt="EcoSathi Official Logo" className="h-14 w-auto rounded-xl shadow-sm" />
            <span className="font-extrabold text-emerald-800">EcoSathi</span>
          </div>
          <p className="text-slate-600 font-medium text-sm">Join the movement for a greener tomorrow</p>
        </div>

        {/* Card */}
        <Card>
          {/* ── Step 1: Signup form ─────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-slate-700 font-bold text-sm mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-slate-700 font-bold text-sm mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-slate-700 font-bold text-sm mb-1.5">
                  City
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                >
                  <option value="">-- Select City --</option>
                  <option value="Pune">Pune</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-slate-700 font-bold text-sm mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-slate-700 font-bold text-sm mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              {/* Terms */}
              <label className="flex items-center gap-2 text-slate-700 text-sm pt-1">
                <input type="checkbox" required className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                <span>
                  I agree to the{' '}
                  <a href="#" className="text-emerald-700 font-bold hover:text-emerald-800 underline">
                    Terms of Service
                  </a>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl font-bold text-base shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Sending verification code...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP verification ────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-5">
              {/* Info banner */}
              {info && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium">
                  {info}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="text-center space-y-1">
                <p className="text-slate-900 font-extrabold text-base">Enter Verification Code</p>
                <p className="text-xs text-slate-600">
                  Sent to <span className="font-bold text-emerald-800">{formData.email}</span>
                </p>
                <button
                  type="button"
                  onClick={handleEditDetails}
                  className="text-[11px] text-slate-500 hover:text-emerald-700 underline font-semibold mt-0.5"
                >
                  Change details / email
                </button>
              </div>

              {/* 6-box OTP input */}
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-xl font-bold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Code expires in 10 minutes</span>
                {resendCooldown > 0 ? (
                  <span className="font-semibold text-slate-400">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {/* Verify button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl font-bold text-base shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            </form>
          )}

          {/* Login link */}
          <div className="mt-6 text-center border-t border-slate-200 pt-6">
            <p className="text-slate-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-700 font-bold hover:text-emerald-800">
                Log in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}