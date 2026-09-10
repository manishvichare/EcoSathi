import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';

/**
 * Login Page with Integrated "Forgot Password" OTP Verification & Reset Flow
 *
 * Modes:
 * 1. 'login'          - Standard login form (email + password)
 * 2. 'forgot_email'   - User enters registered email to receive 6-digit OTP
 * 3. 'forgot_otp'     - User enters 6-digit OTP received in email
 * 4. 'forgot_reset'   - User creates & confirms new password
 */
import { 
  Shield, 
  Building2, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  KeyRound, 
  Lock, 
  CheckCircle2,
  AlertTriangle,
  Sparkles 
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo]   = useState('');
  const [loading, setLoading] = useState(false);

  // Portal selection: 'citizen' | 'authority'
  const [portalRole, setPortalRole] = useState('citizen');

  // Authority 2FA Verification flow: 'credentials' | 'verification'
  const [authorityStep, setAuthorityStep] = useState('credentials');
  const [authorityOtp, setAuthorityOtp] = useState(['', '', '', '', '', '']);
  const [authorityOfficerName, setAuthorityOfficerName] = useState('');

  // Forgot password flow states
  // 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_reset'
  const [mode, setMode] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef([]);
  const authorityOtpRefs = useRef([]);
  const navigate = useNavigate();
  const {
    login,
    authoritySendOtp,
    authorityLogin,
    forgotPasswordSendOtp,
    forgotPasswordVerifyOtp,
    resetPassword,
  } = useAuth();

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── 1. Citizen Login Submit ──────────────────────────────────
  const handleCitizenLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user?.role === 'admin' || user?.email === 'authority@ecosathi.gov.in') {
        navigate('/notices');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // ── 2. Authority Step 1: Validate Officer & Dispatch 2FA ─────
  const handleAuthorityCredentialSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const res = await authoritySendOtp(email, password);
      setAuthorityOfficerName(res?.officerName || 'Municipal Officer');
      setInfo(`Official 2FA verification code dispatched to ${email}. Please check your inbox.`);
      setAuthorityStep('verification');
      setResendCooldown(30);
      setTimeout(() => authorityOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || 'Authority credential validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── 3. Authority Step 2: Verify Code & Authenticate ──────────
  const handleAuthorityVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const code = authorityOtp.join('').trim();
    if (code.length < 6) {
      setError('Please enter the full 6-digit Municipal Verification Code.');
      return;
    }

    setLoading(true);
    try {
      await authorityLogin(email, password, code);
      navigate('/notices');
    } catch (err) {
      setError(err.message || 'Invalid or expired 2FA Verification Code.');
      setAuthorityOtp(['', '', '', '', '', '']);
      authorityOtpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend Authority 2FA Code
  const handleResendAuthorityOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await authoritySendOtp(email, password);
      setInfo(`A fresh 2FA verification code has been dispatched to ${email}.`);
      setResendCooldown(30);
      setAuthorityOtp(['', '', '', '', '', '']);
      authorityOtpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend 2FA verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Authority OTP Input Event Handlers
  const handleAuthorityOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...authorityOtp];
    next[index] = digit;
    setAuthorityOtp(next);
    setError('');

    if (digit && index < 5) {
      authorityOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleAuthorityOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !authorityOtp[index] && index > 0) {
      authorityOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleAuthorityOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...authorityOtp];
    [...pasted].forEach((ch, i) => { next[i] = ch; });
    setAuthorityOtp(next);
    authorityOtpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── 2. Forgot Password: Send OTP ────────────────────────────
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!resetEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordSendOtp(resetEmail.trim());
      setInfo(`A 6-digit reset code has been sent to ${resetEmail.trim()}. Check your inbox.`);
      setMode('forgot_otp');
      setResendCooldown(30);
    } catch (err) {
      setError(err.message || 'Failed to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  // ── 3. Forgot Password: OTP Input Handling ──────────────────
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    [...pasted].forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the reset code.');
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordVerifyOtp(resetEmail.trim(), code);
      setInfo('Code verified! Please enter your new password.');
      setMode('forgot_reset');
    } catch (err) {
      setError(err.message || 'Invalid or expired reset code.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Forgot Password flow
  const handleResendResetOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await forgotPasswordSendOtp(resetEmail.trim());
      setInfo(`A fresh 6-digit code has been sent to ${resetEmail.trim()}.`);
      setResendCooldown(30);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend reset code.');
    } finally {
      setLoading(false);
    }
  };

  // ── 4. Forgot Password: Set New Password ─────────────────────
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const code = otp.join('');
      await resetPassword(resetEmail.trim(), code, newPassword);
      setInfo('Password reset successfully! Please log in with your new password.');
      setEmail(resetEmail.trim());
      setPassword('');
      setMode('login');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setInfo('');
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-3 text-4xl font-black text-emerald-800 mb-2">
            <img src="/ecosathi-logo.jpg" alt="EcoSathi Official Logo" className="h-12 w-12 rounded-2xl shadow-sm" />
            <span className="bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">EcoSathi</span>
          </div>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            Urban Eco Intelligence & Environmental Governance Portal
          </p>
        </div>

        {/* Card */}
        <Card>
          {/* Notifications */}
          {info && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2 DISTINCT LOGIN OPTIONS: CITIZEN vs MUNICIPAL AUTHORITY      */}
          {/* ============================================================ */}
          {mode === 'login' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Select Login Option
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Role-Protected Gateways
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* OPTION 1: CITIZEN USER */}
                <button
                  type="button"
                  onClick={() => {
                    setPortalRole('citizen');
                    setAuthorityStep('credentials');
                    setError('');
                    setInfo('');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                    portalRole === 'citizen'
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`p-2 rounded-xl transition-colors ${
                      portalRole === 'citizen' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`block text-xs font-black tracking-tight ${
                        portalRole === 'citizen' ? 'text-emerald-950' : 'text-slate-800'
                      }`}>
                        Citizen Login
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Public Resident
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Report pollution, track AQI & earn eco badges
                  </p>
                </button>

                {/* OPTION 2: MUNICIPAL AUTHORITY */}
                <button
                  type="button"
                  onClick={() => {
                    setPortalRole('authority');
                    setError('');
                    setInfo('');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                    portalRole === 'authority'
                      ? 'bg-gradient-to-br from-purple-50 to-indigo-50/50 border-purple-600 ring-2 ring-purple-600/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`p-2 rounded-xl transition-colors ${
                      portalRole === 'authority' ? 'bg-purple-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`block text-xs font-black tracking-tight ${
                        portalRole === 'authority' ? 'text-purple-950' : 'text-slate-800'
                      }`}>
                        Authority Login
                      </span>
                      <span className="text-[10px] text-purple-700 font-black uppercase tracking-wider">
                        2FA Verified
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Municipal officers, BBMP, KSPCB squads
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* OPTION 1: CITIZEN USER LOGIN                                  */}
          {/* ============================================================ */}
          {mode === 'login' && portalRole === 'citizen' && (
            <form onSubmit={handleCitizenLoginSubmit} className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 mb-4 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
                <span className="text-base">🌱</span>
                <span>Access your personal citizen account, community reports, and active eco challenges.</span>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="citizen-email" className="block text-slate-700 font-bold text-xs mb-1.5">
                  Citizen Email Address
                </label>
                <input
                  id="citizen-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="citizen-password" className="block text-slate-700 font-bold text-xs mb-1.5">
                  Password
                </label>
                <input
                  id="citizen-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    switchMode('forgot_email');
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In as Citizen Resident'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Sign Up Link */}
              <div className="text-center border-t border-slate-100 pt-4 mt-2">
                <p className="text-slate-500 text-xs">
                  New to EcoSathi?{' '}
                  <Link to="/signup" className="text-emerald-700 font-bold hover:text-emerald-800">
                    Create a free citizen account
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* OPTION 2: MUNICIPAL AUTHORITY LOGIN WITH 2FA VERIFICATION    */}
          {/* ============================================================ */}
          {mode === 'login' && portalRole === 'authority' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Authority Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white space-y-1.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-300" />
                    <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                      Official Authority Gateway
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
                    2-Step Verification
                  </span>
                </div>
                <p className="text-xs text-purple-100 font-medium leading-relaxed">
                  Restricted to accredited municipal enforcement personnel and environmental officers.
                </p>
              </div>

              {/* ── SUB-STEP 2A: OFFICER CREDENTIALS ── */}
              {authorityStep === 'credentials' && (
                <form onSubmit={handleAuthorityCredentialSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="authority-email" className="block text-slate-700 font-bold text-xs mb-1.5">
                      Official Government / Authority Email
                    </label>
                    <input
                      id="authority-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@ecosathi.gov.in"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="authority-password" className="block text-slate-700 font-bold text-xs mb-1.5">
                      Authority Security Passphrase
                    </label>
                    <input
                      id="authority-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-700/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'Verifying clearance...' : 'Send 2FA Verification Code →'}</span>
                  </button>
                </form>
              )}

              {/* ── SUB-STEP 2B: 2-FACTOR SECURITY VERIFICATION CODE ── */}
              {authorityStep === 'verification' && (
                <form onSubmit={handleAuthorityVerifySubmit} className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 text-center space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-200/60 px-2 py-0.5 rounded-full">
                      Step 2: Two-Factor Verification
                    </span>
                    <h3 className="text-sm font-black text-purple-950">Enter Official 6-Digit Verification Code</h3>
                    <p className="text-xs text-purple-900 font-medium">
                      Accredited Officer: <strong>{authorityOfficerName || 'Municipal Officer'}</strong>
                    </p>
                    <p className="text-xs text-slate-600">
                      An official 2FA security code was sent to your registered email:
                    </p>
                    <p className="text-xs font-mono font-bold text-purple-900 bg-white/90 py-1 px-3 rounded-lg border border-purple-200 inline-block">
                      {email}
                    </p>
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      Please check your email inbox and enter the 6-digit code below.
                    </p>
                  </div>

                  {/* 6-box OTP input */}
                  <div className="flex justify-center gap-2 py-2" onPaste={handleAuthorityOtpPaste}>
                    {authorityOtp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (authorityOtpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleAuthorityOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleAuthorityOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-xl font-black border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition-colors bg-white text-purple-950"
                      />
                    ))}
                  </div>

                  {/* Resend & Timer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Code valid for 10 minutes</span>
                    {resendCooldown > 0 ? (
                      <span className="font-semibold text-slate-400">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendAuthorityOtp}
                        disabled={loading}
                        className="font-bold text-purple-700 hover:text-purple-800 underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-700/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'Verifying 2FA...' : 'Authenticate & Enter Authority Portal'}</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorityStep('credentials');
                        setError('');
                        setInfo('');
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-purple-700 underline cursor-pointer"
                    >
                      ← Re-enter Officer Email / Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. FORGOT PASSWORD: ENTER EMAIL                              */}
          {/* ============================================================ */}
          {mode === 'forgot_email' && (
            <form onSubmit={handleSendResetOtp} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-500">
                  Enter your registered EcoSathi email address. We'll send you a 6-digit verification code to reset your password.
                </p>
              </div>

              <div>
                <label htmlFor="resetEmail" className="block text-slate-700 font-bold text-sm mb-1.5">
                  Registered Email Address
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl font-bold text-base shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Sending verification code...' : 'Send Reset Code'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* 3. FORGOT PASSWORD: ENTER OTP                                */}
          {/* ============================================================ */}
          {mode === 'forgot_otp' && (
            <form onSubmit={handleVerifyResetOtp} className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900">Enter Reset Code</h3>
                <p className="text-xs text-slate-600">
                  We sent a 6-digit code to <span className="font-bold text-emerald-800">{resetEmail}</span>
                </p>
                <button
                  type="button"
                  onClick={() => switchMode('forgot_email')}
                  className="text-[11px] text-slate-500 hover:text-emerald-700 underline font-semibold mt-0.5 cursor-pointer"
                >
                  Change email address
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
                <span>Expires in 10 minutes</span>
                {resendCooldown > 0 ? (
                  <span className="font-semibold text-slate-400">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendResetOtp}
                    disabled={loading}
                    className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl font-bold text-base shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Verifying code...' : 'Verify Code'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* 4. FORGOT PASSWORD: SET NEW PASSWORD                         */}
          {/* ============================================================ */}
          {mode === 'forgot_reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Create New Password</h3>
                <p className="text-xs text-slate-500">
                  Please enter and confirm your new password for <span className="font-bold text-emerald-800">{resetEmail}</span>.
                </p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-slate-700 font-bold text-sm mb-1.5">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-slate-700 font-bold text-sm mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl font-bold text-base shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Saving new password...' : 'Set New Password & Log In'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}