"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { toSatang } from "@/lib/money";

export type AdminState = { error?: string; ok?: string };

/**
 * ทุก action ที่นี่เรียก DB function ที่:
 *   1. ตรวจ is_platform_admin() ซ้ำที่ชั้น DB
 *   2. ทำงานและเขียน audit_logs ในทรานแซกชันเดียวกัน
 *
 * ฝั่งนี้จึงเป็นแค่ตัวส่งค่า ไม่ได้เป็นด่านความปลอดภัย
 * ถ้าใครยิง RPC ตรงโดยไม่ผ่านหน้านี้ ฐานข้อมูลก็ยังปฏิเสธอยู่ดี
 */

export async function recordPayment(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const t = await getTranslations("admin");
  const supabase = await createClient();

  const workspaceId = String(formData.get("workspace_id") ?? "");
  const amountBaht = Number(formData.get("amount") ?? 0);
  if (!workspaceId || !Number.isFinite(amountBaht) || amountBaht < 0) {
    return { error: t("actionFailed") };
  }

  const { data, error } = await supabase.rpc("admin_record_payment", {
    p_workspace_id: workspaceId,
    p_plan_code: String(formData.get("plan_code") ?? "monthly_149"),
    // เงินเข้า DB เป็นสตางค์เสมอ แปลงที่ขอบ input ตามกฎข้อ 22
    p_amount_satang: toSatang(amountBaht),
    p_method: String(formData.get("method") ?? "bank_transfer"),
    p_reference: String(formData.get("reference") ?? "") || undefined,
    p_note: String(formData.get("note") ?? "") || undefined,
  });

  if (error) return { error: t("actionFailed") };

  revalidatePath(`/admin/stores/${workspaceId}`);
  revalidatePath("/admin");
  const until = data?.period_end
    ? new Date(data.period_end).toLocaleDateString("th-TH-u-ca-gregory")
    : "";
  return { ok: t("paymentRecorded", { date: until }) };
}

export async function setSuspended(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const t = await getTranslations("admin");
  const supabase = await createClient();

  const workspaceId = String(formData.get("workspace_id") ?? "");
  const suspended = formData.get("suspended") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  // บังคับเหตุผลตั้งแต่ฝั่งนี้ด้วย เพื่อให้ error อ่านรู้เรื่อง
  // (DB บังคับซ้ำอยู่แล้ว แต่ข้อความจาก DB เป็นภาษาอังกฤษดิบ)
  if (!reason) return { error: t("reasonRequired") };

  const { error } = await supabase.rpc("admin_set_suspended", {
    p_workspace_id: workspaceId,
    p_suspended: suspended,
    p_reason: reason,
  });

  if (error) return { error: t("actionFailed") };

  revalidatePath(`/admin/stores/${workspaceId}`);
  revalidatePath("/admin");
  return { ok: suspended ? t("suspendDone") : t("unsuspendDone") };
}
