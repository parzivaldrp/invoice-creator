
'use client'


import { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-toastify';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    setFormData((prev) => ({ ...prev, agreeToTerms: checked === true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation
    if (!formData.name.trim()) {
      toast.warning("Please enter your name.");
      setIsLoading(false);
      return;
    }
    if (formData.name.trim().length < 2) {
      toast.warning("Name must be at least 2 characters.");
      setIsLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      toast.warning("Please enter your email.");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.warning("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (!formData.password) {
      toast.warning("Please enter a password.");
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 7) {
      toast.warning("Password must be at least 7 characters.");
      setIsLoading(false);
      return;
    }
    if (!formData.confirmPassword) {
      toast.warning("Please confirm your password.");
      setIsLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.warning("Passwords don't match!");
      setIsLoading(false);
      return;
    }
    if (!formData.agreeToTerms) {
      toast.warning("Please agree to the terms of service!");
      setIsLoading(false);
      return;
    }

   try {
    // Pass full_name and agree_to_terms via options.data — this lands in
    // auth.users.raw_user_meta_data, which the on_auth_user_created trigger
    // (migration 0001) reads to create the profile row. So we don't need
    // a separate client-side INSERT/RPC after signUp — the trigger does it.
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name.trim(),
          agree_to_terms: formData.agreeToTerms,
        },
      },
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      if (signUpError.message.includes('already registered')) {
        toast.error("This email is already registered. Please sign in instead.");
      } else if (signUpError.message.includes('password')) {
        toast.error("Password does not meet requirements.");
      } else {
        toast.error(`Sign up failed: ${signUpError.message}`);
      }
      setIsLoading(false);
      return;
    }

    // Belt-and-braces: also try the RPC in case the auth.users trigger isn't
    // installed (older Supabase projects). The trigger runs synchronously on
    // signUp and uses raw_user_meta_data (which we now pass via options.data
    // above), so in well-configured projects this is a no-op upsert.
    // We skip this if `user` is null (anti-enumeration response) since we
    // have no id to write against — but the request still succeeded.
    if (user) {
      const { error: rpcError } = await supabase.rpc('create_user_profile', {
        user_id: user.id,
        full_name: formData.name.trim(),
        agree_to_terms: formData.agreeToTerms,
      });
      if (rpcError) {
        console.warn('[signup] create_user_profile RPC reported:', rpcError);
      }
    }

    // No error from signUp() means the account was created (or already
    // existed — Supabase hides this for anti-enumeration). Tell the user
    // their account is good to go, then nudge them to verify their email.
    toast.success(`Account created for ${formData.email}!`);
    toast.info('Check your inbox to verify your email before signing in.', {
      autoClose: 7000,
    });
    const rawNext =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next')
        : null;
    const safeNextPath =
      rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;
    router.push(
      safeNextPath ? `/login?next=${encodeURIComponent(safeNextPath)}` : '/login'
    );
   } catch (error: unknown) {
    console.error('Unexpected error during signup:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    toast.error(`Sign up failed: ${errorMessage}`);
   } finally {
    setIsLoading(false);
   }
  };

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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join us and start your journey today
          </p>
        </div>

        {/* Signup Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Sign Up
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Fill in your information to get started
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Full name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
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
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
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

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={handleCheckboxChange}
                  className="border-gray-300"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-gray-600 leading-5"
                >
                  I agree to the{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                </Label>
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
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
