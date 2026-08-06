# PRD — "POS" (ออกบิล + ต้นทุน/กำไร สำหรับแม่ค้าออนไลน์ไทย)

> Product Requirements Document v1 · สำหรับพัฒนา · ชื่อ "POS" ชั่วคราว
> Platform: Web App (PWA) responsive **Mobile + Tablet** · Stack: Next.js + Supabase (Postgres/Auth/Storage/RLS)
> รหัสข้อกำหนดใช้ prefix FR-x (functional) / NFR-x (non-functional) เพื่ออ้างอิงตอนแตก story

---

## 1. เป้าหมาย & ตัวชี้วัด

**Vision:** ให้แม่ค้าออนไลน์รายเล็กออกบิลได้ใน 3–4 แตะ, แนบ PromptPay QR ส่งลูกค้าทาง LINE, บันทึกต้นทุน แล้วเห็นกำไรรายเดือนในหน้าเดียว

**Success metrics (เก็บจริงหลัง launch):**
- Activation: ผู้ใช้ใหม่ออกบิลแรกได้ภายใน 10 นาที (เป้า >60%)
- Engagement: จำนวนบิล/ผู้ใช้ที่ active ต่อสัปดาห์
- เข้าหน้า "กำไรรายเดือน" อย่างน้อย 1 ครั้ง/เดือน (เป้า >50% ของ active)
- Conversion trial→paid (เป้า ~15%)
- Retention M1 (เป้า >40%)

---

## 2. Scope

**In scope (MVP):** Auth+multi-tenant, ตั้งค่าร้าน, สินค้า+หมวดหมู่, ออกบิล+ใบเสร็จ+PromptPay QR, บันทึกต้นทุน (แยกรายการ), รายงานยอดขาย + กำไรรายเดือน, i18n ไทย/อังกฤษ

**Out of scope (เฟสหลัง):** สต๊อก/คลัง, promotions, barcode, ร้านออนไลน์, marketplace sync, payment gateway/auto-reconcile, ข้อมูลลูกค้า/สถานะจัดส่ง, เครื่องปริ๊น, export PDF, หลายสาขา, AI insight, n8n automation, offline-sync เต็มรูปแบบ

---

## 3. Personas

- **แม่ค้ามือใหม่ (primary):** ขายผ่าน Facebook/LINE/IG วันละ 5–30 บิล ใช้มือถือ ไม่จด VAT อยากออกบิลสวย + รู้กำไรสิ้นเดือน
- **แม่ค้ามีหน้าร้าน/ออกบูธ (secondary):** ใช้แท็บเล็ตตั้งเคาน์เตอร์ อยากกดออกบิลเร็วแบบ split view
- **เจ้าของหลายร้าน (future):** ต้องหลายผู้ใช้/หลายสาขา (เฟสหลัง)

---

## 4. Information Architecture & Navigation

Bottom nav 4 แท็บ + ⚙️ (ตั้งค่า มุมบนขวา):
```
[ ขาย ]   [ สินค้า ]   [ ต้นทุน ]   [ สรุป ]        ⚙️
```
Flow หลัก: เปิดแอป → (ล็อกอิน) → แท็บ **ขาย** เป็น default → เลือกสินค้า → checkout → ใบเสร็จ → แชร์

---

## 5. Functional Requirements

### FR-0 · Auth & Workspace (Multi-tenant)
- FR-0.1 สมัคร/เข้าสู่ระบบด้วย Supabase Auth (email+password ขั้นต่ำ; social login = future)
- FR-0.2 สมัครครั้งแรก → สร้าง 1 workspace (ร้าน) อัตโนมัติ + membership role=owner
- FR-0.3 ข้อมูลทุกอย่างผูกกับ workspace_id
- FR-0.4 **Trial/subscription state:** สมัครใหม่ได้ trial 7 วัน (trial_ends_at); หมด trial แล้วต้องสมัคร 149฿/เดือนถึงใช้ต่อได้ (gate ฟีเจอร์หลัก, ยังดูข้อมูลเดิม read-only ได้); สถานะ = trialing / active / expired
  - **MVP:** การจ่ายทำ manual ทาง LINE (ลูกค้าโอน → เปิดสถานะ active ด้วยปุ่ม admin) — ยังไม่มี payment gateway ในแอป, ทำระบบจ่ายอัตโนมัติเฟสหลัง
- **AC:** ผู้ใช้เห็นเฉพาะข้อมูล workspace ตัวเอง; เข้าถึงข้อมูล workspace อื่นไม่ได้แม้ยิง API ตรง (บังคับด้วย RLS — ดู NFR-4); หมด trial แล้วออกบิลใหม่ไม่ได้จนกว่าจะจ่าย

### FR-1 · Store Settings (⚙️)
- FR-1.1 แก้ข้อมูลร้าน: ชื่อร้าน, โลโก้ (อัปโหลดรูป), สาขา, เบอร์โทร
- FR-1.2 ตั้งเลข PromptPay (เบอร์มือถือ / เลขบัตร ปชช. / e-wallet id) — ใช้ gen QR
- FR-1.3 VAT: toggle เปิด/ปิด (**default ปิด**) + ช่องอัตรา (default 7%)
- FR-1.4 ภาษา: เลือก ไทย/อังกฤษ (**default ไทย**)
- **AC:** ปิด VAT → ทั้งแอปไม่แสดง element เกี่ยวกับ tax เลย; เปลี่ยนภาษาแล้ว UI เปลี่ยนทันทีทุกหน้า; ไม่ตั้ง PromptPay → ใบเสร็จไม่โชว์ QR จ่ายเงิน (แต่ยังมี QR เปิดบิลได้)

### FR-2 · Products & Categories
- FR-2.1 CRUD หมวดหมู่: ชื่อ + สี (มี default "Uncategorized")
- FR-2.2 CRUD สินค้า: รูป (optional), หมวด, ชื่อ (required), คำอธิบาย (optional), ราคา (required)
- FR-2.3 เมื่อ VAT เปิด → แสดง checkbox "ราคานี้รวมภาษีแล้ว" (price_includes_tax) ต่อสินค้า
- FR-2.4 หน้า list สินค้า: grid รูป+ชื่อ+ราคา, ค้นหา, เรียง, กรองตามหมวด
- FR-2.5 Instant add: โหมดเร็ว กรอกแค่ ชื่อ+ราคา แล้วใช้ในบิลได้ทันที
- **AC:** เพิ่มสินค้าใหม่ปรากฏในหน้าขายทันที; ไม่มี field สต๊อก/barcode; ลบสินค้าแล้วบิลเก่ายังแสดงชื่อ/ราคาเดิม (ดู BR-4 snapshot)

### FR-3 · ขาย (Billing / Order)
- FR-3.1 สร้างบิลใหม่: เพิ่มรายการจาก (ก) แตะสินค้าใน grid (ข) ค้นหา (ค) instant add
- FR-3.2 แต่ละรายการ: ชื่อ, จำนวน (ปุ่ม +/−), ราคา/หน่วย, ยอดรวมรายการ; ลบรายการได้
- FR-3.3 ส่วนลดระดับบิล (จำนวนเงิน ฿)
- FR-3.4 คำนวณสรุป: Subtotal → (VAT ถ้าเปิด) → Discount → **TOTAL** (ดู BR-1, BR-2)
- FR-3.5 ช่องรับเงิน (Received) → คำนวณเงินทอน (Change) อัตโนมัติ (สำหรับเงินสด)
- FR-3.6 เลือกวิธีชำระ: เงินสด / PromptPay / โอน
- FR-3.7 ปุ่ม Checkout → บันทึกบิล (สร้าง order + order_items) → ไปหน้าใบเสร็จ (FR-4)
- FR-3.8 **Layout responsive:** มือถือ = คอลัมน์เดียว (grid ↔ บิล); แท็บเล็ต (≥768px) = split view ซ้าย grid สินค้า / ขวา บิลสด
- **AC:** ยอดรวมอัปเดตทันทีทุกครั้งที่แก้จำนวน/ส่วนลด; checkout แล้วบิลถูกบันทึกและมีเลขบิล (BR-3); บิลว่าง (0 รายการ) กด checkout ไม่ได้

### FR-4 · ใบเสร็จ + PromptPay QR + แชร์
- FR-4.1 หน้าใบเสร็จ: หัวร้าน (โลโก้/ชื่อ/สาขา/เบอร์) + เลขบิล + วันที่-เวลา + รายการ + สรุปยอด + Received/Change (หน้าตาแนวบิลตัวอย่าง)
- FR-4.2 **PromptPay QR ระบุจำนวนเงิน** — gen ในเครื่องจากเลข PromptPay ร้าน + ยอด total (มาตรฐาน EMVCo, lib promptpay-qr) **ไม่ต้องเชื่อม gateway**
- FR-4.3 **QR เปิดบิลออนไลน์** — ชี้ไปลิงก์ใบเสร็จ public
- FR-4.4 render ใบเสร็จ+QR เป็น **รูปเดียว** (QR ฝังในรูป) เพื่อแชร์
- FR-4.5 ปุ่ม: แชร์ (Web Share API → LINE/Facebook) / บันทึกรูป / คัดลอกลิงก์บิล
- FR-4.6 หน้าบิลออนไลน์ (public, เปิดด้วยลิงก์/QR โดยไม่ต้องล็อกอิน) — read-only
- **AC:** QR สแกนด้วยแอปธนาคารแล้วจำนวนเงินขึ้นตรงกับ total; รูปที่แชร์เข้า LINE เห็น QR ในรูปเลย; ลิงก์บิล public เปิดได้โดยไม่ล็อกอินและไม่รั่วข้อมูลร้านอื่น

### FR-5 · ต้นทุน (Cost / Purchases)
- FR-5.1 หน้า list การซื้อ: วันที่, ร้านที่ซื้อ, ยอดรวม (เรียงล่าสุดก่อน)
- FR-5.2 เพิ่ม/แก้บันทึกการซื้อ: วันที่ซื้อ (required), ร้าน/แหล่ง (optional), โน้ต (optional), แนบรูปสลิป (optional)
- FR-5.3 **รายการย่อยแยกได้หลายรายการ:** ชื่อของ, จำนวน, ราคา/หน่วย → ยอดรวมรายการ auto; กด "+ เพิ่มรายการ" ได้ไม่จำกัด
- FR-5.4 ยอดรวมทั้งบิล = auto-sum จากรายการย่อย (แก้เองได้เผื่อกรอกยอดรวมอย่างเดียว)
- **AC:** บันทึกการซื้อในเดือน X ปรากฏในสรุปกำไรเดือน X ทันที; ลบรายการย่อยแล้วยอดรวมอัปเดต

### FR-6 · สรุป (Reports & Monthly Profit)
- FR-6.1 Dashboard บนสุด: ยอดขายวันนี้, ยอดขายเดือนนี้, **กำไรเดือนนี้**
- FR-6.2 รายงาน Daily / Monthly / Custom range → ยอดขายรวม, จำนวนบิล, ส่วนลดรวม
- FR-6.3 **หน้ากำไรรายเดือน (P&L):** เลือกเดือน → ยอดขายรวม − ต้นทุนรวม = **กำไร**, จำนวนบิล, จำนวนครั้งที่ซื้อ, เทียบเดือนก่อน (%)
- FR-6.4 หน้า Orders: รายการบิลทั้งหมด ค้นหา/กรอง, แตะดูใบเสร็จเดิม
- **AC:** กำไรเดือน = Σ(orders.total ในเดือน) − Σ(purchases.total ในเดือน) (ดู BR-5); ตัวเลขตรงกับข้อมูลบิล/การซื้อจริง

---

## 6. Business Rules

- **BR-1 คำนวณบิล (VAT ปิด — default):** subtotal = Σ line_total; total = subtotal − discount
- **BR-2 คำนวณบิล (VAT เปิด):**
  - โหมดบวกเพิ่ม (ราคาไม่รวมภาษี): taxable = subtotal − discount; tax = taxable × rate/100; total = taxable + tax
  - โหมดรวมแล้ว (price_includes_tax): total = subtotal − discount; tax = total − total/(1+rate/100) (แสดงเป็นยอดภาษีที่รวมอยู่)
- **BR-3 เลขบิล:** รูปแบบ `DDMMYYYY-NNNNNNNN` — prefix = วันที่บิล, suffix = running 8 หลัก zero-pad ต่อ workspace (unique ต่อร้าน)
- **BR-4 Snapshot:** order_items เก็บ name_snapshot + price_snapshot ตอนบันทึก → แก้/ลบสินค้าภายหลัง บิลเก่าต้องไม่เปลี่ยน
- **BR-5 กำไรรายเดือน:** = Σ orders.total (ordered_at ในเดือน) − Σ purchases.total (purchased_at ในเดือน) *(เป็นกำไรเงินสดรายเดือน ไม่ใช่ COGS ต่อชิ้น; ถ้าเปิด VAT พิจารณาใช้ยอดก่อนภาษี — mark ไว้เป็น config เฟสหลัง)*
- **BR-6 เงินทอน:** change = received − total (แสดงเฉพาะเมื่อ received ≥ total)

---

## 7. Data Model

```
workspaces     (id, name, logo_url, branch, phone, promptpay_id,
                tax_enabled bool default false, tax_rate numeric default 7,
                language text default 'th',
                trial_ends_at, subscription_status default 'trialing', created_at)
users          (Supabase auth)
memberships    (id, user_id, workspace_id, role)

categories     (id, workspace_id, name, color)
products       (id, workspace_id, category_id, name, description,
                price numeric, price_includes_tax bool default false,
                image_url, created_at)

orders         (id, workspace_id, bill_no, ordered_at,
                subtotal, discount, tax_amount, total,
                received, change, payment_method, created_at)
order_items    (id, order_id, product_id nullable, name_snapshot,
                price_snapshot, qty, line_total)

purchases      (id, workspace_id, purchased_at, vendor, note,
                total, slip_url, created_at)
purchase_items (id, purchase_id, name, qty, unit_price, line_total)
```
Relationships: workspace 1—* ทุกตาราง; order 1—* order_items; purchase 1—* purchase_items; product 1—* order_items (nullable เมื่อ instant add / สินค้าถูกลบ)

---

## 8. Non-Functional Requirements

- **NFR-1 Responsive:** รองรับ Mobile (~360–430px) และ Tablet (≥768px, แนวตั้ง+แนวนอน); ปุ่ม touch target ≥44px; หน้าขายเปลี่ยนเป็น split view บนแท็บเล็ต
- **NFR-2 i18n:** ทุกข้อความผ่านระบบแปล (next-intl/react-i18next), ไทย default + อังกฤษ; ห้าม hardcode string; เงิน = THB 2 ตำแหน่งทศนิยม; วันที่รูปแบบไทย
- **NFR-3 Performance:** โหลดครั้งแรก < 3 วิ บน 4G; interaction บนหน้าขาย (เพิ่ม/แก้รายการ) ตอบสนองทันที (optimistic UI)
- **NFR-4 Security (สำคัญ):** Supabase **RLS ทุกตาราง** แยกตาม workspace_id; auth บังคับทุก endpoint; ลิงก์บิล public เห็นเฉพาะบิลนั้น ไม่รั่วข้อมูลร้าน; รูป (โลโก้/สลิป) ควบคุมสิทธิ์เข้าถึง
- **NFR-5 PWA:** ติดตั้งลงหน้าจอได้; แสดงข้อมูลที่ cache ได้เมื่อเน็ตหลุด (offline-lite; full offline-sync = เฟสหลัง)
- **NFR-6 Browser:** Safari/Chrome รุ่นใหม่บน iOS/Android/iPadOS
- **NFR-7 Reliability:** การบันทึกบิล/การซื้อต้อง atomic (order + items สำเร็จพร้อมกัน)

---

## 9. Technical Architecture

- **Frontend:** Next.js (React) เป็น PWA, Tailwind + shadcn/ui, responsive breakpoints, i18n layer
- **Backend/DB:** Supabase — Postgres + Auth + Storage (โลโก้/รูปสินค้า/สลิป) + RLS
- **PromptPay QR:** promptpay-qr (client-side, EMVCo)
- **Receipt→image:** html-to-image / canvas สำหรับ render บิล+QR เป็นรูปเดียว; Web Share API สำหรับแชร์
- **รายงาน:** SQL aggregation / Postgres views ต่อ workspace+ช่วงเวลา
- **Hosting:** Vercel + Supabase cloud หรือ self-host บน VPS เดิม (Docker/Nginx/Cloudflare)

---

## 10. Release Plan (แมพกับ 9 กลุ่ม task ในแผนพัฒนา)

| เฟส | ครอบคลุม | ผลลัพธ์ |
|---|---|---|
| **P1 (สัปดาห์ 1)** | FR-0, FR-1, FR-2, NFR-2, NFR-4 | ล็อกอิน+ร้าน+สินค้า+i18n+RLS |
| **P2 (สัปดาห์ 2)** | FR-3, FR-4, NFR-1 | ออกบิล+ใบเสร็จ+PromptPay+split view |
| **P3 (สัปดาห์ 3)** | FR-5, FR-6, NFR-5 | ต้นทุน+รายงาน+กำไรรายเดือน+PWA+deploy |

---

## 11. Resolved Decisions (ยืนยันแล้ว)

- ✅ ทุกบิล = "จ่ายแล้ว" ไม่มี unpaid workflow ใน MVP
- ✅ ยืนยันการจ่าย PromptPay แบบ manual (ร้านเช็คเงินเข้าเอง) — ไม่มี auto-confirm ใน MVP
- ✅ เลขบิล running ต่อเนื่องต่อร้าน (ไม่ reset รายวัน)
- ✅ กำไรรายเดือนใช้ยอด total (VAT default ปิด จึงไม่กระทบ)
