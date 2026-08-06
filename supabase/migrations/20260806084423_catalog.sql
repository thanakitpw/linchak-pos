-- ============================================================================
-- Migration 2 — catalog: categories + products (FR-2)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- categories (FR-2.1)
-- color เก็บเป็น index 1..8 ไม่ใช่ hex — ผูกกับ token cat-1..8 ใน design system
-- ถ้าปล่อยให้เก็บ hex อิสระ สีในแอปจะเละเหมือนที่ mockup เป็น
-- ────────────────────────────────────────────────────────────────────────────
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null check (length(btrim(name)) between 1 and 60),
  color_index   smallint not null default 1 check (color_index between 1 and 8),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, name)
);
comment on column public.categories.color_index is 'ชี้ไป token cat-1..8 ใน src/styles/theme.css · ห้ามเก็บ hex';

create index categories_workspace_id_idx on public.categories (workspace_id, sort_order);

create trigger categories_updated_at
  before update on public.categories
  for each row execute function extensions.moddatetime(updated_at);

-- ────────────────────────────────────────────────────────────────────────────
-- products (FR-2.2)
-- ────────────────────────────────────────────────────────────────────────────
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  category_id         uuid references public.categories(id) on delete set null,
  name                text not null check (length(btrim(name)) between 1 and 200),
  description         text,
  price               numeric(12,2) not null check (price >= 0),
  price_includes_tax  boolean not null default false,
  image_path          text,
  -- BR-4: ลบสินค้าแล้วบิลเก่าต้องไม่เปลี่ยน → archive ไม่ใช่ DELETE
  is_archived         boolean not null default false,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint products_archived_pair check ((is_archived = false) = (archived_at is null))
);
comment on column public.products.is_archived is 'BR-4 · ลบสินค้า = archive ห้าม DELETE เพราะรายงานย้อนหลังจะพัง';
comment on column public.products.price is 'numeric(12,2) · ฝั่ง TS คำนวณเป็นสตางค์ ดู src/lib/money.ts';

-- index สำหรับหน้าขาย: กรองด้วย workspace + ไม่เอาที่ archive แล้ว
create index products_workspace_active_idx
  on public.products (workspace_id, name)
  where is_archived = false;
create index products_category_id_idx on public.products (category_id);

create trigger products_updated_at
  before update on public.products
  for each row execute function extensions.moddatetime(updated_at);

-- ป้องกันการโยงสินค้าไปหมวดหมู่ของร้านอื่น
-- (FK ธรรมดาไม่รู้เรื่อง tenant — เช็คนี้คือเส้นกั้นข้ามร้านที่ระดับข้อมูล)
create or replace function app.assert_category_same_workspace()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.category_id is not null then
    if not exists (
      select 1 from public.categories c
      where c.id = new.category_id and c.workspace_id = new.workspace_id
    ) then
      raise exception 'category % ไม่ได้อยู่ใน workspace เดียวกับสินค้า', new.category_id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger products_category_same_workspace
  before insert or update of category_id, workspace_id on public.products
  for each row execute function app.assert_category_same_workspace();

-- ────────────────────────────────────────────────────────────────────────────
-- RLS
-- อ่าน: สมาชิกทุก role (staff ต้องเห็นสินค้าเพื่อออกบิล)
-- เขียน: owner/manager เท่านั้น ยกเว้น INSERT ที่ staff ทำได้ (FR-2.5 instant add)
-- ทุก policy ที่เขียนข้อมูลต้องผ่าน workspace_is_writable ด้วย (FR-0.4)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.categories enable row level security;
alter table public.products   enable row level security;

create policy categories_select on public.categories
  for select to authenticated
  using ((select app.is_member_of(workspace_id)));

create policy categories_write on public.categories
  for all to authenticated
  using ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)))
  with check ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

create policy products_select on public.products
  for select to authenticated
  using ((select app.is_member_of(workspace_id)));

-- staff เพิ่มสินค้าได้ (instant add ตอนออกบิล) แต่แก้/ลบไม่ได้
create policy products_insert on public.products
  for insert to authenticated
  with check ((select app.is_member_of(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

create policy products_update on public.products
  for update to authenticated
  using ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)))
  with check ((select app.can_see_money(workspace_id)) and (select app.workspace_is_writable(workspace_id)));

-- ไม่มี policy DELETE โดยตั้งใจ: BR-4 บังคับให้ archive แทนการลบ
