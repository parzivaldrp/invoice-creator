-- ============================================
-- 0003 — Stripe subscription fields on profiles
-- ============================================
-- Extends public.profiles with the columns the Stripe webhook writes to
-- when a checkout completes or a subscription state changes.
--
-- Why on `profiles` and not a separate `subscriptions` table:
--   - One subscription per user keeps the model simple.
--   - The auth context already loads the profile row on every page,
--     so plan checks become free (no extra round-trip / JOIN).
--
-- ⚠️ The webhook writes with the service-role key (bypassing RLS), so
-- we deliberately do NOT add a public UPDATE policy for these columns.
-- The existing "Users can update own profile" policy stays in place for
-- name/agree-to-terms edits — service role bypasses RLS anyway.
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_status    TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier      TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free','pro','business')),
  ADD COLUMN IF NOT EXISTS current_period_end     TIMESTAMP WITH TIME ZONE;

-- Webhook does customer-id lookups; index it.
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_idx
  ON public.profiles (stripe_customer_id);

-- Helpful for "is this user pro right now?" checks if you ever need to
-- run them server-side without selecting the row.
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx
  ON public.profiles (subscription_tier);
