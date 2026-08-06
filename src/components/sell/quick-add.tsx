"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { quickAddProduct } from "@/app/(app)/sell/actions";
import type { Product } from "./product-grid";

/**
 * FR-2.5 · instant add — กรอกแค่ชื่อกับราคา ใช้ในบิลได้ทันที
 *
 * เป็นทางเข้าหลักของแม่ค้าที่เพิ่งสมัคร: ร้านยังไม่มีสินค้าเลย
 * ถ้าบังคับให้ไปหน้าจัดการสินค้าก่อน จะออกบิลใบแรกไม่ได้สักที
 */
export function QuickAdd({
  onAdded,
  autoOpen = false,
}: {
  onAdded: (p: Product) => void;
  autoOpen?: boolean;
}) {
  const t = useTranslations("sell");
  const [open, setOpen] = useState(autoOpen);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Icon name="add" size={20} />
        {t("quickAdd")}
      </Button>
    );
  }

  return (
    <form
      className="w-full max-w-form space-y-3 rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await quickAddProduct(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          onAdded({
            id: result.id,
            name: result.name,
            price: result.price,
            category_id: null,
            image_url: null,
          });
          // ปิดฟอร์มไม่ได้ — แม่ค้ามักเพิ่มติดกันหลายชิ้นตอนตั้งร้านครั้งแรก
          // เคลียร์ค่าแล้วรอรับชิ้นถัดไปแทน
          (document.getElementById("quick-add-name") as HTMLInputElement | null)?.focus();
        })
      }
      onReset={() => setOpen(false)}
    >
      <p className="text-label-lg text-on-surface">{t("quickAdd")}</p>
      <p className="text-label-sm text-on-surface-variant">{t("quickAddHint")}</p>

      <Field label={t("productName")} htmlFor="quick-add-name">
        <Input id="quick-add-name" name="name" type="text" required maxLength={200} autoFocus />
      </Field>

      <Field label={t("price")} htmlFor="quick-add-price">
        <Input
          id="quick-add-price"
          name="price"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          required
          className="tnum"
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm bg-error-container px-3 py-2 text-body-md text-on-error-container"
        >
          <Icon name="error" size={20} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="reset" variant="ghost">
          {t("clearBill")}
        </Button>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? t("adding") : t("add")}
        </Button>
      </div>
    </form>
  );
}
