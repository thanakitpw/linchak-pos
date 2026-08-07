import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentWorkspaceId } from "@/lib/workspace";
import { ProductForm } from "@/components/products/product-form";
import { signProductImages } from "@/lib/product-images";

/**
 * แก้ไขสินค้า — **ไม่มีใน mockup** (mockup มีแต่หน้า "เพิ่ม")
 * ใช้ฟอร์มเดียวกับหน้าเพิ่มแล้วเติมปุ่มเลิกขายท้ายหน้า
 */
export default async function EditProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) notFound();

  const [{ data: product }, { data: ws }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, description, category_id, price_includes_tax, image_path")
      .eq("id", id)
      .eq("is_archived", false)
      .maybeSingle(),
    supabase.from("workspaces").select("tax_enabled").eq("id", workspaceId).maybeSingle(),
    supabase.from("categories").select("id, name, color_index").order("sort_order"),
  ]);
  // RLS กรองร้านอื่นออกให้แล้ว — ไม่เจอคือไม่มีสิทธิ์หรือถูก archive ไปแล้ว
  if (!product || !ws) notFound();

  const [withUrl] = await signProductImages([product]);

  return (
    <ProductForm
      product={{ ...withUrl, price: Number(withUrl.price) }}
      categories={categories ?? []}
      taxEnabled={ws.tax_enabled}
    />
  );
}
