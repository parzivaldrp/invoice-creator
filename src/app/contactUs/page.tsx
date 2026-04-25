'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.warning('Please enter your name.');
      return;
    }
    if (!form.email.trim() || !emailRegex.test(form.email)) {
      toast.warning('Please enter a valid email address.');
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.warning('Please enter a message (at least 10 characters).');
      return;
    }

    setIsSending(true);
    // We don't have a backend endpoint for contact yet; simulate send + surface
    // the data in the console so the user can wire up Resend / their own handler.
    try {
      // eslint-disable-next-line no-console
      console.log('Contact form submission:', form);
      await new Promise((r) => setTimeout(r, 600));
      setIsDone(true);
      toast.success("Thanks! We'll get back to you within one business day.");
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Contact us
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Questions, feedback, bug reports — we read every message.
          </p>
        </div>

        {isDone ? (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-10 pb-10 text-center space-y-3">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Message received
              </h2>
              <p className="text-sm text-gray-600">
                We&apos;ll reply to{' '}
                <span className="font-medium text-gray-900">{form.email}</span>{' '}
                within one business day.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setForm({ name: '', email: '', subject: '', message: '' });
                  setIsDone(false);
                }}
              >
                Send another message
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Get in touch
              </CardTitle>
              <CardDescription className="text-gray-600">
                Fill out the form and we&apos;ll get back to you.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (optional)</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    placeholder="What's this about?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    rows={6}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send message
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-500">
                  Or email us directly at{' '}
                  <a
                    href="mailto:support@invoice-creator.app"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    support@invoice-creator.app
                  </a>
                </p>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
