-- ============================================================================
-- Migration 5 — Storage (NFR-4 · "รูป โลโก้/สลิป ควบคุมสิทธิ์เข้าถึง")
--
-- path ทุก bucket ขึ้นต้นด้วย workspace_id เสมอ → policy เช็คแค่ส่วนแรกของ path
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- โลโก้ต้องอ่านได้แบบ public เพราะไปโผล่บนหน้าบิลที่ลูกค้าเปิดโดยไม่ล็อกอิน (FR-4.6)
  ('logos',       'logos',       true,  2  * 1024 * 1024, array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('products',    'products',    false, 5  * 1024 * 1024, array['image/png','image/jpeg','image/webp']),
  -- สลิปซื้อของ = ข้อมูลการเงินของร้าน ปิดสนิท
  ('slips',       'slips',       false, 10 * 1024 * 1024, array['image/png','image/jpeg','image/webp','application/pdf']),
  -- สลิปที่ลูกค้าโอนค่าบริการให้เรา — แอดมินเท่านั้น
  ('admin-slips', 'admin-slips', false, 10 * 1024 * 1024, array['image/png','image/jpeg','image/webp','application/pdf']);

-- ────────────────────────────────────────────────────────────────────────────
-- logos — ใครก็อ่านได้ แต่เขียนได้เฉพาะ owner ของร้านนั้น
-- ────────────────────────────────────────────────────────────────────────────
create policy "logos อ่านได้ทุกคน"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'logos');

create policy "logos เขียนได้เฉพาะ owner ของร้าน"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (select app.is_owner_of((storage.foldername(name))[1]::uuid))
  );

-- upsert ต้องมี update ด้วย ไม่งั้นอัปโหลดทับไฟล์เดิมไม่ได้
create policy "logos แก้ได้เฉพาะ owner ของร้าน"
  on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (select app.is_owner_of((storage.foldername(name))[1]::uuid)))
  with check (bucket_id = 'logos' and (select app.is_owner_of((storage.foldername(name))[1]::uuid)));

create policy "logos ลบได้เฉพาะ owner ของร้าน"
  on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (select app.is_owner_of((storage.foldername(name))[1]::uuid)));

-- ────────────────────────────────────────────────────────────────────────────
-- products — สมาชิกร้านอ่านได้ · owner/manager เขียนได้
-- ────────────────────────────────────────────────────────────────────────────
create policy "products อ่านได้เฉพาะสมาชิกร้าน"
  on storage.objects for select to authenticated
  using (bucket_id = 'products' and (select app.is_member_of((storage.foldername(name))[1]::uuid)));

create policy "products เขียนได้เฉพาะ owner/manager"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and (select app.can_see_money((storage.foldername(name))[1]::uuid)));

create policy "products แก้ได้เฉพาะ owner/manager"
  on storage.objects for update to authenticated
  using (bucket_id = 'products' and (select app.can_see_money((storage.foldername(name))[1]::uuid)))
  with check (bucket_id = 'products' and (select app.can_see_money((storage.foldername(name))[1]::uuid)));

create policy "products ลบได้เฉพาะ owner/manager"
  on storage.objects for delete to authenticated
  using (bucket_id = 'products' and (select app.can_see_money((storage.foldername(name))[1]::uuid)));

-- ────────────────────────────────────────────────────────────────────────────
-- slips — ข้อมูลการเงิน staff ไม่เห็นเลย เหมือนตาราง purchases
-- ────────────────────────────────────────────────────────────────────────────
create policy "slips อ่านได้เฉพาะ owner/manager"
  on storage.objects for select to authenticated
  using (bucket_id = 'slips' and (select app.can_see_money((storage.foldername(name))[1]::uuid)));

create policy "slips เขียนได้เฉพาะ owner/manager"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'slips' and (select app.can_see_money((storage.foldername(name))[1]::uuid)));

create policy "slips แก้ได้เฉพาะ owner/manager"
  on storage.objects for update to authenticated
  using (bucket_id = 'slips' and (select app.can_see_money((storage.foldername(name))[1]::uuid)))
  with check (bucket_id = 'slips' and (select app.can_see_money((storage.foldername(name))[1]::uuid)));

create policy "slips ลบได้เฉพาะ owner/manager"
  on storage.objects for delete to authenticated
  using (bucket_id = 'slips' and (select app.can_see_money((storage.foldername(name))[1]::uuid)));

-- ────────────────────────────────────────────────────────────────────────────
-- admin-slips — แอดมินเท่านั้น ลูกค้าไม่เห็นแม้แต่ของตัวเอง
-- ────────────────────────────────────────────────────────────────────────────
create policy "admin-slips แอดมินเท่านั้น"
  on storage.objects for all to authenticated
  using (bucket_id = 'admin-slips' and (select app.is_platform_admin()))
  with check (bucket_id = 'admin-slips' and (select app.is_platform_admin()));
