import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 เปลี่ยนชื่อ Middleware เป็น Proxy — ไฟล์นี้คือ `middleware.ts` เดิม
 * มีได้ไฟล์เดียวต่อโปรเจค ตรรกะจริงแยกไว้ที่ src/lib/supabase/proxy.ts
 *
 * ⚠️ ห้ามเพิ่ม next-intl middleware ที่นี่ (CLAUDE.md ข้อ 20)
 * ภาษาเป็น setting ของร้าน อ่านจาก cookie ไม่ใช่จาก URL จึงไม่ต้องมี middleware ของ i18n เลย
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // ข้ามไฟล์ static และรูป — ไม่มีเหตุผลให้รีเฟรช session ให้ favicon
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
