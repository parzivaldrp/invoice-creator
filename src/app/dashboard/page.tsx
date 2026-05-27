'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Plus,
  Download,
  Settings,
  User,
  Clock,
  CalendarClock,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

interface RecentInvoice {
  id: string;
  invoice_number: string | number;
  status: string | null;
  to_company: string | null;
  total: number | null;
  issue_date: string | null;
  due_date: string | null;
  created_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  final: 'bg-blue-100 text-blue-700 border-blue-200',
  sent: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

function StatusPill({ status }: { status: string | null }) {
  const s = (status || 'draft').toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        STATUS_STYLES[s] || STATUS_STYLES.draft
      }`}
    >
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function formatMoney(amount: number | null | undefined) {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function DueBadge({ dueDate, status }: { dueDate: string | null; status: string | null }) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;

  const s = (status || '').toLowerCase();
  const paid = s === 'paid' || s === 'cancelled';

  if (paid) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <CalendarClock className="w-3 h-3" />
        Due {format(d, 'MMM d, yyyy')}
      </span>
    );
  }

  if (isPast(d) && !isToday(d)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
        <AlertCircle className="w-3 h-3" />
        Overdue · {format(d, 'MMM d')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
      <CalendarClock className="w-3 h-3" />
      Due {format(d, 'MMM d, yyyy')}
    </span>
  );
}

/** Days between now and a future ISO date string. Returns null if invalid/past. */
function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  const diffMs = target - Date.now();
  if (diffMs <= 0) return null;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name ?? user?.email ?? 'Guest';

  const isTrialing = profile?.subscription_status === 'trialing';
  const trialDaysLeft = isTrialing ? daysUntil(profile?.current_period_end) : null;

  const [recent, setRecent] = useState<RecentInvoice[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingRecent(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(
          'id, invoice_number, status, to_company, total, issue_date, due_date, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!cancelled) {
        if (error) {
          console.error('Failed to load recent invoices', error);
          setRecent([]);
        } else {
          setRecent((data ?? []) as RecentInvoice[]);
        }
        setLoadingRecent(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-600">
              Manage your invoices and account settings
            </p>
          </div>

          {/* Trial countdown — only shown while user is in their 7-day Pro trial */}
          {isTrialing && trialDaysLeft !== null && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-4 py-3 sm:px-5 sm:py-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                    <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {trialDaysLeft === 1
                        ? 'Last day of your Pro trial'
                        : `${trialDaysLeft} days left in your Pro trial`}
                    </p>
                    <p className="text-xs text-gray-600">
                      You won&apos;t be charged until your trial ends. Cancel anytime.
                    </p>
                  </div>
                </div>
                <Link href="/profile" className="sm:shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                  >
                    Manage subscription
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/invoice_generator">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">New Invoice</h3>
                      <p className="text-sm text-gray-600">Create a new invoice</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/myInvoice">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">My Invoices</h3>
                      <p className="text-sm text-gray-600">View all invoices</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/templates">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Download className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Templates</h3>
                      <p className="text-sm text-gray-600">Invoice templates</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/profile">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Settings className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Settings</h3>
                      <p className="text-sm text-gray-600">Account settings</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Your latest invoice activity</CardDescription>
                </div>
                {recent.length > 0 && (
                  <Link
                    href="/myInvoice"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    View all
                    <ChevronRight className="h-4 w-4 ml-0.5" />
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {loadingRecent ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className="h-10 w-10 bg-gray-200 rounded" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                            <div className="h-3 w-32 bg-gray-200 rounded" />
                          </div>
                          <div className="h-6 w-16 bg-gray-200 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recent.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600 mb-3">No invoices yet</p>
                    <Link href="/invoice_generator">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-1" />
                        Create your first invoice
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recent.map((inv) => {
                      const issued = inv.issue_date
                        ? new Date(inv.issue_date)
                        : inv.created_at
                        ? new Date(inv.created_at)
                        : null;
                      return (
                        <Link
                          key={inv.id}
                          href={`/InvoiceDetailPage/${inv.id}`}
                          className="block group"
                        >
                          <div className="flex items-start justify-between gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                              <div className="bg-white p-2 rounded-lg border border-gray-200 shrink-0">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900 truncate">
                                    #{inv.invoice_number}
                                  </p>
                                  <StatusPill status={inv.status} />
                                </div>
                                <p className="text-sm text-gray-700 truncate mt-0.5">
                                  {inv.to_company || 'Untitled client'}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                  {issued && (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      {format(issued, 'MMM d, yyyy')}
                                      {inv.created_at && (
                                        <span className="text-gray-400">
                                          · {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                  <DueBadge dueDate={inv.due_date} status={inv.status} />
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-gray-900">
                                {formatMoney(inv.total)}
                              </p>
                              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto mt-1 group-hover:text-gray-600 transition-colors" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{displayName}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Member since</p>
                        <p className="font-medium">
                          {user?.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <p className="font-medium text-green-600">Active</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Link href="/profile">
                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Edit profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
