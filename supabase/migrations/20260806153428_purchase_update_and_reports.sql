-- ============================================================================
-- แก้บันทึกการซื้อ (FR-5.2) + ฟังก์ชันรายงาน (FR-6)
--
-- ทั้งหมดเป็น SECURITY INVOKER: RLS ทำงานตามปกติ ผู้เรียกเห็นเฉพาะร้านตัวเอง
-- และ `staff` ที่เห็นแค่บิลตัวเองก็จะได้ยอดรวมเฉพาะของตัวเองโดยอัตโนมัติ (กฎ 32)
-- ไม่ต้องเขียนเงื่อนไขสิทธิ์ซ้ำในฟังก์ชัน
--
-- เงินคำนวณด้วย numeric ในฐานข้อมูล ไม่ใช่ float ใน JS (กฎ 22)
-- ขอบวันใช้เวลาไทย ไม่ใช่ UTC — บิลตอน 6 โมงเย็นวันที่ 5 เป็นของวันที่ 5
-- ถ้าใช้ UTC จะกลายเป็นวันที่ 5 เวลา 11:00 ซึ่งยังถูก แต่บิลตอนเที่ยงคืนครึ่ง
-- จะเด้งไปเป็นของเมื่อวาน
-- ============================================================================

-- ── แก้บันทึกการซื้อทั้งใบในทรานแซกชันเดียว (NFR-7) ────────────────────────
-- รายการย่อยใช้วิธีลบทิ้งแล้วเขียนใหม่ ไม่ใช่ diff ทีละแถว:
-- ฟอร์มส่งมาทั้งชุดอยู่แล้ว และ purchase_items ไม่มีใครอ้างถึง (ต่างจาก order_items)
create or replace function public.update_purchase(
  p_id uuid,
  p_purchased_at date,
  p_items jsonb,
  p_vendor text default null,
  p_note text default null,
  p_slip_path text default null,
  p_total_override numeric default null
) returns public.purchases
language plpgsql set search_path = '' as $$
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

  update public.purchases
     set purchased_at = p_purchased_at,
         vendor       = p_vendor,
         note         = p_note,
         total        = coalesce(p_total_override, v_total),
         slip_path    = coalesce(p_slip_path, slip_path),
         updated_at   = now()
   where id = p_id
  returning * into v_purchase;

  -- RLS ปฏิเสธ = ไม่มีแถวกลับมา ต้องหยุดก่อนไปแตะ items
  if v_purchase.id is null then
    raise exception 'purchase not found or not permitted' using errcode = '42501';
  end if;

  delete from public.purchase_items where purchase_id = p_id;

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

-- ── FR-6.2 · ยอดขายในช่วงวันที่ (daily / monthly / custom ใช้ตัวเดียวกัน) ──
create or replace function public.report_sales(p_from date, p_to date)
returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'sales',    coalesce(sum(o.total), 0),
    'discount', coalesce(sum(o.discount), 0),
    'tax',      coalesce(sum(o.tax_amount), 0),
    'bills',    count(*)
  )
  from public.orders o
  where (o.ordered_at at time zone 'Asia/Bangkok')::date between p_from and p_to;
$$;

-- ── ยอดขายรายวันย้อนหลัง N วัน (กราฟแท่งบนหน้าสรุป) ───────────────────────
-- generate_series เพื่อให้วันที่ไม่มีบิลได้แท่งศูนย์ ไม่ใช่หายไปจากแกน
create or replace function public.report_daily_sales(p_days integer default 7)
returns jsonb
language sql stable set search_path = '' as $$
  with days as (
    select generate_series(
      (now() at time zone 'Asia/Bangkok')::date - (p_days - 1),
      (now() at time zone 'Asia/Bangkok')::date,
      interval '1 day'
    )::date as day
  )
  select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'total', coalesce(s.total, 0))
                            order by d.day), '[]'::jsonb)
  from days d
  left join (
    select (o.ordered_at at time zone 'Asia/Bangkok')::date as day, sum(o.total) as total
    from public.orders o
    group by 1
  ) s on s.day = d.day;
$$;

-- ── FR-6.1 / FR-6.3 · กำไรของเดือน (BR-5) ────────────────────────────────
-- กำไร = ยอดขายรวม − ต้นทุนรวม ของ "เดือนนั้น" ไม่ใช่ COGS ต่อชิ้น
-- p_month รับวันไหนก็ได้ในเดือน ฟังก์ชันตัดเป็นต้นเดือนเอง
create or replace function public.report_monthly_profit(p_month date default null)
returns jsonb
language sql stable set search_path = '' as $$
  with bounds as (
    select date_trunc('month',
             coalesce(p_month, (now() at time zone 'Asia/Bangkok')::date))::date as m
  ),
  ranges as (
    select m as cur_from,
           (m + interval '1 month' - interval '1 day')::date as cur_to,
           (m - interval '1 month')::date as prev_from,
           (m - interval '1 day')::date as prev_to
    from bounds
  ),
  sales as (
    select
      coalesce(sum(o.total) filter (where d between r.cur_from  and r.cur_to),  0) as cur,
      coalesce(sum(o.total) filter (where d between r.prev_from and r.prev_to), 0) as prev,
      count(*)              filter (where d between r.cur_from  and r.cur_to)      as bills
    from ranges r
    left join (
      select total, (ordered_at at time zone 'Asia/Bangkok')::date as d from public.orders
    ) o on true
  ),
  costs as (
    select
      coalesce(sum(p.total) filter (where p.purchased_at between r.cur_from  and r.cur_to),  0) as cur,
      coalesce(sum(p.total) filter (where p.purchased_at between r.prev_from and r.prev_to), 0) as prev,
      count(*)              filter (where p.purchased_at between r.cur_from  and r.cur_to)      as purchases
    from ranges r
    left join public.purchases p on true
  )
  select jsonb_build_object(
    'month',         (select m from bounds),
    'sales',         sales.cur,
    'costs',         costs.cur,
    'profit',        sales.cur - costs.cur,
    'bills',         sales.bills,
    'purchases',     costs.purchases,
    'prev_profit',   sales.prev - costs.prev
  )
  from sales, costs;
$$;

-- ── FR-6.3 · แนวโน้มกำไร N เดือนล่าสุด ────────────────────────────────────
create or replace function public.report_profit_trend(p_months integer default 6)
returns jsonb
language sql stable set search_path = '' as $$
  with months as (
    select generate_series(
      date_trunc('month', (now() at time zone 'Asia/Bangkok')::date) - ((p_months - 1) || ' months')::interval,
      date_trunc('month', (now() at time zone 'Asia/Bangkok')::date),
      interval '1 month'
    )::date as m
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'month',  months.m,
           'sales',  coalesce(s.total, 0),
           'costs',  coalesce(c.total, 0),
           'profit', coalesce(s.total, 0) - coalesce(c.total, 0)
         ) order by months.m), '[]'::jsonb)
  from months
  left join (
    select date_trunc('month', (ordered_at at time zone 'Asia/Bangkok')::date)::date as m,
           sum(total) as total
    from public.orders group by 1
  ) s on s.m = months.m
  left join (
    select date_trunc('month', purchased_at)::date as m, sum(total) as total
    from public.purchases group by 1
  ) c on c.m = months.m;
$$;

revoke execute on function public.update_purchase(uuid, date, jsonb, text, text, text, numeric) from public, anon;
revoke execute on function public.report_sales(date, date) from public, anon;
revoke execute on function public.report_daily_sales(integer) from public, anon;
revoke execute on function public.report_monthly_profit(date) from public, anon;
revoke execute on function public.report_profit_trend(integer) from public, anon;

grant execute on function public.update_purchase(uuid, date, jsonb, text, text, text, numeric) to authenticated;
grant execute on function public.report_sales(date, date) to authenticated;
grant execute on function public.report_daily_sales(integer) to authenticated;
grant execute on function public.report_monthly_profit(date) to authenticated;
grant execute on function public.report_profit_trend(integer) to authenticated;
