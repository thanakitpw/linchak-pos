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
 *    จึง flatten ทับด้วยสีเดียวกับพื้นโลโก้ ขอบเลยเนียนไปกับพื้น
 *
 * 2. **dither: 0** — โลโก้เป็นสีแบน 3 สี การ dither โปรยจุดรบกวนลงพื้นเรียบ
 *    ทำให้ไฟล์ใหญ่ขึ้นหลายเท่าโดยตาไม่เห็นความต่าง
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

/**
 * สีในไอคอน — sample จาก brand/app-icon-master.png
 * พื้นเป็นสีที่ใช้เติมเวลา flatten/extend ด้วย จึงต้องตรงกับของจริงเป๊ะ
 */
const ICON_BG = "#1fa54c";
const ICON_COLOURS = [
  [0x1f, 0xa5, 0x4c], // เขียว — พื้น
  [0x01, 0x27, 0x53], // น้ำเงิน — ลิ้นชัก
];

/** โลโก้ใช้สีจริงไม่ถึง 10 สี palette 64 จึงไม่มีการสูญเสียที่ตาเห็น */
const PNG = { palette: true, colours: 64, dither: 0, effort: 10, compressionLevel: 9 };
const RESIZE = { kernel: "lanczos3" };

/**
 * ระยะที่ถือว่า "เป็นสีเดียวกัน"
 *
 * ต้อง ≥17 เพราะต้นฉบับมี**ขอบเข้มบางๆ รอบกรอบสี่เหลี่ยมมน** rgb(17,162,59)
 * ซึ่งห่างจากพื้น 17 หน่วย — บนไอคอนปกติมันคือ silhouette ด้านนอกสุด มองไม่เห็น
 * แต่บน maskable ที่เราเติมพื้นล้อมรอบ ขอบนั้นจะกลายเป็น**วงแหวนกลางพื้นเรียบ**
 * (298 px แต่ตาจับได้ทันทีเพราะเป็นเส้นต่อเนื่อง)
 *
 * ตั้ง 24 เผื่อไว้ — ยังห่างจากสีที่ตั้งใจเหลือเฟือ (น้ำเงิน 126, ขาว 224)
 * กินขอบ antialias ไป ~11% ของช่วงไล่สี ซึ่งเป็นระดับต่ำกว่า 1 พิกเซล
 */
const SNAP_DISTANCE = 24;

/**
 * ปรับสีในไอคอนให้เป็นค่าเดียวเป๊ะต่อสี ก่อนเข้ารหัส
 *
 * ⚠️ ขั้นนี้ห้ามข้าม — ไฟล์ต้นฉบับมีเฉดพื้น **6,226 เฉด** (ไล่โทนบางๆ + noise)
 * พอ flatten/extend ด้วยสีเดียว รอยต่อระหว่าง "พื้นแบนเป๊ะ" กับ "พื้นที่มี noise"
 * ห่างกันแค่ 1-3 หน่วย แต่ palette แยกเป็นคนละช่อง → กลายเป็นเส้นคมที่ตาจับได้
 * เห็นเป็นเงารูปสี่เหลี่ยมมนลอยอยู่กลางไอคอน maskable
 *
 * ระยะ 12 หน่วยครอบคลุม noise ทั้งหมด (พื้นกระจายจริง ±3) และห่างจากสีอื่นเหลือเฟือ:
 * ลิ้นชักน้ำเงินห่างจากพื้นเขียว 126 หน่วย · ขาวห่าง 224
 * ขอบ antialias เสียแค่ปลายสุด ~5% ของช่วงไล่สี ซึ่งมองไม่เห็น
 *
 * ⚠️ ใช้กับ **ไอคอนเท่านั้น** — ตัวอักษรใน wordmark เป็น #002546 ซึ่งห่างจาก
 * น้ำเงินของลิ้นชัก (#012753) แค่ 13 หน่วย ถ้าเอาไปใช้กับ wordmark
 * จะเปลี่ยนสีตัวอักษรในโลโก้ทิ้งแบบเงียบๆ
 */
async function snapIconColours(pipeline) {
  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    for (const c of ICON_COLOURS) {
      if (
        Math.abs(data[i] - c[0]) <= SNAP_DISTANCE &&
        Math.abs(data[i + 1] - c[1]) <= SNAP_DISTANCE &&
        Math.abs(data[i + 2] - c[2]) <= SNAP_DISTANCE
      ) {
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        break;
      }
    }
  }
  return sharp(data, { raw: info });
}

const TASKS = [
  {
    out: "src/app/icon.png",
    why: "favicon ในแท็บ — เล็กแต่ต้องคม",
    snap: true,
    build: (s) => s.resize(32, 32, RESIZE),
  },
  {
    out: "src/app/icon1.png",
    why: "จอความละเอียดสูง / Android / ผลค้นหา",
    snap: true,
    build: (s) => s.resize(512, 512, RESIZE),
  },
  {
    out: "src/app/apple-icon.png",
    why: "หน้าจอโฮมของ iPhone — ทึบเต็มสี่เหลี่ยม iOS ใส่มุมมนเอง",
    snap: true,
    build: (s) => s.resize(180, 180, RESIZE).flatten({ background: ICON_BG }),
  },
  {
    out: "public/icons/icon-192.png",
    why: "manifest — ขนาดที่ Chrome ใช้ตัดสินว่าติดตั้งได้ไหม",
    snap: true,
    build: (s) => s.resize(192, 192, RESIZE),
  },
  {
    out: "public/icons/icon-512.png",
    why: "manifest purpose:any — URL ต้องนิ่ง จึงอยู่ใน public/ ไม่ใช่ app/",
    snap: true,
    build: (s) => s.resize(512, 512, RESIZE),
  },
  {
    out: "public/icons/icon-maskable-512.png",
    why: "manifest purpose:maskable — Android ครอบเป็นวงกลม/สี่เหลี่ยมมนตามธีมเครื่อง",
    snap: true,
    // ย่อโลโก้เหลือ 80% แล้วเติมสีพื้นรอบนอกจนเต็ม 512
    // เพราะ Android รับประกันแค่วงกลมเส้นผ่านศูนย์กลาง 80% ตรงกลาง นอกนั้นโดนตัดได้
    // ถ้าใส่รูปเต็มขนาดไป มุมสี่เหลี่ยมมนของโลโก้จะถูกเฉือนจนเห็นเป็นแหว่ง
    build: (s) =>
      s
        .resize(410, 410, RESIZE)
        .flatten({ background: ICON_BG })
        .extend({ top: 51, bottom: 51, left: 51, right: 51, background: ICON_BG }),
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
  // snap หลัง resize เสมอ — ทำก่อน resize ไม่ช่วย เพราะ interpolation
  // จะสร้างเฉดกลางๆ ขึ้นมาใหม่อยู่ดี
  const pipeline = task.build(sharp(task.src ?? ICON));
  await (task.snap ? await snapIconColours(pipeline) : pipeline).png(PNG).toFile(out);
  const { size } = await stat(out);
  console.log(`✓ ${task.out.padEnd(38)} ${String(size).padStart(6)} B   ${task.why}`);
}
