import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export const updateSession = async (request) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      cookieOptions: {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
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
