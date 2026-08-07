import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentWorkspaceId } from "@/lib/workspace";
import { ProductForm } from "@/components/products/product-form";

/** เพิ่มสินค้า — FR-2.2 · พอร์ตจาก mobile_10 + tablet_4 */
export default async function NewProductPage() {
  const supabase = await createClient();

  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) notFound();

  const [{ data: ws }, { data: categories }] = await Promise.all([
    supabase.from("workspaces").select("tax_enabled").eq("id", workspaceId).maybeSingle(),
    supabase.from("categories").select("id, name, color_index").order("sort_order"),
  ]);
  if (!ws) notFound();

  return <ProductForm categories={categories ?? []} taxEnabled={ws.tax_enabled} />;
}
