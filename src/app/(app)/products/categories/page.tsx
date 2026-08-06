import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/products/category-manager";

/**
 * จัดการหมวดหมู่ — FR-2.1 · **ไม่มีใน mockup** ทั้ง 28 ไฟล์
 *
 * แยกออกมาเป็นหน้าของตัวเองแทนที่จะยัดเป็น dialog ในหน้าสินค้า
 * เพราะเป็นงานที่ทำครั้งเดียวตอนตั้งร้าน แล้วแทบไม่กลับมาอีก
 * ไม่ควรกินพื้นที่ในหน้าที่ใช้ทุกวัน
 */
export default async function CategoriesPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, color_index").order("sort_order"),
    supabase.from("products").select("category_id").eq("is_archived", false),
  ]);

  // นับสินค้าต่อหมวดฝั่งนี้ — ร้านเล็กมีสินค้าหลักร้อย การ join นับใน SQL
  // ไม่คุ้มกับ query เพิ่มอีกชั้น และตัวเลขนี้มีไว้เตือนก่อนลบเท่านั้น
  const counts = new Map<string, number>();
  for (const p of products ?? []) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }

  return (
    <CategoryManager
      categories={(categories ?? []).map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }))}
    />
  );
}
