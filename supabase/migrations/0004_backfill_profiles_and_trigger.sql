-- ============================================
-- 0004 — Backfill missing profile rows + reinstall auth trigger
-- ============================================
-- We discovered some auth.users rows had no matching public.profiles row.
-- This migration:
--   1. Backfills profile rows for any orphan auth.users
--   2. Reinstalls the handle_new_user trigger (idempotent — uses
--      CREATE OR REPLACE + DROP IF EXISTS)
--   3. Re-grants execute on create_user_profile RPC
--
-- Safe to run multiple times.
-- ============================================

-- ----------------------------------------------------------------------
-- 1. Backfill orphaned profiles
-- ----------------------------------------------------------------------
-- For every auth.users without a matching profile row, insert one using
-- the raw_user_meta_data if present. subscription_tier defaults to 'free'
-- via the column default added in migration 0003.
INSERT INTO public.profiles (id, full_name, agree_to_terms)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', '') AS full_name,
  COALESCE((u.raw_user_meta_data->>'agree_to_terms')::boolean, false) AS agree_to_terms
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------
-- 2. Reinstall the create_user_profile RPC (idempotent)
-- ----------------------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon, authenticated;

-- ----------------------------------------------------------------------
-- 3. Reinstall the on_auth_user_created trigger
-- ----------------------------------------------------------------------
-- The trigger fires synchronously on every auth.users INSERT and creates
-- the matching profile row from raw_user_meta_data. signUp() in the
-- client passes options.data, which lands in raw_user_meta_data — so the
-- trigger sees the user's typed name + T&C agreement.
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

-- ----------------------------------------------------------------------
-- 4. Sanity check (for visibility — these are SELECTs, not changes)
-- ----------------------------------------------------------------------
-- Run these manually after the migration to confirm everything is wired:
--
--   SELECT tgname, tgenabled FROM pg_trigger
--   WHERE tgname = 'on_auth_user_created';
--   -- expect 1 row, tgenabled = 'O' (Origin/enabled)
--
--   SELECT proname FROM pg_proc
--   WHERE proname IN ('handle_new_user', 'create_user_profile');
--   -- expect 2 rows
--
--   SELECT COUNT(*) AS orphan_count FROM auth.users u
--   LEFT JOIN public.profiles p ON p.id = u.id
--   WHERE p.id IS NULL;
--   -- expect 0
