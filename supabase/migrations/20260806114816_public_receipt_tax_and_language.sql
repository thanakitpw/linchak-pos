-- ============================================================================
-- get_public_receipt คืน tax_enabled / tax_rate / language เพิ่ม
--
-- เดิมคืนแค่ tax_amount ซึ่งไม่พอจะ render ใบเสร็จให้ถูก:
--   · ไม่รู้ว่า VAT เปิดอยู่ไหม → แยกไม่ออกระหว่าง "ปิดภาษี" กับ "เปิดแต่ยอด 0"
--     กฎ 24 บอกว่าปิดแล้วต้องไม่มี element ภาษีเลย ไม่ใช่แถวที่เป็นศูนย์
--   · ไม่รู้อัตรา → พิมพ์ป้าย "ภาษีมูลค่าเพิ่ม 7%" ไม่ได้
--   · ไม่รู้ภาษาของร้าน → หน้าบิล public จะ render ภาษาตาม cookie ของ "คนเปิดลิงก์"
--     ซึ่งเป็นลูกค้าคนละคนกับเจ้าของร้าน บิลใบเดียวกันจะเปลี่ยนภาษาตามคนดู
--
-- ทั้งสามอย่างพิมพ์อยู่บนใบเสร็จที่ลูกค้าถือในมืออยู่แล้ว ไม่ใช่ข้อมูลใหม่ที่รั่วออกไป
-- ยังคง **ไม่คืน** workspace_id และ promptpay_id เหมือนเดิม
-- ============================================================================
create or replace function public.get_public_receipt(token uuid)
returns jsonb
language sql stable security definer set search_path = '' as $$
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
      'name',      w.name,
      'branch',    w.branch,
      'phone',     w.phone,
      'logo_path', w.logo_path,
      'language',  w.language
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
$$;

comment on function public.get_public_receipt(uuid) is
  'FR-4.6 · เปิดบิลด้วย token โดยไม่ล็อกอิน · ห้ามคืน workspace_id หรือ promptpay_id';
