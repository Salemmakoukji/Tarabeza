import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?from=dashboard');
  }

  // Fetch the restaurant profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!profile) {
    redirect('/login?from=dashboard_no_profile');
  }

  // Fetch stats in parallel
  const [catRes, itemsRes, ratingsRes, scansRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', profile.id),
    supabase
      .from('menu_items')
      .select('category_id')
      .eq('restaurant_id', profile.id),
    supabase
      .from('ratings')
      .select('*')
      .eq('restaurant_id', profile.id),
    supabase
      .from('scans_log')
      .select('scanned_at')
      .eq('restaurant_id', profile.id)
  ]);

  return (
    <DashboardClient 
      profile={profile}
      initialCategories={catRes.data || []}
      initialMenuItems={itemsRes.data || []}
      initialRatings={ratingsRes.data || []}
      initialScans={scansRes.data || []}
    />
  );
}
