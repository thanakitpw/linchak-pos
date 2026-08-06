"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";
import { absoluteUrl } from "@/lib/public-url";

/** ค่าที่กรอกไว้ ส่งกลับไปเติมในฟอร์มเมื่อ submit ไม่ผ่าน — ไม่รวมรหัสผ่าน */
export type AuthState = {
  error?: string;
  ok?: string;
  values?: { email?: string; store_name?: string };
};

/**
 * ข้อความ error จาก Supabase เป็นภาษาอังกฤษและเปลี่ยนได้ตามเวอร์ชัน
 * แปลงเป็น key ของเราแล้วให้ next-intl แปล — ไม่โยนข้อความดิบให้ผู้ใช้เห็น
 *
 * เช็ค `code` ก่อนข้อความเสมอ เพราะข้อความเปลี่ยนบ่อยกว่ารหัส
 */
async function translateAuthError(
  err: { message: string; code?: string },
  fallbackKey: "signInFailed" | "signUpFailed"
) {
  const t = await getTranslations("auth");
  const code = err.code ?? "";
  const m = err.message.toLowerCase();

  // SMTP กลางของ Supabase จำกัด 2-3 ฉบับ/ชม. — เจอบ่อยตอนพัฒนา
  if (code === "over_email_send_rate_limit" || m.includes("email rate limit")) {
    return t("emailRateLimit");
  }
  if (code === "email_not_confirmed" || m.includes("email not confirmed")) {
    return t("emailNotConfirmed");
  }
  if (
    code === "user_already_exists" ||
    m.includes("already registered") ||
    m.includes("already been registered")
  ) {
    return t("emailTaken");
  }
  if (
    code === "weak_password" ||
    (m.includes("password") && (m.includes("weak") || m.includes("short") || m.includes("pwned")))
  ) {
    return t("weakPassword");
  }
  if (code === "email_address_invalid" || (m.includes("invalid") && m.includes("email"))) {
    return t("invalidEmail");
  }
  return t(fallbackKey);
}

/**
 * FR-1.4 · ภาษาเป็น setting ของร้าน
 * หลังล็อกอินสำเร็จ อ่าน workspaces.language แล้ว seed ลง cookie NEXT_LOCALE
 * เพื่อให้ทั้งแอปแสดงภาษาที่ร้านตั้งไว้ โดยไม่ต้องมี locale ใน URL
 */
async function seedLocaleFromWorkspace() {
  const supabase = await createClient();
  const { data } = await supabase.from("workspaces").select("language").limit(1).maybeSingle();
  if (isLocale(data?.language)) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, data.language, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || "/";

  if (!email || !password) return { error: t("requiredField"), values: { email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: await translateAuthError(error, "signInFailed"), values: { email } };
  }

  await seedLocaleFromWorkspace();
  // redirect() โยน exception เพื่อหยุด action — ต้องอยู่นอก try/catch เสมอ
  // cast เพราะ typedRoutes ตรวจตอน compile แต่ `next` มาจากฟอร์มตอน runtime
  // กัน open redirect ด้วยการบังคับให้ขึ้นต้นด้วย "/" และไม่ใช่ "//" (protocol-relative)
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safeNext as Route);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const storeName = String(formData.get("store_name") ?? "").trim();

  const values = { email, store_name: storeName };
  if (!email || !password || !storeName) return { error: t("requiredField"), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // trigger app.handle_new_user() อ่านค่านี้ไปตั้งชื่อร้าน (FR-0.2)
      // ⚠️ raw_user_meta_data ผู้ใช้แก้เองได้ — ใช้ได้แค่กับข้อมูลที่ไม่ใช่สิทธิ์
      //    ห้ามเอาไปตัดสินใจเรื่อง authorization เด็ดขาด
      data: { store_name: storeName },
    },
  });
  if (error) return { error: await translateAuthError(error, "signUpFailed"), values };

  // ถ้าโปรเจคตั้งให้ต้องยืนยันอีเมล signUp จะไม่คืน session มา
  // เข้าแอปเลยไม่ได้ ต้องบอกให้ไปเปิดอีเมลก่อน ไม่ใช่ปล่อยให้ redirect แล้วเด้งกลับมาเงียบๆ
  if (!data.session) return { ok: t("needsEmailConfirm") };

  redirect("/");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const t = await getTranslations("auth");
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: t("requiredField") };

  const supabase = await createClient();
  // ลิงก์ในอีเมลต้องพากลับมาที่ /auth/confirm เพื่อแลก token เป็น session ก่อน
  // แล้วค่อยส่งต่อไปหน้าตั้งรหัสใหม่ · ถ้าไม่ระบุ Supabase จะพาไป Site URL เฉยๆ
  // ซึ่งเป็นหน้าแรกของแอป และผู้ใช้จะไม่มีทางตั้งรหัสใหม่ได้เลย
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await absoluteUrl("/auth/confirm?next=/reset-password/new"),
  });

  // ตอบเหมือนกันเสมอไม่ว่าอีเมลจะมีในระบบหรือไม่
  // ถ้าตอบต่างกัน หน้านี้จะกลายเป็นเครื่องมือเช็คว่าใครสมัครไว้บ้าง
  return { ok: t("resetSent") };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * ตั้งรหัสผ่านใหม่หลังกดลิงก์จากอีเมล — FR-0.1
 *
 * ลิงก์ในอีเมลผ่าน /auth/confirm ซึ่งแลก token เป็น session ให้แล้ว
 * ที่นี่จึงเป็นแค่ `updateUser` ของ session ที่มีอยู่ ไม่ได้รับ token อะไรมาเอง
 * ⚠️ ถ้าไม่มี session แปลว่าลิงก์หมดอายุหรือถูกใช้ไปแล้ว ต้องบอกให้ชัด
 *    ไม่ใช่ปล่อยให้กดบันทึกแล้วเงียบ
 */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) return { error: t("passwordTooShort") };
  if (password !== confirm) return { error: t("passwordMismatch") };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: t("linkExpired") };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: await translateAuthError(error, "signInFailed") };

  redirect("/");
}
