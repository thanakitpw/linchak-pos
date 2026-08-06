import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { BarChart, type Bar } from "@/components/reports/bar-chart";
import { MonthPicker } from "@/components/reports/month-picker";
import { formatPercent, formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import { monthLabel, monthYearLabel, recentMonths } from "@/lib/report-dates";
import type { Locale } from "@/i18n/locales";

type Profit = {
  month: string;
  sales: number;
  costs: number;
  profit: number;
  bills: number;
  purchases: number;
  prev_profit: number;
};

/**
 * กำไรรายเดือน — FR-6.3 · พอร์ตจาก mobile_7
 *
 * ตัวเลขทั้งหมดคำนวณใน Postgres (BR-5) ไม่ใช่บวกใน JS
 * เดือนที่เลือกอยู่ใน query string ไม่ใช่ state — แชร์ลิงก์แล้วได้เดือนเดียวกัน
 * และปุ่มย้อนกลับของเบราว์เซอร์ทำงานตามที่คนคาด
 */
export default async function ProfitPage({ searchParams }: PageProps<"/reports/profit">) {
  const t = await getTranslations("reports");
  const tCommon = await getTranslations("common");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const months = recentMonths(12);
  const raw = (await searchParams).month;
  const selected = typeof raw === "string" && months.includes(raw) ? raw : months[0];

  const [{ data: profitRow }, { data: trendRow }] = await Promise.all([
    supabase.rpc("report_monthly_profit", { p_month: selected }),
    supabase.rpc("report_profit_trend", { p_months: 6 }),
  ]);

  const p = (profitRow as Profit | null) ?? {
    month: selected,
    sales: 0,
    costs: 0,
    profit: 0,
    bills: 0,
    purchases: 0,
    prev_profit: 0,
  };
  const trend = (trendRow as { month: string; profit: number }[] | null) ?? [];

  // เทียบเดือนก่อน: เดือนก่อนเป็น 0 แล้วหารไม่ได้ — บอกตรงๆ ดีกว่าโชว์ ∞% หรือ 0%
  const prev = Number(p.prev_profit);
  const change = prev !== 0 ? (Number(p.profit) - prev) / Math.abs(prev) : null;

  const bars: Bar[] = trend.map((m) => ({
    label: monthLabel(m.month, locale),
    value: Number(m.profit),
    highlight: m.month === selected,
  }));

  return (
    <main className="mx-auto min-h-dvh max-w-content space-y-3 p-4 pb-nav">
      <header className="flex h-app-bar items-center gap-2">
        <Link
          href="/reports"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="arrow_back" label={tCommon("back")} />
        </Link>
        <h1 className="flex-1 text-title-lg text-on-surface">{t("monthlyProfit")}</h1>
        <MonthPicker
          months={months.map((m) => ({ value: m, label: monthYearLabel(m, locale) }))}
          selected={selected}
        />
      </header>

      <section className="rounded-md border border-outline-variant bg-surface-container-lowest p-5 shadow-card">
        <p className="text-label-lg text-on-surface-variant">{t("profitMonth")}</p>
        <p className="text-display-lg text-primary tnum">
          {formatTHB(toSatang(Number(p.profit)), locale)}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-fixed-variant">
          {change === null ? (
            t("noPrevMonth")
          ) : (
            <>
              <Icon name={change >= 0 ? "trending_up" : "trending_down"} size={16} />
              <span className="tnum">
                {t("vsPrevMonth", { percent: formatPercent(Math.abs(change), locale) })}
              </span>
            </>
          )}
        </p>
      </section>

      <section className="space-y-2 rounded-md border border-outline-variant bg-surface-container-lowest p-5 shadow-card">
        <Row label={t("totalSales")} value={formatTHB(toSatang(Number(p.sales)), locale)} />
        <Row label={t("totalCosts")} value={formatTHB(toSatang(Number(p.costs)), locale)} />
        <div className="flex items-baseline justify-between border-t border-outline-variant pt-2">
          <span className="text-title-lg text-on-surface">{t("profit")}</span>
          <span className="text-title-lg text-primary tnum">
            {formatTHB(toSatang(Number(p.profit)), locale)}
          </span>
        </div>
        <p className="border-t border-outline-variant pt-2 text-center text-label-sm text-on-surface-variant tnum">
          {t("billCount", { count: Number(p.bills) })} ·{" "}
          {t("purchaseCount", { count: Number(p.purchases) })}
        </p>
      </section>

      <section className="rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
        <h2 className="mb-3 text-title-lg text-on-surface">{t("profitTrend")}</h2>
        <BarChart bars={bars} locale={locale} emptyLabel={t("noOrders")} />
      </section>

      <p className="text-center text-label-sm text-on-surface-variant">{t("profitFormula")}</p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-body-md">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface tnum">{value}</span>
    </div>
  );
}
