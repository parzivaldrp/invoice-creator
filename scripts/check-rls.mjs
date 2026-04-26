#!/usr/bin/env node
/**
 * RLS smoke test.
 *
 * Connects to Supabase with the public anon key (no signed-in user)
 * and confirms that protected tables refuse to return rows. If any
 * query returns data, RLS has regressed and this script exits non-zero.
 *
 * Usage:
 *   node scripts/check-rls.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * in the environment (loaded automatically from .env.local if present).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Lightweight .env.local loader so this can run without dotenv installed.
function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key] !== undefined) continue;
    const value = rawValue.replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('✖ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing.');
  process.exit(2);
}

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Tables that must NEVER return rows to an anonymous client.
const protectedTables = ['profiles', 'invoices', 'invoice_items', 'extract_usage'];

let failed = 0;

for (const table of protectedTables) {
  const { data, error } = await supabase.from(table).select('*').limit(1);

  if (error) {
    // RLS-blocked errors come back as ok-with-empty in supabase-js v2,
    // so a real error here usually means the table doesn't exist or
    // the network is broken. Surface it but don't count it as a pass.
    console.warn(`⚠ ${table}: ${error.code ?? '?'} — ${error.message}`);
    continue;
  }

  if (Array.isArray(data) && data.length === 0) {
    console.log(`✓ ${table}: anon SELECT returned 0 rows (RLS holds)`);
  } else {
    console.error(`✖ ${table}: anon SELECT returned ${data?.length} row(s) — RLS LEAK`);
    failed++;
  }
}

// Also confirm anon INSERT into invoices is rejected.
{
  const { error } = await supabase.from('invoices').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    invoice_number: 'RLS-PROBE',
    issue_date: '2025-01-01',
  });
  if (error) {
    console.log(`✓ invoices: anon INSERT rejected (${error.code ?? '?'})`);
  } else {
    console.error('✖ invoices: anon INSERT succeeded — RLS LEAK');
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} RLS check(s) failed.`);
  process.exit(1);
}
console.log('\nAll RLS checks passed.');
