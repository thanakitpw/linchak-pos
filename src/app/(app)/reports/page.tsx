import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { LineChart, type Point } from "@/components/reports/line-chart";
import { formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import { bangkokToday, weekdayLabel } from "@/lib/report-dates";
import type { IconName } from "@/lib/icons";
import type { Locale } from "@/i18n/locales";

type SalesRow = { sales: number; bills: number; discount: number; tax: number };
type ProfitRow = { sales: number; costs: number; profit: number; bills: number };

/** สรุป — FR-6.1 · พอร์ตจาก dashboard_mobile */
export default async function ReportsPage() {
  const t = await getTranslations("reports");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const today = bangkokToday();
  const [{ data: todayRow }, { data: profitRow }, { data: dailyRow }] = await Promise.all([
    supabase.rpc("report_sales", { p_from: today, p_to: today }),
    supabase.rpc("report_monthly_profit"),
    supabase.rpc("report_daily_sales", { p_days: 7 }),
  ]);

  const todaySales = (todayRow as SalesRow | null) ?? { sales: 0, bills: 0, discount: 0, tax: 0 };
  const profit = (profitRow as ProfitRow | null) ?? { sales: 0, costs: 0, profit: 0, bills: 0 };
  const daily = (dailyRow as { day: string; total: number }[] | null) ?? [];

  const points: Point[] = daily.map((d) => ({
    label: weekdayLabel(d.day, locale),
    value: Number(d.total),
  }));

  return (
    <main className="min-h-dvh pb-nav">
      <header className="flex h-app-bar items-center gap-2 border-b border-outline-variant bg-surface px-4">
        <h1 className="flex-1 text-title-lg text-primary md:text-headline-md">{t("title")}</h1>
        <Link
          href="/settings"
          className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Icon name="account_circle" label={t("title")} />
        </Link>
      </header>

      <div className="mx-auto max-w-content space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Kpi
            label={t("salesToday")}
            value={Number(todaySales.sales)}
            icon="payments"
            locale={locale}
          />
          <Kpi
            label={t("salesMonth")}
            value={Number(profit.sales)}
            icon="trending_up"
            locale={locale}
          />
        </div>

        {/* กำไรเดือนนี้เป็นตัวเลขที่คนเปิดแอปมาดู — ใช้ bg-primary เข้ม + ตัวขาว (6.44:1)
            ไม่ใช่ #2bb14f ที่ mockup ใช้กับตัวขาวแล้วได้ 2.80:1 (กฎ 5/6) */}
        <div className="flex items-center justify-between gap-4 rounded-lg bg-primary p-5 text-on-primary">
          <div className="min-w-0">
            <p className="text-label-lg">{t("profitMonth")}</p>
            <p className="truncate text-display-lg tnum">
              {formatTHB(toSatang(Number(profit.profit)), locale)}
            </p>
          </div>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="trending_up" size={32} />
          </span>
        </div>

        <section className="rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
          <h2 className="mb-3 text-title-lg text-on-surface">{t("last7Days")}</h2>
          <LineChart points={points} locale={locale} emptyLabel={t("noOrders")} />
        </section>

        <nav className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest">
          <MenuLink href="/reports/profit" icon="leaderboard" label={t("monthlyProfit")} />
          <MenuLink href="/reports/sales" icon="calendar_month" label={t("salesReport")} />
          <MenuLink href="/reports/orders" icon="receipt_long" label={t("allOrders")} />
        </nav>
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  icon,
  locale,
}: {
  label: string;
  value: number;
  icon: IconName;
  locale: Locale;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <div className="min-w-0">
        <p className="text-label-sm text-on-surface-variant">{label}</p>
        <p className="truncate text-headline-md text-on-surface tnum">
          {formatTHB(toSatang(value), locale)}
        </p>
      </div>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed-variant">
        <Icon name={icon} size={24} />
      </span>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: "/reports/profit" | "/reports/sales" | "/reports/orders";
  icon: IconName;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-touch items-center gap-3 border-b border-outline-variant px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-container-low"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed-variant">
        <Icon name={icon} size={20} />
      </span>
      <span className="flex-1 text-body-md text-on-surface">{label}</span>
      <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
    </Link>
  );
}
