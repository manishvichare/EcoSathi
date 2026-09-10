// Color Palette
export const COLORS = {
  primary: '#1b6b4a', // Dark forest green
  secondary: '#2d9659', // Eco green
  accent: '#14b8a6', // Teal
  light: '#f8f9fa', // Off-white
  white: '#ffffff',
  dark: '#1a1a1a',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

// Health Score Thresholds
export const HEALTH_SCORE = {
  CRITICAL: 30,
  LOW: 50,
  MODERATE: 70,
  GOOD: 85,
  EXCELLENT: 100,
};

// Health Score Labels and Colors
export const HEALTH_STATUS = {
  CRITICAL: { label: 'Critical', color: COLORS.danger, range: [0, 30] },
  LOW: { label: 'Low', color: COLORS.warning, range: [30, 50] },
  MODERATE: { label: 'Moderate', color: '#f59e0b', range: [50, 70] },
  GOOD: { label: 'Good', color: COLORS.success, range: [70, 85] },
  EXCELLENT: { label: 'Excellent', color: COLORS.success, range: [85, 100] },
};

// AQI Categories
export const AQI_CATEGORIES = {
  GOOD: { range: [0, 50], label: 'Good', color: COLORS.success },
  SATISFACTORY: { range: [51, 100], label: 'Satisfactory', color: '#84cc16' },
  MODERATELY_POLLUTED: { range: [101, 200], label: 'Moderately Polluted', color: COLORS.warning },
  POOR: { range: [201, 300], label: 'Poor', color: '#f97316' },
  VERY_POOR: { range: [301, 400], label: 'Very Poor', color: COLORS.danger },
  SEVERE: { range: [401, 500], label: 'Severe', color: '#7c2d12' },
};

// Complaint Severity Levels
export const COMPLAINT_SEVERITY = {
  LOW: { label: 'Low', color: COLORS.info, icon: '⚠️' },
  MEDIUM: { label: 'Medium', color: COLORS.warning, icon: '🔸' },
  HIGH: { label: 'High', color: '#f97316', icon: '🔴' },
  CRITICAL: { label: 'Critical', color: COLORS.danger, icon: '🚨' },
};

// Sample Cities (for demo/testing)
export const SAMPLE_CITIES = [
  { id: 1, name: 'Pune', country: 'India', lat: 18.5204, lng: 73.8567 },
  { id: 2, name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
  { id: 3, name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  { id: 4, name: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946 },
];

// Navigation Links
export const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/complaints', label: 'Report Issue' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/compare', label: 'Compare' },
  { path: '/about', label: 'About' },
];

// API Endpoints (used in services)
export const API_ENDPOINTS = {
  AUTH_SIGNUP: '/auth/signup',
  AUTH_LOGIN: '/auth/login',
  CITIES: '/cities',
  ENVIRONMENT_TODAY: '/environment/:city/today',
  ENVIRONMENT_HISTORY: '/environment/:city/history',
  COMPLAINTS: '/complaints',
  COMPLAINTS_DETAIL: '/complaints/:id',
  NOTICES: '/notices/:city',
  LEADERBOARD: '/leaderboard',
  TASKS: '/tasks',
  COMPARE: '/compare',
  CHAT: '/chat',
};

// Page Titles
export const PAGE_TITLES = {
  HOME: 'EcoSathi - Your City\'s Companion for a Greener Tomorrow',
  DASHBOARD: 'Environmental Dashboard - EcoSathi',
  COMPLAINTS: 'Report Environmental Issue - EcoSathi',
  LEADERBOARD: 'Eco Heroes Leaderboard - EcoSathi',
  COMPARE: 'Compare Cities - EcoSathi',
  ABOUT: 'About EcoSathi',
  LOGIN: 'Login - EcoSathi',
  SIGNUP: 'Sign Up - EcoSathi',
};

// Default Values
export const DEFAULTS = {
  CITY: 'Pune',
  LANGUAGE: 'en',
  DATE_FORMAT: 'DD MMM YYYY',
  TIME_FORMAT: 'HH:mm',
};

// Feature Flags (for enabling/disabling features)
export const FEATURES = {
  ENABLE_CHATBOT: true,
  ENABLE_PREDICTIONS: true,
  ENABLE_CITY_COMPARISON: true,
  ENABLE_LEADERBOARD: true,
  ENABLE_NEWS_FEED: true,
  ENABLE_ECO_TASKS: true,
};