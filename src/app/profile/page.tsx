'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  UserCircle,
  Mail,
  Calendar,
  Save,
  ArrowLeft,
  FileText,
  Sparkles,
  CreditCard,
  ExternalLink,
  Loader2,
} from 'lucide-react';

function getInitials(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || email || '';
  if (!source) return '?';
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user, profile, loading, isPro, refreshProfile } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [invoiceCount, setInvoiceCount] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const openBillingPortal = async () => {
    if (openingPortal) return;
    setOpeningPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Could not open billing portal.');
      }
      if (!json.url) throw new Error('Stripe did not return a portal URL.');
      window.location.href = json.url as string;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open billing portal.');
      setOpeningPortal(false);
    }
  };

  // Redirect if logged out (after loading finishes)
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Seed form + pull created_at + invoice count
  useEffect(() => {
    if (!user) return;
    setFullName(profile?.full_name ?? '');
    setCreatedAt(user.created_at ?? null);

    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (!cancelled) setInvoiceCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.warning('Please enter your name.');
      return;
    }
    if (trimmed.length < 2) {
      toast.warning('Name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated!');
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const email = user.email ?? '';
  const displayName = profile?.full_name || fullName || 'there';
  const initials = getInitials(profile?.full_name || fullName, email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to dashboard
        </Link>

        {/* Header card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <span className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-semibold flex items-center justify-center shrink-0">
                {initials}
              </span>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {displayName}
                </h1>
                <p className="text-gray-600 flex items-center justify-center sm:justify-start gap-2 mt-1 text-sm">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{email}</span>
                </p>
                {createdAt && (
                  <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs">
                    <Calendar className="h-4 w-4" />
                    Member since {format(new Date(createdAt), 'MMMM yyyy')}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-center">
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                  <div className="text-2xl font-bold text-blue-700">
                    {invoiceCount ?? '—'}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-blue-600 mt-1">
                    Invoices
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Subscription
            </CardTitle>
            <CardDescription>
              {isPro
                ? 'Manage your billing, update your card, view invoices, or cancel.'
                : 'You’re on the Free plan. Upgrade to Pro to unlock AI extraction and all templates.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shrink-0">
                    <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                      Pro plan
                      <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {profile?.subscription_status === 'trialing' ? 'Trial' : 'Active'}
                      </span>
                    </p>
                    {profile?.current_period_end && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {profile.subscription_status === 'trialing' ? 'Trial ends' : 'Renews'}{' '}
                        on{' '}
                        {format(new Date(profile.current_period_end), 'MMMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={openBillingPortal}
                  disabled={openingPortal}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {openingPortal ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Opening portal…
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage subscription
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">Free plan</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Up to 5 invoices per month, basic templates, email support.
                  </p>
                </div>
                <Link href="/billing?plan=pro">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-blue-600" />
              Account details
            </CardTitle>
            <CardDescription>
              Update how your name appears across the app and in invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500">
                  Email can&apos;t be changed here.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!isDirty || isSaving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save changes
                    </>
                  )}
                </Button>
                <Link href="/myInvoice">
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    <FileText className="h-4 w-4 mr-2" />
                    View my invoices
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
