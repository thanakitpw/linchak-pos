import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * รวม class แล้ว dedupe แบบรู้ความหมายของ Tailwind
 * (เขียนมือ ไม่ได้มาจาก `shadcn init` — เราไม่รัน init เพราะมันจะทับ --radius-*)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
