import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/products/product-form";

/** เพิ่มสินค้า — FR-2.2 · พอร์ตจาก mobile_10 + tablet_4 */
export default async function NewProductPage() {
  const supabase = await createClient();

  const [{ data: ws }, { data: categories }] = await Promise.all([
    supabase.from("workspaces").select("tax_enabled").limit(1).maybeSingle(),
    supabase.from("categories").select("id, name, color_index").order("sort_order"),
  ]);
  if (!ws) notFound();

  return <ProductForm categories={categories ?? []} taxEnabled={ws.tax_enabled} />;
}
