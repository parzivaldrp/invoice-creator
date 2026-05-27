'use client';

import { Button } from '@/components/ui/button';
import {
  FileText,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  UserCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

function getInitials(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || email || '';
  if (!source) return '?';
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function getFirstName(name?: string | null, email?: string | null) {
  if (name && name.trim()) return name.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'there';
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, profile, loading, signOut, isPro } = useAuth();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      toast.success('Signed out successfully!');
      router.push('/');
    } catch {
      toast.error('Error signing out. Please try again.');
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

  const fullName = profile?.full_name ?? '';
  const email = user?.email ?? '';
  const initials = getInitials(fullName, email);
  const firstName = getFirstName(fullName, email);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
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

          {/* Desktop Auth / Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
                    {initials}
                  </span>
                  <span className="text-sm font-medium text-gray-800 max-w-[120px] truncate">
                    {firstName}
                  </span>
                  {isPro && (
                    <span
                      title="Pro plan"
                      className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                    >
                      <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                      Pro
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white border border-gray-200 shadow-lg py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {fullName || firstName}
                            </p>
                            {isPro && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shrink-0">
                                <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                                Pro
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard className="h-4 w-4 text-gray-500" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <UserCircle className="h-4 w-4 text-gray-500" />
                      Profile
                    </Link>
                    <Link
                      href="/myInvoice"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 text-gray-500" />
                      My Invoices
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Link
                href="/profile"
                aria-label="Profile"
                className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-semibold flex items-center justify-center"
              >
                {initials}
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {user && (
                <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 mb-2">
                  <span className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {fullName || firstName}
                      </p>
                      {isPro && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shrink-0">
                          <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{email}</p>
                  </div>
                </div>
              )}

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
                <div className="px-1 py-2 space-y-1 border-t border-gray-200 pt-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/myInvoice"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    My Invoices
                  </Link>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full justify-start mt-2 text-red-600 hover:text-red-700 border-gray-300 hover:border-red-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2 border-t border-gray-200 pt-4">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:text-blue-600"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signUp" onClick={() => setIsMenuOpen(false)}>
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
