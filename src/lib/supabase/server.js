import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isProdDomain = host.includes('tarapeza.com');
  const cookieDomain = isProdDomain ? 'tarapeza.com' : undefined;
  const isHttps = isProdDomain || process.env.NODE_ENV === 'production';

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
                secure: isHttps,
                sameSite: 'lax',
                path: '/',
                domain: cookieDomain,
              });
            });
          } catch (error) {
            // Can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
      cookieOptions: {
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
      }
    }
  );
};
