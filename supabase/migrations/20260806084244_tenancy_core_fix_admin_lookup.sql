-- ============================================================================
-- แก้ 2 advisory จาก migration ก่อน โดยลด SECURITY DEFINER แทนที่จะยอมรับ warning
--
--   1. app.platform_admins เปิด RLS แต่ไม่มี policy
--   2. public.current_user_is_platform_admin() เป็น SECURITY DEFINER ที่ client เรียกได้
--
-- ทางแก้เดียวกันทั้งคู่: ให้ authenticated อ่าน "แถวของตัวเอง" ในตารางนี้ได้
-- แล้วฟังก์ชันตรวจสิทธิ์ก็ไม่ต้อง bypass RLS อีกต่อไป
-- ตารางยังอยู่ใน schema app จึงยิงผ่าน REST API ตรงๆ ไม่ได้อยู่ดี — RLS เป็นชั้นที่สอง
-- ============================================================================

create policy platform_admins_select_self on app.platform_admins
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on app.platform_admins to authenticated;

-- SECURITY INVOKER: ทำงานด้วยสิทธิ์ผู้เรียก + RLS ข้างบนจำกัดให้เห็นแค่แถวตัวเอง
create or replace function app.is_platform_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from app.platform_admins pa
    where pa.user_id = (select auth.uid())
  );
$$;

create or replace function public.current_user_is_platform_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from app.platform_admins pa
    where pa.user_id = (select auth.uid())
  );
$$;

comment on function public.current_user_is_platform_admin() is
  'ให้ client ถามได้ว่าตัวเองเป็น platform admin หรือไม่ เพื่อโชว์/ซ่อนลิงก์ /admin · SECURITY INVOKER + RLS จำกัดให้เห็นเฉพาะแถวตัวเอง';
