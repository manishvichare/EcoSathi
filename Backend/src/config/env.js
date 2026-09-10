// src/config/env.js
// Loads and validates environment variables in one place.
// Every other file should import config values FROM HERE instead of
// calling process.env.X directly — that way there's a single source of
// truth, and the app fails fast (at startup) if something required is missing.

require('dotenv').config();

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
];

// Fail fast: if a required var is missing, crash immediately with a clear
// message instead of failing later with a confusing runtime error.
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Create a .env file in Backend/ (see .env.example)');
  process.exit(1);
}

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // Database — Supabase
  SUPABASE_URL: (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, ''),
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // External APIs (used by aqiWeatherService.js, greenCoverService.js, aiClient.js)
  WAQI_API_TOKEN: process.env.WAQI_API_TOKEN || '',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',

  // CORS
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

module.exports = env;