-- ============================================================================
-- ให้ client ถามได้ว่า "ร้านของฉันตอนนี้ออกบิลได้ไหม" (FR-0.4)
--
-- เดิมหน้า /sell คำนวณเงื่อนไขนี้ซ้ำใน TypeScript ซึ่งเป็นตรรกะเดียวกับ
-- app.workspace_is_writable() — สองที่ที่ต้องแก้พร้อมกันตลอดไปคือที่ที่จะ drift
-- ให้เหลือแหล่งเดียวคือฐานข้อมูล ส่วน UI แค่ถาม
--
-- ไม่รับ argument โดยตั้งใจ: ตอบเรื่องร้านของผู้เรียกเท่านั้น
-- ถ้ารับ workspace_id จะกลายเป็นช่องให้เดาสถานะร้านคนอื่น
-- ============================================================================
create or replace function public.current_workspace_is_writable()
returns boolean
language sql stable security invoker set search_path = '' as $$
  select coalesce(
    (select app.workspace_is_writable(m.workspace_id)
       from public.memberships m
      where m.user_id = (select auth.uid())
      order by m.created_at
      limit 1),
    false
  );
$$;

comment on function public.current_workspace_is_writable() is
  'FR-0.4 · UI ใช้โชว์แถบเตือนล่วงหน้า · การบังคับจริงอยู่ใน RLS policy ของ INSERT';

revoke execute on function public.current_workspace_is_writable() from public, anon;
grant execute on function public.current_workspace_is_writable() to authenticated;
