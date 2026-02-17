'use client';

import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

interface InvoiceRecord {
    id: string;
    invoice_number: string | number;
    issue_date: string | Date | null;
    status: string;
}

export default function InvoiceDetail() {
    const params = useParams();
    const id = params?.id;
    const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
    const[items, setItems] = useState<InvoiceItem[]>([]);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            const { data: inv, error: invErr } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

            if(invErr) return;

            setInvoice(inv as unknown as InvoiceRecord);

            const { data: invItems, error: itemsErr } =  await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', id);

            if (!itemsErr) setItems((invItems || []) as unknown as InvoiceItem[]);

        };

        fetchData();
    }, [id]);
    if(!invoice) return <div>Loading...</div>;

    return(


        <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          Invoice {invoice.invoice_number}
        </h1>
        <p>
          Issue Date:{' '}
          {invoice.issue_date &&
            new Date(invoice.issue_date).toLocaleDateString()}
        </p>
        <p>Status: {invoice.status}</p>
  
        <h2 className="text-xl mt-4">Items</h2>
        <table className="w-full border mt-2">
          <thead>
            <tr>
              <th className="border p-2">Description</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Rate</th>
              <th className="border p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="border p-2">{item.description}</td>
                <td className="border p-2">{item.quantity}</td>
                <td className="border p-2">{item.rate}</td>
                <td className="border p-2">{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      
      </div>

     

    );





}

