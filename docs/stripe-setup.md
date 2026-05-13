# Stripe setup

This document walks through everything needed to enable the Pro plan
($9 AUD/month with a 7-day free trial) end-to-end.

## 1. Install dependencies

```bash
npm install
```

The `stripe` package is in `package.json`. Run `npm install` after
pulling these changes.

## 2. Apply the Supabase migration

Open the SQL editor for your Supabase project and run:

```
supabase/migrations/0003_stripe_subscriptions.sql
```

This adds the columns the webhook writes to (`stripe_customer_id`,
`stripe_subscription_id`, `subscription_status`, `subscription_tier`,
`current_period_end`).

## 3. Environment variables

Add these to `.env.local` (development) and to your hosting provider's
environment for production:

```bash
# --- Stripe ----------------------------------------------------------
# From https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook signing secret. Get this in step 5 below.
STRIPE_WEBHOOK_SECRET=whsec_...

# Pro plan price id from your Stripe dashboard.
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx

# --- App URL ---------------------------------------------------------
# Used to build Stripe success/cancel URLs. In dev this can be
# http://localhost:3000; in prod set it to your production origin.
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- Supabase service role -------------------------------------------
# Required by the webhook handler. Keep this server-only — never prefix
# it with NEXT_PUBLIC_, never import it from a client component.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

## 4. Local webhook testing (Stripe CLI)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), log in, then
forward events to your dev server:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_...` value — copy it into `STRIPE_WEBHOOK_SECRET`
for local development.

Trigger a test event without going through Checkout:

```bash
stripe trigger checkout.session.completed
```

## 5. Production webhook

In the Stripe dashboard go to **Developers → Webhooks → Add endpoint** and
register `https://YOUR_DOMAIN/api/stripe/webhook` for these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `customer.subscription.paused`
- `customer.subscription.resumed`
- `invoice.payment_failed`

Stripe will show a signing secret — copy it into `STRIPE_WEBHOOK_SECRET`
on your hosting provider.

## 6. End-to-end test

1. Sign in to the app.
2. Visit `/pricing`, click **Start free trial** on the Pro card, or go
   straight to `/billing?plan=pro`.
3. The app will redirect to Stripe Checkout. Use card `4242 4242 4242 4242`
   with any future expiry and any CVC.
4. After completing checkout, Stripe redirects to
   `/billing?status=success&session_id=...` and the webhook fires
   `checkout.session.completed`. The user's profile row gets
   `subscription_tier='pro'` and `subscription_status='trialing'`.
5. Reload `/templates` — they should be unlocked.
6. Reload `/invoice_generator` — the AI extraction drop zone should
   work end-to-end.

## How feature gating works

- **Server**: `/api/extract-invoice` reads `subscription_tier` and
  `subscription_status` from the profile and returns `402 Payment
  Required` with `code: 'upgrade_required'` for non-Pro users. This is
  the security boundary.
- **Client**: `useAuth()` exposes an `isPro` boolean (true when tier is
  pro/business AND status is active/trialing). Components like
  `InvoiceUpload` and the templates page render an upsell card instead
  of the gated content when `isPro` is false. This is a UX nicety, not
  a security check.

## Cancellation behavior

- A user cancelling in Stripe stays Pro until `current_period_end` —
  Stripe sends `customer.subscription.updated` with
  `cancel_at_period_end: true`, but `status` stays `active` and we
  treat them as Pro.
- When the period ends, Stripe sends `customer.subscription.deleted`
  and we flip the profile back to free.
- A failed payment moves them to `past_due` (not Pro). Stripe retries
  per its dunning schedule and either recovers them or eventually emits
  `customer.subscription.deleted`.
