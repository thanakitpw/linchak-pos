import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Supabase client สำหรับ server component / server action / route handler
 *
 * ⚠️ ต้องสร้างใหม่ทุก request ห้ามเก็บไว้ในตัวแปร module-level
 * เพราะ session ผูกกับ cookie ของ request นั้น — ใช้ instance ร่วมกันคือสลับตัวตนผู้ใช้
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // server component เขียน cookie ไม่ได้ — ปล่อยผ่านได้
            // เพราะ proxy.ts รีเฟรช session ให้อยู่แล้วก่อนถึงตรงนี้
          }
        },
      },
    }
  );
}

/**
 * คืน user ที่ผ่านการยืนยันกับ Supabase Auth แล้ว หรือ null
 *
 * ⚠️ ใช้ `getUser()` ไม่ใช่ `getSession()` สำหรับการตัดสินใจฝั่ง server
 * getSession() อ่านจาก cookie ตรงๆ ซึ่งผู้ใช้แก้ได้ ส่วน getUser() ยิงไปตรวจกับ Auth server
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
