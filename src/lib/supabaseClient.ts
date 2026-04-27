import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 *
 * Uses cookie-based session storage (via @supabase/ssr) instead of
 * localStorage. That means:
 *   - middleware.ts can read the same session at the edge and reject
 *     unauthorized requests to protected routes BEFORE page code runs.
 *   - Server route handlers can verify the session from cookies — no
 *     Authorization header plumbing needed in fetch calls.
 *   - The token is no longer sitting in localStorage where any third-
 *     party script could read it.
 *
 * Single source of truth for the browser client; everything else
 * imports `supabase` from here.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
