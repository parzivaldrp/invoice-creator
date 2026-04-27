import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import InvoicePDF from '@/app/invoice_generator/InvoicePDF';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const resend = new Resend(process.env.RESEND_API_KEY);

/** Safe error logging: never log payloads (they contain customer PII). */
function logServerError(label: string, err: unknown) {
  if (err instanceof Error) {
    console.error(`[send-invoice] ${label}: ${err.name}: ${err.message}`);
  } else {
    console.error(`[send-invoice] ${label}: unknown error`);
  }
}

export async function POST(req: Request) {
  // 1. Server config sanity ----------------------------------------------
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email service not configured on the server.' },
      { status: 500 }
    );
  }

  // 2. Authenticate via cookie session -----------------------------------
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json(
      { error: 'You must be signed in to send invoices.' },
      { status: 401 }
    );
  }

  // 3. Parse + minimally validate the body -------------------------------
  let body: {
    toEmail?: string;
    toCompany?: string;
    fromCompany?: string;
    invoiceNumber?: string | number;
    total?: number | string;
    dueDate?: string;
    invoiceData?: unknown;
    subtotal?: number;
    taxAmount?: number;
  };
  try {
    body = await req.json();
  } catch (err) {
    logServerError('json-parse', err);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { toEmail, toCompany, fromCompany, invoiceNumber, total, dueDate, invoiceData, subtotal, taxAmount } = body;

  if (!toEmail || typeof toEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return NextResponse.json({ error: 'A valid recipient email is required.' }, { status: 400 });
  }
  if (!invoiceNumber || !invoiceData) {
    return NextResponse.json({ error: 'Missing invoice payload.' }, { status: 400 });
  }

  // 4. Render PDF + send --------------------------------------------------
  try {
    // The InvoicePDF component validates fields at render time; we've
    // already confirmed `invoiceData` exists above. The `as any` here is
    // intentional: react-pdf's element types don't compose cleanly with
    // Next's React types, but the runtime contract is fine.
    const pdfBuffer = await renderToBuffer(
      createElement(
        InvoicePDF,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { invoiceData, subtotal, taxAmount, total } as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any
    );

    await resend.emails.send({
      from: 'Invoice <onboarding@resend.dev>',
      to: toEmail,
      subject: `Invoice #${invoiceNumber} from ${fromCompany ?? 'your supplier'}`,
      html: `
        <h2>Invoice #${invoiceNumber}</h2>
        <p>Hi ${toCompany ?? 'there'},</p>
        <p>Please find your invoice attached to this email.</p>
        <ul>
          <li><strong>Invoice Number:</strong> #${invoiceNumber}</li>
          <li><strong>Total Amount:</strong> $${total ?? ''}</li>
          <li><strong>Due Date:</strong> ${dueDate ?? ''}</li>
        </ul>
        <p>Please make payment by the due date.</p>
        <p>Thanks,<br/>${fromCompany ?? ''}</p>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError('send', err);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}
