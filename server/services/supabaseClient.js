const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.DB_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client for storage operations
const supabaseAdmin = createClient(
  process.env.DB_URL,
  process.env.SUPABASE_STORAGE_KEY
);

module.exports = { supabase, supabaseAdmin };