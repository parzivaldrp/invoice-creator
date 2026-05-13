import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client.
 *
 * USE ONLY FROM SERVER ROUTES that have already established trust by
 * other means — currently just the Stripe webhook, which verifies the
 * signature before touching the DB.
 *
 * This client bypasses RLS, so any code path that uses it MUST be
 * unreachable by user-controlled input that hasn't been authenticated
 * out-of-band.
 *
 * Do NOT export this from any module imported by a client component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client is not configured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
