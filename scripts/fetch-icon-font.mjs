#!/usr/bin/env node
/**
 * สร้าง src/assets/fonts/material-symbols-subset.woff2 จาก ICON_NAMES
 *
 *   pnpm icons:build   → เขียนไฟล์ใหม่
 *   pnpm icons:check   → exit 1 ถ้าไฟล์ที่ commit ไว้ไม่ตรงกับ ICON_NAMES ปัจจุบัน (ใช้ใน CI)
 *
 * ข้อกำหนดของ Google Fonts API สองข้อที่ไม่มีในเอกสาร (verify จากของจริง):
 *   1. `icon_names` ต้องเรียงตามตัวอักษร ไม่งั้นตอบ "400: Invalid selector"
 *   2. User-Agent ต้องเหมือน browser จริง ไม่งั้นได้ TTF (ใหญ่กว่า ~4 เท่า) แทน woff2
 *
 * เลือกแกน `opsz,wght,FILL,GRAD@24,400,0..1,0` — เปิดเฉพาะ FILL ให้ variable
 * เพราะ mockup ใช้ FILL 1 (แท็บ active, chip ที่เลือก) 34 ครั้ง ส่วน wght/GRAD/opsz
 * เป็น 400/0/24 เสมอ  → 7.5 KB เทียบกับ 39 KB ถ้าเปิดทุกแกน
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "src/assets/fonts/material-symbols-subset.woff2");
const ICONS_TS = resolve(ROOT, "src/lib/icons.ts");

const AXES = "opsz,wght,FILL,GRAD@24,400,0..1,0";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** อ่าน ICON_NAMES จาก icons.ts โดยไม่ต้องพึ่ง TS loader */
async function readIconNames() {
  const src = await readFile(ICONS_TS, "utf8");
  const block = src.match(/export const ICON_NAMES = \[([\s\S]*?)\] as const;/);
  if (!block) throw new Error("อ่าน ICON_NAMES จาก src/lib/icons.ts ไม่ได้");
  const names = [...block[1].matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]);
  if (names.length === 0) throw new Error("ICON_NAMES ว่าง");
  return names;
}

async function fetchSubset(names) {
  // ข้อกำหนดที่ 1: ต้องเรียง
  const sorted = [...new Set(names)].sort();
  const cssUrl =
    `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:${AXES}` +
    `&icon_names=${sorted.join(",")}`;

  // ข้อกำหนดที่ 2: ต้อง spoof UA
  const cssRes = await fetch(cssUrl, { headers: { "User-Agent": UA } });
  const css = await cssRes.text();
  if (!cssRes.ok) throw new Error(`Google Fonts ตอบ ${cssRes.status}:\n${css.slice(0, 400)}`);
  if (!css.includes("format('woff2')")) {
    throw new Error(`คาดหวัง woff2 แต่ได้:\n${css.slice(0, 400)}`);
  }

  const fontUrl = css.match(/https:\/\/fonts\.gstatic\.com[^)]+/)?.[0];
  if (!fontUrl) throw new Error(`หา URL ฟอนต์ใน CSS ไม่เจอ:\n${css.slice(0, 400)}`);

  const fontRes = await fetch(fontUrl, { headers: { "User-Agent": UA } });
  if (!fontRes.ok) throw new Error(`ดาวน์โหลดฟอนต์ล้มเหลว: ${fontRes.status}`);
  const buf = Buffer.from(await fontRes.arrayBuffer());
  if (buf.subarray(0, 4).toString("latin1") !== "wOF2") {
    throw new Error("ไฟล์ที่ได้ไม่ใช่ woff2 (magic number ไม่ตรง)");
  }
  return { buf, sorted };
}

const sha = (b) => createHash("sha256").update(b).digest("hex").slice(0, 16);

const isCheck = process.argv.includes("--check");
const names = await readIconNames();
const { buf, sorted } = await fetchSubset(names);

if (isCheck) {
  let current;
  try {
    current = await readFile(OUT);
  } catch {
    console.error(`✗ ไม่มีไฟล์ ${OUT} — รัน \`pnpm icons:build\` แล้ว commit`);
    process.exit(1);
  }
  if (sha(current) !== sha(buf)) {
    console.error(
      `✗ icon font ไม่ตรงกับ ICON_NAMES (${sorted.length} ไอคอน)\n` +
        `  committed: ${sha(current)}  expected: ${sha(buf)}\n` +
        `  รัน \`pnpm icons:build\` แล้ว commit ไฟล์ที่ได้`
    );
    process.exit(1);
  }
  console.log(`✓ icon font ตรงกับ ICON_NAMES (${sorted.length} ไอคอน, ${buf.length} B)`);
} else {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, buf);
  console.log(`✓ เขียน ${OUT}\n  ${sorted.length} ไอคอน · ${buf.length} B · sha ${sha(buf)}`);
}
