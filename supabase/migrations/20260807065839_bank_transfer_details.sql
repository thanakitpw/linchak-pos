-- บัญชีธนาคารสำหรับรับโอน — ผู้ใช้ขอ: "เห็นมีปุ่มรับชำระแบบโอนเงินด้วย
-- ให้มีการเพิ่มเลขบัญชีได้"
--
-- เดิมเลือกวิธีชำระเป็น "โอนเงิน" ได้ แต่ไม่มีที่ให้กรอกว่าโอนไปไหน
-- ลูกค้าที่ได้บิลจึงโอนไม่ได้จริง ต้องถามในแชทอีกรอบ
--
-- เก็บ **รหัสธนาคาร ธปท. 3 หลัก** ไม่ใช่ชื่อ — ชื่อธนาคารเปลี่ยนได้
-- (TMB + ธนชาต → ttb ปี 2564) แต่รหัสไม่เปลี่ยน
-- รายชื่อ+สีแบรนด์อยู่ที่ src/lib/banks.ts

alter table public.workspaces
  add column if not exists bank_code         text,
  add column if not exists bank_account_no   text,
  add column if not exists bank_account_name text;

-- เลขบัญชีไทย 10-15 หลัก แล้วแต่ธนาคาร (ออมสินยาวสุด) · เก็บตัวเลขล้วน
-- ขีดคั่นเป็นเรื่องของการแสดงผล ไม่ใช่ของข้อมูล
alter table public.workspaces
  drop constraint if exists workspaces_bank_account_no_check;
alter table public.workspaces
  add constraint workspaces_bank_account_no_check
  check (bank_account_no is null or bank_account_no ~ '^[0-9]{10,15}$');

alter table public.workspaces
  drop constraint if exists workspaces_bank_code_check;
alter table public.workspaces
  add constraint workspaces_bank_code_check
  check (bank_code is null or bank_code ~ '^[0-9]{3}$');

comment on column public.workspaces.bank_code is
  'รหัสธนาคาร ธปท. 3 หลัก · ชื่อและสีแบรนด์อยู่ใน src/lib/banks.ts';

-- ── บิล public ต้องเห็นบัญชีด้วย ไม่งั้นลูกค้าที่เปิดลิงก์ก็โอนไม่ได้ ────────
--
-- ⚠️ ฟังก์ชันนี้คือด่านเดียวที่ตัดสินใจว่าอะไรออกไปนอกระบบได้ (กฎ 30)
--    เพิ่ม field ที่นี่ = เพิ่มสิ่งที่คนไม่ล็อกอินเห็น ต้องตั้งใจทุกครั้ง
--    บัญชีธนาคารสำหรับรับโอน "ตั้งใจให้เห็น" อยู่แล้ว — เจ้าของร้านกรอกมาเพื่อการนี้
--    เหมือน promptpay_id ที่ยังไม่ส่งออกเพราะ QR ถูก render มาเป็นรูปตั้งแต่ฝั่ง server
create or replace function public.get_public_receipt(token uuid)
returns jsonb
language sql
stable security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'bill_no',        o.bill_no,
    'ordered_at',     o.ordered_at,
    'subtotal',       o.subtotal,
    'discount',       o.discount,
    'tax_amount',     o.tax_amount,
    'tax_enabled',    w.tax_enabled,
    'tax_rate',       w.tax_rate,
    'total',          o.total,
    'received',       o.received,
    'change_amount',  o.change_amount,
    'payment_method', o.payment_method,
    'store', jsonb_build_object(
      'name',              w.name,
      'branch',            w.branch,
      'phone',             w.phone,
      'logo_path',         w.logo_path,
      'language',          w.language,
      'bank_code',         w.bank_code,
      'bank_account_no',   w.bank_account_no,
      'bank_account_name', w.bank_account_name
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name',  i.name_snapshot,
               'price', i.price_snapshot,
               'qty',   i.qty,
               'total', i.line_total
             ) order by i.sort_order)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  join public.workspaces w on w.id = o.workspace_id
  where o.public_token = token;
$function$;
