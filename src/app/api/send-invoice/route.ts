import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import InvoicePDF from '@/app/invoice_generator/InvoicePDF';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { 
    toEmail, 
    toCompany, 
    fromCompany, 
    invoiceNumber, 
    total, 
    dueDate,
    invoiceData,    
    subtotal,   
    taxAmount
  } = await req.json(); 

  try {
    // Generate PDF buffer on the server
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDF, { invoiceData, subtotal, taxAmount, total }) as any
    );

    await resend.emails.send({
      from: 'Invoice <onboarding@resend.dev>',
      to: toEmail,
      subject: `Invoice #${invoiceNumber} from ${fromCompany}`,
      html: `
        <h2>Invoice #${invoiceNumber}</h2>
        <p>Hi ${toCompany},</p>
        <p>Please find your invoice attached to this email.</p>
        <ul>
          <li><strong>Invoice Number:</strong> #${invoiceNumber}</li>
          <li><strong>Total Amount:</strong> $${total}</li>
          <li><strong>Due Date:</strong> ${dueDate}</li>
        </ul>
        <p>Please make payment by the due date.</p>
        <p>Thanks,<br/>${fromCompany}</p>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}