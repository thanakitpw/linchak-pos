# สถานะโปรเจค

> **อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง** และ **อัปเดตทุกครั้งที่ทำอะไรเสร็จ**
> อัปเดตล่าสุด: 2026-08-06

---

## ตอนนี้อยู่ตรงไหน

แอปแบ่งเป็น 3 ส่วน ทำไปแล้ว 2

| ส่วน | สถานะ |
|---|---|
| **หน้าตา** (design system + หน้าจอ) | ✅ **6 หน้าใช้งานได้** — login, signup, reset password, ตั้งค่าร้าน, `/admin`, `/admin/stores/[id]` |
| **ฐานข้อมูล** (Supabase) | ✅ 12 ตาราง RLS ครบ + ฟังก์ชันหลังบ้าน · ทดสอบผ่าน |
| **ระบบทำงาน** (แอปคุยกับ DB) | ✅ **auth ใช้งานได้จริงแล้ว** — สมัครผ่านหน้าเว็บ → สร้างร้าน+owner อัตโนมัติ → เข้าระบบ → เห็นข้อมูลร้านผ่าน RLS (ยืนยันด้วยบัญชีจริงแล้ว) · ฟีเจอร์อื่นยังไม่ได้ต่อ |

เปิด `pnpm dev` แล้วดูได้ที่ `/login`, `/dev/tokens`, `/dev/receipt`

repo: **https://github.com/thanakitpw/linchak-pos** · CI เขียว · local ตรงกับ remote

---

## ขั้นถัดไป (เรียงตามที่ควรทำ)

### 1. หน้าขาย (FR-3) ← **งานหลักถัดไป**
mockup: `mobile_12` + `tablet_split_view` · เป็นหน้าที่ผู้ใช้อยู่นานที่สุด
DB พร้อมแล้ว (`create_order` atomic + เลขบิลล็อกแถว) เหลือแค่ UI

### 2. ใบเสร็จ + PromptPay QR (FR-4)
ต่อจากหน้าขาย · `/dev/receipt` พิสูจน์การ render เป็นรูปไว้แล้ว
`promptpay.ts` พร้อมใช้ · เหลือหน้าบิล public `/r/[token]` ที่ยัง 404
ตาม `docs/admin-backoffice.md` — **ต้องมาก่อนหน้าจอฟีเจอร์ส่วนใหญ่**
เพราะแผนธุรกิจขายผ่าน LINE แบบรับโอนเอง ถ้าไม่มีหน้ากดเปิดบัญชี ก็รับเงินลูกค้าคนแรกไม่ได้

### 3. หน้าจอที่เหลืออีก 23 หน้า
ตาราง burn-down อยู่ใน `docs/design-system.md` §12

### 4. งานเล็กที่ค้าง
- หน้าตั้งรหัสผ่านใหม่หลังกดลิงก์จากอีเมล (ตอนนี้มีแค่หน้า "ขอลิงก์")
- **เปิด Confirm email กลับ + ต่อ SMTP ก่อนขึ้นจริง** (ดูหัวข้อ "ค้างอยู่" ด้านล่าง)

---

## ทำอะไรไปแล้วบ้าง

### เฟส 1 · Foundation (commit `ed4eca2` → `3be9250`)

| | |
|---|---|
| **Scaffold** | Next.js 16.3 · React 19.2 · Tailwind v4.3 · TypeScript · pnpm |
| **Design token** | `src/styles/theme.css` เป็น source of truth เดียว — 52 สี, type 8 ขั้น, radius 4/8/12/16/24, shadow 5 ตัว, layout token |
| **ฟอนต์/ไอคอน** | IBM Plex Sans Thai ตัวเดียว (มี Latin ครบในตัว) · Material Symbols subset **42 ไอคอน = 7,560 B** |
| **i18n** | next-intl **ไม่มี locale ใน URL** อ่านจาก cookie `NEXT_LOCALE` |
| **เงิน** | `src/lib/money.ts` — integer สตางค์ + branded type · BR-1/2/5/6 ครบ · **24 unit test ผ่าน** |
| **หน้าพิสูจน์** | `/dev/tokens` (contrast คำนวณสด + overlay ทับ mockup), `/dev/receipt`, `/dev/mockup/[id]` |
| **Guard** | `scripts/check-tokens.mjs` 11 กฎ + ESLint `no-unknown-classes` + Prettier + GitHub Actions CI |
| **เอกสาร** | `CLAUDE.md` (34 กฎ) · `docs/design-system.md` (migration table T1/T2/T3) |
| **หน้าจอ** | พอร์ต `/login` (mobile_1 + tablet_2) + `<Button>` `<Input>` canonical |

### เฟส 2 · ออกแบบข้อมูล + หลังบ้าน (commit `8f5302a`)

- `docs/data-model.md` — Supabase เก็บอะไร 3 ชั้น (platform / tenant / data)
- `docs/admin-backoffice.md` — แยก "หลังบ้านของเรา" กับ "สิทธิ์ในร้าน" ให้ชัด + role matrix

### เฟส 3 · Supabase setup (commit `f43d430`, `1d2ba43`)

- MCP server + agent skills (`supabase`, `supabase-postgres-best-practices`)
- `.env.local` มี URL + publishable key แล้ว · **ไม่ใช้ secret key** (เหตุผลใน `docs/data-model.md` §9)

### เฟส 4 · Database ขึ้นจริง (commit `9853bad`)

**12 ตาราง · RLS เปิดครบ 12/12 · security advisor เขียว · performance advisor ไม่มี WARN**

migration 7 ไฟล์อยู่ใน `supabase/migrations/` ตรงกับที่ deploy บนโปรเจคจริง

3 อย่างที่บังคับที่ระดับ DB ไม่ใช่ที่ UI:

| เรื่อง | กลไก | ผลทดสอบ |
|---|---|---|
| เลขบิล (BR-3) | `app.allocate_bill_no()` ล็อกแถว workspace | ออก 200 ใบ ไม่ซ้ำ ไม่ข้าม |
| หมด trial ออกบิลไม่ได้ (FR-0.4) | `app.workspace_is_writable()` ใน INSERT policy | ร้านหมด trial → เขียนไม่ได้ |
| ลิงก์บิล public (FR-4.6) | `get_public_receipt(token)` แทนการเปิด RLS ให้ anon | anon อ่าน 4 ตารางได้ 0 แถว แต่ token เปิดบิลได้ 1 ใบ |

ทดสอบเพิ่ม: สมัคร → สร้างร้าน+owner อัตโนมัติ ✓ · RLS แยกร้าน (A เห็น 1 จาก 2) ✓ · staff ไม่เห็นเงิน ✓
### เฟส 5 · Auth ต่อกับแอป

- `@supabase/ssr` — client ฝั่ง browser / server / proxy แยกกัน 3 ไฟล์ใน `src/lib/supabase/`
- `src/proxy.ts` รีเฟรช session ทุก request + กันหน้าที่ต้องล็อกอิน (**Next 16 เรียก Proxy ไม่ใช่ Middleware**)
- server action `signIn` / `signUp` / `requestPasswordReset` / `signOut`
- พอร์ตหน้า signup + reset password (เดิมเป็น stub) · แยก `<AuthShell>` `<AuthForm>` ใช้ร่วมกัน 3 หน้า
- seed cookie `NEXT_LOCALE` จาก `workspaces.language` หลังล็อกอิน (FR-1.4)
- ถอดปุ่ม Google ออกจากหน้า login — FR-0.1 บอกว่า social login เป็นเฟสหลัง ดีกว่าโชว์ปุ่มที่กดไม่ได้

**ทดสอบครบวงจรแล้ว:** ยังไม่ล็อกอิน → `/` เด้ง `/login` (307) · ล็อกอินได้ token · token อ่าน workspaces ผ่าน RLS เห็นแค่ร้านตัวเอง · ใส่ session cookie แล้วเปิด `/` เห็นชื่อร้าน สถานะ trial และอีเมลตัวเอง

**ยืนยันด้วยบัญชีจริงแล้ว** (2026-08-06): สมัครผ่านหน้าเว็บ → ได้ร้าน "ร้านเทส" สถานะ trialing หมด trial 13 ส.ค. 2026 (7 วันพอดี) แผน monthly_149 ภาษา th VAT ปิด สิทธิ์ owner · วันที่แสดงเป็น **ค.ศ. 2026 ไม่ใช่ พ.ศ. 2569** ยืนยันว่า `th-TH-u-ca-gregory` ทำงานถูก

### เฟส 6 · หน้าตั้งค่าร้าน (FR-1)

**หน้าแรกที่ออกแบบเองทั้งหมด** — ไม่มี mockup ใน `pos_design/` ใช้ token จาก design system ล้วน

- 4 หัวข้อแยกฟอร์มกัน (ข้อมูลร้าน · PromptPay · VAT · ภาษา) — แม่ค้ามักเข้ามาแก้เรื่องเดียว
  ฟอร์มเดียวทั้งหน้าทำให้กดบันทึกแล้วส่งทุกอย่างขึ้นไปใหม่โดยไม่ตั้งใจ
- **QR ตัวอย่างสดขณะพิมพ์เลข PromptPay** — เป็นวิธีเดียวที่แม่ค้าจะรู้ว่าเลขถูกก่อนออกบิลจริง
  สร้างในเบราว์เซอร์ล้วน วาดลง canvas ไม่ส่งเลขไปไหน
- `src/lib/promptpay.ts` + **14 unit test** — validate ความยาวตามชนิด, กันเบอร์บ้าน (ต้องขึ้นต้น 06/08/09),
  ตรวจ payload EMVCo รวม checksum CRC
- VAT ปิดอยู่ = **ซ่อนช่องอัตราไปเลย ไม่ใช่ disable** (กฎ 24)
- อัปโหลดโลโก้เข้า bucket `logos` path `{workspace_id}/logo.ext` ตาม storage policy
- เปลี่ยนภาษาแล้วอัปเดตทั้ง DB และ cookie — ไม่งั้นเปลี่ยนแล้วหน้าไม่เปลี่ยน (FR-1.4)
- `<Switch>` เขียนบน checkbox จริง (ส่งค่าไปกับ form ได้เอง) · `<Select>` ใช้ native (มือถือได้ picker ของ OS)

**ทดสอบแล้ว:** ยังไม่ล็อกอิน `/settings` เด้งไป login พร้อม `?next=/settings` · **staff พยายามแก้ชื่อร้าน+เลข PromptPay ได้ 0 แถว** ชื่อร้านไม่เปลี่ยน — RLS กันที่ DB ไม่ใช่แค่ซ่อนปุ่ม

### เฟส 7 · หลังบ้าน /admin

- `/admin` ภาพรวม (MRR, จำนวนร้านแยกสถานะ, กลุ่มที่ต้องลงมือ) + รายชื่อร้าน ค้นหา/กรองผ่าน URL
- `/admin/stores/[id]` รายละเอียด + สมาชิก + ประวัติการจ่าย + audit
- **บันทึกการชำระ → ต่ออายุอัตโนมัติ** ในทรานแซกชันเดียว · ใช้ `greatest(period_end, now())`
  เพื่อให้จ่ายก่อนหมดอายุแล้วไม่เสียวันที่เหลือ
- **ระงับ/ปลดระงับ บังคับกรอกเหตุผล** ทั้งฝั่ง UI และ DB
- ตั้ง `thanakitpw@gmail.com` เป็น superadmin คนแรก

**ทดสอบแล้ว:** ผู้ใช้ธรรมดาเรียก `admin_dashboard_stats()` → DB ปฏิเสธ (42501) ·
จ่าย 149 → สถานะเป็น `active` หมดอายุ +1 เดือน audit บันทึกว่าใครทำและเพราะอะไร ·
ระงับโดยไม่ใส่เหตุผล → DB ปฏิเสธ

⚠️ **ยังไม่ทำ:** impersonate (เข้าไปดูในมุมของร้าน) · หน้าจัดการ platform admin (เพิ่มผ่าน SQL ไปก่อน)


---

## กับดักที่เจอมาแล้ว — อย่าเสียเวลาซ้ำ

| เรื่อง | สิ่งที่เกิด | ทางแก้ |
|---|---|---|
| **วันที่ไทย** | locale `th-TH` ใช้ปฏิทินพุทธ ปี 2026 กลายเป็น **2569** ซึ่งไม่ตรงกับ mockup สักใบ | pin `th-TH-u-ca-gregory` · ใช้ helper ใน `src/lib/format.ts` เท่านั้น |
| **`@theme` ธรรมดา** | tree-shake ตัวแปรที่ไม่มี utility อ้างถึง → 30 จาก 57 สีหายจาก `:root` หน้า swatch เลยว่าง | ใช้ `@theme static` เพราะ inline style กับ `getComputedStyle` scanner มองไม่เห็น |
| **Tailwind สแกน mockup** | ถ้าไม่มี `source("../")` มันจะสแกน `pos_design/*.html` แล้ว emit class ที่ตายไปแล้ว ทำให้ lint จับความผิดพลาดไม่ได้ | บรรทัด `@import "tailwindcss" source("../")` ใน `globals.css` **ห้ามลบ** |
| **dynamic class** | `text-${step}` ไม่ถูก Tailwind detect จะไม่ถูก generate | เขียน class เต็มไว้ใน lookup table |
| **`typedRoutes`** | `<Link>` ชี้ไปหน้าที่ยังไม่พอร์ต = build error | ใช้ `<NotPortedYet mockup="…"/>` เป็น stub |
| **`LayoutProps` / `RouteContext`** | Next generate type พวกนี้ตอน build เก็บใน `.next/` ซึ่ง gitignore ไว้ → CI เช็คเอาต์ใหม่แล้ว `tsc` พัง ทั้งที่เครื่องเราผ่าน (เพราะเคย build) | `typecheck` รัน `next typegen` ก่อนเสมอ · ทดสอบด้วยการ `rm -rf .next` แล้วรัน verify ทั้งชุด |
| **push ไฟล์ workflow** | token GitHub ต้องมี scope `workflow` ไม่ใช่แค่ `repo` ไม่งั้น push `.github/workflows/*` ไม่ได้ | `gh auth refresh -h github.com -s workflow` |
| **สร้าง user ด้วย SQL** | ล็อกอินไม่ได้ ขึ้น `Database error querying schema` — เพราะ GoTrue อ่านคอลัมน์ token ที่เป็น `NULL` เข้า Go string ไม่ได้ | ต้อง set `confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new` ฯลฯ เป็น `''` ไม่ใช่ NULL · ปกติควรสมัครผ่าน Auth API ไม่ใช่ SQL |
| **อีเมลทดสอบ** | Supabase ปฏิเสธโดเมน `.local` และ `example.com` (`email_address_invalid`) | ใช้โดเมนที่ดูจริง หรือสร้าง user ผ่าน SQL ถ้าไม่อยากให้ส่งอีเมลออก |
| **`redirect()` กับ typedRoutes** | รับ string ที่คำนวณตอน runtime ไม่ได้ | cast `as Route` **แต่ต้องกรอง open redirect เองก่อน** (ขึ้นต้น `/` และไม่ใช่ `//`) — type ไม่ได้ให้ความปลอดภัย |
| **`setState` ใน `useEffect`** | ESLint (react-hooks) ฟ้อง — เจอ 2 ครั้งแล้ว (swatch, QR preview) | ถ้าเป็นการ "วัด/วาดลง DOM" ให้ใช้ callback ref หรือ effect ที่เขียนลง canvas ตรงๆ · ถ้าคำนวณได้จาก props ให้ใช้ `useMemo` |
| **guard `dark:` false positive** | ฟ้อง `{ dark: "#121c28" }` ที่เป็น option ของ qrcode | แก้ regex เป็น `dark:(?=\S)` — Tailwind variant ไม่มีช่องว่างหลัง colon แต่ object key ของ JS มี |
| **Supabase CLI** | login แยกจาก MCP · `pnpm db:types` ต้อง `supabase login` ก่อน | |
| **ลบ user** | membership cascade ไป แต่ **workspace ค้างเป็น orphan** (ไม่ได้ผูกกับ user โดยตรง) | ตั้งใจให้เป็นแบบนี้ (ประวัติการขายไม่ควรหายเพราะลบ login) แต่ยังไม่มีทางโอนความเป็นเจ้าของ — ต้องทำในหน้า `/admin` |

---

## ค้างอยู่ / ยังไม่ตัดสินใจ

**ต้องทำใน Dashboard (ผมทำผ่าน MCP ไม่ได้)**
- ~~เปิด **Leaked Password Protection**~~ — **ทำไม่ได้บน free tier** (Pro plan ขึ้นไปเท่านั้น)
  security advisor จะแนะนำเรื่องนี้ตลอด — ข้ามไปก่อน ไว้อัปเกรดแผนแล้วค่อยเปิด
- ตั้ง **Minimum password length = 8** ให้ตรงกับที่ฟอร์มบังคับ (default ของ Supabase คือ 6)
  ไม่งั้นคนที่ยิง API ตรงจะตั้งรหัส 6 ตัวได้ทั้งที่ UI บอก 8
- ⚠️ **ปิด Confirm email ไว้ชั่วคราวเพื่อความสะดวกตอนพัฒนา** (Authentication → Providers → Email)
  **ต้องเปิดกลับก่อนขึ้นจริง** ไม่งั้นใครก็สมัครด้วยอีเมลคนอื่นได้

- 🚨 **ต่อ SMTP เองก่อนเปิดจริง — เป็นตัวบล็อกการเปิดตัว ไม่ใช่ของแต่ง**
  SMTP ของ Supabase **ส่งได้เฉพาะอีเมลของทีมในโปรเจค** และจำกัด **2 ฉบับ/ชม. ทั้งโปรเจค**
  ไม่มี SLA · เอกสารระบุชัดว่าไม่ได้มีไว้ใช้จริง
  ⇒ ถ้าไม่ต่อ SMTP เอง **ลูกค้าจริงจะไม่ได้รับอีเมลเลย** (ไม่ใช่ช้า — ส่งไม่ออก)

  แผนธุรกิจวาง **Resend** ไว้แล้ว (business-plan §7.2 "Email free tier 0฿")
  free tier = 3,000 ฉบับ/เดือน (100/วัน) · เทียบกับเป้า M24 ที่ต้องใช้ ~400 ฉบับ/เดือน
  ⇒ free tier พอถึงหลังปีที่ 2 ตรงตามที่แผนตั้งไว้
  ตั้งค่าที่ Authentication → SMTP Settings (งานประมาณ 15 นาที)
- ตั้ง **Site URL** = `http://localhost:3000` และ **Redirect URLs** = `http://localhost:3000/auth/confirm`
  (Authentication → URL Configuration) · ตอน deploy เพิ่มโดเมนจริง

**ยังไม่ทดสอบบนของจริง**
- `pb-safe` บน iPhone Safari เครื่องจริง (simulator รายงาน safe-area ผิด)
- Lighthouse mobile 4G → บันทึกเป็น baseline NFR-3

**warning ที่ยอมรับแล้ว ไม่ใช่บั๊ก**
- `get_public_receipt` เป็น SECURITY DEFINER ที่ `anon` เรียกได้ — **ตั้งใจ** ตาม FR-4.6 (เหตุผลใน `supabase/README.md`)

**คำถามที่ยังไม่ตอบ** — `docs/data-model.md` §10 และ `docs/admin-backoffice.md` §4
- admin เห็นข้อมูลลูกค้าได้แค่ไหนโดยไม่ impersonate
- ผูก LINE เข้ากับ workspace ไหม (ส่งเตือนใกล้หมดอายุอัตโนมัติได้ แต่มี PDPA)
- ปุ่ม Google ในหน้า login ขัดกับ FR-0.1 ที่บอกว่า social login เป็นเฟสหลัง — เก็บหรือถอด
- `staff` ควรเห็นยอดรวมของวันไหม (ตอนนี้ตั้งเป็นไม่เห็น)
