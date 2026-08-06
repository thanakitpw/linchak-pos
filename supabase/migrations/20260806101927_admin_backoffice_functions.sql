-- ============================================================================
-- Migration 6 — ฟังก์ชันสำหรับหลังบ้าน /admin
-- อ้างอิง docs/admin-backoffice.md
--
-- ทุกฟังก์ชันที่แก้ข้อมูล **เขียน audit_logs ในทรานแซกชันเดียวกัน**
-- ถ้าแยกกันเขียน จะมีกรณีที่การกระทำสำเร็จแต่ audit หาย ซึ่งแย่กว่าไม่มี audit เลย
-- เพราะทำให้เชื่อ log ไม่ได้
--
-- ⚠️ ทุกตัวเป็น SECURITY DEFINER โดยจำเป็น (ต้องอ่าน auth.users และข้าม RLS ที่ผูกกับ
--    สมาชิกร้าน) และ **ทุกตัวมีด่าน is_platform_admin() บรรทัดแรกเสมอ**
--    security advisor จะเตือนเรื่องนี้ตลอด — เป็น warning ที่ยอมรับแล้ว ดู supabase/README.md
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- รายชื่อร้านสำหรับหน้า /admin
-- คืนแค่ตัวเลขสรุป ไม่คืนแถวบิลของลูกค้า (docs/data-model.md §10)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_workspace_list(
  p_search text default null,
  p_status text default null
)
returns table (
  id                  uuid,
  name                text,
  owner_email         text,
  subscription_status text,
  trial_ends_at       timestamptz,
  current_period_end  timestamptz,
  suspended_at        timestamptz,
  suspended_reason    text,
  member_count        bigint,
  orders_this_month   bigint,
  sales_this_month    numeric,
  last_order_at       timestamptz,
  created_at          timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_platform_admin() then
    raise exception 'ต้องเป็นผู้ดูแลแพลตฟอร์ม' using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    w.id, w.name,
    (select u.email::text from auth.users u
       join public.memberships m2 on m2.user_id = u.id
      where m2.workspace_id = w.id and m2.role = 'owner'
      order by m2.created_at limit 1),
    w.subscription_status, w.trial_ends_at, w.current_period_end,
    w.suspended_at, w.suspended_reason,
    (select count(*) from public.memberships m3 where m3.workspace_id = w.id),
    (select count(*) from public.orders o
      where o.workspace_id = w.id
        and o.ordered_at >= date_trunc('month', now() at time zone 'Asia/Bangkok')),
    coalesce((select sum(o.total) from public.orders o
      where o.workspace_id = w.id
        and o.ordered_at >= date_trunc('month', now() at time zone 'Asia/Bangkok')), 0),
    (select max(o.ordered_at) from public.orders o where o.workspace_id = w.id),
    w.created_at
  from public.workspaces w
  where (p_search is null or p_search = ''
         or w.name ilike '%' || p_search || '%'
         or w.phone ilike '%' || p_search || '%'
         or exists (select 1 from auth.users u
                      join public.memberships m4 on m4.user_id = u.id
                     where m4.workspace_id = w.id and u.email ilike '%' || p_search || '%'))
    and (p_status is null or p_status = '' or w.subscription_status = p_status)
  order by
    -- เรียงตามความเร่งด่วน: ใกล้หมดอายุขึ้นก่อน
    case w.subscription_status
      when 'past_due' then 1 when 'trialing' then 2 when 'active' then 3
      when 'expired' then 4 else 5 end,
    coalesce(w.current_period_end, w.trial_ends_at) asc;
end;
$$;

revoke execute on function public.admin_workspace_list(text, text) from public, anon;
grant execute on function public.admin_workspace_list(text, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- ตัวเลขบนหน้า Dashboard
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not app.is_platform_admin() then
    raise exception 'ต้องเป็นผู้ดูแลแพลตฟอร์ม' using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'trialing',  count(*) filter (where subscription_status = 'trialing'),
    'active',    count(*) filter (where subscription_status = 'active'),
    'past_due',  count(*) filter (where subscription_status = 'past_due'),
    'expired',   count(*) filter (where subscription_status = 'expired'),
    'suspended', count(*) filter (where suspended_at is not null),
    'total',     count(*),
    'new_this_week', count(*) filter (where created_at >= now() - interval '7 days'),
    -- ใกล้หมด trial ใน 3 วัน — กลุ่มที่ควรทักไปขายต่อ
    'trial_ending_soon', count(*) filter (
      where subscription_status = 'trialing'
        and trial_ends_at between now() and now() + interval '3 days'),
    -- MRR: นับเฉพาะร้านที่จ่ายอยู่จริง จากราคาแผนที่ใช้อยู่
    'mrr_satang', coalesce((
      select sum(p.price_satang / p.period_months)
      from public.workspaces w2
      join public.plans p on p.code = w2.plan_code
      where w2.subscription_status = 'active' and w2.suspended_at is null), 0)
  ) into result
  from public.workspaces;

  return result;
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- บันทึกการชำระเงิน + ต่ออายุ — ทรานแซกชันเดียว
--
-- ใช้ greatest(current_period_end, now()) เพื่อให้จ่ายก่อนหมดอายุแล้วไม่เสียวันที่เหลือ
-- (greatest ข้าม null ให้เอง ร้านที่ยังไม่เคยจ่ายจึงเริ่มนับจากวันนี้)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_record_payment(
  p_workspace_id  uuid,
  p_plan_code     text,
  p_amount_satang integer,
  p_method        text default 'bank_transfer',
  p_reference     text default null,
  p_note          text default null
)
returns public.payments
language plpgsql security definer set search_path = '' as $$
declare
  v_months   smallint;
  v_start    timestamptz;
  v_end      timestamptz;
  v_payment  public.payments;
  v_before   jsonb;
begin
  if not app.is_platform_admin() then
    raise exception 'ต้องเป็นผู้ดูแลแพลตฟอร์ม' using errcode = 'insufficient_privilege';
  end if;

  select period_months into v_months from public.plans where code = p_plan_code;
  if v_months is null then
    raise exception 'ไม่พบแผน %', p_plan_code using errcode = 'foreign_key_violation';
  end if;

  select to_jsonb(w) into v_before from public.workspaces w where w.id = p_workspace_id;
  if v_before is null then
    raise exception 'ไม่พบร้าน %', p_workspace_id using errcode = 'no_data_found';
  end if;

  v_start := greatest((v_before ->> 'current_period_end')::timestamptz, now());
  v_end   := v_start + (v_months || ' months')::interval;

  insert into public.payments (workspace_id, plan_code, amount_satang, period_start, period_end,
                               method, reference, note, recorded_by)
  values (p_workspace_id, p_plan_code, p_amount_satang, v_start, v_end,
          p_method, p_reference, p_note, (select auth.uid()))
  returning * into v_payment;

  update public.workspaces
     set subscription_status = 'active',
         plan_code = p_plan_code,
         current_period_end = v_end
   where id = p_workspace_id;

  insert into public.audit_logs (actor_user_id, actor_kind, action, target_type, target_id,
                                 workspace_id, before, after, reason)
  values ((select auth.uid()), 'platform_admin', 'payment.record', 'workspace',
          p_workspace_id::text, p_workspace_id,
          jsonb_build_object('current_period_end', v_before ->> 'current_period_end',
                             'subscription_status', v_before ->> 'subscription_status'),
          jsonb_build_object('current_period_end', v_end, 'subscription_status', 'active'),
          p_note);

  return v_payment;
end;
$$;

revoke execute on function public.admin_record_payment(uuid, text, integer, text, text, text)
  from public, anon;
grant execute on function public.admin_record_payment(uuid, text, integer, text, text, text)
  to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- ระงับ / ปลดระงับ — **บังคับกรอกเหตุผล**
-- เหตุผลคือสิ่งที่ตอบคำถาม "ทำไมร้านนี้ถูกปิด" ตอนลูกค้าโทรมา
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_set_suspended(
  p_workspace_id uuid,
  p_suspended    boolean,
  p_reason       text
)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_before jsonb;
begin
  if not app.is_platform_admin() then
    raise exception 'ต้องเป็นผู้ดูแลแพลตฟอร์ม' using errcode = 'insufficient_privilege';
  end if;
  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'ต้องระบุเหตุผล' using errcode = 'check_violation';
  end if;

  select to_jsonb(w) into v_before from public.workspaces w where w.id = p_workspace_id;
  if v_before is null then
    raise exception 'ไม่พบร้าน %', p_workspace_id using errcode = 'no_data_found';
  end if;

  update public.workspaces
     set suspended_at     = case when p_suspended then now() end,
         suspended_by     = case when p_suspended then (select auth.uid()) end,
         suspended_reason = case when p_suspended then p_reason end,
         subscription_status = case when p_suspended then 'suspended'
                                    else v_before ->> 'subscription_status' end
   where id = p_workspace_id;

  -- ปลดระงับแล้วคืนสถานะเดิม แต่ถ้าเดิมเป็น suspended (ไม่ควรเกิด) ให้กลับเป็น expired
  if not p_suspended and (v_before ->> 'subscription_status') = 'suspended' then
    update public.workspaces set subscription_status = 'expired' where id = p_workspace_id;
  end if;

  insert into public.audit_logs (actor_user_id, actor_kind, action, target_type, target_id,
                                 workspace_id, before, after, reason)
  values ((select auth.uid()), 'platform_admin',
          case when p_suspended then 'workspace.suspend' else 'workspace.unsuspend' end,
          'workspace', p_workspace_id::text, p_workspace_id,
          jsonb_build_object('suspended_at', v_before ->> 'suspended_at',
                             'subscription_status', v_before ->> 'subscription_status'),
          jsonb_build_object('suspended', p_suspended),
          p_reason);
end;
$$;

revoke execute on function public.admin_set_suspended(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_suspended(uuid, boolean, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- รายละเอียดร้านหนึ่งร้าน (สมาชิก + ประวัติการจ่าย + audit)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_workspace_detail(p_workspace_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not app.is_platform_admin() then
    raise exception 'ต้องเป็นผู้ดูแลแพลตฟอร์ม' using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'workspace', to_jsonb(w) - 'promptpay_id',   -- ไม่ต้องให้แอดมินเห็นเลขรับเงินของร้าน
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('email', u.email, 'role', m.role,
                                          'joined_at', m.created_at) order by m.created_at)
      from public.memberships m join auth.users u on u.id = m.user_id
      where m.workspace_id = w.id), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.created_at desc)
      from public.payments p where p.workspace_id = w.id), '[]'::jsonb),
    'audit', coalesce((
      select jsonb_agg(jsonb_build_object('action', a.action, 'reason', a.reason,
                                          'created_at', a.created_at,
                                          'actor', (select email from auth.users where id = a.actor_user_id))
                       order by a.created_at desc)
      from (select * from public.audit_logs al
             where al.workspace_id = w.id order by al.created_at desc limit 50) a), '[]'::jsonb),
    'stats', jsonb_build_object(
      'orders_total', (select count(*) from public.orders o where o.workspace_id = w.id),
      'products_total', (select count(*) from public.products pr
                          where pr.workspace_id = w.id and pr.is_archived = false),
      'last_order_at', (select max(o.ordered_at) from public.orders o where o.workspace_id = w.id))
  ) into result
  from public.workspaces w
  where w.id = p_workspace_id;

  return result;
end;
$$;

revoke execute on function public.admin_workspace_detail(uuid) from public, anon;
grant execute on function public.admin_workspace_detail(uuid) to authenticated;
