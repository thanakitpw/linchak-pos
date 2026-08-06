/**
 * ICON_NAMES — allow-list ของ Material Symbols Outlined ที่แอปนี้ใช้ได้
 *
 * mockup 28 ไฟล์ใช้ไอคอน 61 ชื่อ ยุบเหลือ 42 (ตาราง synonym อยู่ใน docs/design-system.md)
 * ไฟล์นี้คือ input ของ `pnpm icons:build` ซึ่งดึง subset woff2 (~7.5 KB) จาก Google
 *
 * เพิ่มไอคอน:
 *   1. เติมชื่อในลิสต์นี้ (ต้องเป็นชื่อจริงใน Material Symbols)
 *   2. pnpm icons:build
 *   3. commit src/assets/fonts/material-symbols-subset.woff2
 * ก่อนเพิ่ม ให้ดูก่อนว่ามีตัวที่สื่อความหมายเดียวกันอยู่แล้วหรือไม่
 */
export const ICON_NAMES = [
  "account_balance",
  "account_circle",
  "add",
  "add_a_photo",
  "arrow_back",
  "arrow_forward",
  "calendar_month",
  "check",
  "check_circle",
  "chevron_right",
  "close",
  "content_copy",
  "delete",
  "download",
  "edit",
  "error",
  "expand_more",
  "filter_list",
  "help",
  "image",
  "info",
  "inventory_2",
  "leaderboard",
  "lock",
  "mail",
  "menu",
  "more_vert",
  "payments",
  "point_of_sale",
  "qr_code_scanner",
  "receipt_long",
  "remove",
  "search",
  "settings",
  "share",
  "shopping_cart",
  "storefront",
  "trending_down",
  "trending_up",
  "visibility",
  "visibility_off",
  "warning",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/**
 * แท็บล่าง / side nav — ชุดเดียวตาม PRD §4
 * ชุดแท็บอีก 3 แบบที่เจอใน mockup ([สรุป·กำไร·รายการ], [หน้าหลัก·การขาย·ต้นทุน·รายงาน])
 * เป็นซากจากการ iterate ไม่ใช้
 * ⚙️ ตั้งค่า อยู่ที่ top app bar (mobile) / ท้าย side nav (tablet) ไม่ใช่แท็บ
 */
export const NAV_TABS = [
  { key: "sell", href: "/", icon: "point_of_sale" },
  { key: "products", href: "/products", icon: "inventory_2" },
  { key: "costs", href: "/costs", icon: "payments" },
  { key: "reports", href: "/reports", icon: "leaderboard" },
] as const satisfies ReadonlyArray<{ key: string; href: string; icon: IconName }>;
