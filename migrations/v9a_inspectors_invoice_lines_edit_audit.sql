-- v9a: inspectors, invoice lines, edit audit, megger/torques persistence
-- Review before applying. Idempotent: safe to re-run.

-- 1. Inspectors table + seed
create table if not exists inspectors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  role        text default 'inspector',
  active      boolean default true,
  created_at  timestamptz default now()
);

insert into inspectors (name, role) values
  ('John Calvillo', 'inspector'),
  ('Brad Coughran', 'inspector'),
  ('Eric Stevens',  'admin')
on conflict (name) do nothing;

-- 2. Invoice lines: parent of exploded inventory items
create table if not exists invoice_lines (
  id              uuid primary key default gen_random_uuid(),
  invoice_number  text not null,
  order_number    text,
  customer_name   text,
  job_site        text,
  line_number     int,
  equipment_type  text,
  manufacturer    text,
  description     text,
  qty             int not null check (qty > 0),
  phase_label     text,
  due_date        date,
  template_key    text,
  source          text default 'manual',
  source_ref      text,
  created_at      timestamptz default now(),
  unique (invoice_number, line_number)
);

create index if not exists idx_invoice_lines_invoice on invoice_lines(invoice_number);

-- 3. Inventory item linkage to invoice line
alter table inventory_items
  add column if not exists invoice_line_id uuid references invoice_lines(id),
  add column if not exists line_item_index int;

create index if not exists idx_inventory_invoice_line on inventory_items(invoice_line_id);

-- 4. Edit audit + inspector ownership on inspections
alter table qc_inspections
  add column if not exists inspector_id     uuid references inspectors(id),
  add column if not exists updated_at       timestamptz,
  add column if not exists update_count     int default 0,
  add column if not exists last_edit_reason text;

-- 5. Persist megger and torque readings (currently only kept in localStorage drafts).
--    Required so edit mode can restore them after save.
alter table qc_inspections
  add column if not exists megger_a_to_b text,
  add column if not exists megger_b_to_c text,
  add column if not exists megger_c_to_a text,
  add column if not exists megger_a_to_g text,
  add column if not exists megger_b_to_g text,
  add column if not exists megger_c_to_g text,
  add column if not exists megger_test_v text,
  add column if not exists torques       jsonb;

-- 6. Inspection link on deficiencies so edits can rewrite them cleanly.
--    Pre-v9a deficiency rows will have inspection_id = null and stay untouched.
alter table inventory_deficiencies
  add column if not exists inspection_id text;

create index if not exists idx_deficiencies_inspection on inventory_deficiencies(inspection_id);
