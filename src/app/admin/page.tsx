import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/admin/status-badge";
import { StoreFilters } from "@/components/admin/store-filters";
import { formatTHB, formatDate } from "@/lib/format";
import { satang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

type Row = {
  id: string;
  name: string;
  owner_email: string | null;
  subscription_status: string;
  trial_ends_at: string;
  current_period_end: string | null;
  suspended_at: string | null;
  member_count: number;
  orders_this_month: number;
  sales_this_month: number;
  last_order_at: string | null;
  created_at: string;
};

/**
 * ภาพรวม + รายชื่อร้าน
 *
 * ตัวเลขทั้งหมดมาจาก DB function ที่คืนเฉพาะ "สรุป" ไม่คืนแถวบิลของลูกค้า
 * ตามที่ตัดสินใจไว้ใน docs/data-model.md §10 — แอดมินไม่ควรเห็นข้อมูลการค้าของร้าน
 * โดยไม่มีเหตุผลและไม่มี audit
 */
export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const t = await getTranslations("admin");
  const locale = (await getLocale()) as Locale;
  const { q, status } = await searchParams;

  const supabase = await createClient();
  const [{ data: stats }, { data: stores }] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase.rpc("admin_workspace_list", {
      p_search: typeof q === "string" ? q : "",
      p_status: typeof status === "string" ? status : "",
    }),
  ]);

  const s = (stats ?? {}) as Record<string, number>;
  const rows = (stores ?? []) as Row[];

  return (
    <div className="space-y-6 py-2">
      {/* ── ตัวเลขที่ต้องดูก่อน ─────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("mrr")} value={formatTHB(satang(s.mrr_satang ?? 0), locale)} highlight />
        <Stat label={t("active")} value={String(s.active ?? 0)} />
        <Stat label={t("trialing")} value={String(s.trialing ?? 0)} />
        <Stat label={t("total")} value={String(s.total ?? 0)} />
      </section>

      {/* กลุ่มที่ต้องลงมือ — วางแยกเพราะเป็นเหตุผลที่เปิดหน้านี้ */}
      {((s.trial_ending_soon ?? 0) > 0 || (s.past_due ?? 0) > 0) && (
        <section className="rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-title-lg text-on-surface">
            <Icon name="warning" size={20} className="text-error" />
            {t("needsAttention")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {(s.trial_ending_soon ?? 0) > 0 && (
              <Link
                href="/admin?status=trialing"
                className="rounded-full bg-secondary-container px-3 py-1.5 text-label-lg text-on-secondary-fixed-variant"
              >
                {t("trialEndingSoon")}: {s.trial_ending_soon}
              </Link>
            )}
            {(s.past_due ?? 0) > 0 && (
              <Link
                href="/admin?status=past_due"
                className="rounded-full bg-error-container px-3 py-1.5 text-label-lg text-on-error-container"
              >
                {t("past_due")}: {s.past_due}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── รายชื่อร้าน ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-lg text-on-surface">
            {t("stores")} <span className="text-on-surface-variant tnum">({rows.length})</span>
          </h2>
          <StoreFilters
            defaultQuery={typeof q === "string" ? q : ""}
            defaultStatus={typeof status === "string" ? status : ""}
          />
        </div>

        {rows.length === 0 ? (
          <p className="rounded-md border border-outline-variant bg-surface-container-lowest p-8 text-center text-body-md text-on-surface-variant">
            {t("noStores")}
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/stores/${r.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card transition-colors hover:bg-surface-container-low"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-title-lg text-on-surface">{r.name}</p>
                    <p className="truncate text-label-sm text-on-surface-variant">
                      {r.owner_email}
                    </p>
                  </div>

                  <StatusBadge status={r.subscription_status} suspended={!!r.suspended_at} />

                  <div className="text-right">
                    <p className="text-label-sm text-on-surface-variant">{t("expires")}</p>
                    <p className="text-body-md text-on-surface tnum">
                      {formatDate(new Date(r.current_period_end ?? r.trial_ends_at), locale)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-label-sm text-on-surface-variant">{t("ordersThisMonth")}</p>
                    <p className="text-body-md text-on-surface tnum">{r.orders_this_month}</p>
                  </div>

                  <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p
        className={
          highlight ? "text-headline-md text-primary tnum" : "text-headline-md text-on-surface tnum"
        }
      >
        {value}
      </p>
    </div>
  );
}
