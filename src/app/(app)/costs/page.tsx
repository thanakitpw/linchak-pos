import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

/**
 * ต้นทุน — FR-5.1 · พอร์ตจาก mobile_11
 *
 * mockup มีป้าย "ชำระแล้ว" / "เงินสด" บนการ์ด — **ไม่ทำตาม**
 * PRD ไม่มีสถานะการชำระของฝั่งซื้อ (ทุกใบคือจ่ายแล้ว) และ schema ก็ไม่มีคอลัมน์รองรับ
 * ป้ายที่โชว์ค่าคงที่ตลอดคือ noise ที่คนจะเชื่อว่ามีความหมาย
 */
export default async function CostsPage() {
  const t = await getTranslations("costs");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const [{ data: purchases }, { data: profit }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id, purchased_at, vendor, total, purchase_items(count)")
      .order("purchased_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("report_monthly_profit"),
  ]);

  const monthCost = Number((profit as { costs?: number } | null)?.costs ?? 0);

  return (
    <main className="min-h-dvh pb-nav">
      <header className="flex h-app-bar items-center gap-2 border-b border-outline-variant bg-surface px-4">
        <h1 className="flex-1 text-title-lg text-primary md:text-headline-md">{t("title")}</h1>
      </header>

      <div className="space-y-4 p-4">
        {/* KPI ต้นทุนเดือนนี้ — #2bb14f คู่กับตัวหนังสือเขียวเข้มเท่านั้น (กฎ 5)
            mockup ใส่ตัวขาวบนพื้นนี้ซึ่งได้ 2.80:1 ตก WCAG AA */}
        <div className="flex items-center justify-between gap-4 rounded-lg bg-primary-container p-5 text-on-primary-container">
          <div>
            <p className="text-label-lg">{t("monthCost")}</p>
            <p className="text-display-lg tnum">{formatTHB(toSatang(monthCost), locale)}</p>
          </div>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icon name="trending_down" size={32} />
          </span>
        </div>

        {(purchases ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Icon name="payments" size={48} className="text-tertiary-fixed-dim" />
            <div>
              <p className="text-title-lg text-on-surface">{t("noPurchases")}</p>
              <p className="text-body-md text-on-surface-variant">{t("noPurchasesHint")}</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {(purchases ?? []).map((p) => {
              const count = p.purchase_items?.[0]?.count ?? 0;
              return (
                <li key={p.id}>
                  <Link
                    href={`/costs/${p.id}`}
                    className="flex items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3 shadow-card transition-colors hover:border-primary"
                  >
                    <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-sm bg-secondary-container text-on-secondary-fixed-variant">
                      <span className="text-label-lg tnum">{p.purchased_at.slice(8, 10)}</span>
                      <span className="text-label-sm">
                        {formatDate(new Date(p.purchased_at), locale).split(" ")[1]}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-md text-on-surface">
                        {p.vendor || t("noVendor")}
                      </span>
                      <span className="block text-label-sm text-on-surface-variant tnum">
                        {t("count", { count })}
                      </span>
                    </span>
                    <span className="text-title-lg text-on-surface tnum">
                      {formatTHB(toSatang(Number(p.total)), locale)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link
        href="/costs/new"
        className="fixed right-4 bottom-fab z-fab flex size-14 items-center justify-center rounded-lg bg-primary text-on-primary shadow-primary transition-transform active:scale-95"
      >
        <Icon name="add" size={32} label={t("addPurchase")} />
      </Link>
    </main>
  );
}
