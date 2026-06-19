import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export const updateSession = async (request) => {
  let response = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // This will refresh the session token if it is expired
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const role = user?.user_metadata?.role || 'merchant';

  if (!user) {
    // If not logged in and accessing protected pages, redirect to login
    if (
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/onboarding') ||
      url.pathname.startsWith('/customer/dashboard')
    ) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
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
        return NextResponse.redirect(url);
      }
    } else {
      // Merchants should only access merchant dashboard, redirect if diner dashboard or auth pages
      if (
        url.pathname.startsWith('/customer/dashboard') ||
        url.pathname.startsWith('/login') ||
        url.pathname.startsWith('/register')
      ) {
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
};
