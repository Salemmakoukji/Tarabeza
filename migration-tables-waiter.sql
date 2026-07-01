-- ==========================================
-- MIGRATION: Table Management + Call Waiter
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. RESTAURANT TABLES
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    table_name TEXT,
    capacity INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(restaurant_id, table_number)
);

-- 2. WAITER CALLS
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    call_type TEXT DEFAULT 'service' NOT NULL CHECK (call_type IN ('service', 'bill', 'help')),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'acknowledged', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant ON public.restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_restaurant ON public.waiter_calls(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status ON public.waiter_calls(status);

-- 4. ENABLE RLS
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- Restaurant Tables: owners can CRUD, public can view (for QR linking)
DROP POLICY IF EXISTS "Tables are viewable by everyone" ON public.restaurant_tables;
CREATE POLICY "Tables are viewable by everyone" ON public.restaurant_tables
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage their tables" ON public.restaurant_tables;
CREATE POLICY "Owners can manage their tables" ON public.restaurant_tables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE public.restaurants.id = public.restaurant_tables.restaurant_id
            AND public.restaurants.owner_id = auth.uid()
        )
    );

-- Waiter Calls: anyone can insert (diner calling), owners manage
DROP POLICY IF EXISTS "Anyone can call waiter" ON public.waiter_calls;
CREATE POLICY "Anyone can call waiter" ON public.waiter_calls
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can view and manage calls" ON public.waiter_calls;
CREATE POLICY "Owners can view and manage calls" ON public.waiter_calls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE public.restaurants.id = public.waiter_calls.restaurant_id
            AND public.restaurants.owner_id = auth.uid()
        )
    );

-- 6. ENABLE REALTIME (for live waiter call notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
