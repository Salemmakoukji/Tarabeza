import { useLoaderData, Link } from 'react-router';
import MenuViewClient from './menu-client';
import { getTemplateDefaults, generateCssStyles } from '../lib/templates';
import { createClient } from '@supabase/supabase-js';

export async function loader({ request, params }) {
  try {
    const { slug } = params;

    const url = new URL(request.url);
    const isPreview = url.searchParams.get('preview') === 'true';
    const previewTemplate = url.searchParams.get('template');
    const previewAccent = url.searchParams.get('accent');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[menu-loader] Missing Supabase credentials');
      return {
        profile: null, categories: [], menuItems: [], ratings: [],
        mergedCustomization: null, cssStyles: '', fontUrl: ''
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch Restaurant
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (fetchError || !restaurant) {
      console.error('[menu-loader] Restaurant not found:', slug, fetchError?.message);
      return {
        profile: null, categories: [], menuItems: [], ratings: [],
        mergedCustomization: null, cssStyles: '', fontUrl: ''
      };
    }

    if (isPreview) {
      if (previewTemplate) restaurant.template_id = previewTemplate;
      if (previewAccent) restaurant.accent_color = previewAccent;

      const displayModeParam = url.searchParams.get('display_mode');
      const imageSizeParam = url.searchParams.get('image_size');
      const fontSizeParam = url.searchParams.get('font_size');
      const layoutStyleParam = url.searchParams.get('layout_style');
      const themeParam = url.searchParams.get('theme');
      const mainColorParam = url.searchParams.get('main_color');
      const fontFamilyParam = url.searchParams.get('font_family');

      if (displayModeParam) restaurant.display_mode = displayModeParam;
      if (imageSizeParam) restaurant.image_size = imageSizeParam;
      if (fontSizeParam) restaurant.font_size = fontSizeParam;
      if (layoutStyleParam) restaurant.layout_style = layoutStyleParam;
      if (themeParam) restaurant.theme = themeParam;
      if (mainColorParam) restaurant.main_color = mainColorParam;
      if (fontFamilyParam) restaurant.font_family = fontFamilyParam;

      // New columns preview mapping
      const coverUrlParam = url.searchParams.get('cover_url');
      const customTextParam = url.searchParams.get('custom_text');
      const mapLinkParam = url.searchParams.get('map_link');
      const websiteParam = url.searchParams.get('website');
      const instagramParam = url.searchParams.get('instagram');
      const facebookParam = url.searchParams.get('facebook');
      const whatsappParam = url.searchParams.get('whatsapp');
      const twitterParam = url.searchParams.get('twitter');
      const tiktokParam = url.searchParams.get('tiktok');
      const youtubeParam = url.searchParams.get('youtube');
      const tripadvisorParam = url.searchParams.get('tripadvisor');
      const wifiNameParam = url.searchParams.get('wifi_name');
      const wifiPasswordParam = url.searchParams.get('wifi_password');
      const businessHoursParam = url.searchParams.get('business_hours');
      const temporarilyClosedParam = url.searchParams.get('temporarily_closed');

      if (coverUrlParam) restaurant.cover_url = coverUrlParam;
      if (customTextParam) restaurant.custom_text = customTextParam;
      if (mapLinkParam) restaurant.map_link = mapLinkParam;
      if (websiteParam) restaurant.website = websiteParam;
      if (instagramParam) restaurant.instagram = instagramParam;
      if (facebookParam) restaurant.facebook = facebookParam;
      if (whatsappParam) restaurant.whatsapp = whatsappParam;
      if (twitterParam) restaurant.twitter = twitterParam;
      if (tiktokParam) restaurant.tiktok = tiktokParam;
      if (youtubeParam) restaurant.youtube = youtubeParam;
      if (tripadvisorParam) restaurant.tripadvisor = tripadvisorParam;
      if (wifiNameParam) restaurant.wifi_name = wifiNameParam;
      if (wifiPasswordParam) restaurant.wifi_password = wifiPasswordParam;
      if (businessHoursParam) {
        try {
          restaurant.business_hours = JSON.parse(decodeURIComponent(businessHoursParam));
        } catch (e) {}
      }
      if (temporarilyClosedParam) restaurant.temporarily_closed = temporarilyClosedParam === 'true';

      const previewCustomization = url.searchParams.get('customization');
      if (previewCustomization) {
        try {
          restaurant.customization = JSON.parse(decodeURIComponent(previewCustomization));
        } catch (e) {
          console.error("Failed to parse preview customization from URL", e);
        }
      }
    }

    // Get template defaults and merge with saved customization
    const templateDefaults = getTemplateDefaults(restaurant.template_id || 'classic');
    const savedCustomization = restaurant.customization || {};

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
    const activeFont = restaurant.font_family || mergedCustomization.fonts.heading || 'Inter';
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(activeFont)}:wght@350;400;500;600;700;800;900&display=swap`;

    // 2. Fetch Categories, Menu Items, and Ratings in parallel
    const [categoriesRes, itemsRes, ratingsRes] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('order_index', { ascending: true }),
      supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('order_index', { ascending: true }),
      supabase
        .from('ratings')
        .select('*, customer_profiles(full_name)')
        .eq('restaurant_id', restaurant.id)
    ]);

    return {
      profile: restaurant,
      categories: categoriesRes.data || [],
      menuItems: itemsRes.data || [],
      ratings: ratingsRes.data || [],
      mergedCustomization,
      cssStyles,
      fontUrl
    };
  } catch (err) {
    console.error('[menu-loader] Unexpected error:', err);
    return {
      profile: null, categories: [], menuItems: [], ratings: [],
      mergedCustomization: null, cssStyles: '', fontUrl: ''
    };
  }
}

export function meta({ loaderData }) {
  const profile = loaderData?.profile;
  const restaurantName = profile?.name;

  if (!restaurantName) {
    return [{ title: "Tarapeza | Digital QR Menu" }];
  }

  const description = profile.description || `View ${restaurantName} menu`;
  const logoUrl = profile.logo_url || '/og-image.png';

  return [
    { title: `${restaurantName} | Tarapeza` },
    { name: "description", content: description },
    { property: "og:title", content: `${restaurantName} | Tarapeza` },
    { property: "og:description", content: description },
    { property: "og:image", content: logoUrl },
    { name: "twitter:title", content: `${restaurantName} | Tarapeza` },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: logoUrl },
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

  const displayMode = profile.display_mode || 'image-text';
  const imageSize = profile.image_size || 'M';
  const fontSize = profile.font_size || 'M';
  const themeMode = profile.theme || 'light';
  const mainColor = profile.main_color || '#f97316';
  const fontFamily = profile.font_family || 'Inter';

  const imageSizeMap = { XS: '90px', S: '120px', M: '160px', L: '200px', XL: '250px' };
  const resolvedImageSize = imageSizeMap[imageSize] || '160px';

  const fontSizeMap = { S: '14px', M: '16px', L: '18px' };
  const resolvedFontSize = fontSizeMap[fontSize] || '16px';

  const themeColors = themeMode === 'dark' ? `
    --color-bg: #0F1524 !important;
    --color-card-bg: #1E293B !important;
    --color-text: #F8FAFC !important;
    --color-text-secondary: #94A3B8 !important;
    --color-border: #334155 !important;
    --color-tab-active: ${mainColor} !important;
    --color-tab-active-text: #ffffff !important;
    --color-tab-inactive: #1E293B !important;
    --color-tab-inactive-text: #94A3B8 !important;
    --color-price: ${mainColor} !important;
    --color-badge: ${mainColor} !important;
    --color-header: #1E293B !important;
  ` : `
    --color-bg: #FFFFFF !important;
    --color-card-bg: #F8FAFC !important;
    --color-text: #0F172A !important;
    --color-text-secondary: #64748B !important;
    --color-border: #E2E8F0 !important;
    --color-tab-active: ${mainColor} !important;
    --color-tab-active-text: #ffffff !important;
    --color-tab-inactive: #F1F5F9 !important;
    --color-tab-inactive-text: #64748B !important;
    --color-price: ${mainColor} !important;
    --color-badge: ${mainColor} !important;
    --color-header: #FFFFFF !important;
  `;

  const menuStyles = `
    :root {
      --color-accent: ${mainColor} !important;
      --primary-theme: ${mainColor} !important;
      --menu-accent: ${mainColor} !important;
      --menu-image-size: ${resolvedImageSize} !important;
      --menu-font-size: ${resolvedFontSize} !important;
      --menu-img-radius: 12px !important;
      ${themeColors}
    }
    
    html {
      font-size: var(--menu-font-size) !important;
      background-color: var(--color-bg) !important;
      color: var(--color-text) !important;
    }

    body, button, input, select, textarea, span, h1, h2, h3, h4, h5, h6, p, div {
      font-family: "${fontFamily}", sans-serif !important;
    }
  `;

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
      {/* Inject theme, color, layout custom overrides */}
      <style dangerouslySetInnerHTML={{ __html: menuStyles }} />
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