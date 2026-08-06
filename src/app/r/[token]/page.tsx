import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ReceiptCard, type ReceiptData } from "@/components/receipt/receipt-card";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";

/**
 * บิลออนไลน์ที่ลูกค้าเปิดจากลิงก์ใน LINE — FR-4.6
 *
 * อยู่นอกกลุ่ม (app) โดยตั้งใจ: ไม่มีแท็บล่าง ไม่มีอะไรให้กดเข้าแอป
 * คนที่เปิดหน้านี้คือลูกค้า ไม่ใช่แม่ค้า และเป็นหน้า **อ่านอย่างเดียว**
 *
 * ⚠️ ทุกอย่างมาจาก `get_public_receipt(token)` ตัวเดียว ห้าม query ตารางตรงๆ ที่นี่
 *    ฟังก์ชันนั้นเป็นด่านที่ตัดสินใจแล้วว่าอะไรออกไปข้างนอกได้บ้าง
 *    (ไม่มี workspace_id ไม่มี promptpay_id ไม่มีบิลอื่น — `supabase/README.md`)
 *    ถ้า query เองจะกลายเป็นด่านที่สองที่ไม่มีใครตรวจ
 */

/**
 * ห้าม index — ลิงก์บิลเดาไม่ได้ก็จริง แต่ถ้าลูกค้าเผลอโพสต์ลงเว็บบอร์ด
 * แล้ว crawler ตามไปเก็บ บิลนั้นจะค้นเจอใน Google ตลอดไป
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/** token เป็น uuid · ถ้าไม่ใช่ ต้องตัดตั้งแต่ก่อนถึง DB ไม่งั้น Postgres โยน 22P02 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PublicReceipt = {
  bill_no: string;
  ordered_at: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  tax_enabled: boolean;
  tax_rate: number;
  total: number;
  received: number | null;
  change_amount: number | null;
  store: {
    name: string;
    branch: string | null;
    phone: string | null;
    logo_path: string | null;
    language: string;
  };
  items: { name: string; price: number; qty: number; total: number }[];
};

export default async function PublicReceiptPage({ params }: PageProps<"/r/[token]">) {
  const { token } = await params;
  if (!UUID.test(token)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_receipt", { token });
  const receipt = data as PublicReceipt | null;
  if (!receipt) notFound();

  // ภาษาของ **ร้าน** ไม่ใช่ของคนเปิดลิงก์ — บิลใบเดียวต้องอ่านได้เหมือนกันทุกคน
  const locale = isLocale(receipt.store.language) ? receipt.store.language : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "receipt" });
  const tApp = await getTranslations({ locale, namespace: "app" });

  const logoUrl = receipt.store.logo_path
    ? supabase.storage.from("logos").getPublicUrl(receipt.store.logo_path).data.publicUrl
    : null;

  // ไม่มี QR บนหน้านี้: QR จ่ายเงินต้องใช้ promptpay_id ซึ่งจงใจไม่ส่งออกมา
  // ส่วน QR เปิดบิลออนไลน์ก็ไร้ประโยชน์ — คนดูอยู่บนหน้านั้นแล้ว
  const view: ReceiptData = {
    billNo: receipt.bill_no,
    orderedAt: receipt.ordered_at,
    storeName: receipt.store.name,
    branch: receipt.store.branch,
    phone: receipt.store.phone,
    logoUrl,
    items: receipt.items,
    subtotal: receipt.subtotal,
    discount: receipt.discount,
    taxAmount: receipt.tax_amount,
    total: receipt.total,
    received: receipt.received,
    change: receipt.change_amount,
    taxEnabled: receipt.tax_enabled,
    taxRate: Number(receipt.tax_rate),
    qr: null,
  };

  return (
    // lang ตามภาษาของร้าน — <html lang> ที่ layout ตั้งไว้อ่านจาก cookie ของคนเปิด
    // ซึ่งบนหน้านี้คือคนละคนกับเจ้าของบิล screen reader ต้องออกเสียงตามบิล
    <main lang={locale} className="mx-auto max-w-form space-y-4 p-4">
      <h1 className="sr-only">
        {t("title")} {receipt.bill_no}
      </h1>

      <ReceiptCard data={view} locale={locale} />

      <p className="text-center text-label-sm text-on-surface-variant">
        {t("poweredBy", { app: tApp("name") })}
      </p>
    </main>
  );
}
