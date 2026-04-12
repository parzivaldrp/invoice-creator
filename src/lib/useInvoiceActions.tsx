'use client';

import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';
import { useAuth } from './authContext';

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

export function useInvoiceActions(invoiceData: InvoiceData, editId?: string | null) {
  const { user } = useAuth();

  const saveInvoiceToDB = async (status: 'draft' | 'final') => {
    if (!user) {
      toast.error('You must be logged in.');
      return;
    }

    try {
      const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = subtotal * (invoiceData.taxRate / 100);
      const total = subtotal + taxAmount;

      let invoiceId: string;

      if (editId) {
        // UPDATE existing invoice
        const { error } = await supabase
          .from('invoices')
          .update({
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
            total: total,
            status: status,
          })
          .eq('id', editId);

        if (error) throw error;
        invoiceId = editId;

        // Delete old items and re-insert fresh ones
        await supabase.from('invoice_items').delete().eq('invoice_id', editId);

      } else {
        // INSERT new invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert([{
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
            total: total,
            status: status,
          }])
          .select()
          .single();

        if (invoiceError) throw invoiceError;
        invoiceId = invoice.id;
      }

      // Insert items (for both new and updated invoices)
      const itemsToInsert = invoiceData.items.map((item) => ({
        invoice_id: invoiceId,
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