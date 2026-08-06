import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/login/actions";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/locales";
import { getLocale } from "next-intl/server";

/**
 * placeholder ระหว่างที่ยังไม่มีแท็บ "ขาย" (FR-3)
 *
 * หน้านี้อยู่หลัง proxy จึงมี session แน่นอน — ใช้พิสูจน์ว่า auth + RLS
 * ทำงานครบวงจร: ล็อกอินแล้วเห็นข้อมูลร้านตัวเองที่ trigger สร้างให้ตอนสมัคร
 */
export default async function Home() {
  const t = await getTranslations("dev");
  const tAuth = await getTranslations("auth");
  const locale = (await getLocale()) as Locale;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS จำกัดให้เห็นเฉพาะร้านที่ตัวเองเป็นสมาชิก — ไม่ต้องกรอง workspace_id เอง
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name, subscription_status, trial_ends_at, tax_enabled, language")
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-content space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-md text-primary">{t("foundationTitle")}</h1>
          <p className="text-body-md text-on-surface-variant">
            {t("signedInAs")} {user?.email}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            {tAuth("signOut")}
          </Button>
        </form>
      </div>

      {workspace && (
        <dl className="grid gap-2 rounded-md border border-outline-variant bg-surface-container-lowest p-4 text-body-md sm:grid-cols-2">
          <div>
            <dt className="text-label-sm text-on-surface-variant">{t("yourStore")}</dt>
            <dd className="text-title-lg text-on-surface">{workspace.name}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">{t("status")}</dt>
            <dd className="text-on-surface">{workspace.subscription_status}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">{t("trialEnds")}</dt>
            <dd className="text-on-surface tnum">
              {formatDate(new Date(workspace.trial_ends_at), locale)}
            </dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">VAT</dt>
            <dd className="text-on-surface">{String(workspace.tax_enabled)}</dd>
          </div>
        </dl>
      )}

      <p className="text-body-md text-on-surface-variant">{t("foundationIntro")}</p>
      <ul className="space-y-2">
        <li>
          <Link
            href="/dev/tokens"
            className="text-body-lg text-primary underline underline-offset-4"
          >
            /dev/tokens — {t("tokensLinkHint")}
          </Link>
        </li>
        <li>
          <Link
            href="/dev/receipt"
            className="text-body-lg text-primary underline underline-offset-4"
          >
            /dev/receipt — {t("receiptLinkHint")}
          </Link>
        </li>
      </ul>
    </main>
  );
}
