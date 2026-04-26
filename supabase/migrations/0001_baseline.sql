-- ============================================
-- 0001 — Baseline schema
-- ============================================
-- This is a snapshot of the schema as it existed before the migrations
-- folder was introduced. Already applied to existing Supabase projects.
-- For a brand-new project, run this first, then run later migrations
-- (0002, 0003, …) in order.
--
-- Source: ./supabase-setup.sql (kept in sync as baseline only).
-- ============================================

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  agree_to_terms BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. profile creation function + trigger
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID, full_name TEXT, agree_to_terms BOOLEAN
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, agree_to_terms)
  VALUES (user_id, full_name, agree_to_terms)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      agree_to_terms = EXCLUDED.agree_to_terms,
      updated_at = TIMEZONE('utc'::text, NOW());
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, agree_to_terms)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'agree_to_terms')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon, authenticated;

-- 3. invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','final','sent','paid','overdue','cancelled')),
  issue_date      DATE NOT NULL,
  due_date        DATE,
  from_company    TEXT,
  from_address    TEXT,
  from_email      TEXT,
  from_phone      TEXT,
  to_company      TEXT,
  to_address      TEXT,
  to_email        TEXT,
  notes           TEXT,
  tax_rate        NUMERIC(6,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  pdf_url         TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (user_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx    ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS invoices_issue_date_idx ON public.invoices (issue_date DESC);
CREATE INDEX IF NOT EXISTS invoices_status_idx     ON public.invoices (status);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoices"   ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;

CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices"
  ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices"
  ON public.invoices FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices"
  ON public.invoices FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;
CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. invoice_items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  TEXT,
  quantity     NUMERIC(12,2) NOT NULL DEFAULT 1,
  rate         NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON public.invoice_items (invoice_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoice items"   ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete own invoice items" ON public.invoice_items;

CREATE POLICY "Users can view own invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.invoices
                  WHERE invoices.id = invoice_items.invoice_id
                    AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can insert own invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices
                       WHERE invoices.id = invoice_items.invoice_id
                         AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update own invoice items"
  ON public.invoice_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.invoices
                  WHERE invoices.id = invoice_items.invoice_id
                    AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete own invoice items"
  ON public.invoice_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.invoices
                  WHERE invoices.id = invoice_items.invoice_id
                    AND invoices.user_id = auth.uid()));

GRANT ALL ON public.invoices      TO authenticated;
GRANT ALL ON public.invoice_items TO authenticated;
