import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export const updateSession = async (request) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
      cookieOptions: {
        name: 'lesmenu-auth-token',
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
    }
  );

  // This will refresh the session token if it is expired
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const role = user?.user_metadata?.role || 'merchant';

  // Helper to redirect while keeping updated cookies
  const redirectWithCookies = (targetUrl) => {
    const redirectResponse = NextResponse.redirect(targetUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie.options);
    });
    return redirectResponse;
  };

  if (!user) {
    // If not logged in and accessing protected pages, redirect to login
    if (
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/onboarding') ||
      url.pathname.startsWith('/customer/dashboard')
    ) {
      url.pathname = '/login';
      url.searchParams.set('error', 'middleware_no_user');
      url.searchParams.set('debug_url', process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing');
      url.searchParams.set('debug_key', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 12) + '...' : 'missing');
      return redirectWithCookies(url);
    }
  } else {
    // If logged in
    if (role === 'customer') {
      // Diners should only access diner dashboard, redirect if elsewhere
      if (
        url.pathname.startsWith('/dashboard') ||
        url.pathname.startsWith('/onboarding') ||
        url.pathname.startsWith('/login') ||
        url.pathname.startsWith('/register')
      ) {
        url.pathname = '/customer/dashboard';
        url.searchParams.set('error', 'middleware_customer_role_mismatch');
        return redirectWithCookies(url);
      }
    } else {
      // Merchants should only access merchant dashboard, redirect if diner dashboard or auth pages
      if (
        url.pathname.startsWith('/customer/dashboard') ||
        url.pathname.startsWith('/login') ||
        url.pathname.startsWith('/register')
      ) {
        url.pathname = '/dashboard';
        return redirectWithCookies(url);
      }
    }
  }

  return response;
};
