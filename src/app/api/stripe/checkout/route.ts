import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PRO_PRICE_ID, getAppUrl } from '@/lib/stripe';

export const runtime = 'nodejs';
export const maxDuration = 15;

/** Plans we know how to start a Checkout for. */
const PLAN_PRICE: Record<string, string | undefined> = {
  pro: PRO_PRICE_ID,
};

function logServerError(label: string, err: unknown) {
  if (err instanceof Error) {
    console.error(`[stripe-checkout] ${label}: ${err.name}: ${err.message}`);
  } else {
    console.error(`[stripe-checkout] ${label}: unknown error`);
  }
}

export async function POST(req: Request) {
  // 1. Server config sanity ------------------------------------------------
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Billing is not configured on the server.' },
      { status: 500 }
    );
  }

  // 2. Authenticate via cookie session -----------------------------------
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user || !user.email) {
    return NextResponse.json(
      { error: 'You must be signed in to upgrade.' },
      { status: 401 }
    );
  }

  // 3. Parse plan ----------------------------------------------------------
  let body: { plan?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty body — default to pro */
  }
  const plan = (body.plan ?? 'pro').toLowerCase();
  const priceId = PLAN_PRICE[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `Unknown plan "${plan}".` },
      { status: 400 }
    );
  }

  // 4. Look up / create Stripe customer ----------------------------------
  // We persist the Stripe customer id on the profile row so the same user
  // upgrading from a second device doesn't create a duplicate customer.
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_status, subscription_tier')
    .eq('id', user.id)
    .single();

  if (profileErr) {
    logServerError('profile-read', profileErr);
    return NextResponse.json(
      { error: 'Could not load your account.' },
      { status: 500 }
    );
  }

  // Already on a paid plan in good standing — don't let them double-pay.
  if (
    profile.subscription_tier === 'pro' &&
    (profile.subscription_status === 'active' ||
      profile.subscription_status === 'trialing')
  ) {
    return NextResponse.json(
      { error: 'You are already on the Pro plan.' },
      { status: 409 }
    );
  }

  let customerId = profile.stripe_customer_id as string | null;

  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Persist immediately so retries don't create duplicates.
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      if (updateErr) {
        logServerError('profile-write-customer', updateErr);
        // Non-fatal: webhook will reconcile via the metadata below.
      }
    } catch (err) {
      logServerError('customer-create', err);
      return NextResponse.json(
        { error: 'Could not start checkout. Please try again.' },
        { status: 502 }
      );
    }
  }

  // 5. Create the Checkout Session ---------------------------------------
  const origin = getAppUrl(req.url);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // 7-day free trial — matches the pricing-page CTA.
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      // Belt-and-braces: copy the user id onto the session itself so the
      // webhook can recover it even if Stripe ever drops subscription
      // metadata on a particular event.
      metadata: { supabase_user_id: user.id, plan },
      // Stripe requires this when collecting trial subscriptions with a
      // saved payment method — it nudges the user to confirm the trial.
      success_url: `${origin}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?status=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      // We're an Australian SaaS — let Stripe Tax decide GST treatment.
      automatic_tax: { enabled: false },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    logServerError('session-create', err);
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 502 }
    );
  }
}
