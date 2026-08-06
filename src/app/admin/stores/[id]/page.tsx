import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/admin/status-badge";
import { PaymentForm } from "@/components/admin/payment-form";
import { SuspendForm } from "@/components/admin/suspend-form";
import { formatDate, formatDateTime, formatTHB } from "@/lib/format";
import { satang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

type Detail = {
  workspace: {
    id: string;
    name: string;
    branch: string | null;
    phone: string | null;
    subscription_status: string;
    plan_code: string | null;
    trial_ends_at: string;
    current_period_end: string | null;
    suspended_at: string | null;
    suspended_reason: string | null;
    created_at: string;
  };
  members: { email: string; role: string; joined_at: string }[];
  payments: {
    id: string;
    amount_satang: number;
    period_start: string;
    period_end: string;
    method: string;
    reference: string | null;
    note: string | null;
    created_at: string;
  }[];
  audit: { action: string; reason: string | null; created_at: string; actor: string | null }[];
  stats: { orders_total: number; products_total: number; last_order_at: string | null };
};

/**
 * รายละเอียดร้าน + การกระทำของแอดมิน
 *
 * ⚠️ ไม่แสดง promptpay_id — DB function ตัดออกให้แล้ว
 * แอดมินไม่มีเหตุผลต้องรู้เลขรับเงินของลูกค้า (docs/data-model.md §10)
 */
export default async function StoreDetailPage({ params }: PageProps<"/admin/stores/[id]">) {
  const { id } = await params;
  const t = await getTranslations("admin");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const [{ data }, { data: plans }] = await Promise.all([
    supabase.rpc("admin_workspace_detail", { p_workspace_id: id }),
    supabase.from("plans").select("code, name_th, name_en, price_satang").eq("is_active", true),
  ]);

  const d = data as Detail | null;
  if (!d?.workspace) notFound();
  const w = d.workspace;

  return (
    <div className="space-y-6 py-2">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-label-lg text-primary underline-offset-4 hover:underline"
      >
        <Icon name="arrow_back" size={20} />
        {t("stores")}
      </Link>

      {/* ── หัวเรื่อง ─────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-md text-on-surface">{w.name}</h1>
          <p className="text-body-md text-on-surface-variant">
            {[w.branch, w.phone].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <StatusBadge status={w.subscription_status} suspended={!!w.suspended_at} />
      </header>

      {w.suspended_at && (
        <p className="flex items-start gap-2 rounded-md bg-error-container px-4 py-3 text-body-md text-on-error-container">
          <Icon name="warning" size={20} className="mt-0.5 shrink-0" />
          <span>
            <strong>{t("suspended_at")}</strong> {formatDateTime(new Date(w.suspended_at), locale)}
            {w.suspended_reason && (
              <>
                {" · "}
                <strong>{t("suspendedBecause")}</strong> {w.suspended_reason}
              </>
            )}
          </span>
        </p>
      )}

      {/* ── ตัวเลขสรุป (ไม่ใช่ข้อมูลบิลจริง) ─────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cell label={t("expires")}>
          {formatDate(new Date(w.current_period_end ?? w.trial_ends_at), locale)}
        </Cell>
        <Cell label={t("members")}>{d.members.length}</Cell>
        <Cell label={t("ordersThisMonth")}>{d.stats.orders_total}</Cell>
        <Cell label={t("lastOrder")}>
          {d.stats.last_order_at ? formatDate(new Date(d.stats.last_order_at), locale) : t("never")}
        </Cell>
      </section>

      {/* ── สมาชิก ───────────────────────────────────────────────────── */}
      <Panel title={t("members")}>
        <ul className="divide-y divide-outline-variant">
          {d.members.map((m) => (
            <li key={m.email} className="flex items-center justify-between gap-4 py-2">
              <span className="truncate text-body-md text-on-surface">{m.email}</span>
              <span className="text-label-sm text-on-surface-variant">{m.role}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* ── บันทึกการชำระเงิน ────────────────────────────────────────── */}
      <Panel title={t("recordPayment")}>
        <PaymentForm workspaceId={w.id} plans={plans ?? []} />
      </Panel>

      {/* ── ประวัติการชำระ ───────────────────────────────────────────── */}
      <Panel title={t("paymentHistory")}>
        {d.payments.length === 0 ? (
          <p className="py-2 text-body-md text-on-surface-variant">{t("noPayments")}</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {d.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-body-md text-on-surface tnum">
                  {formatTHB(satang(p.amount_satang), locale)}
                </span>
                <span className="text-label-sm text-on-surface-variant tnum">
                  {formatDate(new Date(p.period_start), locale)} –{" "}
                  {formatDate(new Date(p.period_end), locale)}
                </span>
                <span className="text-label-sm text-on-surface-variant">{t(p.method)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ── ระงับ / ปลดระงับ ─────────────────────────────────────────── */}
      <Panel title={w.suspended_at ? t("unsuspend") : t("suspend")}>
        <SuspendForm workspaceId={w.id} isSuspended={!!w.suspended_at} />
      </Panel>

      {/* ── audit ────────────────────────────────────────────────────── */}
      <Panel title={t("auditLog")}>
        {d.audit.length === 0 ? (
          <p className="py-2 text-body-md text-on-surface-variant">{t("noAudit")}</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {d.audit.map((a, i) => (
              <li key={i} className="py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-label-lg text-on-surface">{a.action}</code>
                  <span className="text-label-sm text-on-surface-variant tnum">
                    {formatDateTime(new Date(a.created_at), locale)}
                  </span>
                </div>
                <p className="text-label-sm text-on-surface-variant">
                  {a.actor}
                  {a.reason && ` · ${a.reason}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-outline-variant bg-surface-container-lowest shadow-card">
      <h2 className="border-b border-outline-variant px-4 py-3 text-title-lg text-on-surface">
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="text-title-lg text-on-surface tnum">{children}</p>
    </div>
  );
}
