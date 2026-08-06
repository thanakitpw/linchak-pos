import { redirect } from "next/navigation";
import type { Route } from "next";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * ปลายทางของลิงก์ที่ Supabase ส่งไปในอีเมล (ยืนยันอีเมล / ตั้งรหัสผ่านใหม่)
 *
 * แลก token_hash เป็น session แล้วพาไปต่อ
 * ⚠️ `next` มาจาก URL ที่ผู้ใช้กดมา จึงต้องบังคับให้เป็น path ภายในเท่านั้น
 *    ไม่งั้นกลายเป็น open redirect ที่พาไปเว็บฟิชชิ่งได้
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const raw = url.searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    // cast เพราะ typedRoutes ตรวจ path ตอน compile แต่ค่านี้มาตอน runtime
    // ความปลอดภัยมาจากการกรอง startsWith("/") ข้างบน ไม่ใช่จาก type
    if (!error) redirect(next as Route);
  }

  redirect("/login");
}
