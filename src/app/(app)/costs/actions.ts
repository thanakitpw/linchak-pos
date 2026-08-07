"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { currentWorkspaceId } from "@/lib/workspace";

export type CostState = { error?: string; ok?: string };

const MAX_SLIP_BYTES = 10 * 1024 * 1024; // ตรงกับ file_size_limit ของ bucket `slips`
const SLIP_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

function failure(t: (k: string) => string, error: { code?: string; message: string }): CostState {
  if (error.code === "42501" || error.message.toLowerCase().includes("policy")) {
    return { error: t("notAllowed") };
  }
  return { error: t("saveFailed") };
}

/**
 * รายการย่อยส่งมาเป็นชุด array field ชื่อเดียวกันหลายตัว (`item_name` ซ้ำ N ครั้ง)
 * `getAll` จึงคืนมาเรียงตามลำดับใน DOM ซึ่งตรงกับลำดับที่ผู้ใช้เห็น
 *
 * แถวที่ชื่อว่างถูกทิ้ง ไม่ใช่ error — ฟอร์มเปิดมาพร้อมแถวว่าง 1 แถวเสมอ
 * และคนที่กด "เพิ่มรายการ" เกินแล้วไม่ได้กรอก ไม่ควรโดนด่า
 */
function readItems(formData: FormData) {
  const names = formData.getAll("item_name").map(String);
  const qtys = formData.getAll("item_qty").map(String);
  const prices = formData.getAll("item_price").map(String);

  return names
    .map((name, i) => ({
      name: name.trim(),
      qty: Number(qtys[i] ?? 0),
      unit_price: Number(prices[i] ?? 0),
    }))
    .filter((it) => it.name !== "" && Number.isFinite(it.qty) && Number.isFinite(it.unit_price));
}

async function uploadSlip(
  file: File,
  workspaceId: string,
  t: (k: string) => string
): Promise<{ path: string } | { error: string }> {
  if (file.size > MAX_SLIP_BYTES) return { error: t("slipTooLarge") };
  if (!SLIP_TYPES.includes(file.type)) return { error: t("slipWrongType") };

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
  // path ต้องขึ้นต้นด้วย workspace_id — storage policy อ่านส่วนแรกของ path เป็น workspace
  const path = `${workspaceId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("slips")
    .upload(path, file, { contentType: file.type });
  if (error) return { error: t("saveFailed") };
  return { path };
}

/**
 * FR-5.2/5.3/5.4 · บันทึก/แก้การซื้อ
 *
 * ทั้งใบ (purchase + items) เขียนผ่าน RPC ตัวเดียวเพื่อให้อยู่ในทรานแซกชันเดียว (NFR-7)
 * ยอดรวมคำนวณฝั่ง DB จากรายการที่ส่งไป — ไม่เชื่อยอดที่ client บวกมา
 * ยกเว้นกรณีผู้ใช้กรอกยอดรวมเอง (FR-5.4) ซึ่งส่งเป็น `p_total_override`
 */
export async function savePurchase(_prev: CostState, formData: FormData): Promise<CostState> {
  const t = await getTranslations("costs");
  const supabase = await createClient();
  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) return { error: t("saveFailed") };

  const id = String(formData.get("id") ?? "").trim() || null;
  const purchasedAt = String(formData.get("purchased_at") ?? "").trim();
  if (!purchasedAt) return { error: t("saveFailed") };

  const items = readItems(formData);
  const overrideRaw = String(formData.get("total_override") ?? "").trim();
  const override =
    formData.get("use_override") === "on" && overrideRaw !== "" ? Number(overrideRaw) : null;

  // ใบที่ไม่มีทั้งรายการและยอดรวมคือใบเปล่า — ไม่มีความหมายกับรายงานกำไร
  if (items.length === 0 && (override === null || !Number.isFinite(override))) {
    return { error: t("needItemOrTotal") };
  }

  let slipPath: string | null = null;
  const file = formData.get("slip");
  if (file instanceof File && file.size > 0) {
    const result = await uploadSlip(file, workspaceId, t);
    if ("error" in result) return { error: result.error };
    slipPath = result.path;
  }

  const shared = {
    p_purchased_at: purchasedAt,
    p_items: items,
    p_vendor: String(formData.get("vendor") ?? "").trim() || undefined,
    p_note: String(formData.get("note") ?? "").trim() || undefined,
    p_slip_path: slipPath ?? undefined,
    p_total_override: override ?? undefined,
  };

  const { error } = id
    ? await supabase.rpc("update_purchase", { p_id: id, ...shared })
    : await supabase.rpc("create_purchase", { p_workspace_id: workspaceId, ...shared });

  if (error) return failure(t, error);

  revalidatePath("/costs");
  revalidatePath("/reports");
  redirect("/costs");
}

/**
 * ลบบันทึกการซื้อได้จริง ไม่ใช่ archive — ต่างจากสินค้า (กฎ 28)
 * เพราะไม่มีอะไรอ้างถึงมัน และการซื้อที่บันทึกผิดใบต้องหายไปจากยอดต้นทุนจริงๆ
 * ไม่งั้นกำไรของเดือนจะผิดตลอดไป
 */
export async function deletePurchase(id: string): Promise<CostState> {
  const t = await getTranslations("costs");
  const supabase = await createClient();

  const { error } = await supabase.from("purchases").delete().eq("id", id);
  if (error) return failure(t, error);

  revalidatePath("/costs");
  revalidatePath("/reports");
  redirect("/costs");
}
