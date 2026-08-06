import { getTranslations } from "next-intl/server";
import { formatAmount, formatDateTime, formatTHB } from "@/lib/format";
import { satang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

export type ReceiptData = {
  billNo: string;
  orderedAt: string;
  storeName: string;
  branch: string | null;
  phone: string | null;
  logoUrl: string | null;
  items: { name: string; price: number; qty: number; total: number }[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  received: number | null;
  change: number | null;
  taxEnabled: boolean;
  taxRate: number;
  /**
   * QR ที่พิมพ์ลงใบเสร็จ — สร้างฝั่ง server เพื่อให้ฝังอยู่ใน DOM ตั้งแต่แรก
   *
   * **มีได้ทีละอันเท่านั้น** ไม่ใช่ข้อจำกัดทางเทคนิคแต่เป็นการตัดสินใจ:
   * QR สองอันในรูปเดียว ลูกค้าที่เปิดแอปธนาคารมาสแกนจะจับผิดอันได้
   * (`promptpay` = จ่ายเงิน FR-4.2 · `bill` = เปิดบิลออนไลน์ FR-4.3)
   */
  qr: { dataUrl: string; kind: "promptpay" | "bill" } | null;
};

/**
 * ใบเสร็จ — FR-4.1
 *
 * ⚠️ กฎข้อ 31: subtree นี้ใช้ **สีทึบล้วน** เท่านั้น
 *    ห้าม opacity modifier (`/20`), ห้าม oklch(), ห้าม color-mix()
 *    เพราะ FR-4.4 เอา DOM นี้ไป render เป็นรูปด้วย html-to-image
 *    ซึ่งอ่าน color-mix() ไม่ได้ → สีเพี้ยนแบบเงียบๆ บนรูปที่ลูกค้าได้รับ
 *    พิสูจน์ได้ที่ /dev/receipt
 *
 * ⚠️ ห้ามใส่ interactive element ในนี้ — ปุ่มอยู่นอกการ์ดเสมอ
 *    ไม่งั้นปุ่มจะติดไปในรูปที่แชร์
 *
 * ⚠️ ภาษามาจาก prop ไม่ใช่จาก request — บิลใบเดียวกันต้องอ่านได้เหมือนกันทุกคน
 *    หน้าบิล public เปิดโดยลูกค้าที่ cookie คนละใบกับเจ้าของร้าน
 *    ถ้าปล่อยให้ next-intl resolve เอง บิลจะเปลี่ยนภาษาตามคนดู
 */
export async function ReceiptCard({ data, locale }: { data: ReceiptData; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "receipt" });
  const tMoney = await getTranslations({ locale, namespace: "money" });

  return (
    <div className="mx-auto w-full max-w-[360px] rounded-md bg-receipt-paper p-5 text-on-surface">
      {/* หัวร้าน */}
      <header className="flex flex-col items-center gap-2 text-center">
        {data.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.logoUrl}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-full object-cover"
          />
        ) : null}
        <div>
          <p className="text-title-lg text-on-surface">{data.storeName}</p>
          {data.branch && <p className="text-label-sm text-on-surface-variant">{data.branch}</p>}
          {data.phone && <p className="text-label-sm text-on-surface-variant tnum">{data.phone}</p>}
        </div>
      </header>

      <div className="my-4 border-t border-dashed border-receipt-rule" />

      {/* เลขบิล + วันที่ */}
      <dl className="space-y-1 text-label-sm">
        <div className="flex justify-between">
          <dt className="text-on-surface-variant">{t("billNo")}</dt>
          <dd className="text-on-surface tnum">{data.billNo}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-on-surface-variant">{t("date")}</dt>
          <dd className="text-on-surface tnum">
            {formatDateTime(new Date(data.orderedAt), locale)}
          </dd>
        </div>
      </dl>

      <div className="my-4 border-t border-dashed border-receipt-rule" />

      {/* รายการ */}
      <ul className="space-y-2">
        {data.items.map((item, i) => (
          <li key={i} className="flex justify-between gap-3">
            <div className="min-w-0">
              <p className="text-body-md break-words text-on-surface">{item.name}</p>
              <p className="text-label-sm text-on-surface-variant tnum">
                {formatAmount(satang(Math.round(item.price * 100)), locale)} × {item.qty}
              </p>
            </div>
            <span className="text-body-md text-on-surface tnum">
              {formatAmount(satang(Math.round(item.total * 100)), locale)}
            </span>
          </li>
        ))}
      </ul>

      <div className="my-4 border-t border-dashed border-receipt-rule" />

      {/* สรุปยอด */}
      <dl className="space-y-1 text-body-md">
        <Row label={tMoney("subtotal")}>
          {formatAmount(satang(Math.round(data.subtotal * 100)), locale)}
        </Row>
        {data.discount > 0 && (
          <Row label={tMoney("discount")}>
            −{formatAmount(satang(Math.round(data.discount * 100)), locale)}
          </Row>
        )}
        {/* FR-1.3 · VAT ปิด = ไม่มีบรรทัดภาษีเลย ไม่ใช่แถวที่เป็นศูนย์ */}
        {data.taxEnabled && (
          <Row label={`${tMoney("tax")} ${data.taxRate}%`}>
            {formatAmount(satang(Math.round(data.taxAmount * 100)), locale)}
          </Row>
        )}
        <div className="flex items-baseline justify-between border-t border-receipt-rule pt-2">
          <dt className="text-title-lg text-on-surface">{tMoney("total")}</dt>
          <dd className="text-headline-md text-primary tnum">
            {formatTHB(satang(Math.round(data.total * 100)), locale)}
          </dd>
        </div>
        {data.received !== null && (
          <>
            <Row label={tMoney("received")}>
              {formatAmount(satang(Math.round(data.received * 100)), locale)}
            </Row>
            {data.change !== null && (
              <Row label={tMoney("change")}>
                {formatAmount(satang(Math.round(data.change * 100)), locale)}
              </Row>
            )}
          </>
        )}
      </dl>

      {/* QR — FR-4.2 (จ่ายเงิน ระบุยอดไว้แล้ว) หรือ FR-4.3 (เปิดบิลออนไลน์) */}
      {data.qr && (
        <>
          <div className="my-4 border-t border-dashed border-receipt-rule" />
          <div className="flex flex-col items-center gap-2">
            {data.qr.kind === "promptpay" && (
              <p className="text-label-lg text-on-surface">
                {t("promptpayAmount")} {formatTHB(satang(Math.round(data.total * 100)), locale)}
              </p>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.qr.dataUrl}
              alt=""
              width={data.qr.kind === "promptpay" ? 180 : 132}
              height={data.qr.kind === "promptpay" ? 180 : 132}
            />
            <p className="text-center text-label-sm text-on-surface-variant">
              {t(data.qr.kind === "promptpay" ? "scanToPay" : "scanForBill")}
            </p>
          </div>
        </>
      )}

      <p className="mt-4 text-center text-label-sm text-on-surface-variant">{t("thankYou")}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-on-surface tnum">{children}</dd>
    </div>
  );
}
