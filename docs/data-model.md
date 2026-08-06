# Data Model — Supabase เก็บอะไรบ้าง

> โน้ตสำหรับออกแบบ schema · ยังไม่ได้ implement (เฟส P1)
> ขยายจาก `docs/pos-prd.md` §7 โดยเพิ่มส่วนที่ PRD ไม่ได้ครอบคลุม: หลังบ้าน, สิทธิ์, การชำระเงิน, audit
> รายละเอียดหน้าจอหลังบ้านอยู่ใน `docs/admin-backoffice.md`

---

## 0. ภาพรวม 3 ชั้น

```
ชั้น PLATFORM   ← ของเรา (Best Solutions) ดูแลลูกค้าทุกร้าน
  platform_admins · payments · audit_logs · plans

ชั้น TENANT     ← ของร้านแต่ละร้าน แยกกันด้วย workspace_id + RLS
  workspaces · memberships

ชั้น DATA       ← ข้อมูลที่ร้านสร้าง ทุกตารางมี workspace_id
  categories · products · orders · order_items · purchases · purchase_items
```

**กฎเดียวที่ห้ามผิด:** ทุกตารางในชั้น DATA มี `workspace_id` และมี RLS policy ที่ผูกกับมัน
ตารางใหม่ที่ไม่มี policy = อุบัติเหตุ ไม่ใช่ TODO (NFR-4)

---

## 1. ชั้น PLATFORM

### `platform_admins`
ใครเข้าหลังบ้านได้ — แยกเป็นตารางเพื่อให้ RLS ตรวจได้ ไม่ใช่ flag ใน user metadata (แก้ยากกว่าและ audit ได้ดีกว่า)

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `user_id` | uuid PK → `auth.users` | |
| `role` | text | `superadmin` \| `support` (ดู matrix ใน admin-backoffice.md) |
| `created_at` `created_by` | | ใครเพิ่มเข้ามา |

### `plans`
แผนราคา — ตอนนี้มีแผนเดียว (149฿/เดือน) แต่แยกตารางไว้เพราะ business plan วางรายปี + tier สูงไว้แล้ว

| คอลัมน์ | หมายเหตุ |
|---|---|
| `code` PK | `monthly_149`, `yearly_1490` (อนาคต) |
| `name_th` `name_en` | |
| `price_satang` | **integer** 14900 = 149฿ (ดูกฎเงินใน CLAUDE.md ข้อ 22) |
| `period_months` | 1 หรือ 12 |
| `is_active` | ปิดแผนเก่าได้โดยไม่ลบ ร้านที่ใช้อยู่ไม่กระทบ |

### `payments`
**ประวัติการจ่ายเงิน** — MVP บันทึกมือหลังลูกค้าโอนผ่าน LINE (business plan §6)
เป็นตารางที่ทำให้ "ร้านนี้จ่ายมาแล้วกี่รอบ" ตอบได้ และเป็นฐานของ MRR ในหน้า dashboard

| คอลัมน์ | หมายเหตุ |
|---|---|
| `id` `workspace_id` | |
| `plan_code` | → `plans` |
| `amount_satang` | ที่เก็บได้จริง (อาจไม่เท่าราคาแผนถ้าให้ส่วนลด) |
| `period_start` `period_end` | รอบที่จ่ายครอบคลุม |
| `method` | `bank_transfer` \| `promptpay` \| `other` |
| `reference` | เลขอ้างอิง/เวลาโอน จากสลิป |
| `slip_path` | รูปสลิปที่ลูกค้าส่งมา (bucket `admin-slips`) |
| `note` | |
| `recorded_by` | platform admin คนที่บันทึก |
| `created_at` | |

> เฟสหลังต่อ payment gateway: เพิ่ม `provider`, `provider_txn_id`, `status` แล้วเขียนแถวอัตโนมัติจาก webhook — โครงเดิมใช้ต่อได้

### `audit_logs`
**ทุกการกระทำของ admin ต้องถูกบันทึก** — ไม่มีข้อยกเว้น
เป็นสิ่งที่ตอบคำถาม "ใครปิดร้านนี้ ตอนไหน เพราะอะไร" ซึ่งจะถูกถามแน่นอนตอนลูกค้าโทรมาบ่น

| คอลัมน์ | หมายเหตุ |
|---|---|
| `actor_user_id` | ใครทำ |
| `actor_kind` | `platform_admin` \| `member` \| `system` |
| `action` | `workspace.suspend`, `payment.record`, `member.role_change`, `workspace.impersonate` … |
| `target_type` `target_id` | |
| `workspace_id` | (nullable) เพื่อกรองดูของร้านเดียว |
| `before` `after` | jsonb — เก็บ snapshot ก่อน/หลัง |
| `reason` | ข้อความที่ admin กรอก (บังคับกรอกตอน suspend) |
| `ip` `user_agent` | |
| `created_at` | |

**append-only** — ไม่มี UPDATE/DELETE policy เลยแม้แต่ superadmin

---

## 2. ชั้น TENANT

### `workspaces`
1 แถว = 1 ร้าน · สมัครครั้งแรกสร้างอัตโนมัติ (FR-0.2)

| คอลัมน์ | หมายเหตุ |
|---|---|
| **ข้อมูลร้าน (FR-1.1)** | |
| `name` `branch` `phone` | |
| `logo_path` | เก็บ path ไม่ใช่ URL (สร้าง URL ตอนอ่าน) |
| **การชำระเงิน (FR-1.2)** | |
| `promptpay_id` | เบอร์มือถือ / เลขบัตร ปชช. / e-wallet |
| `promptpay_type` | `phone` \| `nid` \| `ewallet` — จำเป็นตอน gen QR ตามมาตรฐาน EMVCo |
| **ภาษี (FR-1.3)** | |
| `tax_enabled` | **default false** |
| `tax_rate` | numeric default 7 |
| **ภาษา (FR-1.4)** | |
| `language` | `th` \| `en` default `th` — seed ลง cookie `NEXT_LOCALE` ตอนล็อกอิน |
| **สถานะการใช้งาน (FR-0.4 + ขยาย)** | |
| `subscription_status` | ดู state machine §5 |
| `plan_code` | แผนปัจจุบัน |
| `trial_ends_at` | |
| `current_period_end` | หมดอายุรอบปัจจุบัน |
| `suspended_at` `suspended_by` `suspended_reason` | admin สั่งปิด |
| **ระบบ** | |
| `bill_seq` | **ตัวนับเลขบิล (BR-3)** — ดู §4 |
| `created_at` `updated_at` | |

> ⚠️ `bill_seq` อยู่บน `workspaces` เพื่อให้ล็อกแถวเดียวได้ตอนออกเลขบิล ห้ามคำนวณจาก `MAX()` หรือ `COUNT()`

### `memberships`
ใครเข้าถึงร้านไหนได้ ด้วยสิทธิ์อะไร

| คอลัมน์ | หมายเหตุ |
|---|---|
| `user_id` `workspace_id` | UNIQUE คู่กัน |
| `role` | `owner` \| `manager` \| `staff` — matrix อยู่ใน admin-backoffice.md §2 |
| `invited_by` `invited_at` `accepted_at` | รองรับการเชิญที่ยังไม่ตอบรับ |
| `created_at` | |

> PRD บอกว่าหลายผู้ใช้เป็น "เฟสหลัง" — โครงนี้รองรับไว้แล้วโดยไม่ต้องแก้ schema ทีหลัง
> MVP สร้างแถวเดียว role=`owner` ก็พอ ส่วน UI เชิญสมาชิกค่อยทำ

---

## 3. ชั้น DATA

ทุกตารางมี `workspace_id` เงินทุกคอลัมน์เป็น `numeric(12,2)` (TS คำนวณเป็นสตางค์ — CLAUDE.md ข้อ 22)

### `categories` (FR-2.1)
`workspace_id` · `name` · **`color_index` smallint 1–8** · `sort_order` · `created_at`

> เก็บเลข 1–8 ไม่ใช่ hex — ผูกกับ token `cat-1..8` ใน design system
> ถ้าปล่อยให้เก็บ hex อิสระ สีในแอปจะเละเหมือนที่ mockup เป็น

### `products` (FR-2.2)
`workspace_id` · `category_id` (nullable) · `name` · `description` · `price` · `price_includes_tax` · `image_path` · **`is_archived`** · `created_at` `updated_at`

> **ลบสินค้า = archive ไม่ใช่ DELETE** — BR-4 บอกว่าบิลเก่าต้องไม่เปลี่ยน
> ถึงจะมี snapshot ใน `order_items` อยู่แล้ว แต่ soft delete ทำให้กู้คืนได้และรายงานย้อนหลังไม่พัง

### `orders` (FR-3)
`workspace_id` · `bill_no` (UNIQUE ต่อ workspace) · `ordered_at` · `subtotal` `discount` `tax_amount` `total` · `received` **`change_amount`** · `payment_method` (`cash`\|`promptpay`\|`transfer`) · **`public_token` uuid** · `created_by` · `created_at`

> `change` เป็นคำที่ชนกับ keyword ในบางบริบท → ใช้ `change_amount`
> `public_token` คือสิ่งที่ทำให้ลิงก์บิล public (FR-4.6) ทำงานโดยไม่เปิดตารางให้ anon อ่าน — ดู §6

### `order_items` (BR-4)
`order_id` · `product_id` (**nullable** — instant add หรือสินค้าถูก archive) · **`name_snapshot`** **`price_snapshot`** · `qty` · `line_total` · `sort_order`

> ห้าม resolve บิลเก่าผ่าน join กับ `products` เด็ดขาด

### `purchases` (FR-5)
`workspace_id` · `purchased_at` · `vendor` · `note` · `total` · `slip_path` · `created_by` · `created_at` `updated_at`

### `purchase_items` (FR-5.3)
`purchase_id` · `name` · `qty` · `unit_price` · `line_total` · `sort_order`

---

## 4. ฟังก์ชันฝั่ง Postgres

ตรรกะที่ **ห้ามอยู่ฝั่ง client** เพราะความถูกต้องขึ้นกับการล็อกและ transaction

| ฟังก์ชัน | ทำอะไร | ทำไมต้องอยู่ใน DB |
|---|---|---|
| `allocate_bill_no(ws)` | `SELECT bill_seq FROM workspaces WHERE id=ws FOR UPDATE` → +1 → คืน `DDMMYYYY-NNNNNNNN` | BR-3 · เช็คเอาต์พร้อมกัน 2 เครื่องในร้านเดียวต้องไม่ได้เลขชนกัน |
| `create_order(...)` | insert order + items ใน transaction เดียว พร้อมเรียก `allocate_bill_no` | NFR-7 · เขียนสำเร็จครึ่งเดียวไม่ได้ |
| `create_purchase(...)` | เหมือนกัน | NFR-7 |
| `get_public_receipt(token)` | คืนบิลใบเดียว + หัวร้าน เป็น jsonb | FR-4.6 · ดู §6 |
| `is_member_of(ws)` | | ใช้ในทุก RLS policy |
| `current_role_in(ws)` | คืน owner/manager/staff | |
| `is_platform_admin()` | | |
| `workspace_is_writable(ws)` | true เฉพาะ `trialing` / `active` / `past_due` | **บังคับ gate ที่ DB ไม่ใช่แค่ซ่อนปุ่มใน UI** |

> ข้อสุดท้ายสำคัญ: FR-0.4 บอก "หมด trial แล้วออกบิลใหม่ไม่ได้"
> ถ้าบังคับแค่ใน UI คนที่ยิง API ตรงก็ยังออกบิลได้ ต้องอยู่ใน RLS policy ของ INSERT

---

## 5. สถานะการใช้งาน (state machine)

```
                    admin บันทึกการจ่าย
   trialing ─────────────────────────────────► active
      │                                          │
      │ เลย trial_ends_at                        │ เลย current_period_end
      ▼                                          ▼
   expired ◄──── เลย grace 3 วัน ──────────── past_due
      │                                          │
      └──────── admin บันทึกการจ่าย ─────────────┘
                          │
                          ▼
                       active

   ทุกสถานะ ──► suspended (admin สั่ง + ต้องกรอกเหตุผล)
   suspended ──► คืนสถานะเดิม (admin ปลด)
```

| สถานะ | ออกบิลใหม่ | ดูข้อมูลเดิม | ล็อกอิน |
|---|---|---|---|
| `trialing` | ✓ | ✓ | ✓ |
| `active` | ✓ | ✓ | ✓ |
| `past_due` | ✓ (ผ่อนผัน 3 วัน + banner เตือน) | ✓ | ✓ |
| `expired` | ✗ | ✓ read-only | ✓ |
| `suspended` | ✗ | ✗ (เห็นแค่หน้าแจ้ง + ช่องทางติดต่อ) | ✓ |

> `past_due` ไม่ได้อยู่ใน PRD — เพิ่มเพราะการเก็บเงินเป็น manual ผ่าน LINE
> ลูกค้าโอนวันเสาร์ แต่กว่าเราจะกดยืนยันคือวันจันทร์ ถ้าตัดทันทีที่หมดรอบ ร้านจะขายไม่ได้ 2 วันทั้งที่จ่ายแล้ว

---

## 6. ลิงก์บิล public — FR-4.6 vs NFR-4

**ปัญหา:** ต้องเปิดบิลได้โดยไม่ล็อกอิน แต่ห้ามรั่วข้อมูลร้านอื่น

**❌ วิธีที่ห้ามทำ:** เปิด RLS ให้ role `anon` อ่านตาราง `orders` ได้
ต่อให้กรองด้วย token ก็เสี่ยง เพราะ policy เดียวที่เขียนผิดในอนาคตเปิดข้อมูลทั้งระบบ

**✅ วิธีที่ใช้:** RLS ปฏิเสธ `anon` ทุกตาราง แล้วเปิดทางเดียวผ่าน
`get_public_receipt(token uuid)` แบบ `SECURITY DEFINER` ที่:
- รับ token → คืน **เฉพาะบิลใบนั้น** + หัวร้าน (ชื่อ/โลโก้/สาขา/เบอร์) + รายการ
- ไม่คืน `workspace_id`, ไม่คืนบิลอื่น, ไม่คืนรายการสินค้าของร้าน, ไม่คืน `promptpay_id` ดิบ (QR gen มาแล้วฝังในบิล)
- rate limit ที่ระดับ route

---

## 7. Storage buckets

| bucket | สิทธิ์ | path | ทำไม |
|---|---|---|---|
| `logos` | **public read** | `{workspace_id}/logo.{ext}` | ต้องแสดงบนหน้าบิล public ที่ไม่ล็อกอิน |
| `products` | private · signed URL | `{workspace_id}/{product_id}.{ext}` | เห็นเฉพาะสมาชิกร้าน |
| `slips` | private เข้มงวด | `{workspace_id}/{purchase_id}.{ext}` | สลิปซื้อของ = ข้อมูลการเงิน |
| `admin-slips` | platform admin เท่านั้น | `{workspace_id}/{payment_id}.{ext}` | สลิปที่ลูกค้าโอนค่าบริการ |

ทุก bucket ตั้ง policy ให้ path ขึ้นต้นด้วย `workspace_id` ที่ผู้ใช้เป็นสมาชิกเท่านั้น

---

## 8. สิ่งที่ยังต้องตัดสินใจ

1. **admin เห็นข้อมูลในร้านลูกค้าได้แค่ไหน** — ผมเสนอ: เห็นแค่ metadata (จำนวนบิล, ยอดรวม, วันใช้งานล่าสุด) เพื่อ support ส่วนการเข้าไปดูข้อมูลจริงต้องผ่าน "impersonate" ที่บันทึก audit ทุกครั้ง · เป็นเรื่อง privacy ที่ควรตัดสินก่อนเขียน RLS
2. **ผูก LINE เข้ากับ workspace ไหม** — ถ้าเก็บ LINE user id ไว้ จะติดตามได้ว่าใครทักมาคือร้านไหน และส่งแจ้งเตือนใกล้หมดอายุอัตโนมัติได้ · ต้องแจ้งเรื่อง PDPA
3. **จำนวนสมาชิกต่อร้าน** — จำกัดตามแผนหรือไม่จำกัด
4. **เก็บข้อมูลนานแค่ไหนหลังลูกค้าเลิกใช้** — PDPA ควรมีนโยบายลบ/anonymise
