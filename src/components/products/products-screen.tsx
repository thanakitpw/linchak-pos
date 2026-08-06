"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import { categoryBg } from "@/lib/category-colors";
import type { Category, Product } from "@/lib/catalog";
import type { Locale } from "@/i18n/locales";

/**
 * รายการสินค้า — FR-2.4 · พอร์ตจาก mobile_8
 *
 * ต่างจากตะแกรงในหน้าขายตรงที่ **แตะแล้วไปหน้าแก้ไข ไม่ใช่ใส่ลงบิล**
 * จึงไม่ใช้ `<ProductGrid>` ร่วมกัน — component เดียวที่ทำสองอย่างตามโหมด
 * คือที่ที่การกดผิดครั้งเดียวหมายถึงเพิ่มของเข้าบิลลูกค้าโดยไม่ตั้งใจ
 */
export function ProductsScreen({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const t = useTranslations("products");
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

  const colorOf = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.color_index]));
    return (id: string | null) => (id === null ? null : (map.get(id) ?? null));
  }, [categories]);

  return (
    <div className="flex min-h-dvh flex-col pb-nav">
      <header className="sticky top-0 z-appbar flex h-app-bar items-center gap-2 border-b border-outline-variant bg-surface px-4">
        <h1 className="flex-1 text-title-lg text-primary md:text-headline-md">{t("title")}</h1>
        <Link
          href="/products/categories"
          className="flex min-h-touch items-center rounded-full px-3 text-label-lg text-primary transition-colors hover:bg-surface-container-low"
        >
          {t("manageCategories")}
        </Link>
      </header>

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

      <div className="flex-1 p-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Icon name="inventory_2" size={48} className="text-tertiary-fixed-dim" />
            <div>
              <p className="text-title-lg text-on-surface">{t("noProducts")}</p>
              <p className="text-body-md text-on-surface-variant">{t("noProductsHint")}</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-label-sm text-on-surface-variant tnum">
              {t("count", { count: visible.length })}
            </p>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((p) => {
                const color = colorOf(p.category_id);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.id}`}
                      className="group block overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest shadow-card transition-all hover:border-primary active:scale-[0.98]"
                    >
                      <div className="relative flex aspect-square items-center justify-center bg-surface-container">
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
                        {/* จุดสีหมวดหมู่ตาม mockup — เป็นตัวช่วยกวาดสายตา ไม่ใช่ข้อมูลชิ้นเดียว
                            ที่บอกหมวด (ชื่อหมวดอยู่ในหน้าแก้ไข) จึงไม่ต้องมี label ให้ screen reader */}
                        {color !== null && (
                          <span
                            aria-hidden="true"
                            className={`absolute top-2 right-2 size-3 rounded-full ${categoryBg(color)}`}
                          />
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
                    </Link>
                  </li>
                );
              })}
            </ul>

            {visible.length === 0 && (
              <p className="py-10 text-center text-body-md text-on-surface-variant">
                {t("noResults")}
              </p>
            )}
          </>
        )}
      </div>

      {/* FAB — ตาม mockup อยู่มุมขวาล่างเหนือแท็บ · bottom-fab เผื่อ safe-area ของ iPhone ให้แล้ว */}
      <Link
        href="/products/new"
        className="fixed right-4 bottom-fab z-fab flex size-14 items-center justify-center rounded-lg bg-primary text-on-primary shadow-primary transition-transform active:scale-95"
      >
        <Icon name="add" size={32} label={t("addProduct")} />
      </Link>
    </div>
  );
}
