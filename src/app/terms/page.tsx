import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: April 24, 2026</p>
        </div>

        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md p-8 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              1. Acceptance
            </h2>
            <p>
              By creating an account or using the service you agree to these terms.
              If you don&apos;t agree, don&apos;t use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              2. Your account
            </h2>
            <p>
              You&apos;re responsible for keeping your login credentials secure and
              for all activity that happens under your account. Let us know
              immediately if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              3. Acceptable use
            </h2>
            <p>
              Don&apos;t use the service to send spam, fraudulent invoices, or
              anything unlawful. Don&apos;t try to reverse engineer, scrape, or
              overwhelm the service. Don&apos;t upload content you don&apos;t have
              the right to use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              4. Your content
            </h2>
            <p>
              The invoices and data you create remain yours. We only use them to
              provide the service to you (storage, PDF generation, email delivery).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              5. Paid plans
            </h2>
            <p>
              If you subscribe to a paid plan, fees are billed in advance and
              are non-refundable except as required by law. You can cancel at any
              time from your account settings and your plan will stay active
              through the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              6. Disclaimer
            </h2>
            <p>
              The service is provided &quot;as is&quot;. We do our best to keep it
              running and accurate but we don&apos;t guarantee uninterrupted
              availability or freedom from every bug. You&apos;re responsible for
              reviewing invoices before sending them to clients.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              7. Limitation of liability
            </h2>
            <p>
              To the extent permitted by law, our liability is limited to the
              amount you paid us in the twelve months before the event giving rise
              to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              8. Changes
            </h2>
            <p>
              We may update these terms from time to time. If the changes are
              material we&apos;ll let you know by email or in-app notice. Continued
              use after the effective date means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              9. Contact
            </h2>
            <p>
              Questions about these terms? Get in touch on our{' '}
              <a href="/contactUs" className="text-blue-600 hover:text-blue-500">
                contact page
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
