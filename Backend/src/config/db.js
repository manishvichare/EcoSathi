// src/config/db.js
// Initialises and exports a singleton Supabase client.
// Import { supabase } from this file anywhere a DB call is needed.

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const resilientFetch = async (url, options = {}) => {
  let attempts = 0;
  while (attempts < 3) {
    try {
      attempts++;
      return await fetch(url, options);
    } catch (err) {
      if (attempts >= 3) throw err;
      console.warn(`⚠️ Supabase fetch attempt ${attempts} failed (${err.message}), retrying...`);
      await new Promise((r) => setTimeout(r, 600));
    }
  }
};

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false, // server-side: no session storage needed
  },
  global: {
    fetch: resilientFetch,
  },
});

// Lightweight connectivity check — resolves once, used by server.js startup.
const connectDB = async () => {
  const { error } = await supabase.from('cities').select('id').limit(1);
  if (error) {
    console.warn(`⚠️  Supabase connectivity check warning: ${error.message}`);
    console.warn('ℹ️  Server will still start; check SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  } else {
    console.log('✅ Supabase connected successfully.');
  }
};

module.exports = { supabase, connectDB };