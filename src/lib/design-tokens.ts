/**
 * รายการ token สำหรับหน้า /dev/tokens
 * ค่าจริงอยู่ใน src/styles/theme.css — ที่นี่เก็บแค่ "ชื่อ + คำอธิบายการใช้งาน"
 * หน้า /dev/tokens จะอ่านค่าจริงจาก getComputedStyle เพื่อพิสูจน์ว่า CSS resolve ถูก
 */

export type ColorToken = {
  name: string;
  /** foreground ที่ใช้คู่กับสีนี้ได้ (ตรวจ contrast ในหน้า /dev/tokens) */
  on?: string[];
  use: string;
};

export type ColorGroup = { title: string; tokens: ColorToken[] };

export const COLOR_GROUPS: ColorGroup[] = [
  {
    title: "Surface",
    tokens: [
      { name: "surface", on: ["on-surface", "on-surface-variant"], use: "พื้นหลังหน้าจอ" },
      { name: "surface-dim", use: "พื้นหลังที่ต้องการให้จมลง" },
      { name: "surface-bright", use: "พื้นหลังสว่างในพื้นที่ scroll" },
      {
        name: "surface-container-lowest",
        on: ["on-surface", "on-surface-variant"],
        use: "พื้น card / sheet / input",
      },
      { name: "surface-container-low", on: ["on-surface"], use: "พื้น side nav, ปุ่ม ghost hover" },
      { name: "surface-container", on: ["on-surface"], use: "พื้น thumbnail, accent shadcn" },
      { name: "surface-container-high", on: ["on-surface-variant"], use: "muted (shadcn)" },
      { name: "surface-container-highest", on: ["on-surface"], use: "พื้น segmented control" },
      { name: "surface-variant", on: ["on-surface"], use: "แถบคั่น, พื้นรอง" },
      { name: "on-surface", use: "ข้อความหลัก" },
      { name: "on-surface-variant", use: "ข้อความรอง / ไอคอน inactive" },
      { name: "inverse-surface", on: ["inverse-on-surface"], use: "toast / tooltip" },
      { name: "inverse-on-surface", use: "ข้อความบน inverse-surface" },
      { name: "outline", use: "⚠️ เส้นขอบและไอคอนตกแต่งเท่านั้น — ไม่ผ่าน AA สำหรับข้อความ" },
      { name: "outline-variant", use: "⚠️ hairline เท่านั้น — 1.71:1 ห้ามใช้กับข้อความ" },
      { name: "placeholder", use: "placeholder ในช่องกรอก (แทน outline-variant ที่ตก AA)" },
    ],
  },
  {
    title: "Primary",
    tokens: [
      { name: "primary", on: ["on-primary"], use: "ปุ่ม CTA, ข้อความเน้น, focus ring" },
      {
        name: "primary-container",
        on: ["on-primary-container"],
        use: "⚠️ สี selected/accent เท่านั้น — ห้ามใส่ตัวหนังสือขาว (2.80:1)",
      },
      { name: "on-primary", use: "ข้อความบน primary" },
      { name: "on-primary-container", use: "ข้อความบน primary-container (fg เดียวที่ผ่าน)" },
      { name: "surface-tint", use: "tint ของ elevation (= primary)" },
      { name: "inverse-primary", use: "primary บนพื้นเข้ม (สำรองไว้ dark mode)" },
      { name: "primary-fixed", use: "สำรองไว้ dark mode" },
      { name: "primary-fixed-dim", use: "สำรองไว้ dark mode" },
      { name: "on-primary-fixed-variant", use: "สำรองไว้ dark mode" },
    ],
  },
  {
    title: "Secondary / Tertiary",
    tokens: [
      { name: "secondary", on: ["on-secondary"], use: "ข้อความ/พื้นเขียวเข้มรอง" },
      {
        name: "secondary-container",
        on: ["on-secondary-fixed-variant", "on-secondary-container"],
        use: "chip เขียวอ่อน, แท็บ active — PREFER on-secondary-fixed-variant (7.27:1)",
      },
      { name: "on-secondary", use: "ข้อความบน secondary" },
      { name: "on-secondary-container", use: "4.56:1 — ผ่านแบบเฉียด" },
      { name: "on-secondary-fixed-variant", use: "7.27:1 — เลือกตัวนี้บน chip เขียวอ่อน" },
      { name: "secondary-fixed", use: "= secondary-container" },
      { name: "tertiary", on: ["on-tertiary"], use: "สีกลาง/เทาอมเขียว" },
      {
        name: "tertiary-container",
        on: ["on-tertiary-container"],
        use: "⚠️ ขาวบนสีนี้ = 2.80:1 ตก AA — ใช้ on-tertiary-container เท่านั้น",
      },
      { name: "on-tertiary", use: "ข้อความบน tertiary" },
      { name: "on-tertiary-container", use: "fg เดียวที่ผ่านบน tertiary-container" },
      { name: "tertiary-fixed", use: "พื้นอ่อนสำหรับ empty state" },
      { name: "tertiary-fixed-dim", use: "ไอคอน placeholder ของสินค้าที่ไม่มีรูป" },
      { name: "on-tertiary-fixed-variant", use: "ข้อความบน tertiary-fixed" },
    ],
  },
  {
    title: "Error",
    tokens: [
      { name: "error", on: ["on-error"], use: "ข้อความ validation, ปุ่มลบ, ส่วนลด" },
      { name: "error-container", on: ["on-error-container"], use: "พื้น banner แจ้งเตือน" },
      { name: "on-error", use: "ข้อความบน error" },
      { name: "on-error-container", use: "ข้อความบน error-container" },
    ],
  },
  {
    title: "ใบเสร็จ + หมวดหมู่",
    tokens: [
      {
        name: "receipt-paper",
        on: ["on-surface"],
        use: "พื้นกระดาษใบเสร็จ — subtree นี้ห้ามใช้ opacity modifier (ดูกฎ 22)",
      },
      { name: "receipt-rule", use: "เส้นปรุ/เส้นประในใบเสร็จ" },
      { name: "cat-1", on: ["white"], use: "สีหมวดหมู่ 1 / chart series 1" },
      { name: "cat-2", on: ["white"], use: "สีหมวดหมู่ 2" },
      { name: "cat-3", on: ["white"], use: "สีหมวดหมู่ 3" },
      { name: "cat-4", on: ["white"], use: "สีหมวดหมู่ 4" },
      { name: "cat-5", on: ["white"], use: "สีหมวดหมู่ 5" },
      { name: "cat-6", on: ["white"], use: "สีหมวดหมู่ 6" },
      { name: "cat-7", on: ["white"], use: "สีหมวดหมู่ 7" },
      { name: "cat-8", on: ["white"], use: "สีหมวดหมู่ 8" },
    ],
  },
];

export const TYPE_STEPS = [
  { name: "display-lg", spec: "40 / 48 / 700 / -0.02em", use: "TOTAL, กำไรเดือนนี้" },
  { name: "headline-lg", spec: "32 / 40 / 600", use: "หัวหน้าจอ (tablet)" },
  { name: "headline-md", spec: "24 / 32 / 600", use: "หัวหน้าจอ (mobile), หัว section" },
  { name: "title-lg", spec: "20 / 28 / 600", use: "หัว card, ยอดรวมรายการ" },
  { name: "body-lg", spec: "18 / 28 / 400", use: "body เน้น" },
  { name: "body-md", spec: "16 / 24 / 400", use: "body มาตรฐาน" },
  { name: "label-lg", spec: "14 / 20 / 500 / +0.01em", use: "label ปุ่ม/ฟอร์ม/chip" },
  { name: "label-sm", spec: "12 / 16 / 500", use: "caption, label แท็บล่าง" },
] as const;

export const RADII = [
  { name: "xs", px: 4, use: "badge, มุมบนแท่งกราฟ" },
  { name: "sm", px: 8, use: "input, ปุ่มรอง" },
  { name: "md", px: 12, use: "card, KPI, product tile" },
  { name: "lg", px: 16, use: "FAB, modal, bottom sheet" },
  { name: "xl", px: 24, use: "hero container" },
  { name: "full", px: 9999, use: "ปุ่ม CTA, chip, stepper, avatar" },
] as const;

export const SHADOWS = [
  { name: "card", use: "list / product card (7×)" },
  { name: "raised", use: "sticky bar, FAB (27×)" },
  { name: "nav", use: "bottom nav — เงาพุ่งขึ้น (14×)" },
  { name: "overlay", use: "modal, bottom sheet (7×)" },
  { name: "primary", use: "CTA glow" },
] as const;

export const LAYOUT_TOKENS = [
  { name: "--spacing-app-bar", use: "ความสูง top app bar" },
  { name: "--spacing-bottom-nav", use: "ความสูง bottom nav (ไม่รวม safe area)" },
  { name: "--spacing-fab-inset", use: "ระยะ FAB จากขอบล่าง" },
  { name: "--spacing-touch", use: "touch target ขั้นต่ำ (NFR-1)" },
  { name: "--container-content", use: "ความกว้างเนื้อหาสูงสุด" },
  { name: "--container-bill-pane", use: "คอลัมน์บิลขวาใน split view (FR-3.8)" },
] as const;

export const Z_LADDER = [
  { name: "z-sticky", z: 10, use: "sticky sub-header, รางแถบ chip" },
  { name: "z-appbar", z: 30, use: "top app bar" },
  { name: "z-nav", z: 40, use: "bottom nav / side nav" },
  { name: "z-fab", z: 45, use: "FAB" },
  { name: "z-scrim", z: 50, use: "ฉากหลังทึบ" },
  { name: "z-sheet", z: 60, use: "modal / bottom sheet" },
  { name: "z-toast", z: 70, use: "toast" },
] as const;

/** ชื่อโฟลเดอร์ mockup ทั้ง 28 — whitelist สำหรับ route /dev/mockup/[id] */
export const MOCKUP_IDS = [
  "dashboard_mobile",
  "dashboard_tablet",
  "mobile_1",
  "mobile_2",
  "mobile_3",
  "mobile_4",
  "mobile_5",
  "mobile_6",
  "mobile_7",
  "mobile_8",
  "mobile_9",
  "mobile_10",
  "mobile_11",
  "mobile_12",
  "style_guide_mobile_2bb14f_green",
  "style_guide_tablet_split_view_2bb14f_green",
  "tablet_1",
  "tablet_2",
  "tablet_3",
  "tablet_4",
  "tablet_5",
  "tablet_6",
  "tablet_7",
  "tablet_8",
  "tablet_9",
  "tablet_10",
  "tablet_11",
  "tablet_split_view",
] as const;

export type MockupId = (typeof MOCKUP_IDS)[number];
