import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { currentWorkspaceId } from "@/lib/workspace";
import { Icon } from "@/components/ui/icon";
import { StoreSection } from "@/components/settings/store-section";
import { PromptPaySection } from "@/components/settings/promptpay-section";
import { TaxSection } from "@/components/settings/tax-section";
import { LanguageSection } from "@/components/settings/language-section";
import { BankSection } from "@/components/settings/bank-section";
import { AccountSection } from "@/components/settings/account-section";
import type { PromptPayType } from "@/lib/promptpay";

/**
 * ตั้งค่าร้าน — FR-1
 *
 * ⚠️ หน้านี้ไม่มี mockup ใน pos_design/ — ออกแบบใหม่จาก token ของ design system
 * (ดู docs/design-system.md §12 "หน้าที่ PRD ต้องการแต่ไม่มี mockup")
 *
 * เป็นหน้าที่สำคัญที่สุดของ FR-1 เพราะเป็นที่เดียวที่ตั้งเลข PromptPay ได้
 * ถ้าไม่ตั้ง ใบเสร็จจะไม่มี QR รับเงิน ซึ่งเป็นฟีเจอร์ขายของทั้งแอป
 */
export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const supabase = await createClient();

  // ยิงพร้อมกัน ไม่ใช่ต่อคิว — สองอย่างนี้ไม่ขึ้นต่อกัน
  // แต่ละ round trip ไป Supabase คือเวลาที่ผู้ใช้รอจริง จึงไม่ควรบวกกัน
  // ⚠️ ต้องระบุ id เสมอ ห้าม limit(1) — เหตุผลเต็มใน src/lib/workspace.ts
  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) notFound();

  const [{ data: ws }, { data: claims }] = await Promise.all([
    supabase
      .from("workspaces")
      .select(
        "name, branch, phone, logo_path, promptpay_id, promptpay_type, tax_enabled, tax_rate, language, bank_code, bank_account_no, bank_account_name"
      )
      .eq("id", workspaceId)
      .maybeSingle(),
    // อีเมลมาจาก claims ของ session ไม่ใช่จากตาราง — เป็นข้อมูลของ auth ไม่ใช่ของร้าน
    supabase.auth.getClaims(),
  ]);

  if (!ws) notFound();

  const email = (claims?.claims?.email as string | undefined) ?? "";

  // bucket `logos` เป็น public เพราะโลโก้ต้องขึ้นบนหน้าบิลที่ลูกค้าเปิดโดยไม่ล็อกอิน
  const logoUrl = ws.logo_path
    ? supabase.storage.from("logos").getPublicUrl(ws.logo_path).data.publicUrl
    : null;

  return (
    <main className="mx-auto max-w-form pb-12">
      <header className="sticky top-0 z-appbar flex h-app-bar items-center gap-2 border-b border-outline-variant bg-surface px-4">
        <Link
          href="/"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="arrow_back" label={t("title")} />
        </Link>
        <h1 className="text-title-lg text-on-surface">{t("title")}</h1>
      </header>

      <div className="space-y-4 p-4">
        <StoreSection name={ws.name} branch={ws.branch} phone={ws.phone} logoUrl={logoUrl} />
        <PromptPaySection
          initialId={ws.promptpay_id}
          initialType={ws.promptpay_type as PromptPayType | null}
        />
        <BankSection
          initialCode={ws.bank_code}
          initialAccountNo={ws.bank_account_no}
          initialAccountName={ws.bank_account_name}
        />
        <TaxSection initialEnabled={ws.tax_enabled} initialRate={Number(ws.tax_rate)} />
        <LanguageSection current={ws.language} />
        <AccountSection email={email} />
      </div>
    </main>
  );
}
