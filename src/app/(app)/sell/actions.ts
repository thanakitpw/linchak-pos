"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { currentWorkspaceId } from "@/lib/workspace";

export type CheckoutResult =
  { ok: true; orderId: string; billNo: string } | { ok: false; error: string };

export type QuickAddResult =
  { ok: true; id: string; name: string; price: number } | { ok: false; error: string };

/**
 * FR-3.7 · บันทึกบิล
 *
 * เรียก create_order() ซึ่งทำทุกอย่างในทรานแซกชันเดียว (NFR-7):
 *   จองเลขบิลใต้ row lock (BR-3) → insert order → insert order_items พร้อม snapshot (BR-4)
 *
 * ยอดคำนวณใหม่ฝั่ง DB จากราคาที่ส่งไป — ไม่เชื่อ total ที่ client คิด
 * ถ้าใครแก้ค่าใน devtools แล้วส่งมา DB จะคิดใหม่อยู่ดี
 */
export async function checkout(params: {
  items: { product_id: string | null; name: string; price: number; qty: number }[];
  paymentMethod: "cash" | "promptpay" | "transfer";
  discountBaht: number;
  receivedBaht: number | null;
}): Promise<CheckoutResult> {
  const t = await getTranslations("sell");
  if (params.items.length === 0) return { ok: false, error: t("billEmptyError") };

  const supabase = await createClient();
  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) return { ok: false, error: t("checkoutFailed") };

  const { data, error } = await supabase.rpc("create_order", {
    p_workspace_id: workspaceId,
    p_items: params.items,
    p_payment_method: params.paymentMethod,
    p_discount: params.discountBaht,
    p_received: params.receivedBaht ?? undefined,
  });

  // RLS ปฏิเสธตอน trial หมด (FR-0.4) — ข้อความจาก DB เป็นภาษาอังกฤษดิบ แปลงก่อนส่งกลับ
  if (error || !data) return { ok: false, error: t("checkoutFailed") };

  revalidatePath("/sell");
  return { ok: true, orderId: data.id, billNo: data.bill_no };
}

/**
 * FR-2.5 · instant add — กรอกแค่ชื่อกับราคา ใช้ในบิลได้ทันที
 *
 * staff เพิ่มสินค้าได้ (policy products_insert อนุญาตสมาชิกทุก role)
 * แต่แก้/ลบไม่ได้ ซึ่งใกล้เคียงกับ "เพิ่มเร็วได้ แต่จัดการคลังไม่ได้"
 */
export async function quickAddProduct(formData: FormData): Promise<QuickAddResult> {
  const t = await getTranslations("sell");
  const name = String(formData.get("name") ?? "").trim();
  const priceBaht = Number(formData.get("price") ?? NaN);

  if (!name || !Number.isFinite(priceBaht) || priceBaht < 0) {
    return { ok: false, error: t("addFailed") };
  }

  const supabase = await createClient();
  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) return { ok: false, error: t("addFailed") };

  const { data, error } = await supabase
    .from("products")
    .insert({ workspace_id: workspaceId, name, price: priceBaht })
    .select("id, name, price")
    .single();

  if (error || !data) return { ok: false, error: t("addFailed") };

  revalidatePath("/sell");
  return { ok: true, id: data.id, name: data.name, price: Number(data.price) };
}
