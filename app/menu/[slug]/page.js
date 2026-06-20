import { createClient } from '@supabase/supabase-js';
import MenuViewClient from './menu-client';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const revalidate = 60; // Enable ISR (Incremental Static Regeneration)
export const dynamicParams = true; // Enable SSG fallbacks for new registrations

// Generate static parameters during production build
export async function generateStaticParams() {
  const supabase = getSupabaseClient();
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('slug');

  return (restaurants || []).map((r) => ({
    slug: r.slug,
  }));
}

// Generate dynamic metadata for search engine indexing and social network cards
export async function generateMetadata({ params }) {
  const supabase = getSupabaseClient();
  const { slug } = await params;

  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!profile) return {};

  const name = profile.name;
  const description = profile.description || `Explore our interactive digital QR menu for ${name}. View categories, dishes, ingredients, and prices in English & Arabic.`;
  const logo = profile.logo_url || '/og-image.png';

  return {
    title: `${name} - Interactive Digital Menu | Tarapeza`,
    description,
    alternates: {
      canonical: `https://tarapeza.com/menu/${slug}`,
      languages: {
        'en-US': `https://tarapeza.com/menu/${slug}?lang=en`,
        'ar-SA': `https://tarapeza.com/menu/${slug}?lang=ar`,
      },
    },
    openGraph: {
      title: `${name} - Digital Menu | Tarapeza`,
      description,
      url: `https://tarapeza.com/menu/${slug}`,
      siteName: 'Tarapeza',
      images: [
        {
          url: logo,
          alt: `${name} Logo`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} - Digital Menu | Tarapeza`,
      description,
      images: [logo],
    },
  };
}

export default async function PublicMenuPage({ params }) {
  const supabase = getSupabaseClient();
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

  // Generate JSON-LD Structured Data Schema for Restaurant Menus
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    'name': profile.name,
    'image': profile.cover_url || profile.logo_url || 'https://tarapeza.com/og-image.png',
    'description': profile.description || `Digital QR menu for ${profile.name}`,
    'telephone': profile.phone || '',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': profile.address || '',
    },
    'hasMenu': {
      '@type': 'FoodMenu',
      'name': `${profile.name} Menu`,
      'hasMenuSection': categories.map((cat) => ({
        '@type': 'MenuSection',
        'name': cat.name_ar && cat.name ? `${cat.name} / ${cat.name_ar}` : (cat.name || cat.name_ar || ''),
        'hasMenuItem': items
          .filter((item) => item.category_id === cat.id)
          .map((item) => ({
            '@type': 'MenuItem',
            'name': item.name_ar && item.name ? `${item.name} / ${item.name_ar}` : (item.name || item.name_ar || ''),
            'description': item.description_ar && item.description ? `${item.description} / ${item.description_ar}` : (item.description || item.description_ar || ''),
            'offers': {
              '@type': 'Offer',
              'price': item.price,
              'priceCurrency': profile.currency || 'USD',
            },
          })),
      })),
    },
  };

  return (
    <>
      {/* Inject JSON-LD Schema to page document */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MenuViewClient 
        profile={profile} 
        categories={categories || []} 
        menuItems={items || []} 
        initialRatings={ratings || []}
      />
    </>
  );
}
