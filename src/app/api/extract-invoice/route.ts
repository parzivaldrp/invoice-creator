import { NextRequest, NextResponse } from 'next/server';
import {
  TextractClient,
  AnalyzeExpenseCommand,
  type ExpenseField,
} from '@aws-sdk/client-textract';
import { createClient } from '@/lib/supabase/server';

// Run on Node (Textract SDK uses Node-only APIs); allow up to 30s.
export const runtime = 'nodejs';
export const maxDuration = 30;

// --- Limits ----------------------------------------------------------------

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per upload
const ACCEPTED = new Set([
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
]);
// How many extractions a single user is allowed per rolling 24h window.
const DAILY_USER_LIMIT = 25;

const textract = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

// --- Helpers ---------------------------------------------------------------

function getField(fields: ExpenseField[] | undefined, type: string): string | undefined {
  const f = fields?.find((x) => x.Type?.Text === type);
  const text = f?.ValueDetection?.Text?.trim();
  return text && text.length > 0 ? text : undefined;
}

function parseNumber(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  if (!cleaned) return undefined;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function parseDate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().split('T')[0];
}

/** Safe error logging: name + message only, never the request body. */
function logServerError(label: string, err: unknown) {
  if (err instanceof Error) {
    console.error(`[extract-invoice] ${label}: ${err.name}: ${err.message}`);
  } else {
    console.error(`[extract-invoice] ${label}: unknown error`);
  }
}

// --- Handler ---------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Server config sanity ------------------------------------------------
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { error: 'AWS credentials not configured on the server.' },
      { status: 500 }
    );
  }

  // 2. Global kill switch (circuit breaker for runaway costs) --------------
  if (process.env.EXTRACT_DISABLED === 'true') {
    return NextResponse.json(
      { error: 'Photo extraction is temporarily unavailable. Please fill the form manually.' },
      { status: 503 }
    );
  }

  // 3. Authenticate the caller via cookie session -------------------------
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json(
      { error: 'You must be signed in to use photo extraction.' },
      { status: 401 }
    );
  }
  const userId = userData.user.id;

  // 4. Per-user rate limit (rolling 24h) ----------------------------------
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await supabase
    .from('extract_usage')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);

  if (countErr) {
    logServerError('rate-limit-read', countErr);
    // Fail closed — better to refuse than to bypass the cap silently.
    return NextResponse.json(
      { error: 'Could not verify usage. Please try again in a moment.' },
      { status: 503 }
    );
  }

  if ((count ?? 0) >= DAILY_USER_LIMIT) {
    return NextResponse.json(
      {
        error: `Daily limit reached (${DAILY_USER_LIMIT} extractions / 24h). Try again tomorrow or fill the form manually.`,
      },
      { status: 429 }
    );
  }

  // 5. Parse upload --------------------------------------------------------
  let file: File;
  try {
    const formData = await req.formData();
    const f = formData.get('file');
    if (!(f instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    file = f;
  } catch (err) {
    logServerError('formdata-parse', err);
    return NextResponse.json({ error: 'Could not read upload.' }, { status: 400 });
  }

  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json(
      { error: 'Use a JPG, PNG, or PDF file.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Max 5 MB.' }, { status: 413 });
  }

  // 6. Textract -----------------------------------------------------------
  let response;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    response = await textract.send(
      new AnalyzeExpenseCommand({ Document: { Bytes: bytes } })
    );
  } catch (err) {
    logServerError('textract', err);
    return NextResponse.json(
      {
        error:
          'Could not read the invoice. Try a sharper photo or fill the form manually.',
      },
      { status: 502 }
    );
  }

  const expenseDoc = response.ExpenseDocuments?.[0];
  if (!expenseDoc) {
    // Still record usage — Textract was billed even if the doc was empty.
    await supabase.from('extract_usage').insert({ user_id: userId });
    return NextResponse.json(
      { error: 'No invoice data detected in the file.' },
      { status: 422 }
    );
  }

  const summary = expenseDoc.SummaryFields;

  const vendorName = getField(summary, 'VENDOR_NAME');
  const vendorAddress = getField(summary, 'VENDOR_ADDRESS');
  const vendorPhone = getField(summary, 'VENDOR_PHONE');
  const vendorUrl = getField(summary, 'VENDOR_URL');

  const receiverName = getField(summary, 'RECEIVER_NAME');
  const receiverAddress = getField(summary, 'RECEIVER_ADDRESS');
  const receiverEmail =
    getField(summary, 'RECEIVER_VAT_NUMBER') ||
    getField(summary, 'RECEIVER_URL');

  const issueDate = parseDate(getField(summary, 'INVOICE_RECEIPT_DATE'));
  const dueDate = parseDate(getField(summary, 'DUE_DATE'));
  const invoiceNumber = getField(summary, 'INVOICE_RECEIPT_ID');

  const total = parseNumber(getField(summary, 'TOTAL'));
  const taxAmount = parseNumber(getField(summary, 'TAX'));
  const subtotal = parseNumber(getField(summary, 'SUBTOTAL'));
  const taxRate =
    taxAmount && subtotal && subtotal > 0
      ? Math.round((taxAmount / subtotal) * 10000) / 100
      : undefined;

  type Item = {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  };
  const items: Item[] = [];

  for (const group of expenseDoc.LineItemGroups ?? []) {
    for (const lineItem of group.LineItems ?? []) {
      const fields = lineItem.LineItemExpenseFields;
      const desc = getField(fields, 'ITEM') || '';
      const qty = parseNumber(getField(fields, 'QUANTITY')) ?? 1;
      const price = parseNumber(getField(fields, 'PRICE')) ?? 0;
      const rowAmount = parseNumber(getField(fields, 'EXPENSE_ROW'));
      const amount = rowAmount ?? qty * price;
      const rate = qty > 0 ? amount / qty : price;

      if (!desc && amount === 0) continue;

      items.push({
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : String(Date.now() + items.length),
        description: desc,
        quantity: qty,
        rate,
        amount,
      });
    }
  }

  // 7. Record usage (post-success) ----------------------------------------
  const { error: usageErr } = await supabase
    .from('extract_usage')
    .insert({ user_id: userId });
  if (usageErr) {
    // Don't fail the request — Textract already ran — but record the issue.
    logServerError('usage-insert', usageErr);
  }

  return NextResponse.json({
    invoiceNumber,
    issueDate,
    dueDate,
    fromCompany: vendorName,
    fromAddress: vendorAddress,
    fromEmail: vendorUrl,
    fromPhone: vendorPhone,
    toCompany: receiverName,
    toAddress: receiverAddress,
    toEmail: receiverEmail,
    items: items.length > 0 ? items : undefined,
    taxRate,
    total,
    usage: {
      used: (count ?? 0) + 1,
      limit: DAILY_USER_LIMIT,
    },
  });
}
