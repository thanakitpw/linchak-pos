import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * ขั้น type ทั้ง 8 ของเรา (`--text-*` ใน theme.css) และ shadow ทั้ง 5 (`--shadow-*`)
 *
 * ⚠️ ต้องสอนให้ tailwind-merge รู้จัก ไม่งั้นมันจะเดาผิด:
 * default config มองว่า `text-<อะไรก็ได้>` คือ "สีตัวอักษร" (validator เป็น isAny)
 * `text-title-lg` จึงถูกจัดกลุ่มเดียวกับ `text-on-primary` แล้ว **ลบตัวแรกทิ้งเงียบๆ**
 * → ปุ่ม CTA (`bg-primary text-on-primary` + size lg ที่เติม `text-title-lg`)
 *   เหลือแต่ขนาด ไม่มีสี ตัวหนังสือเลย inherit สีเข้มมาทับพื้นเขียว
 * เรื่องเดียวกันกับ shadow: `shadow-card` ถูกมองเป็น "สีเงา" ไม่ใช่ตัวเงา
 *
 * เพิ่ม token ใน theme.css เมื่อไหร่ ต้องมาเติมที่นี่ด้วย
 */
const TEXT_STEPS = [
  "display-lg",
  "headline-lg",
  "headline-md",
  "title-lg",
  "body-lg",
  "body-md",
  "label-lg",
  "label-sm",
] as const;

const SHADOWS = ["card", "raised", "nav", "overlay", "primary"] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TEXT_STEPS] }],
      shadow: [{ shadow: [...SHADOWS] }],
    },
  },
});

/**
 * รวม class แล้ว dedupe แบบรู้ความหมายของ Tailwind
 * (เขียนมือ ไม่ได้มาจาก `shadcn init` — เราไม่รัน init เพราะมันจะทับ --radius-*)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
