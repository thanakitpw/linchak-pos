"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuickAdd } from "./quick-add";
import { formatTHB } from "@/lib/format";
import { toSatang, type Satang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

export type Product = {
  id: string;
  name: string;
  price: number; // บาท (numeric จาก DB)
  category_id: string | null;
  image_url: string | null;
};
export type Category = { id: string; name: string; color_index: number };

/**
 * ตะแกรงสินค้า — FR-3.1 (ก) แตะเลือก (ข) ค้นหา (ค) instant add
 *
 * ค้นหาแบบกรองในเครื่อง ไม่ยิง DB ทุกตัวอักษร:
 * ร้านเล็กมีสินค้าหลักสิบถึงหลักร้อย โหลดครั้งเดียวแล้วกรองเร็วกว่ามาก
 * และสำคัญกว่านั้นคือใช้ได้ตอนเน็ตกระตุก ซึ่งเกิดบ่อยที่ตลาด
 */
export function ProductGrid({
  products,
  categories,
  onPick,
  onAdded,
}: {
  products: Product[];
  categories: Category[];
  onPick: (p: { productId: string | null; name: string; price: Satang }) => void;
  onAdded: (p: Product) => void;
}) {
  const t = useTranslations("sell");
  const locale = useLocale() as Locale;
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (categoryId === null || p.category_id === categoryId) &&
        (q === "" || p.name.toLowerCase().includes(q))
    );
  }, [products, query, categoryId]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-outline-variant bg-surface p-4">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          leading={<Icon name="search" size={20} />}
        />

        {categories.length > 0 && (
          <div className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4">
            <Chip active={categoryId === null} onClick={() => setCategoryId(null)}>
              {t("allCategories")}
            </Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Icon name="inventory_2" size={48} className="text-tertiary-fixed-dim" />
            <div>
              <p className="text-title-lg text-on-surface">{t("noProducts")}</p>
              <p className="text-body-md text-on-surface-variant">{t("noProductsHint")}</p>
            </div>
            <QuickAdd onAdded={onAdded} autoOpen />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    onPick({ productId: p.id, name: p.name, price: toSatang(Number(p.price)) })
                  }
                  className="group overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest text-left shadow-card transition-all hover:border-primary active:scale-[0.98]"
                >
                  <div className="flex aspect-square items-center justify-center bg-surface-container">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <Icon name="image" size={40} className="text-tertiary-fixed-dim" />
                    )}
                  </div>
                  <div className="p-2">
                    {/* ไทยไม่มีช่องว่างระหว่างคำ ชื่อยาวจะล้น — ตัด 2 บรรทัด */}
                    <p className="line-clamp-2 text-label-lg break-words text-on-surface">
                      {p.name}
                    </p>
                    <p className="text-title-lg text-primary tnum">
                      {formatTHB(toSatang(Number(p.price)), locale)}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {visible.length === 0 && (
              <p className="py-10 text-center text-body-md text-on-surface-variant">
                {t("noResults")}
              </p>
            )}

            <div className="mt-4 flex justify-center">
              <QuickAdd onAdded={onAdded} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-touch shrink-0 rounded-full border px-4 text-label-lg whitespace-nowrap transition-colors active:scale-95",
        active
          ? // #2bb14f คู่กับตัวหนังสือเขียวเข้มเท่านั้น — ตัวขาวได้ 2.80:1 ตก AA (กฎ 5)
            "border-primary-container bg-primary-container text-on-primary-container"
          : "border-outline-variant bg-surface-container-lowest text-on-surface"
      )}
    >
      {children}
    </button>
  );
}

export { Button };
