import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Supabase client สำหรับ client component
 *
 * ใช้ publishable key ซึ่งถูกส่งไปกับหน้าเว็บอยู่แล้ว — ความปลอดภัยมาจาก RLS
 * ไม่ใช่การซ่อน key (ดู docs/data-model.md §9)
 *
 * `createBrowserClient` เป็น singleton อยู่แล้ว เรียกกี่ครั้งก็ได้ instance เดิม
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
