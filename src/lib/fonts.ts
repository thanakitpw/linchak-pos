import { IBM_Plex_Sans_Thai } from "next/font/google";
import localFont from "next/font/local";

/**
 * IBM Plex Sans Thai — family เดียวสำหรับทั้งไทยและ Latin
 *
 * ไม่โหลด IBM Plex Sans แยกอีกตัว: Plex Sans Thai มี subset `latin` ครบอยู่แล้ว
 * และวาดมาให้เข้าคู่กับ Plex Sans โดยตรง — โหลดสองตัวคือเสียเปล่า และเสี่ยงให้
 * ไทยกับ Latin ไม่เข้ากันกลางประโยค ซึ่งในแอปนี้คือทุกประโยค ("ยอดขาย 1,250.00 ฿")
 *
 * งบ: ~104 KB (thai+latin × 4 น้ำหนัก, woff2) — asset ใหญ่สุดใน foundation
 * ถ้า Lighthouse-4G ชี้ว่าฟอนต์เป็นตัวบล็อก LCP: ตัดน้ำหนัก 600 ออก (−26 KB)
 * แล้ว remap title-lg/headline-* ไป 700 — ห้ามตัด 500 (คือ label-lg/label-sm)
 */
export const plexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-thai",
  display: "swap",
  preload: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Noto Sans Thai", "sans-serif"],
  // metric ที่ next/font คำนวณ fallback ให้อัตโนมัติอิงจาก Latin — ใช้กับไทยแล้วขนาดเพี้ยน
  adjustFontFallback: false,
});

/**
 * Material Symbols Outlined — subset 42 ไอคอน (~7.5 KB)
 * สร้างด้วย `pnpm icons:build` (ดู scripts/fetch-icon-font.mjs)
 *
 * display: "block" ไม่ใช่ "swap"
 * ฟอนต์นี้ใช้ ligature — ข้อความใน element คือชื่อไอคอน ("point_of_sale")
 * ถ้า swap ผู้ใช้จะเห็นคำว่า point_of_sale ในแท็บล่างจริงๆ จนกว่าฟอนต์จะโหลดเสร็จ
 * block ให้ช่วงมองไม่เห็นสั้นๆ แล้วค่อยแสดง ซึ่งเป็นพฤติกรรมที่ถูกสำหรับ icon font
 */
export const materialSymbols = localFont({
  src: "../assets/fonts/material-symbols-subset.woff2",
  variable: "--font-material-symbols",
  display: "block",
  weight: "400",
  style: "normal",
  preload: true,
});

export const fontVariables = `${plexThai.variable} ${materialSymbols.variable}`;
