import { createBrowserClient } from '@supabase/ssr';

const getCookieDomain = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return host.includes('tarapeza.com') ? 'tarapeza.com' : undefined;
  }
  return undefined;
};

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    cookieOptions: {
      domain: getCookieDomain(),
      path: '/',
      secure: typeof window !== 'undefined' ? (window.location.protocol === 'https:' || window.location.hostname.includes('tarapeza.com')) : true,
      sameSite: 'lax',
    }
  }
);
