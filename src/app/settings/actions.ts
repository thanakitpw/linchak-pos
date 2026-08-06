"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";
import { validatePromptPayId, type PromptPayType } from "@/lib/promptpay";

export type SettingsState = { error?: string; ok?: string };

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * หา workspace ของผู้ใช้ปัจจุบัน
 * RLS กรองให้แล้วว่าเห็นเฉพาะร้านที่ตัวเองเป็นสมาชิก จึงไม่ต้องส่ง id มาจาก client
 * (ถ้ารับ id จาก client จะต้องมาตรวจซ้ำว่าเป็นของเขาจริงไหม — ไม่รับตั้งแต่แรกง่ายกว่า)
 */
async function currentWorkspaceId() {
  const supabase = await createClient();
  const { data } = await supabase.from("workspaces").select("id").limit(1).maybeSingle();
  return data?.id ?? null;
}

/**
 * RLS ปฏิเสธการเขียนอยู่แล้วถ้าไม่ใช่ owner แต่ error ที่ได้จะเป็นข้อความดิบ
 * แปลงเป็นข้อความที่อ่านรู้เรื่องก่อนส่งกลับ
 *
 * ⚠️ ดู `error.code` ไม่ใช่แค่ `error.message` — PostgREST แยกสองอย่างนี้
 * ข้อความของ 23505 ไม่มีเลข 23505 อยู่ในนั้นเลย การ grep หาเลขในข้อความจึงไม่เจอ
 * (เคส RLS รอดมาได้เพราะข้อความมีคำว่า "policy" อยู่พอดี ซึ่งเป็นความบังเอิญ)
 */
async function saveFailure(
  t: Awaited<ReturnType<typeof getTranslations>>,
  error: { code?: string; message: string }
) {
  if (error.code === "42501" || error.message.toLowerCase().includes("policy")) {
    return { error: t("notOwner") };
  }
  return { error: t("saveFailed") };
}

export async function updateStoreInfo(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const t = await getTranslations("settings");
  const supabase = await createClient();
  const id = await currentWorkspaceId();
  if (!id) return { error: t("saveFailed") };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: t("saveFailed") };

  const { error } = await supabase
    .from("workspaces")
    .update({
      name,
      branch: String(formData.get("branch") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) return saveFailure(t, error);
  revalidatePath("/settings");
  return { ok: t("saved") };
}

export async function updatePromptPay(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const t = await getTranslations("settings");
  const supabase = await createClient();
  const id = await currentWorkspaceId();
  if (!id) return { error: t("saveFailed") };

  const type = String(formData.get("promptpay_type") ?? "phone") as PromptPayType;
  const raw = String(formData.get("promptpay_id") ?? "");

  // ล้างค่า: ปล่อยว่างแล้วกดบันทึก = ถอด PromptPay ออก
  if (raw.trim() === "") {
    const { error } = await supabase
      .from("workspaces")
      .update({ promptpay_id: null, promptpay_type: null })
      .eq("id", id);
    if (error) return saveFailure(t, error);
    revalidatePath("/settings");
    return { ok: t("saved") };
  }

  // ตรวจก่อนบันทึกเสมอ — เลขผิดจะได้ QR ที่สแกนไม่ขึ้นหรือเงินเข้าผิดบัญชี
  // และแม่ค้าจะไม่รู้ตัวจนกว่าลูกค้าจะบ่น
  const result = validatePromptPayId(raw, type);
  if (!result.ok) {
    const key = {
      empty: "errEmpty",
      not_digits: "errNotDigits",
      bad_phone_prefix: "errBadPhonePrefix",
      wrong_length:
        type === "phone"
          ? "errWrongLengthPhone"
          : type === "nid"
            ? "errWrongLengthNid"
            : "errWrongLengthEwallet",
    }[result.reason];
    return { error: t(key) };
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ promptpay_id: result.value, promptpay_type: type })
    .eq("id", id);

  if (error) return saveFailure(t, error);
  revalidatePath("/settings");
  return { ok: t("saved") };
}

export async function updateTax(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const t = await getTranslations("settings");
  const supabase = await createClient();
  const id = await currentWorkspaceId();
  if (!id) return { error: t("saveFailed") };

  const enabled = formData.get("tax_enabled") === "on";
  const rate = Number(formData.get("tax_rate") ?? 7);

  const { error } = await supabase
    .from("workspaces")
    .update({
      tax_enabled: enabled,
      tax_rate: Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 7,
    })
    .eq("id", id);

  if (error) return saveFailure(t, error);
  revalidatePath("/", "layout");
  return { ok: t("saved") };
}

export async function updateLanguage(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const t = await getTranslations("settings");
  const supabase = await createClient();
  const id = await currentWorkspaceId();
  if (!id) return { error: t("saveFailed") };

  const lang = String(formData.get("language") ?? "th");
  if (!isLocale(lang)) return { error: t("saveFailed") };

  const { error } = await supabase.from("workspaces").update({ language: lang }).eq("id", id);
  if (error) return saveFailure(t, error);

  // FR-1.4 · เปลี่ยนภาษาแล้วต้องมีผลทันทีทุกหน้า
  // ภาษาอ่านจาก cookie จึงต้องอัปเดต cookie ด้วย ไม่ใช่แค่ในฐานข้อมูล
  const store = await cookies();
  store.set(LOCALE_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  revalidatePath("/", "layout");
  return { ok: t("saved") };
}

export async function uploadLogo(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const t = await getTranslations("settings");
  const supabase = await createClient();
  const id = await currentWorkspaceId();
  if (!id) return { error: t("saveFailed") };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: t("saveFailed") };
  if (file.size > MAX_LOGO_BYTES) return { error: t("fileTooLarge") };
  if (!LOGO_TYPES.includes(file.type)) return { error: t("fileWrongType") };

  // path ต้องขึ้นต้นด้วย workspace_id — storage policy เช็คส่วนแรกของ path
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${id}/logo.${ext}`;

  const { error } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return saveFailure(t, error);

  const { error: dbError } = await supabase
    .from("workspaces")
    .update({ logo_path: path })
    .eq("id", id);
  if (dbError) return saveFailure(t, dbError);

  revalidatePath("/settings");
  return { ok: t("saved") };
}

export async function removeLogo(): Promise<void> {
  const supabase = await createClient();
  const id = await currentWorkspaceId();
  if (!id) return;

  const { data } = await supabase.from("workspaces").select("logo_path").eq("id", id).maybeSingle();
  if (data?.logo_path) await supabase.storage.from("logos").remove([data.logo_path]);

  await supabase.from("workspaces").update({ logo_path: null }).eq("id", id);
  revalidatePath("/settings");
}
