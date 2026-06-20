import { createClient } from '@supabase/supabase-js';

let _supabase = null;

export function getSupabase() {
  if (!_supabase) {
    const url = typeof window !== 'undefined'
      ? (import.meta.env.VITE_SUPABASE_URL || '')
      : (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '');
    const key = typeof window !== 'undefined'
      ? (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
      : (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Backwards-compatible named export (lazy proxy)
// This allows existing `import { supabase } from '../lib/supabase/client'` to keep working
// by evaluating only when a property is accessed, not at import time.
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  },
});
