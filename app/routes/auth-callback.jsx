import { useEffect } from 'react';
import { supabase } from '../lib/supabase/client';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      
      if (hash) {
        // Let Supabase handle the hash automatically
        const { data, error } = await supabase.auth.getSession();
        
        if (data?.session) {
          // Write cookies for server-side auth support in dashboard loaders
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`;
          document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=86400; SameSite=Lax; Secure`;

          // Check if restaurant profile exists
          const { data: profile } = await supabase
            .from('restaurants')
            .select('id')
            .eq('owner_id', data.session.user.id)
            .maybeSingle();
          
          window.location.href = !profile 
            ? '/onboarding' 
            : '/dashboard';
        } else {
          window.location.href = '/login?error=Authentication+failed';
        }
      } else {
        window.location.href = '/login';
      }
    };

    // Small delay to let Supabase process the hash
    setTimeout(handleCallback, 500);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-white text-center">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Signing you in...</p>
      </div>
    </div>
  );
}
