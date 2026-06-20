import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MenuClient from './menu-client';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?from=menu');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!profile) {
    redirect('/login?from=menu_no_profile');
  }

  // Fetch categories ordered by order_index
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', profile.id)
    .order('order_index', { ascending: true });

  // Fetch menu items ordered by order_index
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', profile.id)
    .order('order_index', { ascending: true });

  return (
    <MenuClient 
      profile={profile}
      initialCategories={categories || []}
      initialMenuItems={menuItems || []}
    />
  );
}
