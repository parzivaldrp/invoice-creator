'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  from_company: string;
  from_address: string;
  from_email: string;
  from_phone: string;
  to_company: string;
  to_address: string;
  to_email: string;
  issue_date: string;
  due_date: string;
  notes: string;
  tax_rate: number;
  total: number;
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) {
        console.error(invoiceError);
        setIsLoading(false);
        return;
      }

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      if (itemsError) console.error(itemsError);

      setInvoice(invoiceData);
      setItems(itemsData || []);
      setIsLoading(false);
    };

    fetchInvoice();
  }, [id]);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!invoice) return <div className="p-8">Invoice not found.</div>;

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (invoice.tax_rate / 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="outline"
          onClick={() => router.push('/myInvoice')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-gray-500 mt-1">#{invoice.invoice_number}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                {invoice.status}
              </span>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p><span className="font-medium">Issue Date:</span> {invoice.issue_date}</p>
              <p><span className="font-medium">Due Date:</span> {invoice.due_date}</p>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">From</h3>
              <p className="font-medium">{invoice.from_company}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.from_address}</p>
              <p className="text-sm text-gray-600">{invoice.from_email}</p>
              <p className="text-sm text-gray-600">{invoice.from_phone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bill To</h3>
              <p className="font-medium">{invoice.to_company}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.to_address}</p>
              <p className="text-sm text-gray-600">{invoice.to_email}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b text-left text-sm font-medium text-gray-600">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Rate</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 text-sm">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">${item.rate.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({invoice.tax_rate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}