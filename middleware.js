import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const host = request.headers.get('host') || '';
  const isProdDomain = host.includes('tarapeza.com');
  const cookieDomain = isProdDomain ? 'tarapeza.com' : undefined;
  const isHttps = isProdDomain || request.nextUrl.protocol === 'https:';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: isHttps,
              sameSite: 'lax',
              path: '/',
              domain: cookieDomain,
            })
          );
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

  // IMPORTANT: Do NOT use getSession() on server side, use getUser() instead
  const { data: { user } } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('from', 'middleware');

      const response = NextResponse.redirect(redirectUrl);

      // Copy cookies to redirect response to persist updated session or clears
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, {
          ...cookie,
          secure: isHttps,
          sameSite: 'lax',
          domain: cookieDomain,
          path: '/',
        });
      });
      return response;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
