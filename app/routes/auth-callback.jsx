import { redirect } from 'react-router';
import { createServerClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    return redirect('/login?error=Missing+authorization+code');
  }

  const cookies = parse(request.headers.get('Cookie') || '');
  const responseHeaders = new Headers();

  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          responseHeaders.append(
            'Set-Cookie',
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
          responseHeaders.append(
            'Set-Cookie',
            serialize(key, '', {
              ...options,
              maxAge: 0,
              path: '/',
            })
          );
        },
      },
    }
  );

  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !data?.session) {
    return redirect(
      `/login?error=${encodeURIComponent(sessionError?.message || 'Authentication failed')}`,
      { headers: responseHeaders }
    );
  }

  const user = data.session.user;

  const { data: profile } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  const redirectTarget = !profile ? '/onboarding' : '/dashboard';

  return redirect(redirectTarget, { headers: responseHeaders });
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-white text-center">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Signing you in...</p>
      </div>
    </div>
  );
}
