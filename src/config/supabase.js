const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    broadcast: { ack: false },
  },
  global: {
    headers: {
      'User-Agent': 'garantia-app/1.0',
    },
  },
});

module.exports = { supabase };
