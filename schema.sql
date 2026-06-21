-- ==========================================
-- TARAPEZA DATABASE SCHEMA (POSTGRESQL)
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CUSTOMER PROFILES TABLE
-- Extends the default Supabase auth.users table
CREATE TABLE public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. RESTAURANTS TABLE
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    cover_url TEXT,
    accent_color TEXT DEFAULT '#f97316' NOT NULL,
    accent_color_2 TEXT DEFAULT '#ffffff' NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    layout_template TEXT DEFAULT 'grid' NOT NULL CHECK (layout_template IN ('grid', 'list', 'compact')),
    promo_announcement TEXT,
    wifi_ssid TEXT,
    wifi_password TEXT,
    wifi_name TEXT,
    custom_text TEXT,
    map_link TEXT,
    website TEXT,
    instagram TEXT,
    facebook TEXT,
    whatsapp TEXT,
    twitter TEXT,
    tiktok TEXT,
    youtube TEXT,
    tripadvisor TEXT,
    business_hours JSONB DEFAULT '{}'::jsonb NOT NULL,
    temporarily_closed BOOLEAN DEFAULT false NOT NULL,
    template_id TEXT DEFAULT 'classic' NOT NULL,
    customization JSONB DEFAULT '{}'::jsonb NOT NULL,
    custom_colors JSONB DEFAULT '{}'::jsonb NOT NULL,
    custom_fonts JSONB DEFAULT '{}'::jsonb NOT NULL,
    custom_layout JSONB DEFAULT '{}'::jsonb NOT NULL,
    custom_icons JSONB DEFAULT '{}'::jsonb NOT NULL,
    custom_css TEXT,
    display_mode TEXT DEFAULT 'image-text',
    image_size TEXT DEFAULT 'M',
    font_size TEXT DEFAULT 'M',
    layout_style TEXT DEFAULT 'classic',
    theme TEXT DEFAULT 'light',
    main_color TEXT DEFAULT '#f97316',
    font_family TEXT DEFAULT 'Inter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. MENU CATEGORIES TABLE
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. MENU ITEMS TABLE
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    allergens TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. RATINGS / REVIEWS TABLE
CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(restaurant_id, customer_id)
);

-- 6. CUSTOMER FAVORITES / BOOKMARKS TABLE
CREATE TABLE public.customer_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(customer_id, restaurant_id)
);

-- 7. CUSTOMER LOYALTY (COFFEE CARD) TABLE
CREATE TABLE public.customer_loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    stamps INTEGER DEFAULT 0 NOT NULL CHECK (stamps >= 0 AND stamps <= 8),
    reward_ready BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(customer_id, restaurant_id)
);

-- 8. QR CODE SCANS LOG TABLE
CREATE TABLE public.scans_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. SUPPORT TICKETS TABLE
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. SUBSCRIPTIONS TABLE
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'Basic' NOT NULL CHECK (plan IN ('Basic', 'Pro', 'Premium')),
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================
CREATE INDEX idx_restaurants_owner ON public.restaurants(owner_id);
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_categories_restaurant ON public.categories(restaurant_id);
CREATE INDEX idx_categories_order ON public.categories(sort_order);
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX idx_ratings_restaurant ON public.ratings(restaurant_id);
CREATE INDEX idx_favorites_customer ON public.customer_favorites(customer_id);
CREATE INDEX idx_loyalty_customer ON public.customer_loyalty(customer_id);
CREATE INDEX idx_scans_restaurant ON public.scans_log(restaurant_id);
CREATE INDEX idx_subscriptions_restaurant ON public.subscriptions(restaurant_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) HELPERS
-- ==========================================
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- EXAMPLE RLS POLICIES (Can be modified based on requirements)

-- Profiles: Anyone can view profiles, only user can edit
CREATE POLICY "Public profiles are viewable by everyone" ON public.customer_profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.customer_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Restaurants: Anyone can view restaurants, only owners can edit
CREATE POLICY "Restaurants are viewable by everyone" ON public.restaurants
    FOR SELECT USING (true);
CREATE POLICY "Owners can manage their own restaurant" ON public.restaurants
    FOR ALL USING (auth.uid() = owner_id);

-- Categories & Menu Items: Anyone can view, only restaurant owners can manage
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);
CREATE POLICY "Owners can manage their categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE public.restaurants.id = public.categories.restaurant_id 
            AND public.restaurants.owner_id = auth.uid()
        )
    );

CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items
    FOR SELECT USING (true);
CREATE POLICY "Owners can manage their menu items" ON public.menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.categories
            JOIN public.restaurants ON public.restaurants.id = public.categories.restaurant_id
            WHERE public.categories.id = public.menu_items.category_id
            AND public.restaurants.owner_id = auth.uid()
        )
    );
