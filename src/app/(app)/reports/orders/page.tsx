import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { OrderFilters } from "@/components/reports/order-filters";
import { formatDate, formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const PAYMENT_KEY = {
  cash: "payCash",
  promptpay: "payPromptpay",
  transfer: "payTransfer",
} as const;

/**
 * รายการบิลทั้งหมด — FR-6.4 · พอร์ตจาก mobile_3
 *
 * กรองด้วย SQL ไม่ใช่ดึงมาทั้งหมดแล้วกรองในเครื่องเหมือนหน้าสินค้า:
 * บิลสะสมไม่มีเพดาน ร้านที่ขายมาปีหนึ่งมีหลายพันใบ
 */
export default async function OrdersPage({ searchParams }: PageProps<"/reports/orders">) {
  const t = await getTranslations("reports");
  const tCommon = await getTranslations("common");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const sp = await searchParams;
  const date = typeof sp.date === "string" && ISO_DATE.test(sp.date) ? sp.date : null;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  let query = supabase
    .from("orders")
    .select("id, bill_no, ordered_at, total, payment_method, order_items(name_snapshot)")
    .order("ordered_at", { ascending: false })
    .limit(100);

  if (date) {
    // ขอบวันเป็นเวลาไทย ให้ตรงกับที่ฟังก์ชันรายงานตัดวัน
    query = query
      .gte("ordered_at", `${date}T00:00:00+07:00`)
      .lt("ordered_at", `${date}T24:00:00+07:00`);
  }
  if (q) query = query.ilike("bill_no", `%${q}%`);

  const { data: orders } = await query;

  return (
    <main className="mx-auto min-h-dvh max-w-content space-y-3 p-4 pb-nav">
      <header className="flex h-app-bar items-center gap-2">
        <Link
          href="/reports"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="arrow_back" label={tCommon("back")} />
        </Link>
        <h1 className="flex-1 text-title-lg text-primary">{t("allOrders")}</h1>
      </header>

      <OrderFilters date={date} q={q} />

      <p className="text-right text-label-sm text-on-surface-variant tnum">
        {t("billsFound", { count: (orders ?? []).length })}
      </p>

      {(orders ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Icon name="receipt_long" size={48} className="text-tertiary-fixed-dim" />
          <p className="text-body-md text-on-surface-variant">{t("noOrders")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {(orders ?? []).map((o) => {
            const names = (o.order_items ?? []).map((i) => i.name_snapshot);
            return (
              <li key={o.id}>
                <Link
                  href={`/receipt/${o.id}`}
                  className="block rounded-md border border-outline-variant bg-surface-container-lowest p-3 shadow-card transition-colors hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-title-lg text-on-surface tnum">{o.bill_no}</p>
                      <p className="truncate text-body-md text-on-surface-variant">
                        {names.length > 1
                          ? t("itemsSummary", { first: names[0], rest: names.length - 1 })
                          : (names[0] ?? "—")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-label-sm text-on-surface-variant tnum">
                        {formatDate(new Date(o.ordered_at), locale)}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-secondary-container px-2 py-0.5 text-label-sm text-on-secondary-fixed-variant">
                        {t(PAYMENT_KEY[o.payment_method as keyof typeof PAYMENT_KEY] ?? "payCash")}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 flex items-baseline justify-between border-t border-outline-variant pt-2">
                    <span className="text-body-md text-on-surface-variant">{t("billTotal")}</span>
                    <span className="text-title-lg text-on-surface tnum">
                      {formatTHB(toSatang(Number(o.total)), locale)}
                    </span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
