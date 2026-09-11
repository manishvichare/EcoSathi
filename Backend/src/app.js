// src/app.js
// Sets up the Express app: middleware + all routes. server.js imports this
// and just handles starting the HTTP listener + DB connection.

const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const cityRoutes = require('./routes/cityRoutes');
const environmentRoutes = require('./routes/environmentRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes'); // handles /leaderboard and /tasks
const comparisonRoutes = require('./routes/comparisonRoutes');
const chatRoutes = require('./routes/chatRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const newsRoutes = require('./routes/newsRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ── Global middleware ──────────────────────────────────
const customOrigins = (env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://eco-sathi-blue.vercel.app',
  ...customOrigins,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        customOrigins.some((allowed) => normalizedOrigin === allowed) ||
        /^https:\/\/eco-sathi.*\.vercel\.app$/.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// ── Static file serving for uploaded photos ──────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── API health check ─────────────────────────────────────
// Keep diagnostics under /api so / can be used by the React application.
app.get('/api', (req, res) => {
  res.json({
    name: 'EcoSathi API Server',
    status: 'online',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

// ── Route mounting ──────────────────────────────────────
app.use('/api/auth', authRoutes);              // /api/auth/signup, /api/auth/login
app.use('/api/cities', cityRoutes);            // /api/cities/:name
app.use('/api/environment', environmentRoutes); // /api/environment/:city/today, /history
app.use('/api/complaints', complaintRoutes);    // /api/complaints, /api/complaints/:id
app.use('/api/notices', noticeRoutes);          // /api/notices/:city
app.use('/api', leaderboardRoutes);             // /api/leaderboard, /api/tasks/:id/complete
app.use('/api/compare', comparisonRoutes);      // /api/compare?cities=a,b
app.use('/api/chat', chatRoutes);              // /api/chat
app.use('/api/suggestions', suggestionRoutes);  // /api/suggestions/:city
app.use('/api/news', newsRoutes);              // /api/news

// ── Production frontend ───────────────────────────────────
// Render builds the Vite app into ../../frontend/dist. Serving it here means
// the browser and API share one origin, so no public API URL is needed.
const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// React Router routes must return index.html when opened directly. API and
// upload requests retain the JSON 404 below.
app.get('*', (req, res, next) => {
  const acceptsHtml = req.accepts(['html', 'json']) === 'html';
  if (req.method === 'GET' && acceptsHtml && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    return res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  }
  return next();
});

// ── JSON 404 fallback ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Centralized error handler (must be LAST) ────────────────
app.use(errorHandler);

module.exports = app;
