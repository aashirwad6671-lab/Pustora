-- ==========================================================
-- PUSTORA MIGRATION 002: SCHOOLS, COMBOS & SDUI ENGINE
-- ==========================================================
-- Fully idempotent — safe to run multiple times without errors.
-- All CREATEs use IF NOT EXISTS. Triggers use DROP IF EXISTS first.
-- Policies use DO $$ blocks to skip if already present.
-- ==========================================================

-- ============================================================
-- GUARD: Ensure shared functions exist (defined in Migration 001).
-- CREATE OR REPLACE is always safe to re-run.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'::public.user_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 1: ADD SLUG COLUMN TO PRODUCTS (SEO-friendly URL keys)
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Auto-generate slug from name for any existing rows (lowercase, hyphenated)
UPDATE public.products
  SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  WHERE slug IS NULL;

-- Index for fast slug lookups (used on every product page load)
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- ============================================================
-- PART 2: SCHOOLS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.schools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  short_name  TEXT NOT NULL,
  logo_url    TEXT,
  city        TEXT DEFAULT 'Lucknow' NOT NULL,
  board       TEXT DEFAULT 'CBSE',
  is_featured BOOLEAN DEFAULT false NOT NULL,
  is_active   BOOLEAN DEFAULT true NOT NULL,
  sort_order  INT DEFAULT 0 NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS trigger_update_schools ON public.schools;
CREATE TRIGGER trigger_update_schools
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_schools_slug   ON public.schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_active ON public.schools(is_active);
CREATE INDEX IF NOT EXISTS idx_schools_city   ON public.schools(city);

-- ============================================================
-- PART 3: SCHOOL_CLASSES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.school_classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_name    TEXT NOT NULL,
  class_slug    TEXT NOT NULL,
  stream        TEXT,
  academic_year TEXT DEFAULT '2025-26' NOT NULL,
  is_active     BOOLEAN DEFAULT true NOT NULL,
  sort_order    INT DEFAULT 0 NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(school_id, class_slug, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_school_classes_school ON public.school_classes(school_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_active ON public.school_classes(is_active);

-- ============================================================
-- PART 4: COMBOS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.combos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_class_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  combo_image_url TEXT,
  total_price     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  mrp_total       DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  savings_pct     DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN mrp_total > 0 THEN ROUND(((mrp_total - total_price) / mrp_total) * 100, 2) ELSE 0 END
  ) STORED,
  is_active       BOOLEAN DEFAULT true NOT NULL,
  is_featured     BOOLEAN DEFAULT false NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS trigger_update_combos ON public.combos;
CREATE TRIGGER trigger_update_combos
  BEFORE UPDATE ON public.combos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_combos_slug         ON public.combos(slug);
CREATE INDEX IF NOT EXISTS idx_combos_school_class ON public.combos(school_class_id);
CREATE INDEX IF NOT EXISTS idx_combos_active       ON public.combos(is_active);

-- ============================================================
-- PART 5: COMBO_ITEMS (Junction: Combos <-> Products)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.combo_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id   UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity   INT NOT NULL DEFAULT 1,
  UNIQUE(combo_id, product_id),
  CONSTRAINT check_combo_item_qty CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_combo_items_combo   ON public.combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_product ON public.combo_items(product_id);

-- ============================================================
-- PART 6: SDUI CONFIG (Server-Driven UI Engine)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sdui_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page        TEXT UNIQUE NOT NULL,
  layout_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active   BOOLEAN DEFAULT true NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS trigger_update_sdui_config ON public.sdui_config;
CREATE TRIGGER trigger_update_sdui_config
  BEFORE UPDATE ON public.sdui_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PART 7: RLS POLICIES — Idempotent using DO $$ blocks
-- ============================================================

-- Schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Schools - Anyone Read Active') THEN
    CREATE POLICY "Schools - Anyone Read Active" ON public.schools FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Schools - Admin All') THEN
    CREATE POLICY "Schools - Admin All" ON public.schools FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- School Classes
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_classes' AND policyname = 'School Classes - Anyone Read Active') THEN
    CREATE POLICY "School Classes - Anyone Read Active" ON public.school_classes FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_classes' AND policyname = 'School Classes - Admin All') THEN
    CREATE POLICY "School Classes - Admin All" ON public.school_classes FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Combos
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combos' AND policyname = 'Combos - Anyone Read Active') THEN
    CREATE POLICY "Combos - Anyone Read Active" ON public.combos FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combos' AND policyname = 'Combos - Admin All') THEN
    CREATE POLICY "Combos - Admin All" ON public.combos FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Combo Items
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combo_items' AND policyname = 'Combo Items - Anyone Read') THEN
    CREATE POLICY "Combo Items - Anyone Read" ON public.combo_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combo_items' AND policyname = 'Combo Items - Admin All') THEN
    CREATE POLICY "Combo Items - Admin All" ON public.combo_items FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- SDUI Config
ALTER TABLE public.sdui_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sdui_config' AND policyname = 'SDUI - Anyone Read Active') THEN
    CREATE POLICY "SDUI - Anyone Read Active" ON public.sdui_config FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sdui_config' AND policyname = 'SDUI - Admin All') THEN
    CREATE POLICY "SDUI - Admin All" ON public.sdui_config FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- PART 8: SEED DATA — Lucknow Schools & SDUI Homepage Config
-- ON CONFLICT DO NOTHING = safe to re-run
-- ============================================================

INSERT INTO public.schools (name, slug, short_name, logo_url, board, is_featured, sort_order) VALUES
  ('City Montessori School',   'cms',           'CMS',      NULL, 'ICSE',     true,  1),
  ('La Martiniere College',    'la-martiniere', 'La Mart',  NULL, 'CBSE',     true,  2),
  ('Delhi Public School',      'dps-lucknow',   'DPS',      NULL, 'CBSE',     true,  3),
  ('Seth Anandram Jaipuria',   'jaipuria',      'Jaipuria', NULL, 'CBSE',     false, 4),
  ('Loreto Convent',           'loreto',        'Loreto',   NULL, 'ICSE',     false, 5),
  ('Colvin Taluqdars College', 'colvin',        'Colvin',   NULL, 'UP Board', false, 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.sdui_config (page, layout_json) VALUES (
  'home',
  '[
    {"type": "banner_carousel", "order": 1, "data": {}},
    {"type": "school_widget",   "order": 2, "data": {"title": "Shop By School", "school_slugs": ["cms", "la-martiniere", "dps-lucknow"]}},
    {"type": "category_grid",   "order": 3, "data": {"title": "Browse Categories"}},
    {"type": "flash_deals",     "order": 4, "data": {"title": "Flash Deals"}},
    {"type": "product_row",     "order": 5, "data": {"title": "Best Sellers",   "filter": "is_bestseller"}},
    {"type": "product_row",     "order": 6, "data": {"title": "Featured Items", "filter": "is_featured"}}
  ]'
) ON CONFLICT (page) DO NOTHING;
