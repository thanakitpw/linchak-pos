"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isCategoryColor } from "@/lib/category-colors";

export type ProductState = { error?: string; ok?: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // ตรงกับ file_size_limit ของ bucket `products`
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * RLS กรองให้แล้วว่าเห็นเฉพาะร้านที่ตัวเองเป็นสมาชิก จึงไม่ต้องรับ id จาก client
 * (รับมาแล้วต้องมาตรวจซ้ำว่าเป็นของเขาจริงไหม — ไม่รับตั้งแต่แรกง่ายกว่าและพลาดยากกว่า)
 */
async function currentWorkspaceId() {
  const supabase = await createClient();
  const { data } = await supabase.from("workspaces").select("id").limit(1).maybeSingle();
  return data?.id ?? null;
}

/**
 * แปลง error ดิบจาก Postgres เป็นข้อความที่แม่ค้าอ่านรู้เรื่อง
 *
 * ⚠️ ต้องดู `error.code` ไม่ใช่ `error.message` — PostgREST แยกสองอย่างนี้
 * ข้อความของ 23505 คือ `duplicate key value violates unique constraint "…"`
 * ซึ่งไม่มีเลข 23505 อยู่ในนั้นเลย การ grep หาเลขในข้อความจึงไม่เจอตลอดกาล
 */
function failure(
  t: (k: string) => string,
  error: { code?: string; message: string }
): ProductState {
  if (error.code === "42501" || error.message.toLowerCase().includes("policy")) {
    return { error: t("notAllowed") };
  }
  if (error.code === "23505") return { error: t("duplicateCategory") };
  return { error: t("saveFailed") };
}

/**
 * อัปโหลดรูปสินค้า — คืน path ที่เก็บ ไม่ใช่ URL
 *
 * bucket `products` เป็น private ต่างจาก `logos` ที่ public
 * รูปสินค้าคือข้อมูลของร้าน ไม่ใช่ของที่ต้องแชร์ให้ใครก็ได้ดู
 * เวลาแสดงต้องขอ signed URL ทุกครั้ง
 *
 * ชื่อไฟล์เป็น uuid สุ่ม ไม่ผูกกับ product id: ตอนสร้างสินค้าใหม่ยังไม่มี id
 * และการเปลี่ยนรูปทับชื่อเดิมทำให้ CDN/เบราว์เซอร์ยังโชว์รูปเก่าค้าง
 */
async function uploadImage(
  file: File,
  workspaceId: string,
  t: (k: string) => string
): Promise<{ path: string } | { error: string }> {
  if (file.size > MAX_IMAGE_BYTES) return { error: t("imageTooLarge") };
  if (!IMAGE_TYPES.includes(file.type)) return { error: t("imageWrongType") };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  // path ต้องขึ้นต้นด้วย workspace_id — storage policy อ่านส่วนแรกของ path เป็น workspace
  const path = `${workspaceId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("products")
    .upload(path, file, { contentType: file.type });
  if (error) return { error: t("saveFailed") };
  return { path };
}

/**
 * FR-2.2 · เพิ่ม/แก้สินค้า — ฟอร์มเดียวใช้ทั้งสองงาน
 * มี `id` มาด้วย = แก้ของเดิม ไม่มี = สร้างใหม่
 */
export async function saveProduct(_prev: ProductState, formData: FormData): Promise<ProductState> {
  const t = await getTranslations("products");
  const supabase = await createClient();
  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) return { error: t("saveFailed") };

  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? NaN);
  if (!name || name.length > 200) return { error: t("saveFailed") };
  if (!Number.isFinite(price) || price < 0) return { error: t("saveFailed") };

  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  // checkbox ที่ไม่ติ๊กจะไม่ถูกส่งมาเลย · VAT ปิดอยู่ช่องนี้ไม่ถูก render (FR-1.3)
  const priceIncludesTax = formData.get("price_includes_tax") === "on";

  let imagePath: string | null | undefined; // undefined = ไม่แตะรูปเดิม
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const result = await uploadImage(file, workspaceId, t);
    if ("error" in result) return { error: result.error };
    imagePath = result.path;
  } else if (formData.get("remove_image") === "1") {
    imagePath = null;
  }

  const fields = {
    name,
    price,
    category_id: categoryId,
    description,
    price_includes_tax: priceIncludesTax,
    ...(imagePath === undefined ? {} : { image_path: imagePath }),
  };

  if (id) {
    const { error } = await supabase.from("products").update(fields).eq("id", id);
    if (error) return failure(t, error);
  } else {
    const { error } = await supabase
      .from("products")
      .insert({ workspace_id: workspaceId, ...fields });
    if (error) return failure(t, error);
  }

  // หน้าขายต้องเห็นของใหม่ทันที (AC ของ FR-2)
  revalidatePath("/products");
  revalidatePath("/sell");
  redirect("/products");
}

/**
 * BR-4 · "ลบ" สินค้าคือ archive ไม่ใช่ DELETE
 * บิลเก่าอ้าง snapshot อยู่แล้วก็จริง แต่ตาราง products ไม่มี DELETE policy เลย
 * เพราะการลบจริงทำให้ประวัติการซื้อและรายงานต้นทุนขาดตอน
 */
export async function archiveProduct(id: string): Promise<ProductState> {
  const t = await getTranslations("products");
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return failure(t, error);

  revalidatePath("/products");
  revalidatePath("/sell");
  redirect("/products");
}

/** FR-2.1 · เพิ่ม/แก้หมวดหมู่ — ฟอร์มเดียวเหมือนสินค้า */
export async function saveCategory(_prev: ProductState, formData: FormData): Promise<ProductState> {
  const t = await getTranslations("products");
  const supabase = await createClient();
  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) return { error: t("saveFailed") };

  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 60) return { error: t("saveFailed") };

  const raw = Number(formData.get("color_index") ?? 1);
  const colorIndex = isCategoryColor(raw) ? raw : 1;

  const { error } = id
    ? await supabase.from("categories").update({ name, color_index: colorIndex }).eq("id", id)
    : await supabase
        .from("categories")
        .insert({ workspace_id: workspaceId, name, color_index: colorIndex });

  if (error) return failure(t, error);

  revalidatePath("/products");
  revalidatePath("/sell");
  return { ok: t("saved") };
}

/**
 * ลบหมวดหมู่จริง (ต่างจากสินค้า) — FK เป็น `on delete set null`
 * สินค้าในหมวดจึงไม่หายไปด้วย แค่กลายเป็นไม่มีหมวดหมู่
 */
export async function deleteCategory(id: string): Promise<ProductState> {
  const t = await getTranslations("products");
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return failure(t, error);

  revalidatePath("/products");
  revalidatePath("/sell");
  return { ok: t("saved") };
}
