import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentWorkspaceId } from "@/lib/workspace";
import { ProductsScreen } from "@/components/products/products-screen";
import { signProductImages } from "@/lib/product-images";

/**
 * หน้าสินค้า — FR-2.4 · พอร์ตจาก mobile_8 + tablet_6
 *
 * โหลดทั้งหมดครั้งเดียวแล้วกรองในเครื่องเหมือนหน้าขาย ด้วยเหตุผลเดียวกัน:
 * ร้านเล็กมีสินค้าหลักสิบถึงหลักร้อย และการค้นหาที่ไม่ต้องรอเน็ตสำคัญกว่ามาก
 */
export default async function ProductsPage() {
  const supabase = await createClient();

  if (!(await currentWorkspaceId())) notFound();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, category_id, image_path")
      .eq("is_archived", false)
      .order("name"),
    supabase.from("categories").select("id, name, color_index").order("sort_order"),
  ]);

  return (
    <ProductsScreen
      products={await signProductImages(products ?? [])}
      categories={categories ?? []}
    />
  );
}
