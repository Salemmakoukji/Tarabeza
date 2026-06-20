import { redirect } from 'react-router';
import { createClient } from '../lib/supabase/server';

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

  const supabase = await createClient(request);
  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !data?.session) {
    return redirect(`/login?error=${encodeURIComponent(sessionError?.message || 'Failed to authenticate session')}`);
  }

  const session = data.session;
  const user = session.user;

  // Retrieve restaurant profile to see if they have completed onboarding
  const { data: profile } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  // Redirect decision: if restaurant does not exist, onboarding is required.
  const redirectTarget = !profile ? '/onboarding' : '/dashboard';

  // Build redirection headers containing access/refresh tokens in cookies
  const responseHeaders = new Headers();
  responseHeaders.append('Set-Cookie', `sb-access-token=${session.access_token}; Path=/; Max-Age=3600; SameSite=Lax; Secure`);
  responseHeaders.append('Set-Cookie', `sb-refresh-token=${session.refresh_token}; Path=/; Max-Age=86400; SameSite=Lax; Secure`);

  return redirect(redirectTarget, {
    headers: responseHeaders,
  });
}

export default function AuthCallback() {
  return null;
}
