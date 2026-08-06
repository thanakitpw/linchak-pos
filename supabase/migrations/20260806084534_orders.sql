-- ============================================================================
-- Migration 3 — orders (FR-3) + เลขบิล (BR-3) + ใบเสร็จ public (FR-4.6)
-- ============================================================================

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,

  -- BR-3 · DDMMYYYY-NNNNNNNN unique ต่อร้าน
  bill_no        text not null,

  ordered_at     timestamptz not null default now(),

  subtotal       numeric(12,2) not null check (subtotal >= 0),
  discount       numeric(12,2) not null default 0 check (discount >= 0),
  tax_amount     numeric(12,2) not null default 0 check (tax_amount >= 0),
  total          numeric(12,2) not null check (total >= 0),
  received       numeric(12,2) check (received >= 0),
  change_amount  numeric(12,2) check (change_amount >= 0),

  payment_method text not null check (payment_method in ('cash','promptpay','transfer')),

  -- FR-4.6 · token สำหรับลิงก์บิล public — ไม่เดาได้ ไม่บอกอะไรเกี่ยวกับร้าน
  public_token   uuid not null default gen_random_uuid(),

  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),

  unique (workspace_id, bill_no),
  unique (public_token)
);
comment on column public.orders.change_amount is 'BR-6 · แสดงเฉพาะเมื่อ received >= total (คอลัมน์ change ชนกับ keyword จึงเติม _amount)';

create index orders_workspace_ordered_at_idx on public.orders (workspace_id, ordered_at desc);
create index orders_created_by_idx on public.orders (workspace_id, created_by, ordered_at desc);

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  -- nullable: instant add หรือสินค้าถูก archive ไปแล้ว
  product_id     uuid references public.products(id) on delete set null,
  -- BR-4 · snapshot เสมอ ห้าม resolve บิลเก่าผ่าน join กับ products
  name_snapshot  text not null,
  price_snapshot numeric(12,2) not null check (price_snapshot >= 0),
  qty            integer not null check (qty > 0),
  line_total     numeric(12,2) not null check (line_total >= 0),
  sort_order     integer not null default 0
);
comment on table public.order_items is 'BR-4 · name_snapshot/price_snapshot คือค่าจริงตอนออกบิล ห้าม join products เพื่ออ่านบิลเก่า';

create index order_items_order_id_idx on public.order_items (order_id, sort_order);
create index order_items_product_id_idx on public.order_items (product_id);

-- ────────────────────────────────────────────────────────────────────────────
-- BR-3 · จัดสรรเลขบิลภายใต้ row lock
-- UPDATE ... RETURNING ล็อกแถว workspace ไว้จนจบ transaction
-- เช็คเอาต์พร้อมกันสองเครื่องในร้านเดียวกันจึงเข้าคิวกัน ไม่ได้เลขชนกัน
-- ห้ามใช้ MAX(bill_no)+1 หรือ count() เพราะสองอันนั้นแข่งกันได้
-- ────────────────────────────────────────────────────────────────────────────
create or replace function app.allocate_bill_no(ws uuid, at_ts timestamptz)
returns text language plpgsql security definer set search_path = '' as $$
declare
  next_seq bigint;
begin
  update public.workspaces
     set bill_seq = bill_seq + 1
   where id = ws
  returning bill_seq into next_seq;

  if next_seq is null then
    raise exception 'ไม่พบ workspace %', ws using errcode = 'no_data_found';
  end if;

  -- prefix เป็นวันที่ตามเวลาไทย ไม่ใช่ UTC
  return to_char(at_ts at time zone 'Asia/Bangkok', 'DDMMYYYY')
         || '-' || lpad(next_seq::text, 8, '0');
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- NFR-7 · order + items เป็น transaction เดียว
-- ฟังก์ชันเดียวจบ = เขียนสำเร็จครึ่งเดียวไม่ได้
-- ยอดคำนวณใหม่ฝั่ง DB จากราคาที่ส่งมา ไม่เชื่อ total ที่ client คำนวณ
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.create_order(
  p_workspace_id    uuid,
  p_items           jsonb,           -- [{product_id, name, price, qty}]
  p_payment_method  text,
  p_discount        numeric default 0,
  p_received        numeric default null,
  p_ordered_at      timestamptz default now()
)
returns public.orders
language plpgsql
security invoker            -- RLS ของ orders/order_items ยังบังคับใช้ตามปกติ
set search_path = ''
as $$
declare
  v_order       public.orders;
  v_bill_no     text;
  v_subtotal    numeric(12,2) := 0;
  v_discount    numeric(12,2);
  v_tax         numeric(12,2) := 0;
  v_total       numeric(12,2);
  v_tax_enabled boolean;
  v_tax_rate    numeric(5,2);
  v_item        jsonb;
  v_idx         integer := 0;
  v_line_total  numeric(12,2);
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'บิลว่างออกไม่ได้' using errcode = 'check_violation';
  end if;

  select w.tax_enabled, w.tax_rate into v_tax_enabled, v_tax_rate
  from public.workspaces w where w.id = p_workspace_id;

  -- รวมยอดจากราคาที่ส่งมา (ยังไม่เชื่อ total จาก client)
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_line_total := round((v_item->>'price')::numeric * (v_item->>'qty')::integer, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  -- ส่วนลดเกินยอดรวมไม่ได้
  v_discount := least(coalesce(p_discount, 0), v_subtotal);

  -- BR-2 · ภาษีคิดที่ระดับบิลครั้งเดียว ไม่ใช่รายบรรทัด
  if v_tax_enabled and v_tax_rate > 0 then
    v_total := v_subtotal - v_discount;
    v_tax   := round(v_total - (v_total / (1 + v_tax_rate / 100)), 2);
  else
    v_total := v_subtotal - v_discount;
  end if;

  v_bill_no := app.allocate_bill_no(p_workspace_id, p_ordered_at);

  insert into public.orders (
    workspace_id, bill_no, ordered_at, subtotal, discount, tax_amount, total,
    received, change_amount, payment_method, created_by
  ) values (
    p_workspace_id, v_bill_no, p_ordered_at, v_subtotal, v_discount, v_tax, v_total,
    p_received,
    case when p_received is not null and p_received >= v_total
         then p_received - v_total end,     -- BR-6
    p_payment_method,
    (select auth.uid())
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_idx := v_idx + 1;
    insert into public.order_items (
      order_id, product_id, name_snapshot, price_snapshot, qty, line_total, sort_order
    ) values (
      v_order.id,
      nullif(v_item->>'product_id','')::uuid,
      v_item->>'name',
      (v_item->>'price')::numeric,
      (v_item->>'qty')::integer,
      round((v_item->>'price')::numeric * (v_item->>'qty')::integer, 2),
      v_idx
    );
  end loop;

  return v_order;
end;
$$;

revoke execute on function public.create_order(uuid, jsonb, text, numeric, numeric, timestamptz) from public, anon;
grant execute on function public.create_order(uuid, jsonb, text, numeric, numeric, timestamptz) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- FR-4.6 · ใบเสร็จ public
-- ทางเดียวที่ผู้ไม่ล็อกอินแตะข้อมูลได้ — และคืน "บิลใบเดียว" เท่านั้น
-- ไม่คืน workspace_id, ไม่คืนบิลอื่น, ไม่คืนรายการสินค้าของร้าน, ไม่คืน promptpay_id
-- ทางเลือกที่ปฏิเสธ: เปิด RLS ให้ role anon อ่านตาราง orders
-- เพราะ policy เดียวที่เขียนผิดในอนาคตจะเปิดข้อมูลทั้งระบบ
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.get_public_receipt(token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'bill_no',        o.bill_no,
    'ordered_at',     o.ordered_at,
    'subtotal',       o.subtotal,
    'discount',       o.discount,
    'tax_amount',     o.tax_amount,
    'total',          o.total,
    'received',       o.received,
    'change_amount',  o.change_amount,
    'payment_method', o.payment_method,
    'store', jsonb_build_object(
      'name',      w.name,
      'branch',    w.branch,
      'phone',     w.phone,
      'logo_path', w.logo_path
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
  'FR-4.6 · เปิดบิลด้วย token โดยไม่ต้องล็อกอิน · คืนบิลใบเดียว ไม่รั่ว workspace_id/promptpay_id/บิลอื่น';

grant execute on function public.get_public_receipt(uuid) to anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS
-- staff เห็นเฉพาะบิลที่ตัวเองออก (admin-backoffice.md §2)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy orders_select on public.orders
  for select to authenticated
  using (
    (select app.can_see_money(workspace_id))
    or (created_by = (select auth.uid()) and (select app.is_member_of(workspace_id)))
  );

-- FR-0.4 · หมด trial แล้วออกบิลใหม่ไม่ได้ — บังคับที่ DB ไม่ใช่แค่ซ่อนปุ่ม
create policy orders_insert on public.orders
  for insert to authenticated
  with check (
    (select app.is_member_of(workspace_id))
    and (select app.workspace_is_writable(workspace_id))
  );

create policy orders_update on public.orders
  for update to authenticated
  using ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)))
  with check ((select app.can_see_money(workspace_id)));

create policy order_items_select on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy order_items_insert on public.order_items
  for insert to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (select app.is_member_of(o.workspace_id))
      and (select app.workspace_is_writable(o.workspace_id))
  ));
