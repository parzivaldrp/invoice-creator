import Stripe from 'stripe';

/**
 * Server-side Stripe client.
 *
 * Pin the API version so a Stripe-side bump can't silently change webhook
 * payload shapes on us. Update intentionally in a single PR (alongside
 * the SDK upgrade) when we want a newer version.
 *
 * Never import this from a client component — it would leak the secret
 * key into the browser bundle.
 */
if (!process.env.STRIPE_SECRET_KEY) {
  // Don't throw at module load — Next.js eagerly imports route modules
  // during build, and we'd rather a missing key fail the request with a
  // clear 500 than break `next build`. The route handlers below check
  // for it before calling out to Stripe.
  console.warn('[stripe] STRIPE_SECRET_KEY is not set — checkout/webhook routes will return 500.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-08-27.basil',
  typescript: true,
  appInfo: {
    name: 'InvoicePro',
  },
});

/** Single source of truth for the Pro price id used at checkout. */
export const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '';

/** Resolve the absolute origin to use for Stripe success/cancel URLs. */
export function getAppUrl(reqUrl?: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (reqUrl) {
    try {
      const u = new URL(reqUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* fall through */
    }
  }
  return 'http://localhost:3000';
}
