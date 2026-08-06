"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";

export type AuthState = { error?: string; ok?: string };

/**
 * ข้อความ error จาก Supabase เป็นภาษาอังกฤษและเปลี่ยนได้ตามเวอร์ชัน
 * แปลงเป็น key ของเราแล้วให้ next-intl แปล — ไม่โยนข้อความดิบให้ผู้ใช้เห็น
 */
async function translateAuthError(message: string, fallbackKey: string) {
  const t = await getTranslations("auth");
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return t("emailTaken");
  }
  if (
    m.includes("password") &&
    (m.includes("weak") || m.includes("short") || m.includes("pwned"))
  ) {
    return t("weakPassword");
  }
  if (m.includes("invalid") && m.includes("email")) return t("invalidEmail");
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

  if (!email || !password) return { error: t("requiredField") };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: await translateAuthError(error.message, "signInFailed") };

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

  if (!email || !password || !storeName) return { error: t("requiredField") };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // trigger app.handle_new_user() อ่านค่านี้ไปตั้งชื่อร้าน (FR-0.2)
      // ⚠️ raw_user_meta_data ผู้ใช้แก้เองได้ — ใช้ได้แค่กับข้อมูลที่ไม่ใช่สิทธิ์
      //    ห้ามเอาไปตัดสินใจเรื่อง authorization เด็ดขาด
      data: { store_name: storeName },
    },
  });
  if (error) return { error: await translateAuthError(error.message, "signUpFailed") };

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
  await supabase.auth.resetPasswordForEmail(email);

  // ตอบเหมือนกันเสมอไม่ว่าอีเมลจะมีในระบบหรือไม่
  // ถ้าตอบต่างกัน หน้านี้จะกลายเป็นเครื่องมือเช็คว่าใครสมัครไว้บ้าง
  return { ok: t("resetSent") };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
