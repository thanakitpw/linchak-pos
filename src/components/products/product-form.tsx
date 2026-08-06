"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { archiveProduct, saveProduct, type ProductState } from "@/app/(app)/products/actions";
import type { Category } from "@/lib/catalog";

export type EditableProduct = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category_id: string | null;
  price_includes_tax: boolean;
  image_url: string | null;
};

/**
 * ฟอร์มสินค้า — FR-2.2 · พอร์ตจาก mobile_10 (หน้า "เพิ่ม")
 * หน้าแก้ไขไม่มีใน mockup เลย ใช้ฟอร์มเดียวกันแล้วเพิ่มปุ่มเลิกขายท้ายหน้า
 */
export function ProductForm({
  product,
  categories,
  taxEnabled,
}: {
  product?: EditableProduct;
  categories: Category[];
  taxEnabled: boolean;
}) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const [state, formAction] = useActionState<ProductState, FormData>(saveProduct, {});

  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null);
  const [removeImage, setRemoveImage] = useState(false);

  return (
    <form action={formAction} className="mx-auto max-w-form space-y-4 p-4 pb-nav">
      <header className="flex h-app-bar items-center gap-2">
        <Link
          href="/products"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="close" label={tCommon("close")} />
        </Link>
        <h1 className="flex-1 text-title-lg text-on-surface">
          {product ? t("editProduct") : t("addProduct")}
        </h1>
      </header>

      {product && <input type="hidden" name="id" value={product.id} />}
      {removeImage && <input type="hidden" name="remove_image" value="1" />}

      {/* รูปสินค้า — dropzone เต็มความกว้างตาม mockup */}
      <div className="space-y-2">
        <span className="block text-label-lg text-on-surface">{t("image")}</span>
        <label
          htmlFor="product-image"
          className="flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-outline bg-surface-container-low"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-on-surface-variant">
              <Icon name="add_a_photo" size={40} />
              <span className="text-label-lg">{t("addImage")}</span>
            </span>
          )}
        </label>
        <input
          id="product-image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setPreview(URL.createObjectURL(f));
            setRemoveImage(false);
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-label-sm text-on-surface-variant">{t("imageHint")}</p>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPreview(null);
                setRemoveImage(true);
              }}
            >
              {t("removeImage")}
            </Button>
          )}
        </div>
      </div>

      <Field label={t("category")} htmlFor="category_id">
        <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""}>
          <option value="">
            {categories.length === 0 ? t("noCategory") : t("chooseCategory")}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("name")} htmlFor="name">
        <Input
          id="name"
          name="name"
          type="text"
          required
          maxLength={200}
          defaultValue={product?.name}
          placeholder={t("namePlaceholder")}
        />
      </Field>

      <Field label={t("description")} htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface transition-colors placeholder:text-placeholder focus:border-2 focus:border-primary focus:outline-none"
        />
      </Field>

      <Field label={t("price")} htmlFor="price">
        <Input
          id="price"
          name="price"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          required
          defaultValue={product?.price}
          placeholder="0.00"
          className="tnum"
        />
      </Field>

      {/* FR-2.3 · ช่องนี้มีความหมายเฉพาะตอน VAT เปิด — ปิดอยู่ก็ไม่ render เลย (กฎ 24) */}
      {taxEnabled && (
        <label className="flex items-start gap-3 rounded-sm bg-surface-container-low p-3">
          <input
            type="checkbox"
            name="price_includes_tax"
            defaultChecked={product?.price_includes_tax}
            className="mt-0.5 size-5 accent-primary"
          />
          <span>
            <span className="block text-label-lg text-on-surface">{t("priceIncludesTax")}</span>
            <span className="block text-label-sm text-on-surface-variant">
              {t("priceIncludesTaxHint")}
            </span>
          </span>
        </label>
      )}

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

      {product && <ArchiveSection productId={product.id} />}
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
 * "ลบ" คือ archive (BR-4) — บิลเก่าต้องยังแสดงชื่อและราคาเดิมได้
 * ต้องกดสองครั้ง: ปุ่มนี้อยู่ท้ายฟอร์มที่คนกำลังแก้ราคาอยู่ การกดพลาดครั้งเดียว
 * แล้วสินค้าหายจากหน้าขายกลางวันขายดีคือความเสียหายจริง
 */
function ArchiveSection({ productId }: { productId: string }) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2 border-t border-outline-variant pt-4">
      {confirming ? (
        <div className="space-y-2 rounded-sm bg-error-container p-3">
          <p className="text-body-md text-on-error-container">{t("archiveHint")}</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              aria-busy={pending}
              onClick={() => startTransition(() => archiveProduct(productId).then(() => undefined))}
            >
              {pending ? t("archiving") : t("archiveConfirm")}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
          <Icon name="delete" size={20} />
          {t("archive")}
        </Button>
      )}
    </div>
  );
}
