import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getAppUrl } from '@/lib/stripe';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * Create a Stripe Billing Portal session for the current user.
 *
 * The Billing Portal is a hosted Stripe page where customers can:
 *   - update their card / payment method
 *   - view past invoices
 *   - cancel their subscription (we receive customer.subscription.updated
 *     with cancel_at_period_end=true, then customer.subscription.deleted
 *     at period end)
 *
 * The user must already have a stripe_customer_id on their profile —
 * meaning they've at least started a checkout once. Otherwise we 404
 * (there's nothing to manage yet).
 */
function logServerError(label: string, err: unknown) {
  if (err instanceof Error) {
    console.error(`[stripe-portal] ${label}: ${err.name}: ${err.message}`);
  } else {
    console.error(`[stripe-portal] ${label}: unknown error`);
  }
}

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Billing is not configured on the server.' },
      { status: 500 }
    );
  }

  // 1. Auth -----------------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json(
      { error: 'You must be signed in to manage billing.' },
      { status: 401 }
    );
  }

  // 2. Look up customer id --------------------------------------------------
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profileErr) {
    logServerError('profile-read', profileErr);
    return NextResponse.json(
      { error: 'Could not load your account.' },
      { status: 500 }
    );
  }

  if (!profile.stripe_customer_id) {
    return NextResponse.json(
      {
        error: 'No billing account found. Start a subscription first.',
        code: 'no_customer',
      },
      { status: 404 }
    );
  }

  // 3. Create portal session ------------------------------------------------
  const origin = getAppUrl(req.url);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/profile`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a portal URL.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    logServerError('portal-session-create', err);
    return NextResponse.json(
      { error: 'Could not open the billing portal. Please try again.' },
      { status: 502 }
    );
  }
}
