import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.name}
              className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md overflow-hidden flex flex-col"
            >
              <div
                className={`h-32 bg-gradient-to-br ${tpl.accent} flex items-center justify-center`}
              >
                <FileText className="h-12 w-12 text-white/90" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900">{tpl.name}</h3>
                <p className="mt-1 text-sm text-gray-600 flex-1">
                  {tpl.description}
                </p>
                <Link href="/invoice_generator" className="mt-4">
                  <Button variant="outline" className="w-full">
                    Use template
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
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
