"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Filter, FileText, ArrowUpDown, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import StatsCards from "../../components/invoices/StatsCards/page";
import InvoiceCard from "../../components/invoices/InvoiceCards/page";
import { useRouter } from 'next/navigation';

export interface InvoiceType {
  id: string;
  invoice_number: string | number;
  status: string;
  from_company: string;
  from_address?: string;
  from_email?: string;
  from_phone?: string;
  to_company: string;
  to_address?: string;
  to_email?: string;
  notes?: string;
  tax_rate?: number;
  amount?: number;
  currency?: string;
  description?: string;
  issue_date: string | Date;
  due_date?: string | Date;
  pdf_url?: string;
  total?: number;
}

export default function Page() {
  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("issue_date");
  const router = useRouter();

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order(sortBy, { ascending: false })
        .limit(100);

      if (error) throw error;

      setInvoices((data || []) as unknown as InvoiceType[]);
    } catch (error) {
      toast.error("Error loading invoices");
      console.error(error);
    }
    setIsLoading(false);
  }, [sortBy]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleView = (invoice: InvoiceType) => {
    router.push(`/InvoiceDetailPage/${invoice.id}`);
    toast.info(`Viewing invoice #${invoice.invoice_number}`);
    
    // navigate or modal logic here
  };

const handleSend = async (invoiceId: string) => {
  try {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice?.to_email) {
      toast.error('No client email found for this invoice');
      return;
    }

    // Fetch invoice items from Supabase
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    // Build invoiceData object for PDF generation
    const invoiceData = {
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      fromCompany: invoice.from_company,
      fromAddress: invoice.from_address || '',
      fromEmail: invoice.from_email || '',
      fromPhone: invoice.from_phone || '',
      toCompany: invoice.to_company,
      toAddress: invoice.to_address || '',
      toEmail: invoice.to_email || '',
      notes: invoice.notes || '',
      taxRate: invoice.tax_rate || 0,
      items: items || [],
    };

    const subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    const total = subtotal + taxAmount;

    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: invoice.to_email,
        toCompany: invoice.to_company,
        fromCompany: invoice.from_company,
        invoiceNumber: invoice.invoice_number,
        total,
        dueDate: invoice.due_date,
        invoiceData,   // ← now included
        subtotal,      // ← now included
        taxAmount,     // ← now included
      }),
    });

    if (!res.ok) throw new Error('Failed to send');

    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId);

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'sent' } : inv
      )
    );

    toast.success('Invoice sent with PDF attached!');
  } catch (error) {
    toast.error('Failed to send invoice');
    console.error(error);
  }
};

  const handleDelete = async (invoiceId: string) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;

    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    toast.success('Invoice deleted successfully');
  } catch (error) {
    toast.error('Failed to delete invoice');
    console.error(error);
  }
};

  const handleDownload = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (!invoice) {
        toast.error("Invoice not found");
        return;
      }

      // Fetch line items
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);
      if (itemsError) throw itemsError;

      const invoiceData = {
        invoiceNumber: String(invoice.invoice_number),
        issueDate: String(invoice.issue_date),
        dueDate: invoice.due_date ? String(invoice.due_date) : "",
        fromCompany: invoice.from_company || "",
        fromAddress: invoice.from_address || "",
        fromEmail: invoice.from_email || "",
        fromPhone: invoice.from_phone || "",
        toCompany: invoice.to_company || "",
        toAddress: invoice.to_address || "",
        toEmail: invoice.to_email || "",
        notes: invoice.notes || "",
        taxRate: invoice.tax_rate || 0,
        items: (items || []).map((i) => ({
          id: i.id,
          description: i.description ?? "",
          quantity: Number(i.quantity) || 0,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        })),
      };

      const subtotal = invoiceData.items.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const taxAmount = subtotal * (invoiceData.taxRate / 100);
      const total = subtotal + taxAmount;

      // Dynamic imports so @react-pdf/renderer only loads on the client
      const [{ pdf }, { default: InvoicePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../invoice_generator/InvoicePDF"),
      ]);

      const blob = await pdf(
        <InvoicePDF
          invoiceData={invoiceData}
          subtotal={subtotal}
          taxAmount={taxAmount}
          total={total}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF download started");
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error(error);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      invoice.invoice_number?.toString().toLowerCase().includes(q) ||
      invoice.from_company?.toLowerCase().includes(q) ||
      invoice.to_company?.toLowerCase().includes(q) ||
      invoice.to_email?.toLowerCase().includes(q) ||
      invoice.notes?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-24 bg-slate-200 rounded"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-48 bg-slate-200 rounded"></div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Invoice Management
            </h1>
            <p className="text-slate-600">
              Track and manage your business invoices efficiently
            </p>
          </div>
          <Link href="/invoice_generator">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <StatsCards invoices={invoices} />

        {/* Filters and Search */}
        <Card className="mb-6 shadow-sm border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search — full width on mobile, ~half on desktop.
                  `block` + `w-full` on the relative wrapper guarantee the
                  absolute-positioned search icon stays anchored to the
                  input box at every breakpoint. */}
              <div className="md:col-span-6 lg:col-span-7 relative block w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
                <Input
                  placeholder="Search by invoice #, company, client email, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status filter — `mr-2` removed from icon; SelectTrigger
                  now wraps children in a flex container with gap-2 so
                  spacing comes from there, not from per-icon margins. */}
              <div className="md:col-span-3 lg:col-span-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full h-10">
                    <Filter className="w-4 h-4 shrink-0 text-slate-500" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort by */}
              <div className="md:col-span-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full h-10">
                    <ArrowUpDown className="w-4 h-4 shrink-0 text-slate-500" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issue_date">Sort: Issue date</SelectItem>
                    <SelectItem value="due_date">Sort: Due date</SelectItem>
                    <SelectItem value="total">Sort: Amount</SelectItem>
                    <SelectItem value="invoice_number">Sort: Invoice #</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filter chips */}
            {(searchTerm || statusFilter !== "all") && (
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-600">
                <span className="font-medium">Active:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
                    &ldquo;{searchTerm}&rdquo;
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-1">
                    Status: {statusFilter}
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      aria-label="Clear status filter"
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="text-slate-500 hover:text-slate-700 underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Grid */}
        {filteredInvoices.length === 0 ? (
          <Card className="py-12 text-center shadow-sm border-0">
            <CardContent>
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No invoices found
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first invoice to get started"}
              </p>
              <Link href="/invoice_generator">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Invoice
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredInvoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <InvoiceCard
                    invoice={invoice}
                    onView={handleView}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onSend={handleSend}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Results Summary */}
        {filteredInvoices.length > 0 && (
          <div className="mt-8 text-center text-slate-600">
            <p>
              Showing {filteredInvoices.length} of {invoices.length} invoices
              {(searchTerm || statusFilter !== "all") && " (filtered)"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
