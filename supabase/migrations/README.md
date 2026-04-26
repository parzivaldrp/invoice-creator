# Supabase migrations

Schema changes live here as numbered, append-only SQL files. Apply them
in order to any new environment. Existing dev/prod DBs already have
`0001_baseline.sql` applied (it's a snapshot of the original
`supabase-setup.sql` at the root of the repo).

## Convention

- File name: `NNNN_short_description.sql` (zero-padded sequence).
- Files are **forward-only** — never edit a migration after it has been
  applied to any environment. Add a new one instead.
- Each migration must be safe to re-run (use `IF NOT EXISTS`,
  `DROP POLICY IF EXISTS`, etc.) so failed deploys can be retried.

## Applying migrations

For now, paste each new file into the Supabase SQL Editor in order:
<https://supabase.com/dashboard/project/_/sql>

When the project grows, switch to the Supabase CLI:

```bash
supabase login
supabase link --project-ref <your-ref>
supabase db push
```

## Current migrations

| #    | File                        | What it adds                                      |
|------|-----------------------------|---------------------------------------------------|
| 0001 | `0001_baseline.sql`         | profiles, invoices, invoice_items + RLS + triggers |
| 0002 | `0002_extract_usage.sql`    | usage table for Textract rate limiting            |
