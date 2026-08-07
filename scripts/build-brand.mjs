#!/usr/bin/env node
/**
 * ย่อโลโก้ต้นฉบับใน brand/ ให้เป็น asset ที่แอปใช้จริง
 *
 *   pnpm brand:build   → เขียนไฟล์ใหม่ทั้งชุด
 *
 * ต้นฉบับอยู่ที่ brand/ (ไม่ถูก build เพราะอยู่นอก source("../") ของ Tailwind)
 * ผลลัพธ์ commit ไว้ใน repo — สคริปต์นี้รันเฉพาะตอนแบรนด์เปลี่ยน ไม่ได้อยู่ใน CI
 *
 * สามเรื่องที่ต้องรู้ ไม่งั้นได้ไฟล์ที่ผิดแบบเงียบๆ:
 *
 * 1. **apple-icon ต้องทึบและเต็มสี่เหลี่ยม** — iOS ใส่มุมมนให้เอง
 *    ถ้าปล่อยมุมโปร่งใสไว้จะได้มุมมนซ้อนมุมมน และบางเวอร์ชันเติมดำที่มุม
 *    จึง flatten ทับด้วยสีน้ำเงินเดียวกับพื้นโลโก้ ขอบเลยเนียนไปกับพื้น
 *
 * 2. **dither: 0** — โลโก้เป็นสีแบน 3 สี การ dither โปรยจุดรบกวนลงพื้นเรียบ
 *    ทำให้ไฟล์ใหญ่ขึ้น ~15 เท่า (512px: 109 KB → 17 KB) โดยตาไม่เห็นความต่าง
 *
 * 3. **sharp มาจาก next** ไม่ได้เป็น dependency ตรงของโปรเจค
 *    (Next ใช้ทำ image optimization) จึงต้อง resolve ผ่าน path ของ next
 */
import { createRequire } from "node:module";
import { mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let sharp;
try {
  sharp = require(require.resolve("sharp", { paths: [require.resolve("next")] }));
} catch {
  console.error("หา sharp ไม่เจอ — ต้องรัน pnpm install ก่อน (sharp มากับ next)");
  process.exit(1);
}

const ICON = resolve(ROOT, "brand/app-icon-master.png");
const WORDMARK = resolve(ROOT, "brand/wordmark-master.png");

/** พื้นน้ำเงินของโลโก้ — sample จาก brand/app-icon-master.png */
const NAVY = "#012555";

/** โลโก้ใช้สีจริงไม่ถึง 10 สี palette 64 จึงไม่มีการสูญเสียที่ตาเห็น */
const PNG = { palette: true, colours: 64, dither: 0, effort: 10, compressionLevel: 9 };
const RESIZE = { kernel: "lanczos3" };

const TASKS = [
  {
    out: "src/app/icon.png",
    why: "favicon ในแท็บ — เล็กแต่ต้องคม",
    build: (s) => s.resize(32, 32, RESIZE),
  },
  {
    out: "src/app/icon1.png",
    why: "จอความละเอียดสูง / Android / ผลค้นหา",
    build: (s) => s.resize(512, 512, RESIZE),
  },
  {
    out: "src/app/apple-icon.png",
    why: "หน้าจอโฮมของ iPhone — ทึบเต็มสี่เหลี่ยม iOS ใส่มุมมนเอง",
    build: (s) => s.resize(180, 180, RESIZE).flatten({ background: NAVY }),
  },
  {
    out: "src/assets/brand/logo-wordmark.png",
    src: WORDMARK,
    why: "โลโก้แบบมีชื่อแบรนด์ ใช้ในหน้า auth (แสดงสูง 40-48px จึงพอที่ 3x)",
    build: (s) => s.resize({ width: 640, ...RESIZE }),
  },
];

for (const task of TASKS) {
  const out = resolve(ROOT, task.out);
  await mkdir(dirname(out), { recursive: true });
  await task.build(sharp(task.src ?? ICON)).png(PNG).toFile(out);
  const { size } = await stat(out);
  console.log(`✓ ${task.out.padEnd(38)} ${String(size).padStart(6)} B   ${task.why}`);
}
