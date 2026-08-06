"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { deleteCategory, saveCategory, type ProductState } from "@/app/(app)/products/actions";
import { CATEGORY_COLORS, categoryBg } from "@/lib/category-colors";
import { cn } from "@/lib/utils";

type ManagedCategory = {
  id: string;
  name: string;
  color_index: number;
  productCount: number;
};

/** FR-2.1 · CRUD หมวดหมู่ + สี */
export function CategoryManager({ categories }: { categories: ManagedCategory[] }) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState<ManagedCategory | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <main className="mx-auto max-w-form space-y-4 p-4 pb-nav">
      <header className="flex h-app-bar items-center gap-2">
        <Link
          href="/products"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="arrow_back" label={tCommon("back")} />
        </Link>
        <h1 className="flex-1 text-title-lg text-on-surface">{t("categoriesTitle")}</h1>
      </header>

      {categories.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Icon name="filter_list" size={48} className="text-tertiary-fixed-dim" />
          <p className="text-title-lg text-on-surface">{t("noCategories")}</p>
          <p className="text-body-md text-on-surface-variant">{t("noCategoriesHint")}</p>
        </div>
      )}

      <ul className="space-y-2">
        {categories.map((c) =>
          editing?.id === c.id ? (
            <li key={c.id}>
              <CategoryForm category={c} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3"
            >
              <span
                aria-hidden="true"
                className={cn("size-5 shrink-0 rounded-full", categoryBg(c.color_index))}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-md text-on-surface">{c.name}</span>
                <span className="block text-label-sm text-on-surface-variant tnum">
                  {t("productsInCategory", { count: c.productCount })}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditing(c);
                  setAdding(false);
                }}
                className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                <Icon name="edit" size={20} label={t("renameCategory")} />
              </button>
            </li>
          )
        )}
      </ul>

      {adding ? (
        <CategoryForm onDone={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          <Icon name="add" size={20} />
          {t("addCategory")}
        </Button>
      )}
    </main>
  );
}

function CategoryForm({ category, onDone }: { category?: ManagedCategory; onDone: () => void }) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const [state, formAction] = useActionState<ProductState, FormData>(async (prev, formData) => {
    const result = await saveCategory(prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});
  const [color, setColor] = useState(category?.color_index ?? 1);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
    >
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="color_index" value={color} />

      <Field label={t("categoryName")} htmlFor={`cat-name-${category?.id ?? "new"}`}>
        <Input
          id={`cat-name-${category?.id ?? "new"}`}
          name="name"
          type="text"
          required
          maxLength={60}
          autoFocus
          defaultValue={category?.name}
          placeholder={t("categoryNamePlaceholder")}
        />
      </Field>

      <div className="space-y-1.5">
        <span className="block text-label-lg text-on-surface">{t("categoryColor")}</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setColor(i)}
              aria-pressed={color === i}
              /* ป้ายกำกับเป็นตัวเลขลำดับสี — ไม่มีชื่อสีให้แปล และการตั้งชื่อสีเอง
                 ("เขียว" "ฟ้า") จะเพี้ยนทันทีที่มีคนแก้ค่า token */
              aria-label={`${i}`}
              className={cn(
                "flex size-11 items-center justify-center rounded-full transition-transform active:scale-90",
                categoryBg(i),
                color === i && "ring-2 ring-on-surface ring-offset-2"
              )}
            >
              {color === i && <Icon name="check" size={20} className="text-on-primary" />}
            </button>
          ))}
        </div>
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

      <div className="flex flex-wrap justify-end gap-2">
        {category && <DeleteButton category={category} />}
        <Button type="button" variant="ghost" onClick={onDone}>
          {tCommon("cancel")}
        </Button>
        <SaveButton label={t("saveCategory")} pendingLabel={t("saving")} />
      </div>
    </form>
  );
}

function SaveButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

/**
 * ลบหมวดหมู่ได้จริง (ต่างจากสินค้าที่ archive เท่านั้น) — FK เป็น `on delete set null`
 * สินค้าจึงไม่หายไปด้วย แต่ต้องบอกให้ชัดก่อนกด เพราะ "ลบหมวด" อ่านแล้วน่ากลัวกว่าที่เกิดขึ้นจริง
 */
function DeleteButton({ category }: { category: ManagedCategory }) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
        <Icon name="delete" size={20} />
        {tCommon("delete")}
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2 rounded-sm bg-error-container p-3">
      <p className="text-body-md text-on-error-container">{t("deleteCategoryHint")}</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
          {tCommon("cancel")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          aria-busy={pending}
          onClick={() => startTransition(() => deleteCategory(category.id).then(() => undefined))}
        >
          {t("deleteCategory")}
        </Button>
      </div>
    </div>
  );
}
