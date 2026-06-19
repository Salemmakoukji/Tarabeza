import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?from=settings');
  }

  // Fetch the restaurant profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!profile) {
    redirect('/login?from=settings_no_profile');
  }

  return <SettingsClient initialProfile={profile} />;
}
