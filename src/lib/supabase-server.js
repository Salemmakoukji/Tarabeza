import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  const headersList = await headers();
  const xForwardedProto = headersList.get('x-forwarded-proto');
  const isHttps = xForwardedProto === 'https';

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gijgxturrhglkucpgdnp.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpamd4dHVycmhnbGt1Y3BnZG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTQ3NTQsImV4cCI6MjA5NzE5MDc1NH0.Y4vZ28BvCr8pJtZbHb73O8MCbbC7BNvR8vomwPfFUh8',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({
                name,
                value,
                ...options,
                httpOnly: false,
                secure: isHttps,
                sameSite: 'lax',
                path: '/',
              });
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      cookieOptions: {
        httpOnly: false,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
      }
    }
  );
};

