
'use client'
import { Button } from "@/components/ui/button";
import { FileText, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';


export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();


  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully!");
      router.push('/');
    } catch {
      toast.error("Error signing out. Please try again.");
    }
  };

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">InvoicePro</span>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  // Get display name
  const displayName = user?.user_metadata?.full_name || user?.email;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">InvoicePro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/invoice_generator"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Create Invoice
            </Link>
            <Link
              href="/templates"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/pricing"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Pricing
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{displayName}</span>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="text-gray-700 hover:text-red-600 border-gray-300 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signUp">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/invoice_generator"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Create Invoice
              </Link>
              <Link
                href="/templates"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Templates
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              
              {user ? (
                <div className="px-3 py-2 space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 px-3 py-2">
                    <User className="h-4 w-4" />
                    <span>{displayName}</span>
                  </div>
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start text-gray-700 hover:text-red-600 border-gray-300 hover:border-red-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2 border-t border-gray-200 pt-4">
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:text-blue-600"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/signUp"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
