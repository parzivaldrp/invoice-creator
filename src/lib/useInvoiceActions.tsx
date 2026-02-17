'use client';

import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';
import { useAuth } from './authContext'; // so we get logged in user

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
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
  const { user } = useAuth(); // get current logged in user

  // status = 'draft' or 'final'
  const saveInvoiceToDB = async (status: 'draft' | 'final') => {
    if (!user) {
      toast.error('You must be logged in.');
      return;
    }

    try {
      // Insert or update invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            user_id: user.id,
            invoice_number: invoiceData.invoiceNumber,
            issue_date: invoiceData.issueDate,
            due_date: invoiceData.dueDate,
            from_company: invoiceData.fromCompany,
            from_address: invoiceData.fromAddress,
            from_email: invoiceData.fromEmail,
            from_phone: invoiceData.fromPhone,
            to_company: invoiceData.toCompany,
            to_address: invoiceData.toAddress,
            to_email: invoiceData.toEmail,
            notes: invoiceData.notes,
            tax_rate: invoiceData.taxRate,
            status: status,
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert items
      const itemsToInsert = invoiceData.items.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(
        status === 'draft'
          ? 'Invoice saved as draft successfully'
          : 'Invoice saved as final successfully'
      );
    } catch (err) {
      console.error(err);
      toast.error('Error saving invoice');
    }
  };

  return { saveInvoiceToDB };
}
