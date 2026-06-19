import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export const updateSession = async (request) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const host = request.headers.get('host') || '';
  const cookieDomain = host.includes('tarapeza.com') ? '.tarapeza.com' : undefined;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gijgxturrhglkucpgdnp.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpamd4dHVycmhnbGt1Y3BnZG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTQ3NTQsImV4cCI6MjA5NzE5MDc1NH0.Y4vZ28BvCr8pJtZbHb73O8MCbbC7BNvR8vomwPfFUh8',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const isHttps = request.nextUrl.protocol === 'https:';
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: false,
              secure: isHttps,
              sameSite: 'lax',
              path: '/',
              domain: cookieDomain,
            })
          );
        },
      },
      cookieOptions: {
        httpOnly: false,
        secure: request.nextUrl.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
      }
    }
  );

  // Validate session and refresh tokens if needed
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const isDashboardRoute = url.pathname.startsWith('/dashboard');

  if (isDashboardRoute) {
    if (userError || !user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('from', 'middleware');
      redirectUrl.searchParams.set('url_val', process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined');
      if (userError) {
        redirectUrl.searchParams.set('reason', userError.message);
      } else {
        redirectUrl.searchParams.set('reason', 'Auth session missing!');
      }

      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Copy any updated cookies (like cleared tokens) from the Supabase response to the redirect response
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });

      return redirectResponse;
    }
  }

  return supabaseResponse;
};
