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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: restaurants } = await supabase.from('restaurants').select('id, name, slug');
  for (const r of restaurants || []) {
    console.log(`\n===========================================`);
    console.log(`RESTAURANT: ${r.name} (id: ${r.id}, slug: ${r.slug})`);
    console.log(`===========================================`);
    
    const { data: categories } = await supabase.from('categories').select('*').eq('restaurant_id', r.id);
    console.log(`Categories (${categories?.length || 0}):`);
    console.log(categories);

    const { data: items } = await supabase.from('menu_items').select('*').eq('restaurant_id', r.id);
    console.log(`Menu Items (${items?.length || 0}):`);
    console.log(items);
  }
}

inspect();
