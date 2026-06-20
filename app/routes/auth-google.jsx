import { redirect } from 'react-router';
import { createClient } from '../lib/supabase/server';

export async function loader({ request }) {
  const supabase = await createClient(request);
  
  const url = new URL(request.url);
  const origin = url.origin;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  return redirect(data.url);
}

export default function AuthGoogleRedirect() {
  return null;
}
