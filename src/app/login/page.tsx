'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-toastify';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // When Supabase says the email isn't confirmed we show an inline panel
  // with a Resend button. Holds the email that needs confirming so the
  // Resend call uses exactly what the user just typed.
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  // Surface state from query params after redirects:
  //   ?unverified=<email> — middleware bounced an unverified session here
  //   ?error=invalid_link — /auth/confirm got a token_hash but no type
  //   ?error=expired_link — link was already used or has expired
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const unverified = params.get('unverified');
    if (unverified && unverified !== '1') {
      setEmail(unverified);
      setUnconfirmedEmail(unverified);
    }

    const error = params.get('error');
    if (error === 'expired_link') {
      toast.error('That verification link has expired. Sign in to get a new one.');
    } else if (error === 'invalid_link') {
      toast.error('That verification link is invalid. Try signing up again.');
    }
  }, []);

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail || isResending) return;
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: unconfirmedEmail,
    });
    setIsResending(false);
    if (error) {
      toast.error(`Could not resend: ${error.message}`);
    } else {
      toast.success(`Verification email re-sent to ${unconfirmedEmail}.`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!email.trim()) {
      toast.warning("Please enter your email.");
      return;
    }
    if (!validateEmail(email)) {
      toast.warning("Please enter a valid email address.");
      return;
    }
    if (!password) {
      toast.warning("Please enter your password.");
      return;
    }
    if (password.length < 7) {
      toast.warning("Password must be at least 7 characters.");
      return;
    }

    setIsLoading(true);
    setUnconfirmedEmail(null); // clear any previous unconfirmed panel
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Incorrect email or password.");
      } else if (error.message.includes("Email not confirmed")) {
        // Supabase's built-in enforcement (Confirm email setting ON).
        setUnconfirmedEmail(email);
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Defense-in-depth: even if Supabase's "Confirm email" setting is off
    // (or its enforcement has a gap), we refuse to let an unverified user
    // hold an authenticated session. Sign them right back out and show
    // the verification panel so they can resend the link.
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      setIsLoading(false);
      setUnconfirmedEmail(email);
      return;
    }

    setIsLoading(false);
    toast.success("Logged in successfully!");
    router.push(safeNext() ?? '/');
  };

  /**
   * Read ?next= from the URL and only honor it if it's a same-origin
   * relative path. Prevents open-redirect attacks via crafted links.
   */
  function safeNext(): string | null {
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('next');
    if (!raw) return null;
    try {
      const decoded = decodeURIComponent(raw);
      if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded;
    } catch {
      // ignore malformed
    }
    return null;
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand Section */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM12 17C10.33 17 8.94 16.19 8.16 15H15.84C15.06 16.19 13.67 17 12 17Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {/* Unconfirmed-email panel — appears only after a failed sign-in
                  with that specific Supabase error. Gives the user a way to
                  recover without leaving the page. */}
              {unconfirmedEmail && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      Verify your email to sign in
                    </p>
                    <p className="text-xs text-amber-800 mt-1 break-words">
                      We sent a confirmation link to{' '}
                      <span className="font-medium">{unconfirmedEmail}</span>. Click
                      it before signing in. Can&apos;t find it? Check your spam
                      folder, or resend below.
                    </p>
                    <Button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      size="sm"
                      variant="outline"
                      className="mt-2 border-amber-300 text-amber-900 hover:bg-amber-100 hover:text-amber-900"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          Resend verification email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/forgotPassword"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
               {`Don't have an account?`} {" "}
                <Link
                  href="/signUp"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign up here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}





/*
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Incorrect email or password.");
      } else if (error.message.includes("Email not confirmed")) {
        toast.warning("Please confirm your email before logging in.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Logged in successfully!");
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          className="w-full border border-gray-300 rounded p-2"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border border-gray-300 rounded p-2" 
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}*/
