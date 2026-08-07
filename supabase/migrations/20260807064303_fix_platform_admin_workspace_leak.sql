-- ปิดช่องที่ platform admin มองเห็น (และแก้ได้) ร้านของลูกค้าทุกร้านโดยไม่ตั้งใจ
--
-- อาการที่เจอ: บัญชีที่เป็นทั้งเจ้าของร้านและ platform admin กดออกบิลไม่ได้
--   `select id from workspaces limit 1` คืน "ร้านของลูกค้าอีกคน" เพราะ policy
--   ให้ admin เห็นทุกร้าน และ limit 1 ที่ไม่มี order by ไม่รับประกันลำดับ
--   → create_order() ใส่ workspace_id ผิด → orders_insert เช็ค is_member_of แล้ว false
--   → "new row violates row-level security policy"
--
-- แต่บั๊กที่แท้จริงหนักกว่านั้น: หน้าตั้งค่าของ admin กำลังอ่าน (และเขียนทับได้)
-- ชื่อร้าน/เบอร์/เลข PromptPay ของลูกค้าคนอื่น
--
-- กฎ 34 ใน CLAUDE.md บอกไว้ตั้งแต่ต้นว่า "admin ไม่เห็นข้อมูลของลูกค้าโดย default
-- ต้องผ่าน impersonate ที่บังคับกรอกเหตุผลและเขียน audit" — policy พวกนี้จึงผิดสเปคอยู่แล้ว
--
-- /admin ไม่ได้ใช้ policy พวกนี้เลย: ทุก query ผ่าน admin_* ที่เป็น SECURITY DEFINER
-- (admin_dashboard_stats, admin_workspace_list, admin_workspace_detail,
--  admin_record_payment, admin_set_suspended — ตรวจ prosecdef แล้วเป็น true ทุกตัว)

-- ── 1. ร้านของผู้ใช้ปัจจุบัน แบบที่ไม่ขึ้นกับความกว้างของ policy ───────────
--
-- กรอง user_id ตรงๆ ไม่พึ่ง RLS ว่าจะแคบพอ · order by ให้ผลนิ่งข้ามการรัน
-- (MVP มีร้านเดียวต่อผู้ใช้ แต่ถ้าวันหนึ่งมีหลายร้าน ต้องได้ร้านเดิมทุกครั้ง
--  ไม่ใช่แล้วแต่ planner)
create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select m.workspace_id
  from public.memberships m
  where m.user_id = (select auth.uid())
  order by m.created_at, m.workspace_id
  limit 1
$$;

comment on function public.current_workspace_id() is
  'ร้านของผู้ใช้ที่ล็อกอินอยู่ · ห้ามใช้ select from workspaces limit 1 แทน เพราะไม่รับประกันลำดับ';

grant execute on function public.current_workspace_id() to authenticated;

-- ── 2. workspaces: เห็นเฉพาะร้านที่เป็นสมาชิก ─────────────────────────────
drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to authenticated
  using ((select app.is_member_of(workspaces.id)));

-- แก้ได้เฉพาะ owner ของร้านนั้น · admin ที่ต้องแก้ต้องผ่าน admin_* ที่เขียน audit
drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
  for update to authenticated
  using (
    (select app.is_owner_of(workspaces.id))
    and (select app.workspace_is_writable(workspaces.id))
  )
  with check ((select app.is_owner_of(workspaces.id)));

-- ── 3. memberships: เหตุผลเดียวกัน ────────────────────────────────────────
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select to authenticated
  using ((select app.is_member_of(memberships.workspace_id)));
