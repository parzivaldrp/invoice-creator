import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Edit3, CheckCircle } from "lucide-react";

// Define the shape of invoice object
interface Invoice {
  id: string;
  status: 'draft' | 'final' | string; // extendable for other statuses
  // add more fields if needed
}

interface StatsCardsProps {
  invoices: Invoice[];
}

export default function page({ invoices }: StatsCardsProps) {
  // Count totals
  const totalInvoices = invoices.length;
  const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;
  const finalInvoices = invoices.filter(inv => inv.status === 'final').length;

  const stats = [
    {
      title: "Total Invoices",
      value: totalInvoices,
      icon: FileText,
      bgColor: "bg-slate-50",
      iconColor: "text-slate-600",
      borderColor: "border-slate-200"
    },
    {
      title: "Draft Invoices",
      value: draftInvoices,
      icon: Edit3,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200"
    },
    {
      title: "Final Invoices",
      value: finalInvoices,
      icon: CheckCircle,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className={`${stat.bgColor} ${stat.borderColor} border transition-all duration-200 hover:shadow-md`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
