import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
// Stripe sends the raw body — make sure Next doesn't parse it for us.
export const dynamic = 'force-dynamic';

function logServerError(label: string, err: unknown) {
  if (err instanceof Error) {
    console.error(`[stripe-webhook] ${label}: ${err.name}: ${err.message}`);
  } else {
    console.error(`[stripe-webhook] ${label}: unknown error`);
  }
}

/**
 * Map a Stripe subscription's status to whether the user should be
 * treated as Pro. We treat trialing + active as Pro; everything else
 * (past_due, unpaid, canceled, incomplete, incomplete_expired, paused)
 * downgrades to free.
 */
function tierFromStatus(status: Stripe.Subscription.Status): 'pro' | 'free' {
  return status === 'active' || status === 'trialing' ? 'pro' : 'free';
}

/**
 * Find the Supabase user id for a Stripe customer. We try metadata first
 * (set on customer creation), then fall back to the customer_id column
 * on profiles.
 */
async function resolveUserId(
  customerId: string,
  fallbackUserId: string | null
): Promise<string | null> {
  if (fallbackUserId) return fallbackUserId;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (error) {
    logServerError('profile-lookup', error);
    return null;
  }
  return data?.id ?? null;
}

async function applySubscriptionToProfile(
  userId: string,
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();
  const status = subscription.status;
  const tier = tierFromStatus(status);

  // current_period_end is a unix timestamp (seconds).
  const periodEnd = subscription.items.data[0]?.current_period_end ?? null;

  const updatePayload = {
    stripe_customer_id:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    subscription_tier: tier,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
  };

  // Upsert (not just update) — handles the edge case where the profile
  // row doesn't exist yet (e.g. the on_auth_user_created trigger failed,
  // or the user was created before the trigger was installed). Without
  // this, a webhook against a missing profile would silently no-op and
  // the user would stay on the free tier forever.
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, ...updatePayload },
      { onConflict: 'id' }
    );

  if (error) {
    logServerError('profile-write', error);
    throw error;
  }
}

async function downgradeProfile(userId: string, subscriptionId?: string) {
  const supabase = createAdminClient();
  // Upsert for symmetry with applySubscriptionToProfile — see comment there.
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        stripe_subscription_id: subscriptionId ?? null,
        subscription_status: 'canceled',
        subscription_tier: 'free',
        current_period_end: null,
      },
      { onConflict: 'id' }
    );
  if (error) {
    logServerError('profile-downgrade', error);
    throw error;
  }
}

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Webhook is not configured on the server.' },
      { status: 500 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  // Read the raw body — Stripe's signature is computed over these bytes.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Bad signature: log + 400 so Stripe stops retrying for this delivery.
    logServerError('signature-verify', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;
        const userId = await resolveUserId(
          customerId ?? '',
          (session.metadata?.supabase_user_id as string) ?? null
        );

        if (!userId || !subscriptionId) {
          // Nothing we can do — log and ack so Stripe doesn't retry forever.
          logServerError(
            'checkout-completed-missing-ids',
            new Error(
              `userId=${userId} subscriptionId=${subscriptionId} customerId=${customerId}`
            )
          );
          break;
        }

        // Pull the subscription so we get the canonical period_end + status.
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await applySubscriptionToProfile(userId, subscription);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.trial_will_end':
      case 'customer.subscription.resumed':
      case 'customer.subscription.paused': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;
        const userId = await resolveUserId(
          customerId,
          (subscription.metadata?.supabase_user_id as string) ?? null
        );
        if (!userId) {
          logServerError(
            'subscription-no-user',
            new Error(`customer=${customerId} sub=${subscription.id}`)
          );
          break;
        }
        await applySubscriptionToProfile(userId, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;
        const userId = await resolveUserId(
          customerId,
          (subscription.metadata?.supabase_user_id as string) ?? null
        );
        if (!userId) break;
        await downgradeProfile(userId, subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        // Don't downgrade immediately — Stripe will retry per the dunning
        // schedule. Just mirror the subscription's new status (past_due).
        const invoice = event.data.object as Stripe.Invoice;
        // Cast: subscription is on Invoice in current API but typed loose.
        const subscriptionId =
          (invoice as unknown as { subscription?: string | { id: string } })
            .subscription;
        const subId =
          typeof subscriptionId === 'string'
            ? subscriptionId
            : subscriptionId?.id;
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;
        const userId = await resolveUserId(
          customerId,
          (subscription.metadata?.supabase_user_id as string) ?? null
        );
        if (!userId) break;
        await applySubscriptionToProfile(userId, subscription);
        break;
      }

      default:
        // Unhandled event types are fine — ack with 200.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // Any thrown error here is a transient/DB issue — return 500 so Stripe
    // retries with exponential backoff. Do NOT return 200 on failure.
    logServerError(`handler:${event.type}`, err);
    return NextResponse.json(
      { error: 'Webhook handler failed.' },
      { status: 500 }
    );
  }
}
