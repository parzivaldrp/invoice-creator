import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything you need to send your first invoices.',
    features: [
      'Up to 5 invoices per month',
      'PDF download',
      'Email invoice to client',
      'Basic invoice templates',
      'Email support',
    ],
    cta: 'Get started',
    href: '/signUp',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For freelancers and small businesses billing regularly.',
    features: [
      'Unlimited invoices',
      'Custom logo & branding',
      'Recurring invoices',
      'Client management',
      'Priority email support',
      'Export to CSV',
    ],
    cta: 'Start free trial',
    href: '/signUp',
    highlight: true,
  },
  {
    name: 'Business',
    price: '$29',
    period: 'per month',
    description: 'For teams that need collaboration and reporting.',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Advanced reporting',
      'Payment reminders',
      'API access',
      'Dedicated support',
    ],
    cta: 'Contact sales',
    href: '/contactUs',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Pick the plan that fits your business. Upgrade or downgrade at any time.
            No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl bg-white/80 backdrop-blur-sm border shadow-lg p-8 flex flex-col ${
                tier.highlight
                  ? 'border-blue-500 ring-2 ring-blue-500'
                  : 'border-gray-200'
              }`}
            >
              {tier.highlight && (
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                  Most popular
                </div>
              )}
              <h2 className="text-2xl font-semibold text-gray-900">{tier.name}</h2>
              <p className="mt-2 text-sm text-gray-600">{tier.description}</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                <span className="ml-2 text-sm text-gray-500">{tier.period}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start text-sm text-gray-700">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={tier.href} className="mt-8 block">
                <Button
                  className={`w-full h-11 ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          All plans include SSL, automatic backups, and a 14-day money-back guarantee.
        </p>
      </div>
    </div>
  );
}
