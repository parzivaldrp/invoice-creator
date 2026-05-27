'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';

/**
 * Post-verification "you're all set" page.
 *
 * The /auth/confirm route redirects users here after their email has
 * been verified. We re-fetch the profile (which now has updated auth
 * state) and auto-redirect to the dashboard after a short pause — long
 * enough to read the success message, short enough not to be annoying.
 *
 * Users who don't want to wait can click "Continue to dashboard".
 */
const REDIRECT_AFTER_MS = 3000;

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(REDIRECT_AFTER_MS / 1000)
  );

  useEffect(() => {
    // Pull a fresh profile so isPro / subscription_tier / full_name etc.
    // reflect the just-confirmed auth state, in case anything elsewhere
    // depends on them.
    void refreshProfile();

    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const redirect = setTimeout(() => {
      router.push('/dashboard');
    }, REDIRECT_AFTER_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(redirect);
    };
    // refreshProfile is stable (useCallback in authContext) — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 sm:p-10 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center mb-5 shadow-md">
            <CheckCircle2 className="h-9 w-9 text-white" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Email verified!
          </h1>
          <p className="mt-3 text-gray-600">
            Your InvoicePro account is ready. You can now create invoices,
            track payments, and (with Pro) unlock AI extraction and templates.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                Continue to dashboard
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/invoice_generator">
              <Button variant="outline" className="w-full sm:w-auto">
                Create my first invoice
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-500 flex items-center justify-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            Auto-redirecting in {secondsLeft}s
          </p>
        </div>
      </div>
    </div>
  );
}
