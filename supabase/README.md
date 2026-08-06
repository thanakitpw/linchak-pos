# supabase/

## migrations/

schema ทั้งหมดของโปรเจค · ชื่อไฟล์ตรงกับ `supabase_migrations.schema_migrations` บนโปรเจคจริง
เหตุผลการออกแบบแต่ละตาราง: `docs/data-model.md` · หลังบ้าน: `docs/admin-backoffice.md`

| ไฟล์                                 | มีอะไร                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `..._tenancy_core`                   | plans, platform_admins, workspaces, memberships, helper functions, trigger สมัคร→สร้างร้าน, RLS |
| `..._tenancy_core_fix_admin_lookup`  | ลด SECURITY DEFINER ของการตรวจสิทธิ์แอดมิน (แก้ security advisor 2 ข้อ)                         |
| `..._catalog`                        | categories, products + trigger กันโยงข้ามร้าน                                                   |
| `..._orders`                         | orders, order_items, `allocate_bill_no`, `create_order`, `get_public_receipt`                   |
| `..._purchases_payments_audit`       | purchases, purchase_items, `create_purchase`, payments, audit_logs                              |
| `..._storage_buckets`                | bucket 4 ตัว + policy                                                                           |
| `..._fix_indexes_and_policy_overlap` | index บน FK + แยก policy `FOR ALL` (แก้ performance advisor)                                    |

## คำสั่ง

```bash
supabase login                 # ครั้งแรกครั้งเดียว
supabase link --project-ref txuqhvbbzjpkmkewezhv
supabase db push               # ส่ง migration ที่ยังไม่ได้ apply ขึ้นโปรเจค
pnpm db:types                  # generate src/lib/database.types.ts ใหม่หลังแก้ schema
```

## หลักที่ต้องรักษา

- **ทุกตารางเปิด RLS และ scope ด้วย `workspace_id`** — ตอนนี้ 12/12 ตารางเปิดครบ
- **`app` schema ไม่ถูก expose ทาง PostgREST** — ใช้เก็บ helper ที่ RLS policy เรียก
- **`get_public_receipt` เป็น SECURITY DEFINER ตัวเดียวที่ `anon` เรียกได้** — เป็นข้อยกเว้นที่ตั้งใจ (FR-4.6)
  security advisor จะเตือนเรื่องนี้เสมอ **นี่คือ warning ที่ยอมรับแล้ว** ไม่ใช่บั๊ก
  ทางเลือกอีกทางคือเปิด RLS ให้ `anon` อ่านตาราง orders ซึ่งอันตรายกว่ามาก
- **รัน advisor ทุกครั้งหลังแก้ schema** — `get_advisors` ผ่าน MCP หรือ `supabase db advisors`
