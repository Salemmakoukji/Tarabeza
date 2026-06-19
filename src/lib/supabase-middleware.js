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
    }
  );

  // IMPORTANT: Do NOT call supabase.auth.getSession() here.
  // Use getUser() instead — it sends a request to the Supabase Auth server
  // to revalidate the Auth token, while getSession does not.
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const role = user?.user_metadata?.role || 'merchant';

  // Helper to redirect while preserving Supabase cookie refreshes
  const redirectWithCookies = (targetUrl) => {
    const redirectResponse = NextResponse.redirect(targetUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
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
      return redirectWithCookies(url);
    }
  } else {
    // If logged in
    if (role === 'customer') {
      // Diners should only access diner dashboard
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
      // Merchants should only access merchant dashboard
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

  return supabaseResponse;
};
