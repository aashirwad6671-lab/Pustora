-- ==========================================================
-- PUSTORA PRODUCTION DATABASE MIGRATION (17 CORE TABLES)
-- ==========================================================

-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom database types and enums
CREATE TYPE public.user_role AS ENUM ('student', 'parent', 'teacher', 'general', 'delivery_partner', 'admin');
CREATE TYPE public.order_status AS ENUM ('placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE public.ticket_status AS ENUM ('open', 'active', 'closed');
CREATE TYPE public.delivery_partner_status AS ENUM ('active', 'busy', 'offline');

-- ==========================================
-- TABLE SCHEMAS DEFINITION
-- ==========================================

-- 1. USERS / PROFILES (Extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role public.user_role DEFAULT 'general'::public.user_role NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ADDRESSES
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home' NOT NULL, -- e.g. 'Home', 'Work', 'School'
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    area TEXT NOT NULL, -- e.g. 'Hazratganj', 'Gomti Nagar'
    city TEXT DEFAULT 'Lucknow' NOT NULL,
    state TEXT DEFAULT 'Uttar Pradesh' NOT NULL,
    pincode TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CATEGORIES
CREATE TABLE public.categories (
    id TEXT PRIMARY KEY, -- e.g. 'books', 'stationery', 'toys', 'games'
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PRODUCTS
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    sub_category TEXT NOT NULL, -- e.g. 'textbooks', 'notebooks', 'pens'
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    mrp DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    grade_suitability TEXT, -- e.g. 'Class 6', 'Age 10-12'
    subject_tag TEXT, -- e.g. 'Mathematics', 'Science'
    is_featured BOOLEAN DEFAULT false NOT NULL,
    is_bestseller BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_positive_price CHECK (price >= 0),
    CONSTRAINT check_mrp_higher CHECK (mrp >= price)
);

-- 5. INVENTORY
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    stock_quantity INT DEFAULT 0 NOT NULL,
    low_stock_threshold INT DEFAULT 5 NOT NULL,
    restock_history JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_positive_stock CHECK (stock_quantity >= 0),
    CONSTRAINT check_positive_threshold CHECK (low_stock_threshold >= 0)
);

-- 6. DELIVERY PARTNERS
CREATE TABLE public.delivery_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL, -- e.g. 'Bicycle', 'Bike'
    vehicle_number TEXT,
    status public.delivery_partner_status DEFAULT 'offline'::public.delivery_partner_status NOT NULL,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. STORES ( Lucknow stores to calculate nearest branch )
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ORDERS
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    address_id UUID NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
    status public.order_status DEFAULT 'placed'::public.order_status NOT NULL,
    items_total DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    discount_applied DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    grand_total DECIMAL(10, 2) NOT NULL,
    delivery_partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_positive_order_totals CHECK (items_total >= 0 AND grand_total >= 0)
);

-- 9. ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    CONSTRAINT check_positive_quantity CHECK (quantity > 0),
    CONSTRAINT check_positive_purchase_price CHECK (price_at_purchase >= 0)
);

-- 10. PAYMENTS
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL, -- e.g. 'COD', 'UPI', 'CARD'
    payment_status TEXT DEFAULT 'pending' NOT NULL, -- e.g. 'pending', 'paid', 'failed'
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_positive_payment_amt CHECK (amount >= 0)
);

-- 11. WISHLIST
CREATE TABLE public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- 12. REVIEWS
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5),
    UNIQUE(product_id, user_id)
);

-- 13. COUPONS
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    min_cart_value DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_coupon_discount CHECK (discount_amount > 0),
    CONSTRAINT check_coupon_min CHECK (min_cart_value >= 0)
);

-- 14. NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    type TEXT, -- e.g. 'order_status', 'flash_deal'
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. SUPPORT TICKETS
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status public.ticket_status DEFAULT 'open'::public.ticket_status NOT NULL,
    priority TEXT DEFAULT 'medium' NOT NULL, -- e.g. 'low', 'medium', 'high'
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. SUPPORT MESSAGES
CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. BANNERS
CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT NOT NULL,
    action_link TEXT, -- Screen slug/id to route to on tap
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. FLASH DEALS
CREATE TABLE public.flash_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    deal_price DECIMAL(10, 2) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_deal_price CHECK (deal_price >= 0),
    CONSTRAINT check_deal_dates CHECK (end_time > start_time)
);

-- 19. SYSTEM CONFIGURATION ENGINE
CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- ROW UPDATE TIMESTAMP TRIGGER LOGIC
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_addresses BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_inventory BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_delivery_partners BEFORE UPDATE ON public.delivery_partners FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_stores BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_support_tickets BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_update_system_settings BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================
-- INDEXING STRATEGY
-- ==========================================================
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_inventory_product ON public.inventory(product_id);
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_messages_ticket ON public.support_messages(ticket_id);
CREATE INDEX idx_flash_deals_active ON public.flash_deals(is_active);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR ALL 17 TABLES
-- ==========================================================

-- Enable Row Level Security (RLS) on all core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper admin checker function to optimize policies
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'::public.user_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Profiles - Read Self" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles - Update Self" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles - Admin All" ON public.profiles FOR ALL USING (public.is_admin(auth.uid()));

-- 2. Addresses Policies
CREATE POLICY "Addresses - Read Self" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Addresses - Write Self" ON public.addresses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Addresses - Admin All" ON public.addresses FOR ALL USING (public.is_admin(auth.uid()));

-- 3. Categories Policies
CREATE POLICY "Categories - Anyone Read" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Categories - Admin All" ON public.categories FOR ALL USING (public.is_admin(auth.uid()));

-- 4. Products Policies
CREATE POLICY "Products - Anyone Read" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Products - Admin All" ON public.products FOR ALL USING (public.is_admin(auth.uid()));

-- 5. Inventory Policies
CREATE POLICY "Inventory - Admin All" ON public.inventory FOR ALL USING (public.is_admin(auth.uid()));

-- 6. Delivery Partners Policies
CREATE POLICY "Riders - Anyone Active Read" ON public.delivery_partners FOR SELECT USING (status = 'active'::public.delivery_partner_status);
CREATE POLICY "Riders - Rider Modify Self" ON public.delivery_partners FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Riders - Admin All" ON public.delivery_partners FOR ALL USING (public.is_admin(auth.uid()));

-- 7. Stores Policies
CREATE POLICY "Stores - Anyone Read" ON public.stores FOR SELECT USING (is_active = true);
CREATE POLICY "Stores - Admin All" ON public.stores FOR ALL USING (public.is_admin(auth.uid()));

-- 8. Orders Policies
CREATE POLICY "Orders - Read Self" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Orders - Insert Self" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Orders - Admin All" ON public.orders FOR ALL USING (public.is_admin(auth.uid()));

-- 9. Order Items Policies
CREATE POLICY "Order Items - Read Self" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Order Items - Insert Self" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Order Items - Admin All" ON public.order_items FOR ALL USING (public.is_admin(auth.uid()));

-- 10. Payments Policies
CREATE POLICY "Payments - Read Self" ON public.payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Payments - Admin All" ON public.payments FOR ALL USING (public.is_admin(auth.uid()));

-- 11. Wishlist Policies
CREATE POLICY "Wishlist - Read Self" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Wishlist - Write Self" ON public.wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Wishlist - Admin All" ON public.wishlist FOR ALL USING (public.is_admin(auth.uid()));

-- 12. Reviews Policies
CREATE POLICY "Reviews - Anyone Read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews - Write Self" ON public.reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Reviews - Admin All" ON public.reviews FOR ALL USING (public.is_admin(auth.uid()));

-- 13. Coupons Policies
CREATE POLICY "Coupons - Authenticated Read" ON public.coupons FOR SELECT TO authenticated USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Coupons - Admin All" ON public.coupons FOR ALL USING (public.is_admin(auth.uid()));

-- 14. Notifications Policies
CREATE POLICY "Notifications - Read Self" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications - Update Self" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Notifications - Admin All" ON public.notifications FOR ALL USING (public.is_admin(auth.uid()));

-- 15. Support Tickets Policies
CREATE POLICY "Tickets - Read Self" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tickets - Insert Self" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tickets - Admin All" ON public.support_tickets FOR ALL USING (public.is_admin(auth.uid()));

-- 16. Support Messages Policies
CREATE POLICY "Support Messages - Read Self" ON public.support_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE support_tickets.id = ticket_id AND support_tickets.user_id = auth.uid())
);
CREATE POLICY "Support Messages - Insert Self" ON public.support_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE support_tickets.id = ticket_id AND support_tickets.user_id = auth.uid())
);
CREATE POLICY "Support Messages - Admin All" ON public.support_messages FOR ALL USING (public.is_admin(auth.uid()));

-- 17. Banners Policies
CREATE POLICY "Banners - Anyone Read" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Banners - Admin All" ON public.banners FOR ALL USING (public.is_admin(auth.uid()));

-- 18. Flash Deals Policies
CREATE POLICY "Flash Deals - Anyone Read" ON public.flash_deals FOR SELECT USING (is_active = true);
CREATE POLICY "Flash Deals - Admin All" ON public.flash_deals FOR ALL USING (public.is_admin(auth.uid()));

-- 19. System Settings Policies
CREATE POLICY "Settings - Anyone Read" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Settings - Admin All" ON public.system_settings FOR ALL USING (public.is_admin(auth.uid()));


-- ==========================================================
-- SUPABASE STORAGE BUCKETS & POLICIES
-- ==========================================================

-- Insert public bucket configuration row
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pustora-media', 'pustora-media', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Storage - Public Read Access to pustora-media bucket
CREATE POLICY "Storage - Anyone Read Pustora Media" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'pustora-media');

-- 2. Storage - Authenticated users can insert/update their own profiles avatars
CREATE POLICY "Storage - Authenticated Insert Avatar" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'pustora-media' AND (storage.foldername(name))[1] = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2]);

-- 3. Storage - Admin full access on all objects inside pustora-media
CREATE POLICY "Storage - Admin Full Access" 
    ON storage.objects FOR ALL 
    USING (
        bucket_id = 'pustora-media' AND 
        public.is_admin(auth.uid())
    );

-- ==========================================================
-- INVENTORY STOCK DECREMENT RPC FUNCTION
-- ==========================================================
CREATE OR REPLACE FUNCTION public.decrement_product_stock(prod_id UUID, qty_to_dec INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.inventory
    SET stock_quantity = stock_quantity - qty_to_dec
    WHERE product_id = prod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
