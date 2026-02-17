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
import { Search, Plus, Filter, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

import StatsCards from "../../components/invoices/StatsCards/page";
import InvoiceCard from "../../components/invoices/InvoiceCards/page";

export interface InvoiceType {
  id: string;
  invoice_number: string | number;
  status: string;
  from_company: string;
  to_company: string;
  amount?: number;
  currency?: string;
  description?: string;
  issue_date: string | Date;
  due_date?: string | Date;
  pdf_url?: string;
}

export default function Page() {
  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("issue_date");

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
    toast.info(`Viewing invoice #${invoice.invoice_number}`);
    // navigate or modal logic here
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (invoice?.pdf_url) {
        const link = document.createElement("a");
        link.href = invoice.pdf_url;
        link.download = `invoice-${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("PDF download started");
      } else {
        toast.error("PDF not available for this invoice");
      }
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error(error);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number
        ?.toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.from_company
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.to_company?.toLowerCase().includes(searchTerm.toLowerCase());

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
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        {/* Stats Overview */}
        <StatsCards invoices={invoices} />

        {/* Filters and Search */}
        <Card className="mb-6 shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by invoice number, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issue_date">Issue Date</SelectItem>
                    <SelectItem value="due_date">Due Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="invoice_number">Invoice #</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Invoice
              </Button>
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
