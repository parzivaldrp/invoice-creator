"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, Eye, Download, ArrowRight } from "lucide-react";
import { format, isAfter } from "date-fns";
import StatusBadge, { type Status } from "../StatusBadge/page";

// 1️⃣ Define the Invoice type
interface Invoice {
  id: string;
  invoice_number: string | number;
  status: string; // e.g. "paid" | "unpaid" | etc.
  from_company: string;
  to_company: string;
  amount?: number;
  currency?: string;
  description?: string;
  issue_date: string | Date; // accepts ISO string or Date
  due_date?: string | Date;
  pdf_url?: string;
}

// 2️⃣ Props for the component
interface InvoiceCardProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onDownload?: (invoiceId: string) => Promise<void> | void;
}

// 3️⃣ Component
const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onView,
  onDownload,
}) => {
  // Make sure the dates are converted properly
  const dueDate = invoice.due_date ? new Date(invoice.due_date) : undefined;
  const issueDate = new Date(invoice.issue_date);

  const isOverdue =
    invoice.status !== "paid" && dueDate && isAfter(new Date(), dueDate);

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload(invoice.id);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                #{invoice.invoice_number}
              </h3>
              <StatusBadge status={invoice.status as Status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{invoice.from_company}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{invoice.to_company}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              ${invoice.amount?.toLocaleString() || "0"}
            </p>
            <p className="text-sm text-slate-500">{invoice.currency || "USD"}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {invoice.description && (
            <p className="text-sm text-slate-600 line-clamp-2">
              {invoice.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Issued: {format(issueDate, "MMM d, yyyy")}</span>
              </div>
              {dueDate && (
                <div
                  className={`flex items-center gap-1 ${
                    isOverdue ? "text-red-600" : "text-slate-600"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Due: {format(dueDate, "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(invoice)}
                className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
              {invoice.pdf_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              )}
            </div>
            {isOverdue && (
              <Badge
                variant="destructive"
                className="bg-red-50 text-red-700 border-red-200"
              >
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceCard;
