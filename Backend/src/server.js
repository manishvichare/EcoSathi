// src/server.js
const env = require('./config/env');            // loads & validates .env
const { connectDB } = require('./config/db');   // Supabase connectivity check
const app = require('./app');                   // Express app with all routes mounted
const { startDailyFetchJob } = require('./jobs/dailyFetchJob');
const seedInitialData = require('./utils/seedData');

// Start listening immediately
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

// Check Supabase connectivity, seed initial data, then start cron job
connectDB().then(async () => {
  try {
    await seedInitialData();
  } catch (seedErr) {
    console.warn('ℹ️ Seed data skipped/already seeded.');
  }

  startDailyFetchJob();
});