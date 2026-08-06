-- ============================================================================
-- แก้ผลจาก performance advisor
--   1. FK ที่ไม่มี index — ตอน CASCADE/SET NULL ต้อง scan ทั้งตาราง
--   2. policy FOR ALL ทับกับ FOR SELECT — Postgres ต้องรันทั้งสองทุกครั้งที่อ่าน
-- ============================================================================

-- ── 1. index บน FK ทุกตัวที่ยังไม่มี ────────────────────────────────────────
create index platform_admins_created_by_idx on app.platform_admins (created_by);
create index memberships_invited_by_idx     on public.memberships (invited_by);
create index orders_created_by_fk_idx       on public.orders (created_by);
create index payments_plan_code_idx         on public.payments (plan_code);
create index payments_recorded_by_idx       on public.payments (recorded_by);
create index purchases_created_by_idx       on public.purchases (created_by);
create index workspaces_plan_code_idx       on public.workspaces (plan_code);
create index workspaces_suspended_by_idx    on public.workspaces (suspended_by);

-- ── 2. แยก FOR ALL ออกเป็น INSERT/UPDATE/DELETE ─────────────────────────────
-- policy FOR ALL ครอบ SELECT ด้วย ทำให้ทุก query อ่านต้องประเมิน 2 policy
-- ทั้งที่ policy อ่านตัวจริงมีอยู่แล้ว

-- categories
drop policy categories_write on public.categories;

create policy categories_insert on public.categories
  for insert to authenticated
  with check ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

create policy categories_update on public.categories
  for update to authenticated
  using ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)))
  with check ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

create policy categories_delete on public.categories
  for delete to authenticated
  using ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

-- purchases
drop policy purchases_write on public.purchases;

create policy purchases_insert on public.purchases
  for insert to authenticated
  with check ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

create policy purchases_update on public.purchases
  for update to authenticated
  using ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)))
  with check ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

create policy purchases_delete on public.purchases
  for delete to authenticated
  using ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

-- purchase_items
drop policy purchase_items_write on public.purchase_items;

create policy purchase_items_insert on public.purchase_items
  for insert to authenticated
  with check (exists (
    select 1 from public.purchases p
    where p.id = purchase_id
      and (select app.can_see_money(p.workspace_id))
      and (select app.workspace_is_writable(p.workspace_id))
  ));

create policy purchase_items_update on public.purchase_items
  for update to authenticated
  using (exists (
    select 1 from public.purchases p
    where p.id = purchase_id
      and (select app.can_see_money(p.workspace_id))
      and (select app.workspace_is_writable(p.workspace_id))
  ))
  with check (exists (
    select 1 from public.purchases p
    where p.id = purchase_id
      and (select app.can_see_money(p.workspace_id))
      and (select app.workspace_is_writable(p.workspace_id))
  ));

create policy purchase_items_delete on public.purchase_items
  for delete to authenticated
  using (exists (
    select 1 from public.purchases p
    where p.id = purchase_id
      and (select app.can_see_money(p.workspace_id))
      and (select app.workspace_is_writable(p.workspace_id))
  ));

-- workspaces: รวม 2 policy UPDATE เป็นตัวเดียว
drop policy workspaces_update_owner on public.workspaces;
drop policy workspaces_update_admin on public.workspaces;

create policy workspaces_update on public.workspaces
  for update to authenticated
  using (
    ((select app.is_owner_of(id)) and (select app.workspace_is_writable(id)))
    or (select app.is_platform_admin())
  )
  with check (
    (select app.is_owner_of(id)) or (select app.is_platform_admin())
  );
