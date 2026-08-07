import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { currentWorkspaceId } from "@/lib/workspace";
import { Icon } from "@/components/ui/icon";
import { RangeForm } from "@/components/reports/range-form";
import { formatDate, formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import { bangkokMonthStart, bangkokToday } from "@/lib/report-dates";
import type { Locale } from "@/i18n/locales";

type SalesRow = { sales: number; bills: number; discount: number; tax: number };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * รายงานยอดขาย — FR-6.2 · **ไม่มีใน mockup** (mockup มีแค่ลิงก์ในเมนู)
 *
 * PRD แยกเป็น Daily / Monthly / Custom range แต่ทั้งสามคือ "ช่วงวันที่" อันเดียวกัน
 * ทำเป็นสามหน้าคือสามที่ที่ต้องแก้เวลาคำนวณเปลี่ยน — หน้าเดียวที่มีปุ่มลัดครอบคลุมครบ
 */
export default async function SalesReportPage({ searchParams }: PageProps<"/reports/sales">) {
  const t = await getTranslations("reports");
  const tCommon = await getTranslations("common");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const sp = await searchParams;
  const pick = (key: string, fallback: string) => {
    const v = sp[key];
    return typeof v === "string" && ISO_DATE.test(v) ? v : fallback;
  };
  // ค่าเริ่มต้น = เดือนนี้ ซึ่งเป็นช่วงที่คนเปิดรายงานมาดูบ่อยที่สุด
  const from = pick("from", bangkokMonthStart());
  const to = pick("to", bangkokToday());

  const { data } = await supabase.rpc("report_sales", { p_from: from, p_to: to });
  const r = (data as SalesRow | null) ?? { sales: 0, bills: 0, discount: 0, tax: 0 };

  const workspaceId = await currentWorkspaceId();
  const { data: ws } = workspaceId
    ? await supabase.from("workspaces").select("tax_enabled").eq("id", workspaceId).maybeSingle()
    : { data: null };

  return (
    <main className="mx-auto min-h-dvh max-w-content space-y-3 p-4 pb-nav">
      <header className="flex h-app-bar items-center gap-2">
        <Link
          href="/reports"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="arrow_back" label={tCommon("back")} />
        </Link>
        <h1 className="flex-1 text-title-lg text-on-surface">{t("salesReport")}</h1>
      </header>

      <RangeForm from={from} to={to} />

      <section className="rounded-md border border-outline-variant bg-surface-container-lowest p-5 shadow-card">
        <p className="text-label-sm text-on-surface-variant tnum">
          {formatDate(new Date(`${from}T00:00:00+07:00`), locale)} –{" "}
          {formatDate(new Date(`${to}T00:00:00+07:00`), locale)}
        </p>
        <p className="text-label-lg text-on-surface-variant">{t("totalSales")}</p>
        <p className="text-display-lg text-primary tnum">
          {formatTHB(toSatang(Number(r.sales)), locale)}
        </p>

        <dl className="mt-3 space-y-1 border-t border-outline-variant pt-3 text-body-md">
          <Row label={t("bills")} value={String(Number(r.bills))} />
          <Row label={t("discountTotal")} value={formatTHB(toSatang(Number(r.discount)), locale)} />
          {/* FR-1.3 · VAT ปิดอยู่ไม่ render แถวภาษีเลย ไม่ใช่แถวที่เป็นศูนย์ (กฎ 24) */}
          {ws?.tax_enabled && (
            <Row label={t("taxTotal")} value={formatTHB(toSatang(Number(r.tax)), locale)} />
          )}
        </dl>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-on-surface tnum">{value}</dd>
    </div>
  );
}
