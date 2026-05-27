import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Email verification (and password-reset) link handler.
 *
 * Supabase email templates point users at this route instead of the
 * default Supabase-hosted verification endpoint. The flow:
 *
 *   1. User clicks the link in their inbox: /auth/confirm?token_hash=...&type=signup
 *   2. We call supabase.auth.verifyOtp() which:
 *        - validates the token,
 *        - flips auth.users.email_confirmed_at to NOW(),
 *        - sets the session cookies on the response.
 *   3. We redirect to /auth/callback (a friendly success page) — or
 *      wherever ?next= points, if it's a same-origin relative path.
 *
 * Why this is better than the default Supabase-hosted flow:
 *   - We render our own success UI ("Email verified ✓"), instead of the
 *     user landing silently on /dashboard with no confirmation.
 *   - We control error UX (invalid/expired links show a real error
 *     page, not a Supabase JSON blob).
 *   - The session cookie is set by our own server, which is the same
 *     pattern the rest of our auth uses.
 *
 * Required Supabase setup:
 *   In Dashboard → Authentication → Email Templates → "Confirm signup",
 *   change the action URL from {{ .ConfirmationURL }} to:
 *       {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 *   See docs/auth-setup.md for the full template.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // Only honor ?next when it's a same-origin relative path — prevents
  // open-redirect attacks via a crafted email link.
  const rawNext = searchParams.get('next');
  const next =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : '/auth/callback';

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    // Likely an expired or already-used link.
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'expired_link');
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(next, origin));
}
