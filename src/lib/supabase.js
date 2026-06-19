import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gijgxturrhglkucpgdnp.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpamd4dHVycmhnbGt1Y3BnZG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTQ3NTQsImV4cCI6MjA5NzE5MDc1NH0.Y4vZ28BvCr8pJtZbHb73O8MCbbC7BNvR8vomwPfFUh8'
);
