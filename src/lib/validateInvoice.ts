import { toast } from 'react-toastify';

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate invoice data.
 *
 * mode='draft': lenient — only checks that whatever IS filled in is valid
 *   (email format, date ordering, negative numbers). Empty fields are OK.
 *
 * mode='final' (default): strict — requires all the fields needed to
 *   actually send a real invoice to a client.
 */
export function validateInvoice(
  invoiceData: InvoiceData,
  mode: 'draft' | 'final' = 'final'
): boolean {
  // ------------------------------------------------------------------
  // Format checks — always run, regardless of mode
  // ------------------------------------------------------------------
  if (invoiceData.fromEmail.trim() && !emailRegex.test(invoiceData.fromEmail)) {
    toast.error('Your email is not valid');
    return false;
  }
  if (invoiceData.toEmail.trim() && !emailRegex.test(invoiceData.toEmail)) {
    toast.error('Client email is not valid');
    return false;
  }
  if (
    invoiceData.issueDate &&
    invoiceData.dueDate &&
    invoiceData.dueDate < invoiceData.issueDate
  ) {
    toast.error('Due date cannot be before issue date');
    return false;
  }
  if (invoiceData.taxRate < 0 || invoiceData.taxRate > 100) {
    toast.error('Tax rate must be between 0 and 100');
    return false;
  }
  for (const item of invoiceData.items) {
    if (item.quantity < 0) {
      toast.error('Item quantity cannot be negative');
      return false;
    }
    if (item.rate < 0) {
      toast.error('Item rate cannot be negative');
      return false;
    }
  }

  // Invoice number is auto-generated on form load, so even drafts have one.
  if (!invoiceData.invoiceNumber.trim()) {
    toast.error('Invoice number is required');
    return false;
  }

  // Drafts stop here — partial data is fine.
  if (mode === 'draft') return true;

  // ------------------------------------------------------------------
  // Final mode — strict required-fields
  // ------------------------------------------------------------------
  if (!invoiceData.fromCompany.trim()) {
    toast.error('Your company name is required');
    return false;
  }
  if (!invoiceData.fromEmail.trim()) {
    toast.error('Your email is required');
    return false;
  }
  if (!invoiceData.toCompany.trim()) {
    toast.error('Client company name is required');
    return false;
  }
  if (!invoiceData.toEmail.trim()) {
    toast.error('Client email is required');
    return false;
  }
  if (!invoiceData.issueDate) {
    toast.error('Issue date is required');
    return false;
  }
  if (!invoiceData.dueDate) {
    toast.error('Due date is required');
    return false;
  }
  if (invoiceData.items.length === 0) {
    toast.error('At least one item is required');
    return false;
  }
  for (const item of invoiceData.items) {
    if (!item.description.trim()) {
      toast.error('All items must have a description');
      return false;
    }
    if (item.rate <= 0) {
      toast.error('All items must have a rate greater than 0');
      return false;
    }
  }
  return true;
}
