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
| `..._admin_backoffice_functions`     | `is_platform_admin` + ฟังก์ชัน `admin_*` 5 ตัว (ดูตาราง definer ด้านล่าง)                       |
| `..._current_workspace_is_writable`  | RPC ให้ UI ถามว่าร้านตัวเองออกบิลได้ไหม (FR-0.4) — invoker ไม่ใช่ definer                       |

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
- **SECURITY DEFINER ที่ยอมรับแล้ว — 6 ตัว ไม่ใช่บั๊ก**
  security advisor จะเตือนทุกครั้ง อย่าเพิ่งตกใจ นี่คือรายการที่ผ่านการพิจารณาแล้ว:

  | ฟังก์ชัน                 | ใครเรียกได้              | ทำไมต้อง definer                                      | ด่านกันในตัวฟังก์ชัน                                                           |
  | ------------------------ | ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
  | `get_public_receipt`     | `anon` + `authenticated` | FR-4.6 ต้องเปิดบิลโดยไม่ล็อกอิน                       | รับ uuid token (122 บิต เดาไม่ได้) คืนบิลเดียว ไม่มี workspace_id/promptpay_id |
  | `admin_workspace_list`   | `authenticated`          | อ่าน `auth.users` + นับบิลข้าม RLS                    | `is_platform_admin()` บรรทัดแรก                                                |
  | `admin_dashboard_stats`  | `authenticated`          | นับข้ามทุกร้าน                                        | `is_platform_admin()` บรรทัดแรก                                                |
  | `admin_workspace_detail` | `authenticated`          | อ่าน `auth.users` + payments + audit                  | `is_platform_admin()` บรรทัดแรก                                                |
  | `admin_record_payment`   | `authenticated`          | เขียน payments + workspaces + audit ในทรานแซกชันเดียว | `is_platform_admin()` บรรทัดแรก                                                |
  | `admin_set_suspended`    | `authenticated`          | เขียน workspaces + audit ในทรานแซกชันเดียว            | `is_platform_admin()` + บังคับเหตุผล                                           |

  **ถ้าเพิ่มฟังก์ชัน definer ใหม่ ต้องเติมลงตารางนี้พร้อมเหตุผล**
  ไม่งั้น session ถัดไปจะแยกไม่ออกว่าอันไหนตั้งใจ อันไหนพลาด

- **ทางเลือกที่ปฏิเสธ:** เปิด RLS ให้ `anon` อ่านตาราง orders (สำหรับบิล public)
  policy เดียวที่เขียนผิดในอนาคตจะเปิดข้อมูลทั้งระบบ — อันตรายกว่าฟังก์ชันเดียวที่ตรวจสอบได้
- **รัน advisor ทุกครั้งหลังแก้ schema** — `get_advisors` ผ่าน MCP หรือ `supabase db advisors`
