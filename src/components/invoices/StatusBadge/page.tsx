import React from 'react';
import { Badge } from "../../ui/badge";
import { CheckCircle, Clock, AlertTriangle, FileText, X } from "lucide-react";

// 1️⃣ Define all allowed statuses as a union type
export type Status = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// 2️⃣ Props for the component
interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // 3️⃣ Configuration for each status
  const statusConfig: Record<Status, {
    label: string;
    variant: 'secondary' | 'outline' | 'destructive';
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = {
    draft: {
      label: "Draft",
      variant: "secondary",
      className: "bg-slate-100 text-slate-700 hover:bg-slate-200",
      icon: FileText
    },
    sent: {
      label: "Sent",
      variant: "outline",
      className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      icon: Clock
    },
    paid: {
      label: "Paid",
      variant: "outline",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      icon: CheckCircle
    },
    overdue: {
      label: "Overdue",
      variant: "destructive",
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      icon: AlertTriangle
    },
    cancelled: {
      label: "Cancelled",
      variant: "outline",
      className: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
      icon: X
    }
  };

  // 4️⃣ Pick config based on status
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} flex items-center gap-1 px-3 py-1`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
