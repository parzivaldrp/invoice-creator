'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Mail, Clock } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

const PLAN_COPY: Record<string, { label: string; price: string }> = {
  pro: { label: 'Pro', price: '$9 / month' },
  business: { label: 'Business', price: '$29 / month' },
};

function BillingContent() {
  const searchParams = useSearchParams();
  const planKey = (searchParams.get('plan') || '').toLowerCase();
  const plan = PLAN_COPY[planKey];

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

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 sm:p-10">
            <div className="flex justify-center mb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900">
              {plan ? `${plan.label} plan` : 'Upgrade'} is coming soon
            </h1>
            <p className="text-center text-gray-600 mt-3">
              {plan
                ? `We're putting the finishing touches on the ${plan.label} plan (${plan.price}). Self-serve checkout will be live shortly — leave us your email and we'll let you know the moment it ships.`
                : `Self-serve upgrades aren't live yet. Drop us a line and we'll set you up manually in the meantime.`}
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/contactUs" className="block">
                <Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  <Mail className="h-4 w-4 mr-2" />
                  Get early access
                </Button>
              </Link>
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full h-11">
                  <Clock className="h-4 w-4 mr-2" />
                  Keep using Free
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-center text-gray-500">
              Your free plan keeps working — you won&apos;t lose access while paid
              tiers are being prepared.
            </p>
          </CardContent>
        </Card>
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
