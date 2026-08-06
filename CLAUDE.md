@AGENTS.md

# POS — คู่มือสำหรับ agent

แอปออกบิล (PWA) สำหรับแม่ค้าออนไลน์ไทย · เลือกสินค้า → บิลสด → checkout → ใบเสร็จ + PromptPay QR แชร์เข้า LINE · บันทึกต้นทุน → กำไรรายเดือน
สเปคเต็ม: `docs/pos-prd.md` (FR-0…FR-6, BR-1…BR-6, NFR-1…NFR-7) · เฟสปัจจุบัน: **foundation เสร็จแล้ว ยังไม่มีหน้าจอฟีเจอร์**

## Stack

| | |
|---|---|
| Next.js 16.3 (App Router, Turbopack) · React 19.2 · TypeScript | pnpm 10 |
| Tailwind **v4** — `@theme` ใน CSS ไม่มี `tailwind.config.js` | shadcn/ui (new-york) |
| next-intl 4 — **ไม่มี locale ใน URL** | IBM Plex Sans Thai + Material Symbols (subset) |
| Supabase (Postgres/Auth/Storage/RLS) — **ยังไม่ติดตั้ง** เข้ามาที่ P1 | Vercel |

`tw-animate-css` ไม่ใช่ `tailwindcss-animate` — ตัวหลังเป็น plugin v3 ใช้กับ v4 ไม่ได้ Radix component จะเสียแอนิเมชัน

## คำสั่ง

```
pnpm dev            เปิด dev server
pnpm verify         lint → lint:tokens → icons:check → typecheck → test → build (รันก่อน commit)
pnpm lint           ESLint — จับ class ที่ไม่มีอยู่จริง + lucide ที่หลุดออกนอก ui/
pnpm lint:tokens    guard นโยบาย — arbitrary value, ghost token, ข้อความไทย hardcode
pnpm icons:build    สร้าง icon font subset ใหม่จาก ICON_NAMES
pnpm format         Prettier (เรียง Tailwind class ให้เป็นระเบียบเดียว)
```

## แผนที่ repo

```
SOURCE      src/            โค้ดแอป
            docs/design-system.md    ← กฎ design system + migration table (สำคัญที่สุด)
REFERENCE   pos_design/     mockup 28 ไฟล์ — อ่านอย่างเดียว ไม่เคยถูก import/build
            docs/pos-prd.md, docs/pos-business-plan.md
GENERATED   AGENTS.md       Next.js เขียนทับทุกครั้งที่รัน `next dev` — ห้ามแก้มือ
            src/assets/fonts/*.woff2   สร้างจาก pnpm icons:build (commit ไว้ CI เช็ค hash)
```

## กฎเหล็ก

1. **`pos_design/` คือ REFERENCE ไม่ใช่ SOURCE** — ห้าม import ห้าม copy ยกก้อน อ่านเพื่อดู layout/ลำดับชั้น แล้วเขียน markup ใหม่ด้วย token ปัจจุบัน
2. **เทียบกับ `screen.png` ไม่ใช่ `code.html`** — PNG คือสิ่งที่ถูกอนุมัติ ส่วน HTML เป็นขยะจาก Stitch (มีคำขยะ `flat no shadows docked full-width` ใน class, `<link>` ซ้ำ, input 40 แบบใน 50 ช่อง)
3. **`pos_design/verdant_growth/DESIGN.md` STALE** — สเกล radius ในนั้นเพี้ยนไป 1 ขั้นเต็มจากที่ mockup render จริง และ prose ระบุสีที่ไม่มีในระบบ · `docs/design-system.md` แทนที่ทั้งหมด
4. **ห้าม arbitrary value กับอะไรก็ตามที่ design system เป็นเจ้าของ** — `shadow-[…]`, `bg-[#…]`, `rounded-[…]`, `text-[13px]` ถ้าต้องการค่าใหม่ให้เพิ่ม token ใน `theme.css` แล้วบันทึกเหตุผลใน `docs/design-system.md`

### สี — กับดัก contrast ที่ต้องจำ

5. **`bg-primary-container` (`#2bb14f`) ห้ามใส่ตัวหนังสือขาวเด็ดขาด** = 2.80:1 ตก WCAG AA (mockup ทำแบบนี้ใน 9 ไฟล์ — เป็นบั๊ก) · foreground เดียวที่ถูกต้องคือ `on-primary-container` (`#003c13`, 4.53:1)
6. **ปุ่ม CTA = `bg-primary` (`#006e29`) + `text-on-primary`** (6.44:1) · `#2bb14f` เป็นสี selected/accent เท่านั้น: แท็บ active, chip ที่เลือก, badge
7. **กับดักเดียวกันที่ `tertiary-container`** (`#939d97`) — ขาวบนมัน = 2.80:1 ใช้ `on-tertiary-container` เท่านั้น
8. **`outline-variant` (`#bdcab9`) เป็นสีเส้น ไม่ใช่สีข้อความ** (1.71:1) · placeholder ใช้ `placeholder:text-placeholder` · `outline` (`#6e7b6b`) ใช้กับเส้นและไอคอนตกแต่ง ไม่ผ่าน AA สำหรับข้อความ
9. บน chip เขียวอ่อน (`secondary-container`) เลือก `on-secondary-fixed-variant` (7.27:1) ดีกว่า `on-secondary-container` (4.56:1 เฉียดมาก)

### Design token

10. **spacing มีคำศัพท์ชุดเดียว: เลข Tailwind** — `p-4` = 16px · ไม่มี `px-md` / `gap-gutter` / `p-container-margin` (mockup ใช้ปนกันสองชุดจนกลายเป็นแหล่ง divergence) · ชื่อมีเฉพาะขนาดที่เข้ารหัสการตัดสินใจ: `h-app-bar`, `bottom-fab`, `min-h-touch`, `max-w-bill-pane`
11. **ไม่มี type token ลงท้าย `-mobile`** — responsive เขียน `text-title-lg md:text-headline-md` · ghost token (`title-lg-mobile`, `headline-md-mobile`, `h2`, `label`, `label-md`) ตายหมดแล้ว
12. **ห้ามเขียน class `font-<step>`** เช่น `font-body-md` — ใน mockup มันเป็น family alias ที่ไม่ทำอะไรเลย ~800 จุด · family มาจาก `<body>` · น้ำหนักฟอนต์มากับ `text-<step>` อยู่แล้ว และ `font-bold` override ได้ตามปกติ
13. **radius**: `xs 4` badge/มุมแท่งกราฟ · `sm 8` input/ปุ่มรอง · `md 12` card/KPI/product tile · `lg 16` FAB/modal/sheet · `full` ปุ่ม CTA/chip/stepper/avatar
14. **shadow**: `card` (list/product) · `raised` (sticky bar/FAB) · `nav` (bottom nav เงาพุ่งขึ้น) · `overlay` (modal/sheet) · `primary` (CTA glow)
15. **ห้ามใช้ `dark:`** — MVP เป็น light-only และ `dark` variant ถูก scope ไว้ที่ `.dark` ซึ่งไม่มีอะไร set · `dark:` คือโค้ดตายที่โกหกว่าผ่านการทดสอบแล้ว
16. **ห้ามรัน `shadcn init`** — มันเขียนทับ `--radius-*` ของเรา (8/12/16/24 → 6/8/10/14) ใช้แค่ `shadcn add <component>`
17. **`lucide-react` ใช้ได้เฉพาะภายใน `src/components/ui/`** (shadcn primitive import เองภายใน) ไอคอนของแอปทุกตัวผ่าน `<Icon name="…"/>`

### i18n

18. **ห้าม hardcode ข้อความที่ผู้ใช้เห็น** รวม `aria-label`, `placeholder`, `alt`, `title`, ข้อความ toast, ข้อความ validation · อักษรไทยนอก `src/messages/**` ทำให้ `pnpm lint:tokens` แดง
19. **`th` เป็น source locale** — เขียน copy ใน `th.json` ก่อน แล้ว `en.json` mirror key ให้ครบ
20. **ภาษาไม่อยู่ใน URL** — อ่านจาก cookie `NEXT_LOCALE` ที่ seed มาจาก `workspaces.language` (FR-1.4 ภาษาเป็น setting ของร้าน) ห้ามเพิ่ม next-intl middleware — จะไปชนกับ middleware ของ Supabase ตอน P1
21. **วันที่ภาษาไทยต้อง pin `th-TH-u-ca-gregory`** — locale `th-TH` เฉยๆ ใช้ปฏิทินพุทธ ปี 2026 จะกลายเป็น 2569 ซึ่งไม่ตรงกับ mockup สักใบ · ใช้ helper ใน `src/lib/format.ts` เท่านั้น

### เงินและตัวเลข

22. **เลขเงินทุกตัวเป็นจำนวนเต็มสตางค์** — 1 บาท = 100 สตางค์ · แปลงที่ขอบ input → คำนวณเป็นสตางค์ → format ที่ขอบ render · DB เป็น `numeric(12,2)` · `src/lib/money.ts` เป็นเจ้าของการแปลงทั้งสองทาง · `Satang` เป็น branded type ตัวเลขราคาดิบข้าม module ไม่ได้ · `0.1 + 0.2` ห้ามแตะราคาเด็ดขาด
23. **VAT ปัดครึ่งขึ้นที่สตางค์ และคิดที่ระดับบิลครั้งเดียว ไม่ใช่รายบรรทัด** (BR-2) — คิดรายบรรทัดแล้วรวมจะคลาดจากยอดที่ลูกค้าคำนวณเองบนใบเสร็จ
24. **VAT ปิดเป็นค่าเริ่มต้น (FR-1.3) และเมื่อปิดต้องไม่ render element ภาษีใดๆ เลย** — ไม่ใช่แถวที่เป็นศูนย์ ไม่ใช่แถวที่ซ่อน · แตกที่ระดับ component ตาม `workspace.tax_enabled`
25. **ทุกคอลัมน์เงิน ยอดรวม และตัวนับใน stepper ต้องมี `tnum`** ไม่งั้นตัวเลขเต้นตอนอัปเดต · format ผ่าน `formatTHB()` เท่านั้น

### ข้อมูลและความปลอดภัย (ยังไม่ implement — กฎล่วงหน้าสำหรับ P1)

26. **RLS ทุกตาราง scope ด้วย `workspace_id` ไม่มีข้อยกเว้น** (NFR-4) · ห้ามมี `service_role` ในฝั่ง browser · ตารางใหม่ที่ไม่มี policy คืออุบัติเหตุ ไม่ใช่ TODO
27. **เลขบิล (`DDMMYYYY-NNNNNNNN`, BR-3) จัดสรรด้วย Postgres function ภายใต้ row lock ต่อ workspace ใน transaction เดียวกับที่ insert order** — ห้าม `MAX(bill_no)+1` ห้าม `count()` ห้ามคำนวณฝั่ง client · เช็คเอาต์พร้อมกันสองเครื่องในร้านเดียวกันต้องไม่ได้เลขชนกัน
28. **`order_items` เขียน `name_snapshot` + `price_snapshot` เสมอ** (BR-4) — ห้าม resolve บิลเก่าผ่าน join กับ `products`
29. **order + items และ purchase + items เป็น transaction เดียว** (NFR-7) เขียนสำเร็จครึ่งเดียวไม่ได้
30. **route บิล public (FR-4.6) ไม่ต้องล็อกอิน และต้องไม่รั่วอะไรนอกจากบิลใบนั้น** — ไม่มี workspace id ไม่มีบิลอื่น ไม่มีรายการสินค้าของร้าน

### ใบเสร็จ

31. **ใน subtree ใบเสร็จใช้สีทึบล้วน** — ห้าม opacity modifier (`bg-primary/20`), ห้าม `oklch()`, ห้าม `color-mix()` · Tailwind v4 compile `/opacity` เป็น `color-mix()` ซึ่ง canvas serialisation อ่านไม่ได้ · FR-4.4 เอา DOM ไป render เป็นรูป ใบเสร็จที่สีเพี้ยนแบบเงียบๆ คือบั๊กที่ทำลายความเชื่อใจลูกค้า · ใช้ `html-to-image` ไม่ใช่ `html2canvas` (ตัวหลัง parse `oklch`/`color-mix` ไม่ได้เลย) · ตรวจที่ `/dev/receipt`

## Checklist

### เพิ่ม shadcn component
```
1. pnpm dlx shadcn@latest add <name>      ← ห้าม `init` เด็ดขาด (กฎ 16)
2. normalise radius: shadcn rounded-md(10px) → input/ปุ่มรอง rounded-sm(8),
   card/popover rounded-md(12), dialog/sheet rounded-lg(16)
3. ลบ class dark: ทุกตัว
4. ถ้ามี bg-secondary → bg-secondary-container text-on-secondary-fixed-variant
5. ไอคอนที่ผู้ใช้เห็น (ไม่ใช่ chevron/check ภายใน) เปลี่ยนเป็น <Icon/>
6. เช็คการตัดคำไทยที่ 360px — ไทยไม่มีช่องว่างระหว่างคำ ชื่อยาวจะล้นตรงที่
   อังกฤษตัดบรรทัดได้ ใส่ break-words / line-clamp-* ตามต้องการ
7. pnpm verify
```

### เพิ่มไอคอน
```
1. เติมชื่อใน ICON_NAMES (src/lib/icons.ts) — ต้องเป็นชื่อจริงของ Material Symbols
2. ดูตาราง synonym ใน docs/design-system.md ก่อน — อาจมีตัวที่สื่อความหมายเดียวกันแล้ว
3. pnpm icons:build
4. commit src/assets/fonts/material-symbols-subset.woff2
```

### พอร์ตหน้าจอจาก mockup
```
1. เปิด pos_design/<id>/screen.png — นั่นคือเป้าหมาย (ไม่ใช่ code.html)
2. เปิดตาราง migration ใน docs/design-system.md แปลง class ทีละตัว
3. ถ้ามี component canonical อยู่แล้วให้ใช้ อย่าย้อนไปถอดจาก HTML ใหม่
4. ดึงข้อความทั้งหมดเข้า messages/th.json + en.json ก่อนเขียน JSX
5. เทียบด้วย overlay: /dev/tokens แล้วเลือก id ที่มุมขวาล่าง
6. ตรวจที่ 360px และ 768px
7. pnpm verify
```

## ลิงก์

- `docs/design-system.md` — token, กฎ, ตาราง migration, สถานะพอร์ตทั้ง 28 หน้า
- `docs/pos-prd.md` — FR / BR / NFR / data model
- `docs/pos-business-plan.md` — โมเดลธุรกิจ ราคา GTM
- `/dev/tokens` — หน้าพิสูจน์ token (dev เท่านั้น)
- `/dev/receipt` — พิสูจน์ใบเสร็จ → รูป (กฎ 31)
