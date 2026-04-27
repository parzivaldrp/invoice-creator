'use client';

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- Types -----------------------------------------------------------------

/**
 * Shape returned by /api/extract-invoice.
 * Every field is optional: Textract may not detect everything.
 * Items use the same row shape used by the invoice generator.
 */
export interface ExtractedInvoiceData {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  fromCompany?: string;
  fromAddress?: string;
  fromEmail?: string;
  fromPhone?: string;
  toCompany?: string;
  toAddress?: string;
  toEmail?: string;
  items?: {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  taxRate?: number;
  total?: number;
}

interface InvoiceUploadProps {
  /** Called when Textract returns a parsed invoice. */
  onExtracted: (data: ExtractedInvoiceData) => void;
  /** Optional className for the outer wrapper. */
  className?: string;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

// --- Constants -------------------------------------------------------------

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const ACCEPT_ATTR = 'image/jpeg,image/png,image/jpg,application/pdf';

// --- Helpers ---------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, or PDF files are supported.';
  }
  if (file.size > MAX_BYTES) {
    return `File is too large (${formatBytes(file.size)}). Max 5 MB.`;
  }
  return null;
}

// --- Component -------------------------------------------------------------

export default function InvoiceUpload({ onExtracted, className }: InvoiceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setFileMeta(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const err = validateFile(file);
      if (err) {
        setErrorMsg(err);
        setState('error');
        setFileMeta({ name: file.name, size: file.size });
        return;
      }

      setFileMeta({ name: file.name, size: file.size });
      setErrorMsg(null);
      setState('uploading');

      try {
        // The Supabase session cookie is sent automatically with same-
        // origin fetches; the server route reads it via @/lib/supabase/server.
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/extract-invoice', {
          method: 'POST',
          body: formData,
          credentials: 'same-origin',
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErrorMsg(json?.error || 'Could not read the invoice. Try a sharper photo.');
          setState('error');
          return;
        }

        onExtracted(json as ExtractedInvoiceData);
        setState('success');
      } catch {
        setErrorMsg('Network error. Please check your connection and try again.');
        setState('error');
      }
    },
    [onExtracted]
  );

  // --- Event handlers ------------------------------------------------------

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onBrowseClick = () => {
    inputRef.current?.click();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (state === 'uploading') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onBrowseClick();
    }
  };

  // --- Render --------------------------------------------------------------

  return (
    <div className={className}>
      <div
        className="relative overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-1 shadow-sm"
        aria-label="AI invoice extraction"
      >
        {/* Decorative corner glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-blue-300/40 to-purple-300/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-gradient-to-tr from-indigo-300/30 to-pink-300/30 blur-3xl"
        />

        <div className="relative rounded-xl bg-white/70 backdrop-blur-sm p-5 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Auto-fill from a photo
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    AI
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Drop an invoice image or PDF — we&apos;ll fill the form for you.
                </p>
              </div>
            </div>

            {state !== 'idle' && state !== 'uploading' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
                className="self-start sm:self-auto"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Try another
              </Button>
            )}
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={onInputChange}
            className="sr-only"
            aria-label="Choose an invoice file to extract"
          />

          {/* Stateful surface */}
          <AnimatePresence mode="wait" initial={false}>
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload an invoice photo or PDF"
                  onClick={onBrowseClick}
                  onKeyDown={onKeyDown}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={[
                    'group relative flex flex-col items-center justify-center text-center',
                    'rounded-xl border-2 border-dashed px-4 py-8 sm:py-10 cursor-pointer',
                    'transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    isDragging
                      ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40',
                  ].join(' ')}
                >
                  <motion.div
                    animate={isDragging ? { y: -4 } : { y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-3 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </motion.div>
                  <p className="text-sm sm:text-base font-medium text-gray-900">
                    {isDragging ? 'Drop it here' : 'Drag & drop an invoice'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    or{' '}
                    <span className="font-semibold text-blue-600 underline-offset-2 group-hover:underline">
                      click to browse
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500 mt-3">
                    JPG, PNG, or PDF · up to 5 MB
                  </p>
                </div>
              </motion.div>
            )}

            {state === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-xl border border-blue-200 bg-white px-4 py-6 sm:px-6"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Reading {fileMeta?.name ?? 'your invoice'}…
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Extracting fields with AWS Textract — usually 3 to 8 seconds.
                    </p>
                  </div>
                </div>

                {/* Indeterminate shimmer bar */}
                <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                  <motion.div
                    className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                    initial={{ x: '-100%' }}
                    animate={{ x: '300%' }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-5 sm:px-6"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <motion.div
                    initial={{ scale: 0.6, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100"
                  >
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-900">
                      Invoice extracted!
                    </p>
                    <p className="text-xs text-emerald-800/80 mt-0.5">
                      We&apos;ve filled the form below. Please review every field before saving.
                    </p>
                    {fileMeta && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 text-[11px] text-emerald-900 ring-1 ring-emerald-200">
                        <FileImage className="h-3 w-3" aria-hidden="true" />
                        <span className="truncate max-w-[180px] sm:max-w-xs">
                          {fileMeta.name}
                        </span>
                        <span className="text-emerald-700/70">
                          · {formatBytes(fileMeta.size)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 px-4 py-5 sm:px-6"
                role="alert"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100">
                    <AlertCircle className="h-6 w-6 text-rose-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-rose-900">
                      Couldn&apos;t extract this one
                    </p>
                    <p className="text-xs text-rose-800/90 mt-0.5">
                      {errorMsg ?? 'Please try a sharper photo or fill the form manually.'}
                    </p>
                    {fileMeta && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 text-[11px] text-rose-900 ring-1 ring-rose-200">
                        <X className="h-3 w-3" aria-hidden="true" />
                        <span className="truncate max-w-[180px] sm:max-w-xs">
                          {fileMeta.name}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={onBrowseClick}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                        Try a different file
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={reset}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tip + privacy row */}
          {state === 'idle' && (
            <div className="mt-3 space-y-1 text-center">
              <p className="text-[11px] text-gray-500">
                Tip: a flat, well-lit photo works best.
              </p>
              <p className="text-[11px] text-gray-500">
                Your file is processed in memory only — we don&apos;t store the original photo or PDF.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
