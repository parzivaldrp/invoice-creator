'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/authContext';

const PLAN_COPY: Record<string, { label: string; price: string }> = {
  pro: { label: 'Pro', price: '$9 AUD / month' },
  business: { label: 'Business', price: '$29 AUD / month' },
};

function BillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isPro, refreshProfile } = useAuth();

  const planKey = (searchParams.get('plan') || '').toLowerCase();
  const status = searchParams.get('status'); // 'success' after Stripe redirect
  const plan = PLAN_COPY[planKey];

  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  // Avoid double-firing checkout on a fast double click or React StrictMode.
  const checkoutInFlight = useRef(false);

  // After a successful checkout Stripe redirects back here. The webhook
  // updates the profile asynchronously, so poll once to refresh.
  useEffect(() => {
    if (status === 'success') {
      void refreshProfile();
    }
  }, [status, refreshProfile]);

  // Auto-start checkout when arriving with ?plan=pro (and not already pro
  // and not coming back from a successful checkout).
  useEffect(() => {
    if (!planKey || isPro || status === 'success' || checkoutInFlight.current) return;
    if (!PLAN_COPY[planKey]) return;
    if (planKey !== 'pro') return; // business is "contact sales" for now

    void startCheckout(planKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, isPro, status]);

  async function startCheckout(plan: string) {
    if (checkoutInFlight.current) return;
    checkoutInFlight.current = true;
    setError(null);
    setRedirecting(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        credentials: 'same-origin',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Could not start checkout.');
      }
      if (!json.url) throw new Error('Stripe did not return a checkout URL.');
      window.location.href = json.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setRedirecting(false);
      checkoutInFlight.current = false;
    }
  }

  // ---- Render branches -------------------------------------------------

  // 1. Returned from a successful Stripe checkout
  if (status === 'success') {
    return (
      <Wrapper>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 sm:p-10 text-center">
            <div className="flex justify-center mb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-md">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">You&apos;re on Pro!</h1>
            <p className="text-gray-600 mt-3">
              Your 7-day free trial has started. Pro features are unlocked
              across the app — AI invoice extraction, templates, and more.
            </p>
            <div className="mt-8">
              <Button
                onClick={() => router.push('/dashboard')}
                className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
              >
                Go to dashboard
              </Button>
            </div>
            <p className="mt-6 text-xs text-gray-500">
              You can cancel anytime before the trial ends. No charge until day 8.
            </p>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  // 2. Already pro
  if (isPro) {
    return (
      <Wrapper>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 sm:p-10 text-center">
            <div className="flex justify-center mb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">You&apos;re already Pro</h1>
            <p className="text-gray-600 mt-3">
              Thanks for subscribing! Manage your subscription from your profile.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/dashboard">
                <Button>Go to dashboard</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">Manage account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  // 3. Business (contact-sales) plan — keep the old "coming soon" UI.
  if (planKey === 'business') {
    return (
      <Wrapper>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 sm:p-10 text-center">
            <div className="flex justify-center mb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Business plan</h1>
            <p className="text-gray-600 mt-3">
              The Business plan is set up by our team. Drop us a line and
              we&apos;ll get you onboarded.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/contactUs">
                <Button>Contact sales</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Back to dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  // 4. Default: show upgrade panel (initial state OR after an error)
  return (
    <Wrapper>
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 sm:p-10">
          <div className="flex justify-center mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900">
            {plan ? `Upgrade to ${plan.label}` : 'Upgrade your plan'}
          </h1>
          <p className="text-center text-gray-600 mt-3">
            {plan
              ? `Start your 7-day free trial of ${plan.label} (${plan.price}). Cancel anytime before day 8 and you won't be charged.`
              : `Start your 7-day free trial of Pro ($9 AUD / month). Cancel anytime before day 8 and you won't be charged.`}
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-rose-800">{error}</p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => startCheckout('pro')}
              disabled={redirecting}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {redirecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to Stripe…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start 7-day free trial
                </>
              )}
            </Button>
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full h-11" disabled={redirecting}>
                Maybe later
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-center text-gray-500">
            Secure checkout powered by Stripe. We never see your card details.
          </p>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to dashboard
        </Link>
        {children}
      </div>
    </div>
  );
}

export default function BillingPage() {
  // Wrap in ProtectedRoute (client-side gate) and Suspense (for useSearchParams).
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <BillingContent />
      </Suspense>
    </ProtectedRoute>
  );
}
