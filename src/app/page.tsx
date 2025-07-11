'use client';

import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Download,
  Users,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  const features = [
    {
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      title: "Professional Templates",
      description:
        "Choose from a variety of professionally designed invoice templates that suit your business needs.",
    },
    {
      icon: <Download className="h-8 w-8 text-blue-600" />,
      title: "PDF Export",
      description:
        "Generate and download professional PDF invoices instantly with just one click.",
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Client Management",
      description:
        "Store and manage your client information for faster invoice creation and better organization.",
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: "Time Tracking",
      description:
        "Track billable hours and automatically add them to your invoices for accurate billing.",
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Secure & Private",
      description:
        "Your data is encrypted and secure. We never share your information with third parties.",
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: "Lightning Fast",
      description:
        "Create professional invoices in under 2 minutes with our streamlined interface.",
    },
  ];

  const benefits = [
    "Create unlimited invoices",
    "Professional PDF generation",
    "Multiple currency support",
    "Client management system",
    "Invoice tracking & status",
    "Email delivery integration",
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Create Professional
              <span className="text-blue-600 block">Invoices in Minutes</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your billing process with our easy-to-use invoice
              generator. Create, customize, and send professional invoices that
              get you paid faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signUp">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-3 text-lg border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Bill Professionally
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive invoice solution includes all the tools you need
              to manage your billing efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose InvoicePro?
              </h2> 
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of businesses who trust InvoicePro for their
                invoicing needs. Our platform is designed to save you time and
                help you get paid faster.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/invoice_generator">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Start Creating Invoices
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 rounded-lg mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">INVOICE</h3>
                    <p className="text-blue-100">#INV-001</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100">Date</p>
                    <p className="font-semibold">Dec 15, 2024</p>
                  </div>
                </div>
                <div className="border-t border-blue-400 pt-4">
                  <p className="text-blue-100 mb-1">Bill To:</p>
                  <p className="font-semibold">Acme Corporation</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Web Development</span>
                  <span className="font-semibold">$2,500.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">UI/UX Design</span>
                  <span className="font-semibold">$1,800.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Consulting</span>
                  <span className="font-semibold">$750.00</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    $5,050.00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Streamline Your Invoicing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who trust InvoicePro for their
            business invoicing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/invoice_generator">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                Create Your First Invoice
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 text-lg border-white text-white hover:bg-blue-700"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
