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
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin or matching allowed origins, or in dev mode
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

// ── Static file serving for uploaded photos ──────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health check ────────────────────────────────────────
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

// ── 404 fallback ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Centralized error handler (must be LAST) ────────────────
app.use(errorHandler);

module.exports = app;