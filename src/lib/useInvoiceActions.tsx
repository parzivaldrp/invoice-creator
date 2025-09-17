// hooks/useInvoiceActions.ts
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  fromCompany: string;
  fromAddress: string;
  fromEmail: string;
  fromPhone: string;
  toCompany: string;
  toAddress: string;
  toEmail: string;
  items: InvoiceItem[];
  notes: string;
  taxRate: number;
}

export function useInvoiceActions(invoiceData: InvoiceData) {
  const saveInvoiceToDB = async (status: "draft" | "final") => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("You must be logged in to save invoices.");
      return;
    }

    const invoicePayload = {
      user_id: user.id,
      invoice_number: invoiceData.invoiceNumber,
      invoice_date: invoiceData.date,
      due_date: invoiceData.dueDate,
      from_company: invoiceData.fromCompany,
      from_address: invoiceData.fromAddress,
      from_email: invoiceData.fromEmail,
      from_phone: invoiceData.fromPhone,
      to_company: invoiceData.toCompany,
      to_address: invoiceData.toAddress,
      to_email: invoiceData.toEmail,
      items: invoiceData.items,
      notes: invoiceData.notes,
      tax_rate: invoiceData.taxRate,
      status,
    };

    const { error } = await supabase.from("invoices").insert([invoicePayload]);

    if (error) {
      console.error("Error saving invoice:", error.message);
      toast.error("Failed to save invoice.");
    } else {
      toast.success(  
        status === "draft" ? "Draft saved successfully!" : "Invoice finalized!"
      );
    }
  };

  return { saveInvoiceToDB };
}
