# Design System — POS

> เอกสารนี้ **แทนที่** `pos_design/verdant_growth/DESIGN.md` ทั้งฉบับ
> ค่าจริงของ token อยู่ใน `src/styles/theme.css` — เอกสารนี้อธิบาย *ทำไม* และเป็น *แผนที่* สำหรับพอร์ต mockup 28 หน้า

---

## 1. สถานะและอำนาจของเอกสาร

`pos_design/verdant_growth/DESIGN.md` เป็น spec ที่ Stitch สร้างมาพร้อม mockup แต่ **ขัดกับสิ่งที่ mockup render จริง** 3 จุด:

| จุด | DESIGN.md บอก | mockup render จริง | เราใช้ |
|---|---|---|---|
| **radius** | `sm .25 / DEFAULT .5 / md .75 / lg 1 / xl 1.5rem` | `DEFAULT .25 / lg .5 / xl .75rem` | ค่าที่ render จริง (§6) |
| **สี secondary/tertiary** | prose ระบุ `#1a4d2e` และ `#f2fcf5` | ไม่มีสองสีนี้อยู่ในระบบเลย · token block บอก `#366847` / `#57615b` | token block |
| **ฟอนต์** | IBM Plex Sans | 16 ใน 28 ไฟล์ไม่โหลด Thai subset เลยทั้งที่เนื้อหาไทยล้วน · 1 ไฟล์โหลด Be Vietnam Pro หลุดมา | IBM Plex Sans Thai ตัวเดียว (§9) |

**screenshot คือสิ่งที่ถูกอนุมัติ** — เวลาขัดกัน ให้เชื่อ `screen.png` ไม่ใช่ `code.html` และไม่ใช่ DESIGN.md

---

## 2. อ่านเอกสารนี้ยังไง

- `src/styles/theme.css` = source of truth ของค่า
- เอกสารนี้ = เหตุผล + ตารางแปลง
- `/dev/tokens` = หน้าพิสูจน์ว่าค่าที่ browser resolve ตรงกับที่ตั้งใจ (คำนวณ contrast สดจาก `getComputedStyle`)
- `CLAUDE.md` = กฎย่อสำหรับใช้งานประจำวัน

---

## 3. สี

**41 สี M3 + 3 utility + 8 หมวดหมู่ = 52 ตัว** ยกมาจาก mockup ตรงๆ (ทั้ง 28 ไฟล์ประกาศค่าเหมือนกันเป๊ะ — เป็นส่วนเดียวของ design system เดิมที่ไม่มี drift เลย)

ตัดออก 4 ตัวที่ไม่ได้ใช้และไม่มีบทบาทในโหมดสว่าง: `on-tertiary-fixed #151d19` · `on-primary-fixed #002107` · `on-secondary-fixed #00210e` · `secondary-fixed-dim #9dd3aa` — บันทึก hex ไว้ที่นี่เพื่อให้เพิ่มกลับได้ด้วยการ copy

ไม่มี `background` / `on-background` เพราะค่าเท่ากับ `surface` / `on-surface` เป๊ะ และชื่อสองตัวนี้สงวนให้ shadcn alias layer

### 3.1 กับดัก contrast — สามจุดที่ mockup ทำผิด

| คู่สี | อัตราส่วน | ผล | ต้องใช้แทน |
|---|---|---|---|
| ขาว บน `primary-container` `#2bb14f` | **2.80:1** | ✗ ตก AA (mockup ทำใน 9 ไฟล์) | `on-primary-container` `#003c13` = 4.53:1 |
| `outline-variant` `#bdcab9` เป็นสีข้อความ | **1.71:1** | ✗ ตกหนักที่สุดในชุด | `placeholder` `#667363` = 5.00:1 (token ใหม่) |
| ขาว บน `tertiary-container` `#939d97` | **2.80:1** | ✗ ตก AA | `on-tertiary-container` `#2b3530` = 4.54:1 |

`outline` `#6e7b6b` = 4.24:1 — ใช้กับเส้นและไอคอนตกแต่งได้ **ไม่ใช่ข้อความ**
`on-secondary-container` `#3d6f4d` = 4.56:1 ผ่านแบบเฉียด → บน chip เขียวอ่อนให้เลือก `on-secondary-fixed-variant` `#1d5031` (7.27:1)

### 3.2 คู่สีที่ยืนยันแล้วว่าปลอดภัย

```
6.44  AA   on-primary  #ffffff  บน  primary  #006e29     ← ปุ่ม CTA
16.30 AAA  on-surface  #121c28  บน  surface  #f8f9ff     ← ข้อความหลัก
8.71  AAA  on-surface-variant   บน  surface              ← ข้อความรอง
7.27  AAA  on-secondary-fixed-variant บน secondary-container
6.12  AA   on-tertiary #ffffff  บน  tertiary #57615b
5.00  AA   placeholder #667363  บน  #ffffff
4.54  AA   on-tertiary-container บน tertiary-container
4.53  AA   on-primary-container  บน primary-container
```

ตารางเต็มอยู่ที่ `/dev/tokens#colors` คำนวณสดจากค่าที่ resolve จริง

### 3.3 สีหมวดหมู่

`cat-1` … `cat-8` — FR-2.1 ให้หมวดหมู่มีสี แต่ **`categories.color` ต้องเก็บ index 1–8 ไม่ใช่ hex อิสระ**
mockup แอบใส่ `#3b82f6` `#f59e0b` `#10b981` `#ef4444` (สี Tailwind ดิบ) เข้ามาแบบไม่มีระบบ — ชุด 8 สีนี้ปิดช่องนั้น และใช้เป็น chart series ได้ด้วย

---

## 4. ตัวอักษร

**8 ขั้น** (ไม่ใช่ 9 — `headline-lg-mobile` ใน mockup มีค่าเท่ากับ `headline-md` เป๊ะทุกฟิลด์)

| token | px / line-height / weight | ใช้กับ |
|---|---|---|
| `display-lg` | 40 / 48 / 700 · -0.02em | TOTAL, กำไรเดือนนี้ |
| `headline-lg` | 32 / 40 / 600 | หัวหน้าจอ (tablet) |
| `headline-md` | 24 / 32 / 600 | หัวหน้าจอ (mobile), หัว section |
| `title-lg` | 20 / 28 / 600 | หัว card, ยอดรวมรายการ |
| `body-lg` | 18 / 28 / 400 | body เน้น |
| `body-md` | 16 / 24 / 400 | body มาตรฐาน |
| `label-lg` | 14 / 20 / 500 · +0.01em | label ปุ่ม/ฟอร์ม/chip |
| `label-sm` | 12 / 16 / 500 | caption, label แท็บล่าง |

### 4.1 ไม่มี token ลงท้าย `-mobile`

mockup อ้าง `title-lg-mobile` (8 ครั้ง), `headline-md-mobile` (7), `headline-lg-mobile` (8), `h2` (4), `label` (4), `label-md` (43) — **ทุกตัวไม่เคยถูก define** จึงเป็น no-op ที่ element สืบขนาดจาก parent มาแทน

responsive เขียนเป็น breakpoint variant: `text-title-lg md:text-headline-md`
ข้อนี้ลบ class ผี 74 จุดออกจากงานพอร์ต และตัดคำถาม "ขั้นไหนคู่กับขั้นไหน" ทิ้งถาวร

### 4.2 น้ำหนักฟอนต์มาพร้อม `text-<step>`

Tailwind v4 emit `font-weight: var(--tw-font-weight, <token>)` และ `font-bold` เป็นตัว set `--tw-font-weight`
⇒ `text-title-lg font-bold` ได้ 700 เสมอ **ไม่ว่าลำดับ class จะเป็นอย่างไร** (เหมือนกับ `leading-*` และ `tracking-*`) — ทดสอบอยู่ที่ `/dev/tokens#weight-test`

**ห้ามเขียน `font-<step>`** เช่น `font-body-md` — ใน mockup มันคือ fontFamily alias ที่ชี้ไป `["IBM Plex Sans"]` เฉยๆ **701 จุดที่ไม่ทำอะไรเลย** ลบทิ้งไม่ต้องแปลง

---

## 5. spacing

**คำศัพท์ชุดเดียว: เลข Tailwind** (`--spacing: 0.25rem` ⇒ `p-4` = 16px)

mockup ใช้สองชุดพร้อมกัน (`px-md` **และ** `px-4` ในไฟล์เดียวกัน) ซึ่งเป็นแหล่ง divergence แบบเดียวกับที่ทำให้เกิด input 40 แบบ — ตัดชุดที่ซ้ำทิ้ง

| ชื่อเก่า | px | ใช้แทนด้วย |
|---|---|---|
| `xs` / `unit` | 4 | `1` |
| `sm` | 8 | `2` |
| `gutter` | 12 | `3` |
| `md` / `container-margin` | 16 | `4` |
| `lg` | 24 | `6` |
| `xl` | 32 | `8` |

ชื่อเหลือเฉพาะขนาดที่ **เข้ารหัสการตัดสินใจ** ไม่ใช่แค่ตัวเลข:

| token | ค่า | ความหมาย |
|---|---|---|
| `--spacing-app-bar` | 64px | ความสูง top app bar (`h-app-bar`) |
| `--spacing-bottom-nav` | 64px | ความสูง bottom nav ไม่รวม safe area |
| `--spacing-fab-inset` | 80px | ระยะ FAB จากขอบล่าง (mockup ใช้ 72/88/96 มั่ว 5 ค่า) |
| `--spacing-touch` | 44px | touch target ขั้นต่ำ NFR-1 (`min-h-touch`) |
| `--container-content` | 1120px | ความกว้างเนื้อหาสูงสุด (`max-w-content`) |
| `--container-bill-pane` | 420px | คอลัมน์บิลขวาใน split view FR-3.8 (`max-w-bill-pane`) |

---

## 6. มุมโค้ง

ใช้ค่าที่ mockup **render จริง** เปลี่ยนชื่อให้ monotonic (DESIGN.md เพี้ยนไป 1 ขั้นเต็ม — ดู §1)

| token | px | เดิมใน mockup | ใช้กับ |
|---|---|---|---|
| `rounded-xs` | 4 | `rounded` | badge, มุมบนแท่งกราฟ |
| `rounded-sm` | 8 | `rounded-lg` | input, ปุ่มรอง |
| `rounded-md` | 12 | `rounded-xl` | card, KPI, product tile |
| `rounded-lg` | 16 | `rounded-2xl` | FAB, modal, bottom sheet |
| `rounded-xl` | 24 | — (ใหม่) | hero container |
| `rounded-full` | ∞ | `rounded-full` | ปุ่ม CTA, chip, stepper, avatar |

⚠️ **ห้ามรัน `shadcn init`** — มันจะ append `--radius-sm/md/lg/xl` เวอร์ชันของมัน (`calc(var(--radius) ± Npx)`) ทับสเกลนี้ ทำให้ 8/12/16/24 กลายเป็น 6/8/10/14 เงียบๆ ทั้งแอป

---

## 7. เงา

| token | ค่า | ใช้กับ | จำนวนใน mockup |
|---|---|---|---|
| `shadow-card` | `0 4px 12px rgb(0 0 0 / .02)` | list / product card | 7 |
| `shadow-raised` | `0 4px 12px rgb(0 0 0 / .05)` | sticky bar, FAB | 27 |
| `shadow-nav` | `0 -4px 12px rgb(0 0 0 / .05)` | bottom nav (เงาพุ่งขึ้น) | 14 |
| `shadow-overlay` | `0 12px 32px rgb(0 0 0 / .1)` | modal, bottom sheet | 7 |
| `shadow-primary` | `0 4px 12px rgb(0 110 41 / .25)` | CTA glow | 4 (re-tint จาก `rgba(43,177,79,…)`) |

ตรงกับ elevation ladder ที่ DESIGN.md เขียนไว้พอดี · แทน arbitrary `shadow-[…]` กว่า 90 จุด

---

## 8. z-index

mockup กระจาย `z-10/20/30/40/50/[60]/[70]` 78 จุดโดยไม่มีระบบ (`z-50` ใช้ทั้งกับ bottom nav และ scrim)

```
z-sticky 10   sticky sub-header, รางแถบ chip หมวดหมู่
z-appbar 30   top app bar
z-nav    40   bottom nav / side nav
z-fab    45   FAB
z-scrim  50   ฉากหลังทึบของ modal/sheet
z-sheet  60   ตัว modal / bottom sheet
z-toast  70   toast
```

---

## 9. ฟอนต์และไอคอน

### 9.1 ข้อความ — family เดียว

**IBM Plex Sans Thai** (`subsets: ["thai", "latin"]`, น้ำหนัก 400/500/600/700) โหลดผ่าน `next/font/google` (self-host)

ไม่โหลด IBM Plex Sans แยก: Plex Sans Thai มี Latin ครบและวาดมาให้เข้าคู่กันโดยตรง โหลดสองตัวคือเสียเปล่าและเสี่ยงให้ไทยกับ Latin ไม่เข้ากันกลางประโยค — ซึ่งในแอปนี้คือ *ทุก* ประโยค (`ยอดขาย 1,250.00 ฿`)

`adjustFontFallback: false` เพราะ metric ที่ next/font คำนวณให้อัตโนมัติอิงจาก Latin แล้วทำให้ไทยขนาดเพี้ยน

**งบที่วัดจริง: ~67 KB** ที่ browser ดึงจริงสำหรับหน้าภาษาไทย (thai subset 4 น้ำหนัก + latin subset 4 น้ำหนัก + icon font)
ถ้า Lighthouse-4G ชี้ว่าฟอนต์บล็อก LCP: ตัดน้ำหนัก 600 แล้ว remap `title-lg`/`headline-*` ไป 700 — **ห้ามตัด 500** เพราะเป็น `label-lg`/`label-sm` ซึ่งคิดเป็น 298 จาก type class ทั้งหมด

### 9.2 ไอคอน — subset 42 ตัว 7,560 B

Material Symbols Outlined subset ผ่าน `icon_names=` ของ Google Fonts แล้ว vendor ลง `src/assets/fonts/`

แกน `opsz,wght,FILL,GRAD@24,400,0..1,0` — เปิดเฉพาะ `FILL` ให้ variable

| ตัวเลือกแกน | ขนาด | |
|---|---|---|
| `FILL@0` static | 5,628 B | สลับ fill ไม่ได้ |
| **`…FILL,GRAD@24,400,0..1,0`** | **7,560 B** | ✅ ใช้ตัวนี้ |
| เปิดทุกแกน | 39,428 B | แพง 5 เท่าโดยไม่ได้อะไรเพิ่ม |

mockup ใช้ `FILL 1` 34 ครั้ง (แท็บ active, chip ที่เลือก) ส่วน `wght`/`GRAD`/`opsz` เป็น 400/0/24 เสมอ

ข้อกำหนดสองข้อของ Google Fonts API ที่ไม่มีในเอกสาร (verify จากของจริง แล้ว assert ไว้ในสคริปต์):
1. `icon_names` **ต้องเรียงตามตัวอักษร** ไม่งั้นตอบ `400: Invalid selector`
2. **User-Agent ต้องเหมือน browser จริง** ไม่งั้นได้ TTF (ใหญ่กว่า ~4 เท่า)

`display: "block"` ไม่ใช่ `"swap"` — ฟอนต์นี้ใช้ ligature ข้อความใน element คือ *ชื่อไอคอน* ถ้า swap ผู้ใช้จะเห็นคำว่า `point_of_sale` ในแท็บล่างจริงๆ จนกว่าฟอนต์จะโหลดเสร็จ

`<Icon>` ใส่ `translate="no"` เสมอ — Chrome auto-translate บนหน้า `lang="th"` จะแปล ligature อย่าง `payments` แล้วไอคอนพังถาวร

### 9.3 ตารางยุบ synonym — 61 ชื่อ → 42

| ความหมาย | ใช้ตัวนี้ | ตัวที่ตัดทิ้ง |
|---|---|---|
| สรุป / รายงาน | `leaderboard` | `assessment`(6) `equalizer`(6) `analytics`(3) `monitoring`(1) |
| วันที่ | `calendar_month` | `calendar_today`(2) `today`(1) `date_range`(1) |
| ตะกร้า / รายการบิล | `shopping_cart` | `shopping_basket`(4) |
| ขยาย / ยุบ | `expand_more` + `rotate-180` | `arrow_drop_down`(3) `arrow_drop_up`(1) |
| กรอง / เรียง | `filter_list` | `sort`(1) |
| บันทึก / ส่งออก | `download` | `save`(1) `print`(1) — การพิมพ์อยู่นอก MVP |
| ช่วยเหลือ | `help` | `help_outline`(4) — เป็น alias เก่า FILL 0 ให้ผลเดียวกัน |
| ตัวตน / ความน่าเชื่อถือ | `account_circle` | `group`(1) `verified_user`(2) `star`(1) `mark_email_read`(1) |
| placeholder สินค้า | `image` | `fastfood`(3) `local_drink`(1) `coffee_maker`(1) |
| หน้าหลัก | *(ไม่มี)* | `home`(3) — PRD ไม่มีแท็บ Home |

**เพิ่มใหม่** (mockup ไม่มี แต่ PRD ต้องใช้): `edit` (FR-2.2/FR-5.2 ไม่ได้วาดปุ่มแก้ไขไว้เลย) · `error` `warning` `info` (validation + banner trial หมดอายุ FR-0.4)

### 9.4 แท็บล่าง — ล็อกชุดเดียว

mockup มี **4 ชุดแท็บที่ต่างกัน** อีก 3 ชุดเป็นซากจากการ iterate ใช้ชุดตาม PRD §4 เท่านั้น

| แท็บ | ไอคอน | FILL ตอน active |
|---|---|---|
| ขาย | `point_of_sale` | ✓ |
| สินค้า | `inventory_2` | ✓ |
| ต้นทุน | `payments` | ✓ |
| สรุป | `leaderboard` | ✓ |

⚙️ ตั้งค่าอยู่ที่ top app bar (mobile) / ท้าย side nav (tablet) — **ไม่ใช่แท็บ**

ชุดที่ตายแล้ว: `[สรุป·กำไร·รายการ]` (6 ไฟล์) · `[หน้าหลัก·การขาย·ต้นทุน·รายงาน]` (2 ไฟล์ — ชุดนี้ยังใช้ `inventory_2` แทน "ต้นทุน" ซึ่งชนกับความหมาย "สินค้า" ในชุดหลัก) · ชุดที่ใช้ `equalizer` แทน `leaderboard` (4 ไฟล์)

---

## 10. ตาราง migration T1 — ระดับ class

เรียงตามจำนวนที่พบใน mockup

| class เดิม | จำนวน | → ใช้แทน | ชนิด |
|---|---:|---|---|
| `font-<step>` ทุกตัว (`font-body-md`, `font-label-sm`, …) | **701** | *ลบทิ้ง* | ลบ |
| `dark:*` | **156** | *ลบทิ้ง* | ลบ |
| `rounded-full` | 193 | `rounded-full` | คงเดิม |
| `text-label-sm` | 182 | `text-label-sm` | คงเดิม |
| `text-body-md` | 157 | `text-body-md` | คงเดิม |
| `rounded-xl` | 120 | `rounded-md` | เปลี่ยนชื่อ (0.75rem → 12px) |
| `text-label-lg` | 116 | `text-label-lg` | คงเดิม |
| `rounded-lg` | 99 | `rounded-sm` | เปลี่ยนชื่อ (0.5rem → 8px) |
| `text-title-lg` | 94 | `text-title-lg` | คงเดิม |
| `p-md` | 58 | `p-4` | เปลี่ยนชื่อ |
| `gap-sm` | 56 | `gap-2` | เปลี่ยนชื่อ |
| `text-headline-md` | 50 | `text-headline-md` | คงเดิม |
| `px-md` | 46 | `px-4` | เปลี่ยนชื่อ |
| `text-label-md` | 43 | `text-label-lg` | แก้ (มีแค่ใน style guide) |
| `gap-md` | 36 | `gap-4` | เปลี่ยนชื่อ |
| `py-sm` | 35 | `py-2` | เปลี่ยนชื่อ |
| `px-container-margin` | 31 | `px-4` | เปลี่ยนชื่อ |
| `shadow-[0px_4px_12px_rgba(0,0,0,0.05)]` | 27 | `shadow-raised` | token |
| `rounded-t-xl` | 19 | `rounded-t-md` | เปลี่ยนชื่อ |
| `text-headline-lg` | 19 | `text-headline-lg` | คงเดิม |
| `rounded-2xl` | 17 | `rounded-lg` | เปลี่ยนชื่อ (1rem → 16px) |
| `p-lg` / `gap-lg` | 16 / 16 | `p-6` / `gap-6` | เปลี่ยนชื่อ |
| `text-[20px]` | 15 | `text-title-lg` | remap |
| `shadow-[0px_-4px_12px_rgba(0,0,0,0.05)]` | 14 | `shadow-nav` | token |
| `rounded-md` | 14 | `rounded-sm` | เปลี่ยนชื่อ (v3 default 6px → 8px) |
| `border-[#E5E7EB]` | 11 | `border-outline-variant` | token |
| `text-[16px]` | 11 | `text-body-md` | remap |
| `text-[18px]` | 10 | `text-body-lg` | remap |
| `text-display-lg` / `text-body-lg` | 10 / 10 | คงเดิม | คงเดิม |
| `text-title-lg-mobile` | 8 | `text-body-md md:text-title-lg` | responsive ⚠️ ตรวจกับ PNG |
| `text-headline-lg-mobile` | 8 | `text-headline-md md:text-headline-lg` | responsive |
| `text-[24px]` | 8 | `text-headline-md` | remap |
| `shadow-[0px_4px_12px_rgba(0,0,0,0.02)]` | 7 | `shadow-card` | token |
| `shadow-[0px_12px_32px_rgba(0,0,0,0.1)]` | 7 | `shadow-overlay` | token |
| `text-headline-md-mobile` | 7 | `text-title-lg md:text-headline-md` | responsive |
| `text-[10px]` / `text-[11px]` | 5 / 1 | `text-label-sm` | remap (10px ตก NFR-1) |
| `text-[32px]` | 5 | `text-headline-lg` | remap |
| `p-xl` | 5 | `p-8` | เปลี่ยนชื่อ |
| `text-[48px]` / `[64px]` / `[40px]` | 4 / 1 / 2 | **`<Icon size={…}/>`** | component — นี่คือขนาดไอคอน ไม่ใช่ type step |
| `text-h2` | 4 | `text-label-lg` | แก้ (label ใน side nav) |
| `text-label` + `text-[10px]` | 4 | `text-label-sm` | แก้ |
| `shadow-[…rgba(43,177,79,…)]` | 4 | `shadow-primary` | token (re-tint เป็น `#006e29`) |
| `text-[28px]` | 3 | `text-headline-md` | remap — **อย่าเพิ่มขั้น 28px** |
| `gap-gutter` | 3 | `gap-3` | เปลี่ยนชื่อ |
| `placeholder-outline-variant` / `placeholder:text-outline-variant` | 3 / 6 | `placeholder:text-placeholder` | **แก้ a11y — 1.71:1 → 5.00:1** |
| `placeholder:text-outline` | 4 | `placeholder:text-placeholder` | แก้ a11y |
| `placeholder-on-surface-variant/50` | 3 | `placeholder:text-placeholder` | แก้ a11y |
| `bg-[#3b82f6]` `[#f59e0b]` `[#10b981]` `[#ef4444]` | 6 | `bg-cat-{1..8}` | token |
| `bg-[#F7F7F2]` | 1 | `bg-receipt-paper` | token (ใบเสร็จเท่านั้น) |
| `hover:bg-[#259c45]` | 2 | `hover:opacity-90` บน `bg-primary` | token · **ห้ามใช้ opacity ใน subtree ใบเสร็จ** |
| `bg-primary-container` + ตัวหนังสือขาว | 9 ไฟล์ | `bg-primary` + `text-on-primary` | **แก้ a11y — 2.80:1 → 6.44:1** |
| `text-primary-fixed` / `-fixed-dim` | 34 | *ลบทิ้ง* | ลบ (เป็นสีเขียวสำหรับ dark mode) |
| `z-10`/`20`/`30`/`40`/`50`/`[60]`/`[70]` | 78 | `z-sticky`/`z-appbar`/`z-nav`/`z-scrim`/`z-sheet`/`z-toast` | semantic (§8) |
| `pb-safe` | 6 | `pb-safe` | แก้ (ตอนนี้ define จริงแล้ว — ใน mockup define แค่ 1 ใน 6 ไฟล์) |
| `no-scrollbar` / `hide-scrollbar` / `scrollbar-hide` | 5 | `no-scrollbar` | แก้ (สามชื่อสำหรับสิ่งเดียวกัน อันหลังไม่เคย define) |
| `rounded-DEFAULT` / `rounded-` / `rounded-t-` | 8 | *ลบทิ้ง* | ลบ (no-op) |
| `flat` `no` `shadows` `docked` `full-width` | ~10 | *ลบทิ้ง* | ลบ (คำขยะจาก Stitch export) |

**หมายเหตุที่สำคัญที่สุดสองข้อ:**
- `text-[48px]` ฯลฯ เกือบทั้งหมดอยู่บน `<span class="material-symbols">` — เป็น **ขนาดไอคอน** ไม่ใช่ type step การพอร์ตแบบกลไกจะไปสร้าง `display-xl` ขึ้นมาโดยไม่จำเป็น
- `font-<step>` 701 จุด **ลบ ไม่ใช่แปลง** — ทำข้อนี้ก่อนเป็นอันดับแรกจะลดงานที่เหลือลงมาก

---

## 11. ตาราง migration T2 — ระดับ component

ที่ divergence รุนแรงจนตาราง class ไร้ประโยชน์ ต้องบอกว่า "หยุด copy ใช้อันนี้"

| component | divergence ใน mockup | ใช้ | mockup อ้างอิง | หมายเหตุ |
|---|---|---|---|---|
| Input | **40 class string ใน 50 ช่อง · focus 4 แบบที่ไม่เข้ากัน · placeholder 5 แบบ** | `<Input/>` | `tablet_7` | `rounded-sm` · focus = border 2px primary · label อยู่เหนือช่องเสมอ ไม่ลอย |
| Bottom nav | 17 string / 17 ไฟล์ / 4 ชุดแท็บ | `<BottomNav/>` | `mobile_12` | ชุดแท็บตาม PRD เท่านั้น (§9.4) · `shadow-nav` · `pb-safe` |
| ปุ่ม CTA | 13 string / 2 สีพื้น | `<Button variant="primary"/>` | `mobile_12` | **สีพื้นเปลี่ยนเป็น `#006e29`** · `rounded-full` · `min-h-touch` |
| ปุ่มรอง | 10 string | `<Button variant="outline"/>` | `mobile_1` | `border-primary` · `rounded-sm` |
| Card | 4 token เส้นขอบต่างกัน | `<Card/>` | `mobile_8` | `border-outline-variant` · `rounded-md` · `shadow-card` |
| Product tile | 3 string | `<ProductCard/>` | `mobile_8` | `aspect-square` · fallback ใช้ `<Icon name="image"/>` |
| KPI / stat card | 4 string (ค่าใช้ 20px บ้าง 24px บ้าง) | `<StatCard/>` | `dashboard_mobile` | ค่า = `text-headline-md tnum` · label = `text-label-sm` |
| Chip หมวดหมู่ | 3 string · สีพื้นตอนเลือกต่างกัน | `<Chip/>` | `mobile_12` | เลือกแล้ว = `bg-primary-container text-on-primary-container` |
| Qty stepper | 3 string | `<QtyStepper/>` | `mobile_12` | `rounded-full` · ปุ่ม ≥44px · ตัวเลข `tnum` |
| Bottom sheet | 2 string | `<Sheet/>` | `mobile_12` | มุมบน **16px** (mockup render 12px — ตั้งใจต่าง §13) |
| Modal | 2 string | `<Dialog/>` | `mobile_11` | `rounded-lg` · `shadow-overlay` |
| Top app bar | 5 string (สูง 5 ค่า, z 4 ค่า) | `<AppBar/>` | `mobile_8` | `h-app-bar` · `z-appbar` · ⚙️ ชิดขวา |
| Side nav (tablet) | 3 string | `<SideNav/>` | `tablet_split_view` | ⚙️ อยู่ท้าย |
| ใบเสร็จ | 2 string | `<Receipt/>` | `mobile_9` | **สีทึบล้วน** (กฎ 31) · ตรวจที่ `/dev/receipt` |
| กราฟแท่ง | 1 string | `<BarChart/>` | `dashboard_mobile` | `rounded-t-xs` · `bg-cat-*` |

ทุก component ต้องมี: พิสูจน์ touch target ≥44px · พิสูจน์ contrast · หมายเหตุการตัดคำไทยที่ 360px

---

## 12. ตาราง T3 — สถานะพอร์ต 28 หน้า

| mockup | หน้า | FR | คู่ | สถานะ |
|---|---|---|---|---|
| `mobile_5` / `tablet_11` | Welcome | FR-0 | ✓ | ☐ |
| `mobile_4` / `tablet_7` | สมัครใช้งาน | FR-0.1/0.2 | ✓ | ✅ `/signup` |
| `mobile_1` / `tablet_2` | เข้าสู่ระบบ | FR-0.1 | ✓ | ✅ `/login` ใช้งานได้จริง |
| `mobile_6` / `tablet_1` | รีเซ็ตรหัสผ่าน | FR-0.1 | ✓ | ✅ `/reset-password` (ยังไม่มีหน้าตั้งรหัสใหม่หลังกดลิงก์) |
| `mobile_12` / `tablet_split_view` | ขาย | FR-3 | ✓ | ☐ |
| `mobile_9` / `tablet_10` | ใบเสร็จ + PromptPay QR | FR-4 | ✓ | ☐ |
| `mobile_3` / `tablet_8` | รายการบิล | FR-6.4 | ✓ | ☐ |
| `mobile_8` / `tablet_6` | สินค้า (list) | FR-2.4 | ✓ | ☐ |
| `mobile_10` / `tablet_4` | เพิ่มสินค้า | FR-2.2 | ✓ | ☐ |
| `mobile_11` / `tablet_3` | ต้นทุน (list) | FR-5.1 | ✓ | ☐ |
| `mobile_2` / `tablet_5` | บันทึกการซื้อ | FR-5.2/5.3 | ✓ | ☐ |
| `dashboard_mobile` / `dashboard_tablet` | สรุป | FR-6.1/6.2 | ✓ | ☐ |
| `mobile_7` / `tablet_9` | กำไรรายเดือน | FR-6.3 | ✓ | ☐ |
| `style_guide_*` × 2 | style guide | — | — | ไม่พอร์ต (เอกสารนี้แทน) |

### หน้าที่ PRD ต้องการแต่ไม่มี mockup — ต้องออกแบบใหม่

- ~~**FR-1 หน้าตั้งค่าทั้งหมด**~~ → ✅ ทำแล้วที่ `/settings` **ออกแบบใหม่ทั้งหมด ไม่มี mockup** ·
  4 หัวข้อ: ข้อมูลร้าน+โลโก้ · PromptPay (มี QR preview สด) · VAT · ภาษา
- FR-2.1 CRUD หมวดหมู่ + สี · FR-2.5 instant add ในหน้าขาย · FR-2.3 checkbox "ราคานี้รวมภาษีแล้ว"
- FR-4.6 หน้าบิล public (mockup มีปุ่ม "ดูบิลออนไลน์" แต่ไม่มีหน้าปลายทาง)
- FR-0.4 หน้า trial หมดอายุ / จ่ายเงิน
- หน้าแก้ไข (mockup มีแต่ "เพิ่ม" ทั้งสินค้าและการซื้อ)
- FR-6.2 หน้ารายงาน Daily / Monthly / Custom range (มีแค่ลิงก์ในเมนู)
- empty state / loading / error ทุกหน้า
- เวอร์ชันภาษาอังกฤษ (mockup hardcode ไทยทั้งหมด)

---

## 13. จุดที่จงใจต่างจาก mockup

บันทึกไว้ให้ชัด ไม่งั้นจะมีคนมา "แก้กลับ"

1. **สีพื้นปุ่ม CTA `#2bb14f` → `#006e29`** — เหตุผล accessibility: 2.80:1 → 6.44:1 · `#2bb14f` ยังอยู่ในฐานะสี selected/accent
2. **มุมบน bottom sheet / modal 12px → 16px** — ให้เข้ากับ component map (§6) ต่างกันน้อยมากในสายตา
3. **label แท็บล่าง 10px → 12px** — NFR-1 (อ่านออก) และให้ตรงกับอีก 17 nav ที่ใช้ `label-sm` อยู่แล้ว
4. **วันที่ภาษาไทยใช้ปี ค.ศ.** — ตรงกับ mockup แต่ต่างจาก default ของ locale `th-TH` (ปฏิทินพุทธ) ต้อง pin `th-TH-u-ca-gregory` ไม่งั้น 2026 กลายเป็น 2569

---

## 14. เลื่อนไปเฟสหลัง

- **Dark mode** — token layer พร้อมแล้ว (`shadcn.css` เป็นสองชั้นเพื่อการนี้) เติมบล็อก `.dark { … }` แล้วถอด `@custom-variant` ใน `globals.css` · 156 `dark:` ใน mockup ไม่ได้ยกมา เพราะไม่เคยผ่านการออกแบบหรือ QA
- **สีที่ตัดออก 4 ตัว** — `on-tertiary-fixed #151d19` · `on-primary-fixed #002107` · `on-secondary-fixed #00210e` · `secondary-fixed-dim #9dd3aa`
- **print stylesheet** — การพิมพ์อยู่นอก MVP (PRD §2)
- **PWA** — `manifest.webmanifest` + ไอคอน จะลงที่ `public/` ตอน P3

---

## 15. สิ่งที่ได้จากการพอร์ตหน้าแรก (dry run — `mobile_1` + `tablet_2` → `/login`)

พอร์ตหน้า login จริงหนึ่งหน้าเพื่อทดสอบว่าตาราง §10–§11 ใช้ได้จริง ก่อนจะสลักคำสั่งสำหรับอีก 27 หน้าลงหิน สิ่งที่เจอ:

1. **`typedRoutes: true` ทำให้ลิงก์ไปหน้าที่ยังไม่พอร์ตกลายเป็น build error** — เป็นพฤติกรรมที่ดี (ลิงก์เสียถูกจับตั้งแต่ compile) แต่แปลว่า **การพอร์ตหน้าที่มีลิงก์ออกต้องสร้าง route ปลายทางไปด้วย** ใช้ `<NotPortedYet mockup="…"/>` เป็น stub (ดู `src/components/dev/not-ported.tsx`)
2. **มุมปุ่ม CTA ไม่คงที่ระหว่าง mockup** — หน้า auth ใช้ ~8px (`mobile_1`) แต่ CTA ในแอปใช้ pill (`mobile_12`, `tablet_split_view`, `tablet_2`) เราใช้ `rounded-full` ทุกที่ตาม canonical ในตาราง T2 · เป็นความต่างที่รับรู้แล้วและตั้งใจ
3. **ขนาดเชิงความหมายที่ตาราง T1 ไม่ได้ครอบคลุม** — ความกว้างการ์ดฟอร์ม 420px หลุด guard ออกมาเป็น `max-w-[420px]` เพิ่ม token `--container-form` แล้ว · เวลาพอร์ตเจอค่าคงที่แบบนี้ให้เพิ่ม token อย่าใช้ arbitrary value
4. **ปุ่ม Google อยู่ใน mockup แต่ขัดกับ FR-0.1** ที่ระบุว่า social login เป็นเฟสหลัง — พอร์ตมาไว้ก่อนพร้อมคอมเมนต์ P1 ต้องตัดสินว่าเก็บหรือถอด · โลโก้ Google ใช้สีแบรนด์ตรงๆ ไม่แปลงเป็น `cat-*`
5. **ปุ่มที่มีแต่ไอคอนต้องส่ง `label` ให้ `<Icon>` เสมอ** — ตอนแรกเผลอส่ง `t("signIn")` ให้ปุ่มย้อนกลับ ซึ่งอ่านออกมาผิดความหมายกับ screen reader ต้องเป็น `common.back`

ตาราง T1/T2 ใช้แปลง class ได้ตรงทุกตัวโดยไม่ต้องแก้ · ทั้ง `pnpm lint` และ `pnpm lint:tokens` ผ่านตั้งแต่ครั้งแรกหลังแก้ 5 ข้อข้างบน

---

## 16. เรื่องที่ยังต้องตรวจด้วยตา

- `text-title-lg-mobile` → `text-body-md md:text-title-lg` — ใน mockup มัน render ที่ขนาดที่สืบมาจาก parent (16px) ต้องเทียบกับ `dashboard_mobile/screen.png` ว่าดูเบาไปหรือไม่ ถ้าเบาให้ขยับเป็น `body-lg`
- `pb-safe` บน iPhone Safari **เครื่องจริง** — simulator รายงาน safe-area ผิด
- Lighthouse mobile 4G throttled ที่ `/dev/tokens` → บันทึกเป็น baseline NFR-3
- ทดสอบชื่อสินค้าไทยยาว 40 ตัวอักษรไม่มีเว้นวรรค ที่ 360px ในทุก component recipe

---

## 17. Changelog

| วันที่ | การเปลี่ยนแปลง |
|---|---|
| 2026-08-06 | ตั้งต้น — สกัด token จาก mockup 28 ไฟล์, แก้บั๊ก contrast 3 จุด, ยุบไอคอน 61→42, ตัด named spacing, ล็อกชุดแท็บ |
