import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail } from 'lucide-react';

const faqs = [
  {
    q: 'How do I create my first invoice?',
    a: 'Sign in, click "Create Invoice" on your dashboard, fill in your details, add line items, and click Save as Final. You can then download the PDF or email it directly to your client.',
  },
  {
    q: 'Can I edit an invoice after I save it?',
    a: 'Yes. Open any invoice from My Invoices, click View, then Edit. Your changes are saved instantly.',
  },
  {
    q: 'How do I email an invoice to a client?',
    a: 'From the My Invoices page, click the Send button on any invoice. We\'ll email a PDF attachment to the client email address on the invoice.',
  },
  {
    q: 'What happens to the draft I saved?',
    a: 'Drafts are saved under My Invoices with a "draft" status. You can come back and edit them at any time. Drafts aren\'t sent to clients until you change them to Final.',
  },
  {
    q: 'Do you support taxes and discounts?',
    a: 'You can set a tax rate on each invoice as a percentage. Discounts can be added as a negative-amount line item for now.',
  },
  {
    q: 'Is my data secure?',
    a: 'Your invoices are stored in an encrypted database protected by row-level security, so only you can read or change your own invoices.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the sign-in page, click "Forgot your password?" and enter your email. We\'ll send you a link to set a new one.',
  },
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Help Center
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Answers to the most common questions. Can&apos;t find what you need?
            Get in touch.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex justify-between items-center cursor-pointer">
                <h3 className="text-base font-semibold text-gray-900">{faq.q}</h3>
                <span className="ml-4 text-blue-600 group-open:rotate-45 transition-transform text-2xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md p-8 text-center">
          <Mail className="mx-auto h-10 w-10 text-blue-600 mb-3" />
          <h2 className="text-xl font-semibold text-gray-900">Still need help?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Our support team usually replies within one business day.
          </p>
          <Link href="/contactUs" className="inline-block mt-4">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              Contact support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
