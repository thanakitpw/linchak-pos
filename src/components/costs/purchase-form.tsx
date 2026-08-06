"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { deletePurchase, savePurchase, type CostState } from "@/app/(app)/costs/actions";
import { formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

export type EditablePurchase = {
  id: string;
  purchased_at: string;
  vendor: string | null;
  note: string | null;
  total: number;
  slip_url: string | null;
  items: { name: string; qty: number; unit_price: number }[];
};

type Row = { key: number; name: string; qty: string; price: string };

let nextKey = 0;
const blankRow = (): Row => ({ key: nextKey++, name: "", qty: "1", price: "" });

/**
 * ฟอร์มบันทึกการซื้อ — FR-5.2/5.3/5.4 · พอร์ตจาก mobile_2
 *
 * รายการย่อยเป็น state ฝั่ง client เพื่อให้ยอดรวมอัปเดตทันทีที่พิมพ์ (FR-5.4)
 * แต่ **ยอดที่บันทึกจริงคำนวณใหม่ฝั่ง DB** จากรายการที่ส่งไป
 * ตัวเลขบนจอมีไว้ให้คนเห็น ไม่ใช่ตัวที่เชื่อถือ
 */
export function PurchaseForm({ purchase }: { purchase?: EditablePurchase }) {
  const t = useTranslations("costs");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const [state, formAction] = useActionState<CostState, FormData>(savePurchase, {});

  const [rows, setRows] = useState<Row[]>(() =>
    purchase && purchase.items.length > 0
      ? purchase.items.map((it) => ({
          key: nextKey++,
          name: it.name,
          qty: String(it.qty),
          price: String(it.unit_price),
        }))
      : [blankRow()]
  );
  const [useOverride, setUseOverride] = useState(false);
  const [override, setOverride] = useState(purchase ? String(purchase.total) : "");
  const [slipName, setSlipName] = useState<string | null>(null);

  // รวมเป็นสตางค์ก่อนบวก ไม่บวกทศนิยมของบาทตรงๆ (กฎ 22)
  const autoTotal = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const qty = Number(r.qty);
        const price = Number(r.price);
        if (!r.name.trim() || !Number.isFinite(qty) || !Number.isFinite(price)) return sum;
        return sum + Math.round(qty * price * 100);
      }, 0),
    [rows]
  );

  const shownTotal =
    useOverride && override !== "" ? Math.round(Number(override) * 100) : autoTotal;

  function patch(key: number, field: keyof Omit<Row, "key">, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  return (
    <form action={formAction} className="mx-auto max-w-form space-y-4 p-4 pb-nav">
      <header className="flex h-app-bar items-center gap-2">
        <Link
          href="/costs"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="close" label={tCommon("close")} />
        </Link>
        <h1 className="flex-1 text-title-lg text-on-surface">
          {purchase ? t("editPurchase") : t("addPurchase")}
        </h1>
      </header>

      {purchase && <input type="hidden" name="id" value={purchase.id} />}

      <Field label={t("purchasedAt")} htmlFor="purchased_at">
        <Input
          id="purchased_at"
          name="purchased_at"
          type="date"
          required
          defaultValue={purchase?.purchased_at ?? new Date().toISOString().slice(0, 10)}
          className="tnum"
        />
      </Field>

      <Field label={t("vendor")} htmlFor="vendor">
        <Input
          id="vendor"
          name="vendor"
          type="text"
          maxLength={200}
          defaultValue={purchase?.vendor ?? ""}
          placeholder={t("vendorPlaceholder")}
        />
      </Field>

      {/* ── รายการย่อย ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-title-lg text-on-surface">{t("items")}</h2>

        {rows.map((row, i) => {
          const line = Math.round((Number(row.qty) || 0) * (Number(row.price) || 0) * 100);
          return (
            <div
              key={row.key}
              className="space-y-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3 shadow-card"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Field label={t("itemName")} htmlFor={`item-name-${row.key}`}>
                    <Input
                      id={`item-name-${row.key}`}
                      name="item_name"
                      type="text"
                      maxLength={200}
                      value={row.name}
                      onChange={(e) => patch(row.key, "name", e.target.value)}
                      placeholder={t("itemNamePlaceholder")}
                    />
                  </Field>
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    className="mt-7 flex size-11 shrink-0 items-center justify-center rounded-full text-error transition-colors hover:bg-error-container"
                  >
                    <Icon name="delete" size={20} label={t("removeItem")} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("qty")} htmlFor={`item-qty-${row.key}`}>
                  <Input
                    id={`item-qty-${row.key}`}
                    name="item_qty"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={row.qty}
                    onChange={(e) => patch(row.key, "qty", e.target.value)}
                    className="tnum"
                  />
                </Field>
                <Field label={t("unitPrice")} htmlFor={`item-price-${row.key}`}>
                  <Input
                    id={`item-price-${row.key}`}
                    name="item_price"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={row.price}
                    onChange={(e) => patch(row.key, "price", e.target.value)}
                    placeholder="0.00"
                    className="tnum"
                  />
                </Field>
              </div>

              <p className="flex items-baseline justify-between text-body-md">
                <span className="text-on-surface-variant">{t("lineTotal")}</span>
                <span className="text-title-lg text-on-surface tnum">
                  {formatTHB(toSatang(line / 100), locale)}
                </span>
              </p>
              {/* ให้ index อ่านออกตอนดีบัก — ลำดับใน DOM คือลำดับที่ action อ่านกลับ */}
              <span className="sr-only">{i + 1}</span>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setRows((prev) => [...prev, blankRow()])}
        >
          <Icon name="add" size={20} />
          {t("addItem")}
        </Button>
      </section>

      {/* ── ยอดรวม ─────────────────────────────────────────────────────── */}
      <section className="space-y-2 rounded-md border border-outline-variant bg-surface-container-low p-3">
        <p className="flex items-baseline justify-between">
          <span className="text-title-lg text-on-surface">{t("total")}</span>
          <span className="text-headline-md text-primary tnum">
            {formatTHB(toSatang(shownTotal / 100), locale)}
          </span>
        </p>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="use_override"
            checked={useOverride}
            onChange={(e) => setUseOverride(e.target.checked)}
            className="mt-0.5 size-5 accent-primary"
          />
          <span>
            <span className="block text-label-lg text-on-surface">{t("overrideTotal")}</span>
            <span className="block text-label-sm text-on-surface-variant">
              {useOverride ? t("overrideHint") : t("totalAuto")}
            </span>
          </span>
        </label>

        {useOverride && (
          <Input
            name="total_override"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            placeholder="0.00"
            className="tnum"
          />
        )}
      </section>

      <Field label={t("note")} htmlFor="note">
        <textarea
          id="note"
          name="note"
          rows={2}
          defaultValue={purchase?.note ?? ""}
          placeholder={t("notePlaceholder")}
          className="w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface transition-colors placeholder:text-placeholder focus:border-2 focus:border-primary focus:outline-none"
        />
      </Field>

      {/* ── สลิป ───────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="block text-label-lg text-on-surface">{t("slip")}</span>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="slip"
            className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-full border border-primary px-6 text-label-lg text-primary transition-colors hover:bg-surface-container-low"
          >
            <Icon name="add_a_photo" size={20} />
            {t("addSlip")}
          </label>
          {slipName && <span className="text-label-sm text-on-surface-variant">{slipName}</span>}
          {purchase?.slip_url && !slipName && (
            <a
              href={purchase.slip_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-label-lg text-primary underline underline-offset-4"
            >
              {t("viewSlip")}
            </a>
          )}
        </div>
        <input
          id="slip"
          name="slip"
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => setSlipName(e.target.files?.[0]?.name ?? null)}
        />
        <p className="text-label-sm text-on-surface-variant">{t("slipHint")}</p>
      </div>

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm bg-error-container px-3 py-2 text-body-md text-on-error-container"
        >
          <Icon name="error" size={20} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </p>
      )}

      <SubmitButton label={t("save")} pendingLabel={t("saving")} />

      {purchase && <DeleteSection purchaseId={purchase.id} />}
    </form>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

/**
 * ลบได้จริง ไม่ใช่ archive — การซื้อที่บันทึกผิดใบต้องหายจากยอดต้นทุนจริงๆ
 * ไม่งั้นกำไรของเดือนนั้นจะผิดตลอดไป · แต่ต้องยืนยันก่อนเพราะกู้คืนไม่ได้
 */
function DeleteSection({ purchaseId }: { purchaseId: string }) {
  const t = useTranslations("costs");
  const tCommon = useTranslations("common");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="border-t border-outline-variant pt-4">
      {confirming ? (
        <div className="space-y-2 rounded-sm bg-error-container p-3">
          <p className="text-body-md text-on-error-container">{t("deleteHint")}</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              aria-busy={pending}
              onClick={() =>
                startTransition(() => deletePurchase(purchaseId).then(() => undefined))
              }
            >
              {pending ? t("deleting") : t("deleteConfirm")}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
          <Icon name="delete" size={20} />
          {t("delete")}
        </Button>
      )}
    </div>
  );
}
