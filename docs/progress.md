# สถานะโปรเจค

> **อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง** และ **อัปเดตทุกครั้งที่ทำอะไรเสร็จ**
> อัปเดตล่าสุด: 2026-08-06

---

## ตอนนี้อยู่ตรงไหน

แอปแบ่งเป็น 3 ส่วน ทำไปแล้ว 2

| ส่วน | สถานะ |
|---|---|
| **หน้าตา** (design system + หน้าจอ) | ✅ ระบบพร้อม · พอร์ตแล้ว **3 จาก 28 หน้า** (login, signup, reset password) |
| **ฐานข้อมูล** (Supabase) | ✅ ขึ้นจริงแล้ว 12 ตาราง RLS ครบ ทดสอบผ่าน |
| **ระบบทำงาน** (แอปคุยกับ DB) | ✅ **auth ต่อแล้ว** — สมัคร/เข้าสู่ระบบ/ออกจากระบบ ใช้ได้จริง · ฟีเจอร์อื่นยังไม่ได้ต่อ |

เปิด `pnpm dev` แล้วดูได้ที่ `/login`, `/dev/tokens`, `/dev/receipt`

repo: **https://github.com/thanakitpw/linchak-pos** · CI เขียว · local ตรงกับ remote

---

## ขั้นถัดไป (เรียงตามที่ควรทำ)

### 1. หน้าตั้งค่าร้าน (FR-1) ← **งานหลักถัดไป** — **ไม่มี mockup ต้องออกแบบใหม่**
ช่องว่างใหญ่สุดของโปรเจค: เป็นที่ที่ลูกค้าใส่เลข PromptPay
ถ้าไม่มีหน้านี้ ฟีเจอร์หลักของแอป (แนบ QR ในบิล) ใช้ไม่ได้เลย

### 2. หลังบ้าน `/admin`
ตาม `docs/admin-backoffice.md` — **ต้องมาก่อนหน้าจอฟีเจอร์ส่วนใหญ่**
เพราะแผนธุรกิจขายผ่าน LINE แบบรับโอนเอง ถ้าไม่มีหน้ากดเปิดบัญชี ก็รับเงินลูกค้าคนแรกไม่ได้

### 3. หน้าจอที่เหลืออีก 25 หน้า
ตาราง burn-down อยู่ใน `docs/design-system.md` §12

### 4. งานเล็กที่ค้างจากรอบ auth
- ตั้งค่า Site URL + Redirect URLs ใน Dashboard ให้ลิงก์ในอีเมลกลับมาที่ `/auth/confirm`
- หน้าตั้งรหัสผ่านใหม่หลังกดลิงก์จากอีเมล (ตอนนี้มีแค่หน้า "ขอลิงก์")
- ยืนยันอีเมลตอนสมัคร: ตอนนี้ Supabase ตั้งให้ต้องยืนยัน — ตัดสินใจว่าจะเปิดหรือปิด

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
| **Supabase CLI** | login แยกจาก MCP · `pnpm db:types` ต้อง `supabase login` ก่อน | |
| **ลบ user** | membership cascade ไป แต่ **workspace ค้างเป็น orphan** (ไม่ได้ผูกกับ user โดยตรง) | ตั้งใจให้เป็นแบบนี้ (ประวัติการขายไม่ควรหายเพราะลบ login) แต่ยังไม่มีทางโอนความเป็นเจ้าของ — ต้องทำในหน้า `/admin` |

---

## ค้างอยู่ / ยังไม่ตัดสินใจ

**ต้องทำใน Dashboard (ผมทำผ่าน MCP ไม่ได้)**
- เปิด **Leaked Password Protection** — Authentication → Policies (advisor แนะนำ)

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
