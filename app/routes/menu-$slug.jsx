import { useLoaderData, Link } from 'react-router';
import MenuViewClient from './menu-client';
import { getTemplateDefaults, generateCssStyles } from '../lib/templates';
import { createClient } from '@supabase/supabase-js';

export async function loader({ request, params }) {
  const { slug } = params;

  const url = new URL(request.url);
  const isPreview = url.searchParams.get('preview') === 'true';
  const previewTemplate = url.searchParams.get('template');
  const previewAccent = url.searchParams.get('accent');

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (profile) {
    if (isPreview) {
      if (previewTemplate) profile.template_id = previewTemplate;
      if (previewAccent) profile.accent_color = previewAccent;

      const previewCustomization = url.searchParams.get('customization');
      if (previewCustomization) {
        try {
          profile.customization = JSON.parse(decodeURIComponent(previewCustomization));
        } catch (e) {
          console.error("Failed to parse preview customization from URL", e);
        }
      }
    }
  }

  if (!profile) {
    return {
      profile: null,
      categories: [],
      menuItems: [],
      ratings: [],
      mergedCustomization: null,
      cssStyles: '',
      fontUrl: ''
    };
  }

  // Get template defaults and merge with saved customization
  const templateDefaults = getTemplateDefaults(profile.template_id || 'classic');
  const savedCustomization = profile.customization || {};

  const mergedCustomization = {
    colors: { ...templateDefaults.colors, ...savedCustomization.colors },
    fonts: { ...templateDefaults.fonts, ...savedCustomization.fonts },
    layout: { ...templateDefaults.layout, ...savedCustomization.layout },
    badges: { ...templateDefaults.badges, ...savedCustomization.badges },
    customCss: savedCustomization.customCss || '',
  };

  // Generate CSS styles from merged customization
  const cssStyles = generateCssStyles(mergedCustomization);

  // Build Google Fonts URL
  const headingFont = mergedCustomization.fonts.heading || 'Inter';
  const bodyFont = mergedCustomization.fonts.body || 'Inter';
  const fontFamilies = [...new Set([headingFont, bodyFont])];
  const fontUrl = `https://fonts.googleapis.com/css2?${fontFamilies.map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900`).join('&')}&display=swap`;

  // 2. Fetch Categories, Menu Items, and Ratings in parallel
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

  return {
    profile,
    categories: categoriesRes.data || [],
    menuItems: itemsRes.data || [],
    ratings: ratingsRes.data || [],
    mergedCustomization,
    cssStyles,
    fontUrl
  };
}

export function meta({ data }) {
  if (!data || !data.profile) {
    return [
      { title: "Menu Not Found | Tarapeza" }
    ];
  }
  const { profile } = data;
  const title = `${profile.name} - Interactive Digital Menu | Tarapeza`;
  const description = profile.description || `Explore our interactive digital QR menu for ${profile.name}. View categories, dishes, ingredients, and prices in English & Arabic.`;
  const logo = profile.logo_url || '/og-image.png';

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: `${profile.name} - Digital Menu | Tarapeza` },
    { property: "og:description", content: description },
    { property: "og:url", content: `https://tarapeza.com/menu/${profile.slug}` },
    { property: "og:image", content: logo },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `${profile.name} - Digital Menu | Tarapeza` },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: logo }
  ];
}

export default function PublicMenuPage() {
  const { profile, categories, menuItems, ratings, mergedCustomization, cssStyles, fontUrl } = useLoaderData();

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center font-sans">
        <div className="h-16 w-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-6 text-slate-400">
          <span className="text-2xl font-black">?</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Menu Not Found</h1>
        <p className="text-slate-505 text-sm max-w-xs leading-normal mb-6">
          The digital menu you are trying to access does not exist or has been disabled by the restaurant.
        </p>
        <Link to="/restaurants" className="text-sm font-bold text-orange-500 hover:underline">
          Browse Directory
        </Link>
      </div>
    );
  }

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
        'hasMenuItem': menuItems
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
      {/* Inject Google Fonts */}
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} />
      )}
      {/* Inject customization CSS */}
      {cssStyles && (
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MenuViewClient
        profile={profile}
        categories={categories}
        menuItems={menuItems}
        initialRatings={ratings}
        customization={mergedCustomization}
      />
    </>
  );
}
