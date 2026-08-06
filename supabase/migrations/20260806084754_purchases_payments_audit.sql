-- ============================================================================
-- Migration 4 — ต้นทุน (FR-5) + การชำระค่าบริการ + audit log
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- purchases (FR-5) — staff ไม่เห็นเลย
-- ────────────────────────────────────────────────────────────────────────────
create table public.purchases (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  purchased_at  date not null,
  vendor        text,
  note          text,
  total         numeric(12,2) not null default 0 check (total >= 0),
  slip_path     text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index purchases_workspace_date_idx on public.purchases (workspace_id, purchased_at desc);

create trigger purchases_updated_at
  before update on public.purchases
  for each row execute function extensions.moddatetime(updated_at);

create table public.purchase_items (
  id           uuid primary key default gen_random_uuid(),
  purchase_id  uuid not null references public.purchases(id) on delete cascade,
  name         text not null,
  qty          numeric(12,3) not null check (qty > 0),
  unit_price   numeric(12,2) not null check (unit_price >= 0),
  line_total   numeric(12,2) not null check (line_total >= 0),
  sort_order   integer not null default 0
);
comment on column public.purchase_items.qty is 'numeric ไม่ใช่ integer — ซื้อของเป็นกิโล/ลิตรได้ (ต่างจาก order_items ที่ขายเป็นชิ้น)';

create index purchase_items_purchase_id_idx on public.purchase_items (purchase_id, sort_order);

-- NFR-7 · purchase + items เป็น transaction เดียว
create or replace function public.create_purchase(
  p_workspace_id  uuid,
  p_purchased_at  date,
  p_items         jsonb,          -- [{name, qty, unit_price}]
  p_vendor        text default null,
  p_note          text default null,
  p_slip_path     text default null,
  p_total_override numeric default null   -- FR-5.4 · กรอกยอดรวมเองได้
)
returns public.purchases
language plpgsql security invoker set search_path = ''
as $$
declare
  v_purchase public.purchases;
  v_total    numeric(12,2) := 0;
  v_item     jsonb;
  v_idx      integer := 0;
  v_line     numeric(12,2);
begin
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_total := v_total + round((v_item->>'qty')::numeric * (v_item->>'unit_price')::numeric, 2);
  end loop;

  insert into public.purchases (workspace_id, purchased_at, vendor, note, total, slip_path, created_by)
  values (p_workspace_id, p_purchased_at, p_vendor, p_note,
          coalesce(p_total_override, v_total), p_slip_path, (select auth.uid()))
  returning * into v_purchase;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_idx := v_idx + 1;
    v_line := round((v_item->>'qty')::numeric * (v_item->>'unit_price')::numeric, 2);
    insert into public.purchase_items (purchase_id, name, qty, unit_price, line_total, sort_order)
    values (v_purchase.id, v_item->>'name', (v_item->>'qty')::numeric,
            (v_item->>'unit_price')::numeric, v_line, v_idx);
  end loop;

  return v_purchase;
end;
$$;

revoke execute on function public.create_purchase(uuid, date, jsonb, text, text, text, numeric) from public, anon;
grant execute on function public.create_purchase(uuid, date, jsonb, text, text, text, numeric) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- payments — ประวัติที่ลูกค้าจ่ายค่าบริการให้เรา (ไม่ใช่ยอดขายของร้าน)
-- MVP บันทึกมือหลังลูกค้าโอนผ่าน LINE
-- ────────────────────────────────────────────────────────────────────────────
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  plan_code      text not null references public.plans(code) on delete restrict,
  amount_satang  integer not null check (amount_satang >= 0),
  period_start   timestamptz not null,
  period_end     timestamptz not null,
  method         text not null default 'bank_transfer'
                   check (method in ('bank_transfer','promptpay','other')),
  reference      text,
  slip_path      text,
  note           text,
  recorded_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  check (period_end > period_start)
);
comment on table public.payments is 'ค่าบริการที่ร้านจ่ายให้เรา · amount เป็นสตางค์ (integer) · เฟสหลังต่อ gateway ให้เพิ่ม provider/provider_txn_id/status';

create index payments_workspace_created_idx on public.payments (workspace_id, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- audit_logs — append-only
-- ตอบคำถาม "ใครปิดร้านนี้ ตอนไหน เพราะอะไร" ซึ่งจะถูกถามแน่ตอนลูกค้าโทรมา
-- ไม่มี policy UPDATE/DELETE เลย แม้แต่ superadmin
-- ────────────────────────────────────────────────────────────────────────────
create table public.audit_logs (
  id            bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_kind    text not null default 'member'
                  check (actor_kind in ('platform_admin','member','system')),
  action        text not null,
  target_type   text,
  target_id     text,
  workspace_id  uuid references public.workspaces(id) on delete set null,
  before        jsonb,
  after         jsonb,
  reason        text,
  ip            inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);
comment on table public.audit_logs is 'append-only · ไม่มี policy UPDATE/DELETE โดยตั้งใจ (docs/admin-backoffice.md §1.4)';

create index audit_logs_workspace_idx on public.audit_logs (workspace_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs (action, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────────────────────
alter table public.purchases      enable row level security;
alter table public.purchase_items enable row level security;
alter table public.payments       enable row level security;
alter table public.audit_logs     enable row level security;

-- ต้นทุน: owner/manager เท่านั้น — staff ไม่เห็นเลย
create policy purchases_select on public.purchases
  for select to authenticated
  using ((select app.can_see_money(workspace_id)));

create policy purchases_write on public.purchases
  for all to authenticated
  using ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)))
  with check ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

create policy purchase_items_select on public.purchase_items
  for select to authenticated
  using (exists (select 1 from public.purchases p where p.id = purchase_id));

create policy purchase_items_write on public.purchase_items
  for all to authenticated
  using (exists (
    select 1 from public.purchases p
    where p.id = purchase_id and (select app.can_see_money(p.workspace_id))
      and (select app.workspace_is_writable(p.workspace_id))
  ))
  with check (exists (
    select 1 from public.purchases p
    where p.id = purchase_id and (select app.can_see_money(p.workspace_id))
      and (select app.workspace_is_writable(p.workspace_id))
  ));

-- การชำระค่าบริการ: เจ้าของร้านดูของตัวเองได้ · แอดมินดูได้ทุกร้านและเป็นคนบันทึก
create policy payments_select on public.payments
  for select to authenticated
  using ((select app.is_owner_of(workspace_id)) or (select app.is_platform_admin()));

create policy payments_insert_admin on public.payments
  for insert to authenticated
  with check ((select app.is_platform_admin()));

-- audit: เจ้าของร้านเห็นของร้านตัวเอง · แอดมินเห็นหมด · เขียนได้แต่ไม่มีใครแก้/ลบได้
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    (select app.is_platform_admin())
    or (workspace_id is not null and (select app.is_owner_of(workspace_id)))
  );

create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (actor_user_id = (select auth.uid()));
-- ไม่มี policy UPDATE/DELETE โดยตั้งใจ = append-only
