'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

const templates = [
  {
    name: 'Standard',
    description: 'A clean, simple layout that works for most businesses.',
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    name: 'Freelancer',
    description: 'Compact design for service-based work with hourly rates.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Consultant',
    description: 'Professional layout with space for project details and terms.',
    accent: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Retail',
    description: 'Item-heavy invoices with SKUs, quantities, and unit prices.',
    accent: 'from-orange-500 to-red-500',
  },
];

export default function TemplatesPage() {
  const { isPro, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Invoice templates
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Start with one of our professionally designed templates. Every template
            is fully customizable and exports to PDF.
          </p>
          {!loading && !isPro && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Pro feature
            </div>
          )}
        </div>

        {/* Pro upsell banner for free users */}
        {!loading && !isPro && (
          <div className="mb-10 rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Templates are part of the Pro plan
                </h2>
                <p className="mt-1 text-sm text-gray-700">
                  Get all four templates (and AI invoice extraction) with a
                  7-day free trial. $9 AUD/month after that. Cancel anytime.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/billing?plan=pro">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                      <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                      Start free trial
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline">See pricing</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((tpl) => {
            const locked = !loading && !isPro;
            return (
              <div
                key={tpl.name}
                className={`relative rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md overflow-hidden flex flex-col ${
                  locked ? 'opacity-90' : ''
                }`}
              >
                <div
                  className={`relative h-32 bg-gradient-to-br ${tpl.accent} flex items-center justify-center`}
                >
                  <FileText className="h-12 w-12 text-white/90" />
                  {locked && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <div className="rounded-full bg-white/90 p-2 shadow-md">
                        <Lock className="h-5 w-5 text-gray-700" aria-hidden="true" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900">{tpl.name}</h3>
                  <p className="mt-1 text-sm text-gray-600 flex-1">
                    {tpl.description}
                  </p>
                  {locked ? (
                    <Link href="/billing?plan=pro" className="mt-4">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                        <Lock className="mr-2 h-4 w-4" />
                        Unlock with Pro
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/invoice_generator" className="mt-4">
                      <Button variant="outline" className="w-full">
                        Use template
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">
            More templates coming soon. Have a specific layout in mind?
          </p>
          <Link href="/contactUs">
            <Button variant="outline">Request a template</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
