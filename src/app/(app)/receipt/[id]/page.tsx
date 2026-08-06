import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { ReceiptCard, type ReceiptData } from "@/components/receipt/receipt-card";
import { ReceiptActions } from "@/components/receipt/receipt-actions";
import { promptPayPayload } from "@/lib/promptpay";
import { toSatang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

/**
 * ใบเสร็จหลังเช็คเอาต์ — FR-4
 *
 * QR สร้างฝั่ง server แล้วฝังเป็น data URL ตั้งแต่ HTML แรก
 * เพราะ FR-4.4 ต้อง render DOM นี้เป็นรูป — ถ้า QR โหลดทีหลังฝั่ง client
 * จะมีจังหวะที่กดแชร์แล้วได้รูปที่ยังไม่มี QR
 */
export default async function ReceiptPage({ params }: PageProps<"/receipt/[id]">) {
  const { id } = await params;
  const t = await getTranslations("receipt");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, bill_no, ordered_at, subtotal, discount, tax_amount, total, received, change_amount, public_token, workspace_id"
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const [{ data: items }, { data: ws }] = await Promise.all([
    supabase
      .from("order_items")
      .select("name_snapshot, price_snapshot, qty, line_total")
      .eq("order_id", order.id)
      .order("sort_order"),
    supabase
      .from("workspaces")
      .select("name, branch, phone, logo_path, promptpay_id, tax_enabled, tax_rate")
      .eq("id", order.workspace_id)
      .maybeSingle(),
  ]);
  if (!ws) notFound();

  // FR-4.2 · QR ระบุจำนวนเงินเท่ายอดสุทธิ · ไม่ตั้ง PromptPay = ไม่มี QR (AC ของ FR-1.2)
  const qrDataUrl = ws.promptpay_id
    ? await QRCode.toDataURL(promptPayPayload(ws.promptpay_id, toSatang(Number(order.total))), {
        width: 360,
        margin: 1,
        // สีทึบล้วน — กฎ 31 · color-mix() ทำให้ QR เพี้ยนตอน render เป็นรูป
        color: { dark: "#121c28", light: "#f7f7f2" }, // lint-tokens-ok: option ของ qrcode
      })
    : null;

  const logoUrl = ws.logo_path
    ? supabase.storage.from("logos").getPublicUrl(ws.logo_path).data.publicUrl
    : null;

  const host = (await headers()).get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${proto}://${host}/r/${order.public_token}`;

  const data: ReceiptData = {
    billNo: order.bill_no,
    orderedAt: order.ordered_at,
    storeName: ws.name,
    branch: ws.branch,
    phone: ws.phone,
    logoUrl,
    items: (items ?? []).map((i) => ({
      name: i.name_snapshot,
      price: Number(i.price_snapshot),
      qty: i.qty,
      total: Number(i.line_total),
    })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    taxAmount: Number(order.tax_amount),
    total: Number(order.total),
    received: order.received === null ? null : Number(order.received),
    change: order.change_amount === null ? null : Number(order.change_amount),
    taxEnabled: ws.tax_enabled,
    taxRate: Number(ws.tax_rate),
    qrDataUrl,
  };

  return (
    <main className="mx-auto max-w-form space-y-4 p-4 pb-nav">
      <header className="flex h-app-bar items-center gap-2">
        <Link
          href="/sell"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="close" label={t("sellAgain")} />
        </Link>
        <h1 className="text-title-lg text-on-surface">{t("title")}</h1>
      </header>

      {/* id นี้คือสิ่งที่ html-to-image จับไป render — ต้องครอบเฉพาะการ์ด ไม่รวมปุ่ม */}
      <div id="receipt-card">
        <ReceiptCard data={data} locale={locale} />
      </div>

      {!ws.promptpay_id && (
        <p className="flex items-start gap-2 rounded-sm bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
          <Icon name="info" size={20} className="mt-0.5 shrink-0" />
          <Link href="/settings" className="underline underline-offset-4">
            {t("noPromptpay")}
          </Link>
        </p>
      )}

      <ReceiptActions targetId="receipt-card" billNo={order.bill_no} publicUrl={publicUrl} />
    </main>
  );
}
