import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { LineChart, type Point } from "@/components/reports/line-chart";
import { formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import { bangkokToday, dayMonthLabel, weekdayLabel } from "@/lib/report-dates";
import type { IconName } from "@/lib/icons";
import type { Locale } from "@/i18n/locales";

type SalesRow = { sales: number; bills: number; discount: number; tax: number };
type ProfitRow = { sales: number; costs: number; profit: number; bills: number };

/**
 * ช่วงที่เลือกได้ของกราฟ
 * อยู่ใน query string ไม่ใช่ state — ลิงก์ส่งต่อได้ ปุ่มย้อนกลับทำงานถูก
 * และไม่ต้องทำให้ทั้งหน้ากลายเป็น client component เพราะ chip 3 อัน
 */
const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

/** สรุป — FR-6.1 · พอร์ตจาก dashboard_mobile */
export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const t = await getTranslations("reports");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { days: daysParam } = await searchParams;
  const days: Range = RANGES.find((r) => String(r) === daysParam) ?? 7;

  const today = bangkokToday();
  const [{ data: todayRow }, { data: profitRow }, { data: dailyRow }] = await Promise.all([
    supabase.rpc("report_sales", { p_from: today, p_to: today }),
    supabase.rpc("report_monthly_profit"),
    supabase.rpc("report_daily_sales", { p_days: days }),
  ]);

  const todaySales = (todayRow as SalesRow | null) ?? { sales: 0, bills: 0, discount: 0, tax: 0 };
  const profit = (profitRow as ProfitRow | null) ?? { sales: 0, costs: 0, profit: 0, bills: 0 };
  const daily = (dailyRow as { day: string; total: number }[] | null) ?? [];

  // 7 วันใช้ตัวย่อวัน (จ อ พ) ได้เพราะไม่ซ้ำ · ช่วงยาวกว่านั้นต้องเป็นวันที่
  const points: Point[] = daily.map((d) => ({
    label: days <= 7 ? weekdayLabel(d.day, locale) : dayMonthLabel(d.day, locale),
    value: Number(d.total),
  }));
  const rangeTotal = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <main className="min-h-dvh pb-nav">
      <header className="flex h-app-bar items-center gap-2 border-b border-outline-variant bg-surface px-4">
        <h1 className="flex-1 text-title-lg text-primary md:text-headline-md">{t("title")}</h1>
        {/* เหตุผลเดียวกับหน้าขาย — md ขึ้นไปมีใน rail ซ้ายแล้ว */}
        <Link
          href="/settings"
          className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low md:hidden"
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-title-lg text-on-surface">{t("salesTrend")}</h2>
              <p className="text-label-sm text-on-surface-variant">
                {t("rangeTotal")}{" "}
                <span className="text-on-surface tnum">
                  {formatTHB(toSatang(rangeTotal), locale)}
                </span>
              </p>
            </div>
            {/* ใช้ลิงก์ไม่ใช่ปุ่ม — เปลี่ยนช่วงคือการเปลี่ยนสิ่งที่หน้านี้แสดง
                ควรอยู่ใน URL และย้อนกลับได้ ไม่ใช่ state ที่หายตอนรีเฟรช */}
            <nav className="flex shrink-0 items-center gap-2">
              {RANGES.map((r) => (
                <Link
                  key={r}
                  href={r === 7 ? "/reports" : `/reports?days=${r}`}
                  aria-current={r === days ? "page" : undefined}
                  className={
                    r === days
                      ? "flex min-h-touch items-center rounded-full border border-primary-container bg-primary-container px-4 text-label-lg text-on-primary-container"
                      : "flex min-h-touch items-center rounded-full border border-outline-variant px-4 text-label-lg text-on-surface transition-colors hover:bg-surface-container-low"
                  }
                >
                  {t(`days${r}`)}
                </Link>
              ))}
              {/* <a> ธรรมดาไม่ใช่ <Link> — ปลายทางเป็นไฟล์ ไม่ใช่หน้าในแอป
                  ถ้าใช้ Link จะโดน client router จับแล้วพยายาม render เป็นหน้า */}
              <a
                href={`/reports/export?days=${days}`}
                download
                title={t("exportHint")}
                className="flex min-h-touch items-center gap-1 rounded-full border border-outline-variant px-4 text-label-lg text-on-surface transition-colors hover:bg-surface-container-low"
              >
                <Icon name="download" size={20} />
                <span className="sr-only sm:not-sr-only">{t("export")}</span>
              </a>
            </nav>
          </div>
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
