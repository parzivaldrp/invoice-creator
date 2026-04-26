-- ============================================
-- 0002 — extract_usage table
-- ============================================
-- Tracks each call to /api/extract-invoice so the server can enforce a
-- per-user daily rate limit on Textract usage.
--
-- ⚠️ Run this in the Supabase SQL Editor before deploying the photo-
-- extraction feature, otherwise the route will fail closed (503).
-- ============================================

CREATE TABLE IF NOT EXISTS public.extract_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Speeds up the rolling-24h count query the API does on every call.
CREATE INDEX IF NOT EXISTS extract_usage_user_created_idx
  ON public.extract_usage (user_id, created_at DESC);

ALTER TABLE public.extract_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own extract usage"   ON public.extract_usage;
DROP POLICY IF EXISTS "Users insert own extract usage" ON public.extract_usage;

-- Only the user themselves can see/insert their own rows. The route uses
-- the user's JWT, so RLS applies automatically — no service role needed.
CREATE POLICY "Users read own extract usage"
  ON public.extract_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own extract usage"
  ON public.extract_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.extract_usage TO authenticated;
