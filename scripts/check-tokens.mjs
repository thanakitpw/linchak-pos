#!/usr/bin/env node
/**
 * lint:tokens — guard ที่บังคับวินัย design system + i18n แบบ mechanical
 *
 * ESLint (better-tailwindcss/no-unregistered-classes) จับ class ที่ "ไม่มีอยู่จริง" ได้ดีกว่า
 * สคริปต์นี้จับสิ่งที่ ESLint มองไม่เห็น: arbitrary value ที่ valid แต่ผิดนโยบาย,
 * ข้อความไทย hardcode, และ import ที่ห้าม
 *
 *   pnpm lint:tokens
 */
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "../..");
const SRC = join(ROOT, "src");
const EXTS = new Set([".ts", ".tsx", ".css"]);

/**
 * กฎที่ตรวจ "class ที่เขียนใน JSX" ใช้กับ .ts/.tsx เท่านั้น
 * ไฟล์ .css คือที่ที่เรานิยาม token และเขียนคอมเมนต์อธิบายว่าอะไรถูกยกเลิกไปแล้ว
 * ถ้าเอากฎไปจับด้วยจะโดนคอมเมนต์ของตัวเองทุกครั้ง
 */
const TSX_ONLY = /\.tsx?$/;

/** @type {{id: string, re: RegExp, msg: string, skip?: RegExp, only?: RegExp}[]} */
const RULES = [
  {
    id: "arbitrary-shadow",
    re: /\bshadow-\[/g,
    msg: "ใช้ shadow-card | raised | nav | overlay | primary",
    only: TSX_ONLY,
  },
  {
    id: "hex-literal",
    re: /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|shadow|accent|caret|divide|placeholder)-\[#[0-9a-fA-F]/g,
    msg: "ใช้ color token — ถ้าไม่มีให้เพิ่มใน theme.css แล้วบันทึกใน docs/design-system.md",
    only: TSX_ONLY,
  },
  {
    id: "arbitrary-radius",
    re: /\brounded(?:-[a-z]+)?-\[/g,
    msg: "ใช้ rounded-xs | sm | md | lg | xl | full",
    only: TSX_ONLY,
  },
  {
    id: "arbitrary-font-size",
    re: /\btext-\[\d+(?:px|rem)\]/g,
    msg: "ใช้ type step — ถ้าเป็นขนาดไอคอนให้ใช้ <Icon size={…}/>",
    only: TSX_ONLY,
  },
  {
    id: "legacy-font-alias",
    re: /\bfont-(?:display-lg|headline-lg|headline-md|title-lg|body-lg|body-md|label-lg|label-sm)(?![\w-])/g,
    msg: "font-<step> ใน mockup เป็น no-op — ลบทิ้ง family มาจาก <body>",
    only: TSX_ONLY,
  },
  {
    id: "legacy-named-spacing",
    re: /(?<![\w-])-?(?:p|m|gap|space-[xy]|inset)[trblxy]?-(?:xs|sm|md|lg|xl|unit|gutter|container-margin)(?![\w-])/g,
    msg: "ใช้เลข Tailwind: px-md→px-4, py-sm→py-2, gap-gutter→gap-3, p-lg→p-6, p-xl→p-8",
    only: TSX_ONLY,
  },
  {
    // `(?![\w-])` ไม่ใช่ `\b` — ไม่งั้น text-label จะจับ text-label-lg ที่ถูกต้องด้วย
    id: "ghost-type-token",
    re: /(?<![\w-])text-(?:display-lg-mobile|headline-lg-mobile|headline-md-mobile|title-lg-mobile|body-md-mobile|label-md|h1|h2|h3|label)(?![\w-])/g,
    msg: "ghost token — ไม่มี type token ลงท้าย -mobile ใช้ text-X md:text-Y แทน",
    only: TSX_ONLY,
  },
  {
    id: "cleared-default-utility",
    re: /(?<![\w-])(?:shadow-(?:2xs|xs|sm|md|lg|xl|2xl)|rounded-(?:2xl|3xl|4xl)|text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl))(?![\w-])/g,
    msg: "default scale ของ Tailwind ถูกเคลียร์ไปแล้ว ใช้ token ของโปรเจค",
    only: TSX_ONLY,
  },
  {
    // `(?=\S)` สำคัญ: variant ของ Tailwind ไม่มีช่องว่างหลัง colon เสมอ (dark:bg-black)
    // ส่วน object key ใน JS มี ({ dark: "#121c28" }) — ไม่งั้นจะฟ้อง option ของ lib อื่น
    id: "dark-variant",
    re: /(?<![\w-])dark:(?=\S)/g,
    msg: "MVP เป็น light-only — dark: คือโค้ดตายที่โกหกว่าถูกทดสอบแล้ว",
    only: TSX_ONLY,
    skip: /^src\/components\/ui\//,
  },
  {
    id: "hardcoded-thai",
    re: /[฀-๿]/g,
    msg: "ห้าม hardcode ข้อความไทย (รวม aria-label / placeholder / alt / title / toast) — ใช้ next-intl",
    only: TSX_ONLY,
    // messages/ คือปลายทางที่ถูกต้อง · test อ่านง่ายกว่าถ้าเขียนไทยตรงๆ
    // dev/ ไม่เคยขึ้น production (gate ด้วย NODE_ENV) จึงไม่อยู่ใต้ NFR-2
    //
    // banks.ts ยกเว้นเพราะเป็น **ตารางอ้างอิง ไม่ใช่ copy ของ UI**:
    // ชื่อธนาคารเป็นวิสามานยนาม มี th/en อยู่คู่กันในแถวเดียวกับรหัสและสีแบรนด์
    // ถ้าแยกไป messages/ จะได้ 30 key ที่ต้องคอยจับคู่กับ code เอง ซึ่งพลาดง่ายกว่ามาก
    // เจตนาของกฎ (ผู้ใช้ต้องไม่เจอไทยที่แปลไม่ได้) ยังอยู่ครบ — component เลือกตาม locale
    skip: /^src\/messages\/|\.test\.tsx?$|^src\/(?:app\/dev|components\/dev)\/|^src\/lib\/(?:design-tokens|banks)\.ts$/,
  },
  {
    id: "lucide-import",
    re: /from\s+["']lucide-react["']/g,
    msg: "ใช้ <Icon name=…/> (Material Symbols) — lucide ใช้ได้เฉพาะภายใน src/components/ui/",
    skip: /^src\/components\/ui\//,
  },
  {
    /**
     * เคยพังของจริงบน production: บัญชีที่เป็นทั้งเจ้าของร้านและ platform admin
     * กดออกบิลไม่ได้ เพราะ query นี้คืน "ร้านของลูกค้าอีกคน" — policy ตอนนั้น
     * ให้ admin เห็นทุกร้าน และ limit 1 ที่ไม่มี order by ไม่รับประกันลำดับ
     * (หน้าตั้งค่าก็กำลังโชว์เลข PromptPay ของร้านคนอื่นอยู่ด้วย)
     *
     * แก้ policy แล้ว แต่ pattern นี้ยังไม่ปลอดภัยอยู่ดีถ้าคนหนึ่งมีหลายร้าน
     */
    id: "workspace-limit1",
    re: /from\(\s*["']workspaces["']\s*\)[\s\S]{0,300}?\.limit\(\s*1\s*\)/g,
    msg: "ห้าม from('workspaces')…limit(1) — ใช้ currentWorkspaceId() แล้ว .eq('id', …) (ดู src/lib/workspace.ts)",
  },
];

/** บรรทัดที่จงใจยกเว้น: ต่อท้ายด้วย `lint-tokens-ok` */
const ALLOW = /lint-tokens-ok/;

/**
 * แทนที่เนื้อในคอมเมนต์ด้วยช่องว่าง (คงจำนวนบรรทัด/คอลัมน์ไว้เท่าเดิม)
 *
 * จำเป็นเพราะเราเขียนคอมเมนต์เป็นภาษาไทย และคอมเมนต์เหล่านั้นอธิบาย class ที่
 * "ห้ามใช้" อยู่ตลอด — ถ้าไม่ตัดออกก่อน guard จะฟ้องเอกสารของตัวเองทุกบรรทัด
 *
 * เดินทีละตัวอักษรเพื่อไม่ให้ `//` ใน "https://…" หรือใน string ถูกนับเป็นคอมเมนต์
 */
function stripComments(src) {
  const out = [...src];
  let i = 0;
  const n = src.length;
  const blank = (from, to) => {
    for (let k = from; k < to; k++) if (out[k] !== "\n") out[k] = " ";
  };

  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    if (c === "/" && next === "/") {
      const end = src.indexOf("\n", i);
      blank(i, end === -1 ? n : end);
      i = end === -1 ? n : end;
    } else if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      blank(i, end === -1 ? n : end + 2);
      i = end === -1 ? n : end + 2;
    } else if (c === '"' || c === "'" || c === "`") {
      // ข้าม string ทั้งก้อน (รวม escape) เพื่อไม่ให้ // ข้างในถูกตีความผิด
      i++;
      while (i < n && src[i] !== c) i += src[i] === "\\" ? 2 : 1;
      i++;
    } else {
      i++;
    }
  }
  return out.join("");
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTS.has(extname(entry.name))) yield full;
  }
}

const violations = [];

for await (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const source = await readFile(file, "utf8");
  // ตรวจกฎกับซอร์สที่ตัดคอมเมนต์แล้ว แต่หา `lint-tokens-ok` จากบรรทัดดั้งเดิม
  // (เพราะ escape hatch ตัวนั้นเขียนอยู่ในคอมเมนต์เสมอ)
  const rawLines = source.split("\n");
  const lines = stripComments(source).split("\n");

  for (const rule of RULES) {
    if (rule.only && !rule.only.test(rel)) continue;
    if (rule.skip?.test(rel)) continue;

    lines.forEach((line, i) => {
      if (ALLOW.test(rawLines[i])) return;
      rule.re.lastIndex = 0;
      const m = rule.re.exec(line);
      if (m) {
        violations.push({
          file: rel,
          line: i + 1,
          col: m.index + 1,
          rule: rule.id,
          match: m[0],
          msg: rule.msg,
        });
      }
    });
  }
}

if (violations.length === 0) {
  console.log("✓ lint:tokens ผ่าน");
  process.exit(0);
}

const byRule = new Map();
for (const v of violations) {
  if (!byRule.has(v.rule)) byRule.set(v.rule, []);
  byRule.get(v.rule).push(v);
}

for (const [rule, list] of byRule) {
  console.error(`\n✗ ${rule} — ${list[0].msg}`);
  for (const v of list) {
    console.error(`    ${v.file}:${v.line}:${v.col}  ${JSON.stringify(v.match)}`);
  }
}
console.error(`\n${violations.length} จุดที่ต้องแก้ (ดู docs/design-system.md § migration table)`);
process.exit(1);
