/**
 * logger.js
 * Lightweight logger for EcoSathi backend — zero external dependencies,
 * so there's nothing to install and nothing to break during the hackathon.
 *
 * Levels: debug < info < warn < error
 * Control verbosity with LOG_LEVEL in .env (default: 'info').
 *
 * Usage:
 *   const logger = require('../utils/logger');
 *   logger.info('Server started', { port: 5000 });
 *   logger.error('DB connection failed', err.message);
 *
 * As Express middleware (in app.js):
 *   app.use(logger.requestLogger);
 */

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

const currentLevel =
  LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, meta) {
  const base = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  if (meta === undefined) return base;

  try {
    const metaStr = typeof meta === 'string' ? meta : JSON.stringify(meta);
    return `${base} ${metaStr}`;
  } catch (err) {
    return `${base} [unserializable meta]`;
  }
}

function log(level, message, meta) {
  if (LEVELS[level] < currentLevel) return;

  const color = COLORS[level] || '';
  const formatted = formatMessage(level, message, meta);
  const output = `${color}${formatted}${COLORS.reset}`;

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

const logger = {
  debug: (message, meta) => log('debug', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),

  /**
   * Express middleware — logs every incoming request with status + timing.
   * Mount early in app.js: app.use(logger.requestLogger)
   */
  requestLogger: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const line = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
      if (res.statusCode >= 500) {
        logger.error(line);
      } else if (res.statusCode >= 400) {
        logger.warn(line);
      } else {
        logger.info(line);
      }
    });
    next();
  },
};

module.exports = logger;