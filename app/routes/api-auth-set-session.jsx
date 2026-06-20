import { createServerClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';

export async function action({ request }) {
  const { access_token, refresh_token } = await request.json();
  
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

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error || !data.session) {
    return Response.json(
      { success: false }, 
      { headers: responseHeaders }
    );
  }

  const { data: profile } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', data.session.user.id)
    .maybeSingle();

  return Response.json(
    { 
      success: true, 
      redirect: !profile ? '/onboarding' : '/dashboard' 
    },
    { headers: responseHeaders }
  );
}
