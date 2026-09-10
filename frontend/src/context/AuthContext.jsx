import { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  getMe,
  sendSignupOtp,
  verifyOtpSignup,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
  sendAuthorityOtp,
  loginAuthorityUser,
} from '../services/authService';

/**
 * AuthContext - Global authentication state
 * Provides user data and auth methods to all components
 */
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage on mount and sync with backend
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken && !storedToken.startsWith('mock-token-')) {
      try {
        setUser(JSON.parse(storedUser));

        // Revalidate and sync fresh role/points from server
        getMe()
          .then((res) => {
            if (res?.user) {
              setUser(res.user);
              localStorage.setItem('user', JSON.stringify(res.user));
            }
          })
          .catch((err) => {
            console.warn('Could not refresh profile from server:', err.message);
          });
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    
    setLoading(false);
  }, []);

  /**
   * Real login function calling Backend API with mock fallback if offline
   */
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await loginUser(email, password);
      if (data.token && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.warn('Backend login failed or offline:', err.message);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
        throw new Error(err.response.data.message);
      }
      
      // Dev fallback if backend service is offline
      const mockUser = {
        id: '1',
        email,
        name: email.split('@')[0],
        points: 0,
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('authToken', 'mock-token-' + Date.now());
      setUser(mockUser);
      return mockUser;
    }
  };

  /**
   * Step 1 — Send OTP for Signup: validate email + email a 6-digit code
   * @param {{ name, email, password, city }} userData
   */
  const sendOtp = async (userData) => {
    setError(null);
    try {
      const data = await sendSignupOtp(userData);
      return data; // { success, message, otpSent: true }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send verification email.';
      setError(msg);
      throw new Error(msg);
    }
  };

  /**
   * Step 2 — Verify OTP for Signup: verify OTP + create account + log in
   * @param {string} email
   * @param {string} otp
   */
  const verifyOtp = async (email, otp) => {
    setError(null);
    try {
      const data = await verifyOtpSignup(email, otp);
      if (data.token && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'OTP verification failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  /**
   * Forgot Password - Step 1: Send OTP to registered email
   */
  const forgotPasswordSendOtp = async (email) => {
    setError(null);
    try {
      const data = await sendForgotPasswordOtp(email);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send reset code.';
      setError(msg);
      throw new Error(msg);
    }
  };

  /**
   * Forgot Password - Step 2: Verify OTP
   */
  const forgotPasswordVerifyOtp = async (email, otp) => {
    setError(null);
    try {
      const data = await verifyForgotPasswordOtp(email, otp);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid verification code.';
      setError(msg);
      throw new Error(msg);
    }
  };

  /**
   * Forgot Password - Step 3: Reset password
   */
  const resetPassword = async (email, otp, newPassword) => {
    setError(null);
    try {
      const data = await resetPasswordWithOtp(email, otp, newPassword);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password.';
      setError(msg);
      throw new Error(msg);
    }
  };

  /**
   * Legacy alias
   */
  const signup = async (email, password, name, city = '') => {
    return sendOtp({ email, password, name, city });
  };

  /**
   * Logout user
   */
  const authoritySendOtp = async (email, password) => {
    setError(null);
    try {
      const data = await sendAuthorityOtp(email, password);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send authority verification code.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const authorityLogin = async (email, password, verificationCode) => {
    setError(null);
    try {
      const data = await loginAuthorityUser(email, password, verificationCode);
      if (data.token && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return data.user;
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authority verification failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    sendOtp,
    verifyOtp,
    forgotPasswordSendOtp,
    forgotPasswordVerifyOtp,
    resetPassword,
    authoritySendOtp,
    authorityLogin,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}