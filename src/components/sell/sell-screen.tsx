"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ProductGrid } from "./product-grid";
import type { Category, Product } from "@/lib/catalog";
import { BillPanel, type PaymentMethod } from "./bill-panel";
import { Icon } from "@/components/ui/icon";
import { checkout } from "@/app/(app)/sell/actions";
import {
  addLine,
  cartTotals,
  clearStoredCart,
  EMPTY_CART,
  itemCount,
  loadCart,
  removeLine,
  saveCart,
  setQty,
  toOrderItems,
  type Cart,
} from "@/lib/cart";
import { formatTHB } from "@/lib/format";
import { parseMoneyInput, satang, type Satang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

/**
 * หน้าขาย — FR-3
 *
 * FR-3.8 responsive:
 *   mobile  = คอลัมน์เดียว + แถบสรุปล่าง → เปิดบิลเป็น bottom sheet
 *   tablet  = split view ซ้าย grid ขวาบิลสด (md = 768px)
 *
 * bill panel เป็น component เดียวกันทั้งสองแบบ ต่างแค่ container
 */
export function SellScreen({
  products: initialProducts,
  categories,
  taxEnabled,
  taxRate,
  writable,
}: {
  products: Product[];
  categories: Category[];
  taxEnabled: boolean;
  taxRate: number;
  writable: boolean;
}) {
  const t = useTranslations("sell");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [received, setReceived] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * กู้บิลที่ค้างจาก sessionStorage — ที่หน้าร้านการเผลอรีเฟรชแล้วบิลหายคือความเสียหายจริง
   *
   * ใช้ callback ref ไม่ใช่ useEffect: ต้องอ่านหลัง mount (SSR ไม่มี sessionStorage)
   * แต่ setState ใน effect ทำให้ render ซ้อนโดยไม่จำเป็น
   * ref callback ทำงานตอนโหนดติดจอ ซึ่งเป็นจังหวะที่ต้องการพอดี และมาก่อน effect
   */
  const restored = useRef(false);
  const restoreCart = useCallback((node: HTMLDivElement | null) => {
    if (!node || restored.current) return;
    restored.current = true;
    const saved = loadCart();
    if (saved.lines.length > 0 || saved.discount > 0) setCart(saved);
  }, []);

  // effect นี้เขียนลงระบบภายนอก (sessionStorage) ไม่ได้ setState — ใช้ effect ได้ถูกต้อง
  useEffect(() => {
    if (restored.current) saveCart(cart);
  }, [cart]);

  const totals = cartTotals(cart, taxEnabled, taxRate);
  const count = itemCount(cart);

  function handleCheckout() {
    startTransition(async () => {
      setError(null);
      const result = await checkout({
        items: toOrderItems(cart),
        paymentMethod: method,
        discountBaht: cart.discount / 100,
        receivedBaht: method === "cash" ? (parseMoneyInput(received) ?? 0) / 100 || null : null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // บิลบันทึกแล้ว — เคลียร์ทุกอย่างก่อนพาไปหน้าใบเสร็จ
      // ถ้าไม่เคลียร์ กดย้อนกลับมาแล้วบิลเดิมยังอยู่ เสี่ยงออกซ้ำ
      clearStoredCart();
      setCart(EMPTY_CART);
      setReceived("");
      setSheetOpen(false);
      router.push(`/receipt/${result.orderId}`);
    });
  }

  const billProps = {
    cart,
    taxEnabled,
    taxRate,
    method,
    received,
    pending,
    error,
    onQty: (i: number, q: number) => setCart((c) => setQty(c, i, q)),
    onRemove: (i: number) => setCart((c) => removeLine(c, i)),
    onDiscount: (v: Satang) => setCart((c) => ({ ...c, discount: v })),
    onMethod: setMethod,
    onReceived: setReceived,
    onCheckout: handleCheckout,
    onClear: () => {
      setCart(EMPTY_CART);
      clearStoredCart();
    },
  };

  return (
    <div ref={restoreCart} className="flex h-dvh flex-col md:flex-row">
      {/* ── ซ้าย: สินค้า ────────────────────────────────────────────────── */}
      {/* pb-bottom-nav: หน้านี้เป็น h-dvh + scroll ข้างใน (ไม่ใช่ min-h-dvh เหมือนหน้าอื่น)
          ถ้าไม่กันที่ไว้ ท้าย list จะมุดใต้แท็บล่างที่เป็น fixed แล้วเลื่อนลงไม่ถึง
          — เห็นชัดสุดตอนกางฟอร์ม "เพิ่มสินค้าเร็ว" ปุ่มบันทึกจะโดนบัง
          md ขึ้นไปไม่มีแท็บล่าง (BottomNav เป็น md:hidden) จึงคืนเป็น 0 */}
      <section className="flex min-h-0 flex-1 flex-col pb-bottom-nav md:pb-0">
        <header className="flex h-app-bar items-center justify-between gap-2 border-b border-outline-variant bg-surface px-4">
          <h1 className="text-title-lg text-primary md:text-headline-md">{t("title")}</h1>
          <a
            href="/settings"
            className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <Icon name="settings" label={t("title")} />
          </a>
        </header>

        {/* FR-0.4 · หมดอายุแล้วออกบิลใหม่ไม่ได้ — DB ปฏิเสธอยู่แล้ว
            แถบนี้แค่บอกล่วงหน้าเพื่อไม่ให้เสียเวลาจิ้มสินค้าจนเต็มบิลแล้วค่อยรู้ */}
        {!writable && (
          <p className="flex items-start gap-2 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            <Icon name="warning" size={20} className="mt-0.5 shrink-0" />
            <span>
              <strong>{t("expiredTitle")}</strong> — {t("expiredBody")}
            </span>
          </p>
        )}

        <div className="min-h-0 flex-1">
          <ProductGrid
            products={products}
            categories={categories}
            onPick={(line) => setCart((c) => addLine(c, line))}
            onAdded={(p) => {
              setProducts((prev) => [p, ...prev]);
              setCart((c) =>
                addLine(c, {
                  productId: p.id,
                  name: p.name,
                  price: satang(Math.round(p.price * 100)),
                })
              );
            }}
          />
        </div>

        {/* แถบสรุปล่าง — มือถือเท่านั้น
            ⚠️ ห้ามใส่ `sticky bottom-0` · เคยมีแล้วแถบจมลงไปใต้แท็บล่าง
            sticky วัดระยะจาก scrollport (= viewport) ไม่ใช่จากกล่องแม่
            `bottom-0` จึงดันตัวเองลงไปกินพื้นที่ pb-bottom-nav ที่กันไว้ให้แท็บล่างจนหมด
            ที่นี่ไม่ต้อง sticky อยู่แล้ว — section เป็น h-dvh flex-col และนี่คือลูกตัวสุดท้าย
            มันติดขอบล่างของ content box เองโดยธรรมชาติ */}
        {count > 0 && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-3 border-t border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-raised md:hidden"
          >
            <span className="relative flex size-11 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="shopping_cart" size={24} />
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-error text-label-sm text-on-error tnum">
                {count}
              </span>
            </span>
            <span className="flex-1 text-left">
              <span className="block text-label-sm text-on-surface-variant">
                {t("itemCount", { count })}
              </span>
              <span className="block text-title-lg text-on-surface tnum">
                {formatTHB(totals.total, locale)}
              </span>
            </span>
            <span className="flex items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-label-lg text-on-primary">
              {t("checkout")}
              <Icon name="arrow_forward" size={20} />
            </span>
          </button>
        )}
      </section>

      {/* ── ขวา: บิลสด (tablet) ────────────────────────────────────────── */}
      <aside className="hidden w-full max-w-bill-pane border-l border-outline-variant md:block">
        <BillPanel {...billProps} />
      </aside>

      {/* ── บิลแบบ bottom sheet (มือถือ) ───────────────────────────────── */}
      {sheetOpen && (
        <>
          <button
            type="button"
            aria-label={t("currentBill")}
            onClick={() => setSheetOpen(false)}
            className="fixed inset-0 z-scrim bg-inverse-surface/40 md:hidden"
          />
          <div className="fixed inset-x-0 bottom-0 z-sheet flex max-h-[85dvh] flex-col overflow-hidden rounded-t-lg shadow-overlay md:hidden">
            <div className="flex justify-center bg-surface-container-lowest py-2">
              <span className="h-1.5 w-12 rounded-full bg-outline-variant" />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <BillPanel {...billProps} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
