import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PurchaseForm } from "@/components/costs/purchase-form";

/**
 * แก้ไขการซื้อ — **ไม่มีใน mockup** (mockup มีแต่หน้า "บันทึก")
 * ใช้ฟอร์มเดียวกับหน้าบันทึกแล้วเติมปุ่มลบท้ายหน้า
 */
export default async function EditPurchasePage({ params }: PageProps<"/costs/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: purchase } = await supabase
    .from("purchases")
    .select(
      "id, purchased_at, vendor, note, total, slip_path, purchase_items(name, qty, unit_price, sort_order)"
    )
    .eq("id", id)
    .maybeSingle();
  // RLS กรองร้านอื่นออกให้แล้ว — ไม่เจอคือไม่มีสิทธิ์
  if (!purchase) notFound();

  // bucket `slips` เป็น private — สลิปคือหลักฐานการเงินของร้าน ต้องเป็น signed URL
  const slipUrl = purchase.slip_path
    ? ((await supabase.storage.from("slips").createSignedUrl(purchase.slip_path, 3600)).data
        ?.signedUrl ?? null)
    : null;

  return (
    <PurchaseForm
      purchase={{
        id: purchase.id,
        purchased_at: purchase.purchased_at,
        vendor: purchase.vendor,
        note: purchase.note,
        total: Number(purchase.total),
        slip_url: slipUrl,
        items: [...(purchase.purchase_items ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((it) => ({ name: it.name, qty: Number(it.qty), unit_price: Number(it.unit_price) })),
      }}
    />
  );
}
