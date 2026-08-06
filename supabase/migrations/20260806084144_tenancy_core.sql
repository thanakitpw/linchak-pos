-- ============================================================================
-- Migration 1 — tenancy core
-- workspaces / memberships / plans / platform_admins + helper functions + RLS
-- อ้างอิง: docs/data-model.md §1-2, docs/admin-backoffice.md §2
-- ============================================================================

create extension if not exists moddatetime with schema extensions;

-- schema ส่วนตัว: ไม่ถูก expose ผ่าน PostgREST จึงเรียกจาก client ตรงๆ ไม่ได้
-- ใช้เก็บ helper function ที่ RLS policy เรียกใช้
create schema if not exists app;

-- ────────────────────────────────────────────────────────────────────────────
-- plans — แผนราคา
-- ────────────────────────────────────────────────────────────────────────────
create table public.plans (
  code             text primary key,
  name_th          text not null,
  name_en          text not null,
  price_satang     integer not null check (price_satang >= 0),
  period_months    smallint not null check (period_months > 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);
comment on table public.plans is 'แผนราคา · price เก็บเป็นสตางค์ (integer) ตามกฎเงินของโปรเจค';

insert into public.plans (code, name_th, name_en, price_satang, period_months) values
  ('monthly_149', 'รายเดือน', 'Monthly', 14900, 1);

-- ────────────────────────────────────────────────────────────────────────────
-- platform_admins — ทีมเรา ไม่ใช่ลูกค้า
-- อยู่ใน schema app จึงเรียกผ่าน API ไม่ได้เลย ลด attack surface
-- ────────────────────────────────────────────────────────────────────────────
create table app.platform_admins (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'support' check (role in ('superadmin','support')),
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);
comment on table app.platform_admins is 'ผู้ดูแลแพลตฟอร์ม · schema app ไม่ถูก expose ทาง PostgREST';

-- ────────────────────────────────────────────────────────────────────────────
-- workspaces — 1 แถว = 1 ร้าน
-- ────────────────────────────────────────────────────────────────────────────
create table public.workspaces (
  id                    uuid primary key default gen_random_uuid(),

  -- ข้อมูลร้าน (FR-1.1)
  name                  text not null check (length(btrim(name)) between 1 and 120),
  branch                text,
  phone                 text,
  logo_path             text,

  -- PromptPay (FR-1.2) — ต้องรู้ชนิดด้วย เพราะ payload EMVCo ต่างกัน
  promptpay_id          text,
  promptpay_type        text check (promptpay_type in ('phone','nid','ewallet')),

  -- ภาษี (FR-1.3) — ปิดเป็นค่าเริ่มต้น
  tax_enabled           boolean not null default false,
  tax_rate              numeric(5,2) not null default 7 check (tax_rate >= 0 and tax_rate <= 100),

  -- ภาษา (FR-1.4)
  language              text not null default 'th' check (language in ('th','en')),

  -- สถานะการใช้งาน (FR-0.4)
  subscription_status   text not null default 'trialing'
                          check (subscription_status in ('trialing','active','past_due','expired','suspended')),
  plan_code             text references public.plans(code) on delete restrict,
  trial_ends_at         timestamptz not null default (now() + interval '7 days'),
  current_period_end    timestamptz,
  suspended_at          timestamptz,
  suspended_by          uuid references auth.users(id) on delete set null,
  suspended_reason      text,

  -- ตัวนับเลขบิล (BR-3) — อยู่บนแถวนี้เพื่อให้ล็อกแถวเดียวตอนออกเลขได้
  bill_seq              bigint not null default 0,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- ถ้าตั้ง promptpay ต้องระบุชนิดคู่กันเสมอ ไม่งั้น gen QR ไม่ได้
  constraint workspaces_promptpay_pair
    check ((promptpay_id is null) = (promptpay_type is null)),
  -- ระงับแล้วต้องมีเหตุผลเสมอ (admin-backoffice.md §1.3)
  constraint workspaces_suspend_reason
    check (suspended_at is null or suspended_reason is not null)
);
comment on column public.workspaces.bill_seq is 'BR-3 · จัดสรรผ่าน app.allocate_bill_no() ภายใต้ row lock เท่านั้น ห้าม MAX()+1';

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function extensions.moddatetime(updated_at);

-- ────────────────────────────────────────────────────────────────────────────
-- memberships — ใครเข้าถึงร้านไหนได้ ด้วยสิทธิ์อะไร
-- ────────────────────────────────────────────────────────────────────────────
create table public.memberships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  role          text not null default 'staff' check (role in ('owner','manager','staff')),
  invited_by    uuid references auth.users(id) on delete set null,
  invited_at    timestamptz,
  accepted_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (user_id, workspace_id)
);
comment on table public.memberships is 'สิทธิ์ในร้าน · staff ไม่เห็นตัวเลขเงินย้อนหลัง (docs/admin-backoffice.md §2)';

create index memberships_workspace_id_idx on public.memberships (workspace_id);
create index memberships_user_id_idx on public.memberships (user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Helper functions
-- ทุกตัวเป็น SECURITY DEFINER + search_path='' และ **ตรึง auth.uid() ไว้ในตัวฟังก์ชัน**
-- จึงถามได้แค่ "ผู้ใช้ที่เรียกอยู่ตอนนี้มีสิทธิ์อะไร" ไม่สามารถถามแทนคนอื่นได้
-- เหตุผลที่ต้อง SECURITY DEFINER: policy ของ memberships เองก็เรียกฟังก์ชันนี้
-- ถ้าไม่ bypass RLS จะ recursive ไม่รู้จบ
-- ────────────────────────────────────────────────────────────────────────────

create or replace function app.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from app.platform_admins pa
    where pa.user_id = (select auth.uid())
  );
$$;

create or replace function app.is_member_of(ws uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.workspace_id = ws
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function app.role_in(ws uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.memberships m
  where m.workspace_id = ws
    and m.user_id = (select auth.uid());
$$;

-- staff ไม่เห็นตัวเลขเงินย้อนหลัง — ใช้เป็นเงื่อนไขใน policy ของ purchases/รายงาน
create or replace function app.can_see_money(ws uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(app.role_in(ws) in ('owner','manager'), false);
$$;

create or replace function app.is_owner_of(ws uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(app.role_in(ws) = 'owner', false);
$$;

-- FR-0.4 · gate ที่ระดับ DB ไม่ใช่แค่ซ่อนปุ่มใน UI
-- คำนวณสดจากวันหมดอายุ ไม่พึ่งว่า cron ได้อัปเดตคอลัมน์ status แล้วหรือยัง
create or replace function app.workspace_is_writable(ws uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = ws
      and w.suspended_at is null
      and (
        (w.subscription_status = 'trialing' and w.trial_ends_at > now())
        or (w.subscription_status in ('active','past_due')
            and coalesce(w.current_period_end, '-infinity'::timestamptz) + interval '3 days' > now())
      )
  );
$$;

-- policy ต้องเรียกฟังก์ชันเหล่านี้ได้ จึงต้อง grant
-- schema app ไม่ถูก expose ทาง PostgREST อยู่แล้ว จึงเรียกผ่าน REST API ไม่ได้
grant usage on schema app to authenticated;
grant execute on function
  app.is_platform_admin(), app.is_member_of(uuid), app.role_in(uuid),
  app.can_see_money(uuid), app.is_owner_of(uuid), app.workspace_is_writable(uuid)
  to authenticated;

-- anon ไม่ต้องรู้อะไรทั้งสิ้น
revoke all on schema app from anon;

-- ให้ client ถามได้ว่า "ฉันเป็นแอดมินไหม" เพื่อโชว์/ซ่อนลิงก์ /admin
create or replace function public.current_user_is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select app.is_platform_admin();
$$;
revoke execute on function public.current_user_is_platform_admin() from public, anon;
grant execute on function public.current_user_is_platform_admin() to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- FR-0.2 · สมัครครั้งแรก → สร้างร้าน 1 ร้าน + membership role=owner อัตโนมัติ
-- ────────────────────────────────────────────────────────────────────────────
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  new_workspace_id uuid;
  store_name text;
begin
  store_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'store_name', '')), '');

  insert into public.workspaces (name, language, plan_code)
  values (
    coalesce(store_name, split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'language', ''), 'th'),
    'monthly_149'
  )
  returning id into new_workspace_id;

  insert into public.memberships (user_id, workspace_id, role)
  values (new.id, new_workspace_id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ────────────────────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────────────────────
alter table public.plans enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table app.platform_admins enable row level security;

-- plans: อ่านได้ทุกคนที่ล็อกอิน (ต้องโชว์ราคาในหน้าต่ออายุ) แก้ไขไม่ได้เลยผ่าน API
create policy plans_select on public.plans
  for select to authenticated using (true);

-- platform_admins: ไม่มี policy = ไม่มีใครอ่าน/เขียนผ่าน API ได้เลย
-- เข้าถึงได้เฉพาะผ่าน SECURITY DEFINER function เท่านั้น

-- workspaces
create policy workspaces_select on public.workspaces
  for select to authenticated
  using ((select app.is_member_of(id)) or (select app.is_platform_admin()));

-- แก้ข้อมูลร้านได้เฉพาะ owner (FR-1) และเฉพาะตอนที่ยังเขียนได้
create policy workspaces_update_owner on public.workspaces
  for update to authenticated
  using ((select app.is_owner_of(id)) and (select app.workspace_is_writable(id)))
  with check ((select app.is_owner_of(id)));

-- แอดมินแก้สถานะ/ต่ออายุ/ระงับได้
create policy workspaces_update_admin on public.workspaces
  for update to authenticated
  using ((select app.is_platform_admin()))
  with check ((select app.is_platform_admin()));

-- ไม่มี policy INSERT/DELETE: ร้านเกิดจาก trigger ตอนสมัครเท่านั้น
-- และลบร้านต้องทำผ่านขั้นตอนที่มี audit ไม่ใช่ยิง DELETE ตรงๆ

-- memberships
create policy memberships_select on public.memberships
  for select to authenticated
  using ((select app.is_member_of(workspace_id)) or (select app.is_platform_admin()));

create policy memberships_insert_owner on public.memberships
  for insert to authenticated
  with check ((select app.is_owner_of(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

create policy memberships_update_owner on public.memberships
  for update to authenticated
  using ((select app.is_owner_of(workspace_id)))
  with check ((select app.is_owner_of(workspace_id)));

create policy memberships_delete_owner on public.memberships
  for delete to authenticated
  using ((select app.is_owner_of(workspace_id)));
