import { useEffect } from 'react';
import { redirect } from 'react-router';
import { createServerClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error)}`);
  }

  // If no code, might be hash-based flow
  // Let the client component handle it
  if (!code) {
    return null; // Don't redirect - let client handle hash
  }

  // Handle PKCE flow (code-based)
  const cookies = parse(request.headers.get('Cookie') || '');
  const responseHeaders = new Headers();

  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) { return cookies[key]; },
        set(key, value, options) {
          responseHeaders.append('Set-Cookie',
            serialize(key, value, {
              ...options,
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/',
            })
          );
        },
        remove(key, options) {
          responseHeaders.append('Set-Cookie',
            serialize(key, '', { ...options, maxAge: 0, path: '/' })
          );
        },
      },
    }
  );

  const { data, error: sessionError } = 
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !data?.session) {
    return redirect(`/login?error=Authentication+failed`,
      { headers: responseHeaders }
    );
  }

  const { data: profile } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', data.session.user.id)
    .maybeSingle();

  return redirect(!profile ? '/onboarding' : '/dashboard',
    { headers: responseHeaders }
  );
}

// Client component handles hash-based tokens
export default function AuthCallback() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      // Send tokens to server to set cookies
      fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          access_token: accessToken, 
          refresh_token: refreshToken 
        }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.href = data.redirect;
        } else {
          window.location.href = '/login?error=Authentication+failed';
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-white text-center">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Signing you in...</p>
      </div>
    </div>
  );
}
