"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { formatTHB, formatAmount } from "@/lib/format";
import { parseMoneyInput, computeChange, satang, type Satang } from "@/lib/money";
import { cartTotals, itemCount, lineTotal, type Cart } from "@/lib/cart";
import type { Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

export type PaymentMethod = "cash" | "promptpay" | "transfer";

/**
 * บิลสด — FR-3.2 ถึง FR-3.6
 *
 * mobile: อยู่ใน bottom sheet · tablet: คอลัมน์ขวาถาวร
 * markup ชุดเดียวกัน ต่างแค่ container ที่ครอบ
 */
export function BillPanel({
  cart,
  taxEnabled,
  taxRate,
  method,
  received,
  pending,
  error,
  onQty,
  onRemove,
  onDiscount,
  onMethod,
  onReceived,
  onCheckout,
  onClear,
}: {
  cart: Cart;
  taxEnabled: boolean;
  taxRate: number;
  method: PaymentMethod;
  received: string;
  pending: boolean;
  error: string | null;
  onQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onDiscount: (value: Satang) => void;
  onMethod: (m: PaymentMethod) => void;
  onReceived: (value: string) => void;
  onCheckout: () => void;
  onClear: () => void;
}) {
  const t = useTranslations("sell");
  const locale = useLocale() as Locale;
  const totals = cartTotals(cart, taxEnabled, taxRate);
  const receivedSatang = parseMoneyInput(received);
  const change = receivedSatang !== null ? computeChange(receivedSatang, totals.total) : null;
  const empty = cart.lines.length === 0;

  return (
    <div className="flex h-full flex-col bg-surface-container-lowest">
      <header className="flex items-center justify-between gap-2 border-b border-outline-variant px-4 py-3">
        <h2 className="flex items-center gap-2 text-title-lg text-on-surface">
          <Icon name="receipt_long" size={24} className="text-primary" />
          {t("currentBill")}
          {!empty && (
            <span className="text-label-lg text-on-surface-variant tnum">
              ({t("itemCount", { count: itemCount(cart) })})
            </span>
          )}
        </h2>
        {!empty && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-touch rounded-full px-3 text-label-lg text-error transition-colors hover:bg-error-container"
          >
            {t("clearBill")}
          </button>
        )}
      </header>

      {/* ── รายการ ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-2">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-on-surface-variant">
            <Icon name="shopping_cart" size={48} className="text-tertiary-fixed-dim" />
            <p className="text-body-md">{t("emptyBill")}</p>
          </div>
        ) : (
          <ul>
            {cart.lines.map((line, i) => (
              <li
                key={`${line.productId ?? line.name}-${i}`}
                className="flex items-center gap-3 border-b border-outline-variant/40 p-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md text-on-surface">{line.name}</p>
                  <p className="text-label-sm text-on-surface-variant tnum">
                    {formatTHB(line.price, locale)}
                  </p>
                </div>

                {/* stepper — ปุ่ม 44px ตาม NFR-1 */}
                <div className="flex items-center rounded-full border border-outline-variant">
                  <button
                    type="button"
                    onClick={() => onQty(i, line.qty - 1)}
                    aria-label={t("decrease")}
                    className="flex size-11 items-center justify-center rounded-l-full text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <Icon name={line.qty === 1 ? "delete" : "remove"} size={20} />
                  </button>
                  <span className="w-8 text-center text-label-lg text-on-surface tnum">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQty(i, line.qty + 1)}
                    aria-label={t("increase")}
                    className="flex size-11 items-center justify-center rounded-r-full text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <Icon name="add" size={20} />
                  </button>
                </div>

                <span className="w-20 text-right text-title-lg text-on-surface tnum">
                  {formatAmount(lineTotal(line), locale)}
                </span>

                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={t("removeItem")}
                  className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-error"
                >
                  <Icon name="close" size={20} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── สรุปยอด + ชำระเงิน ─────────────────────────────────────────── */}
      <div className="space-y-3 border-t border-outline-variant bg-surface-container-low p-4">
        <label className="flex items-center gap-3">
          <span className="text-label-lg whitespace-nowrap text-on-surface-variant">
            {t("discount")}
          </span>
          <Input
            type="text"
            inputMode="decimal"
            defaultValue={cart.discount ? String(cart.discount / 100) : ""}
            onChange={(e) => onDiscount(parseMoneyInput(e.target.value) ?? satang(0))}
            placeholder="0.00"
            className="text-right tnum"
          />
        </label>

        <dl className="space-y-1 text-body-md">
          <Row label={t("subtotal")}>{formatTHB(totals.subtotal, locale)}</Row>
          {cart.discount > 0 && (
            <Row label={t("discount")} tone="error">
              −{formatTHB(totals.discount, locale)}
            </Row>
          )}
          {/* FR-1.3 · ปิด VAT แล้วต้องไม่มี element ภาษีเลย ไม่ใช่แถวที่เป็นศูนย์ */}
          {taxEnabled && (
            <Row label={t("tax", { rate: taxRate })}>{formatTHB(totals.taxAmount, locale)}</Row>
          )}
          <div className="flex items-baseline justify-between border-t border-outline-variant pt-2">
            <dt className="text-title-lg text-on-surface">{t("total")}</dt>
            <dd className="text-display-lg text-primary tnum">{formatTHB(totals.total, locale)}</dd>
          </div>
        </dl>

        {/* วิธีชำระ — FR-3.6 */}
        <div
          role="radiogroup"
          aria-label={t("checkout")}
          className="flex gap-1 rounded-full bg-surface-container-highest p-1"
        >
          {(
            [
              { id: "cash", label: t("payCash"), icon: "payments" },
              { id: "promptpay", label: t("payPromptpay"), icon: "qr_code_scanner" },
              { id: "transfer", label: t("payTransfer"), icon: "account_balance" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              onClick={() => onMethod(m.id)}
              className={cn(
                "flex min-h-touch flex-1 items-center justify-center gap-1 rounded-full px-2 text-label-lg transition-colors",
                method === m.id
                  ? "bg-surface-container-lowest text-primary shadow-card"
                  : "text-on-surface-variant"
              )}
            >
              <Icon name={m.icon} size={20} />
              <span className="truncate">{m.label}</span>
            </button>
          ))}
        </div>

        {/* รับเงิน / เงินทอน — FR-3.5 · เฉพาะเงินสด */}
        {method === "cash" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="block text-label-sm text-on-surface-variant">{t("received")}</span>
              <Input
                type="text"
                inputMode="decimal"
                value={received}
                onChange={(e) => onReceived(e.target.value)}
                placeholder="0.00"
                className="text-right tnum"
              />
            </label>
            <div className="space-y-1">
              <span className="block text-label-sm text-on-surface-variant">{t("change")}</span>
              <p className="flex min-h-touch items-center justify-end rounded-sm px-3 text-title-lg text-primary tnum">
                {/* BR-6 · แสดงเงินทอนเฉพาะเมื่อรับเงิน ≥ ยอดสุทธิ */}
                {change === null ? "—" : change === 0 ? t("exact") : formatTHB(change, locale)}
              </p>
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-sm bg-error-container px-3 py-2 text-body-md text-on-error-container"
          >
            <Icon name="error" size={20} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <Button
          type="button"
          size="lg"
          onClick={onCheckout}
          disabled={empty || pending}
          aria-busy={pending}
        >
          {pending ? (
            t("checkingOut")
          ) : (
            <>
              <span>{t("charge")}</span>
              <span className="tnum">{formatTHB(totals.total, locale)}</span>
              <Icon name="check_circle" size={20} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: "error";
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <dt className={tone === "error" ? "text-error" : "text-on-surface-variant"}>{label}</dt>
      <dd className={cn("tnum", tone === "error" ? "text-error" : "text-on-surface")}>
        {children}
      </dd>
    </div>
  );
}
