-- Supabase SQL Schema for Tarapeza
-- Enable UUID generation extension if not enabled
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. RESTAURANTS TABLE
-- =========================================================================
create table public.restaurants (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  logo_url text,
  cover_url text,
  description text,
  theme_color text default '#f97316',
  template_id text default 'classic-dark',
  theme_id text default 'obsidian-dark',
  phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.restaurants enable row level security;

-- Policies for Restaurants
create policy "Allow public read access to restaurants"
  on public.restaurants for select
  using (true);

create policy "Allow owners to insert their own restaurant"
  on public.restaurants for insert
  with check (auth.uid() = owner_id);

create policy "Allow owners to update their own restaurant"
  on public.restaurants for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Allow owners to delete their own restaurant"
  on public.restaurants for delete
  using (auth.uid() = owner_id);


-- =========================================================================
-- 2. CATEGORIES TABLE
-- =========================================================================
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  order_index integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.categories enable row level security;

-- Policies for Categories
create policy "Allow public read access to categories"
  on public.categories for select
  using (true);

create policy "Allow owners full control over their categories"
  on public.categories for all
  using (
    exists (
      select 1 from public.restaurants r 
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.restaurants r 
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );


-- =========================================================================
-- 3. MENU ITEMS TABLE
-- =========================================================================
create table public.menu_items (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.categories(id) on delete cascade not null,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  available boolean default true not null,
  allergens text[] default '{}'::text[] not null,
  order_index integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.menu_items enable row level security;

-- Policies for Menu Items
create policy "Allow public read access to menu items"
  on public.menu_items for select
  using (true);

create policy "Allow owners full control over their menu items"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.restaurants r 
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.restaurants r 
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );


-- =========================================================================
-- 4. SUBSCRIPTIONS TABLE
-- =========================================================================
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  plan text not null default 'free',
  status text not null default 'active',
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Policies for Subscriptions
create policy "Allow owners to view their own subscription"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.restaurants r 
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Allow owners to insert their own subscription"
  on public.subscriptions for insert
  with check (
    exists (
      select 1 from public.restaurants r 
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Allow owners to update their own subscription"
  on public.subscriptions for update
  using (
    exists (
      select 1 from public.restaurants r 
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.restaurants r 
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );


-- =========================================================================
-- 5. SIGNUP TRIGGER (AUTOMATIC RESTAURANT ROW CREATION)
-- =========================================================================
-- Automatically creates a default restaurant entry for a user upon sign up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  restaurant_slug text;
begin
  -- Create a unique slug based on email username prefix + random digits
  restaurant_slug := split_part(new.email, '@', 1) || '-' || floor(random() * 1000)::text;
  
  insert into public.restaurants (owner_id, name, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'restaurant_name', 'My Restaurant'),
    restaurant_slug
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================================================================
-- 6. RATINGS TABLE
-- =========================================================================
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  stars integer not null check (stars >= 1 and stars <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ratings enable row level security;

-- Policies for Ratings
create policy "Allow public read access to ratings"
  on public.ratings for select
  using (true);

create policy "Allow public insert access to ratings"
  on public.ratings for insert
  with check (true);

-- Migration for adding template_id
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS template_id text DEFAULT 'classic-dark';

-- Migration for adding theme_id
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS theme_id text DEFAULT 'obsidian-dark';

-- Migration for bilingual menu data
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_ar text;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS name_ar text;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS description_ar text;

-- Migration for Wi-Fi sharing credentials
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS wifi_ssid text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS wifi_password text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS wifi_encryption text DEFAULT 'WPA';

-- Migration for QR styling features
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_fg_color text DEFAULT '#000000';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_fg_color2 text DEFAULT '#f97316';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_bg_color text DEFAULT '#ffffff';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_style_type text DEFAULT 'solid';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_gradient_direction text DEFAULT 'diagonal';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_dot_style text DEFAULT 'square';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_eye_style text DEFAULT 'square';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_eye_color text DEFAULT '#000000';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_show_logo boolean DEFAULT true;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_logo_style text DEFAULT 'square';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_font_family text DEFAULT 'helvetica';

-- Migration for custom business currency
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Migration for happy hour / promotion banner
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promo_banner_active boolean DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promo_banner_text text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promo_banner_text_ar text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promo_banner_color text DEFAULT 'accent';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS promo_banner_scroll boolean DEFAULT false;

-- Migration for menu item custom badges
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS badge text;

-- =========================================================================
-- 7. CUSTOMER PROFILES, FAVORITES & LOYALTY TABLES
-- =========================================================================

-- Create customer profiles table
create table if not exists public.customer_profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  full_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Customer Profiles
alter table public.customer_profiles enable row level security;

create policy "Allow public read access to customer profiles"
  on public.customer_profiles for select
  using (true);

create policy "Allow customers full control over their own profile"
  on public.customer_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create customer favorites table
create table if not exists public.customer_favorites (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.customer_profiles(id) on delete cascade not null,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (customer_id, restaurant_id)
);

-- Enable RLS for Customer Favorites
alter table public.customer_favorites enable row level security;

create policy "Allow owners to manage their favorites"
  on public.customer_favorites for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- Create customer loyalty stamps table
create table if not exists public.customer_loyalty (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.customer_profiles(id) on delete cascade not null,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  stamps_count integer default 1 not null check (stamps_count >= 0 and stamps_count <= 6),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (customer_id, restaurant_id)
);

-- Enable RLS for Customer Loyalty
alter table public.customer_loyalty enable row level security;

create policy "Allow users to view their own loyalty stamps"
  on public.customer_loyalty for select
  using (auth.uid() = customer_id);

create policy "Allow users to update their own loyalty stamps"
  on public.customer_loyalty for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- Add customer_id to ratings table
alter table public.ratings add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null;

-- Recreate trigger function handle_new_user to distinguish role metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  restaurant_slug text;
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'merchant');
  
  if user_role = 'merchant' then
    -- Create a unique slug based on email username prefix + random digits
    restaurant_slug := split_part(new.email, '@', 1) || '-' || floor(random() * 1000)::text;
    
    insert into public.restaurants (owner_id, name, slug)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'restaurant_name', 'My Restaurant'),
      restaurant_slug
    );
  else
    -- Create customer profile
    insert into public.customer_profiles (id, full_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'Diner')
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;





