import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read and parse .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpColumns() {
  const { data, error } = await supabase.from('restaurants').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns in DB restaurants table:', Object.keys(data[0]));
    console.log('Full first row:', data[0]);
  } else {
    console.log('No rows found in restaurants table.');
  }
}

dumpColumns();
