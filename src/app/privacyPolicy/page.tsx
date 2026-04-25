import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: April 24, 2026</p>
        </div>

        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md p-8 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Information we collect
            </h2>
            <p>
              When you create an account we collect your name, email address, and a
              hashed password. When you create an invoice we store the data you
              enter (company details, client details, line items, amounts, dates,
              and notes) so you can come back to it later.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              How we use your information
            </h2>
            <p>
              We use your information to operate the service: authenticate you,
              store and retrieve your invoices, generate PDFs, and send invoice
              emails to the recipients you specify. We don&apos;t sell your data
              and we don&apos;t show ads.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Data storage</h2>
            <p>
              Your data is stored in an encrypted PostgreSQL database hosted by
              Supabase. Every invoice is protected by row-level security so only
              you can read or modify your own records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Third-party services
            </h2>
            <p>
              We use Supabase for authentication and data storage, and Resend for
              sending invoice emails. These providers only receive the data
              necessary to perform their function.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your rights</h2>
            <p>
              You can export, edit, or delete your invoices at any time from your
              dashboard. To delete your account and all associated data, contact us
              using the link below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Cookies</h2>
            <p>
              We use a single authentication cookie to keep you signed in. We
              don&apos;t use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Contact
            </h2>
            <p>
              Questions about this policy? Reach out through our{' '}
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
