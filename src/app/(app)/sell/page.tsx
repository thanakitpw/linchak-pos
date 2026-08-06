import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SellScreen } from "@/components/sell/sell-screen";
import type { Product } from "@/components/sell/product-grid";

/**
 * หน้าขาย — FR-3 · พอร์ตจาก mobile_12 + tablet_split_view
 *
 * ดึงสินค้าทั้งหมดครั้งเดียวแล้วให้ client กรอง:
 * ร้านเล็กมีสินค้าหลักสิบถึงหลักร้อย และการค้นหาที่ไม่ต้องรอเน็ตสำคัญกว่ามาก
 * ตอนยืนขายของอยู่หน้าร้าน
 */
export default async function SellPage() {
  const supabase = await createClient();

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, tax_enabled, tax_rate")
    .limit(1)
    .maybeSingle();
  if (!ws) notFound();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, category_id, image_path")
      .eq("is_archived", false)
      .order("name"),
    supabase.from("categories").select("id, name, color_index").order("sort_order"),
  ]);

  // bucket `products` เป็น private — ต้องใช้ signed URL ไม่ใช่ public URL
  const withUrls: Product[] = await Promise.all(
    (products ?? []).map(async (p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category_id: p.category_id,
      image_url: p.image_path
        ? ((await supabase.storage.from("products").createSignedUrl(p.image_path, 3600)).data
            ?.signedUrl ?? null)
        : null,
    }))
  );

  // FR-0.4 · ถาม DB ตรงๆ ไม่คำนวณซ้ำฝั่งนี้
  // ตรรกะ "ร้านนี้เขียนได้ไหม" มีที่เดียวคือ app.workspace_is_writable()
  // เขียนซ้ำใน TS แปลว่าต้องแก้สองที่ทุกครั้ง ซึ่งจะลืมสักวัน
  const { data: writable } = await supabase.rpc("current_workspace_is_writable");

  return (
    <SellScreen
      products={withUrls}
      categories={categories ?? []}
      taxEnabled={ws.tax_enabled}
      taxRate={Number(ws.tax_rate)}
      writable={writable ?? false}
    />
  );
}
