-- v9b: QuickBooks OAuth token storage + inspection attachment lifecycle
-- Idempotent. Layered on top of v9a.

-- 1. qbo_tokens: single-tenant token store (one row, key='default').
--    RLS enabled with no policies = anon role has zero access.
--    Server routes use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
create table if not exists qbo_tokens (
  key                       text primary key default 'default',
  realm_id                  text,
  access_token              text,
  refresh_token             text,
  expires_at                timestamptz,
  refresh_token_expires_at  timestamptz,
  updated_at                timestamptz default now()
);

alter table qbo_tokens enable row level security;

-- 2. Inspection attachment lifecycle on qc_inspections.
--    Distinct from legacy qb_sync_status (which stays for backwards compat).
alter table qc_inspections
  add column if not exists qb_invoice_id     text,
  add column if not exists qb_attachment_id  text,
  add column if not exists qb_attachment_url text,
  add column if not exists qb_attached_at    timestamptz,
  add column if not exists qb_attach_status  text default 'not_sent',
    -- 'not_sent' | 'pending' | 'attached' | 'stale' | 'failed'
  add column if not exists qb_attach_error   text;

create index if not exists idx_qc_inspections_qb_attach on qc_inspections(qb_attach_status);
