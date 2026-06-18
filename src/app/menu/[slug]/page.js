import { createClient } from '@/lib/supabase-server';
import MenuViewClient from './menu-client';

export const dynamic = 'force-dynamic';

export default async function PublicMenuPage({ params }) {
  const supabase = createClient();
  const { slug } = await params;

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="h-16 w-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-6 text-slate-400">
          <span className="text-2xl font-black">?</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Menu Not Found</h1>
        <p className="text-slate-500 text-sm max-w-xs leading-normal">
          The digital menu you are trying to access does not exist or has been disabled by the restaurant.
        </p>
      </div>
    );
  }

  // 2. Fetch Categories, Menu Items, and Ratings in parallel (avoids waterfalls)
  const [categoriesRes, itemsRes, ratingsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', profile.id)
      .order('order_index', { ascending: true }),
    supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', profile.id)
      .order('order_index', { ascending: true }),
    supabase
      .from('ratings')
      .select('*, customer_profiles(full_name)')
      .eq('restaurant_id', profile.id)
  ]);

  const categories = categoriesRes.data || [];
  const items = itemsRes.data || [];
  const ratings = ratingsRes.data || [];

  return (
    <MenuViewClient 
      profile={profile} 
      categories={categories || []} 
      menuItems={items || []} 
      initialRatings={ratings || []}
    />
  );
}
