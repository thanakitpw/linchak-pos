"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * บัญชีผู้ใช้ + ออกจากระบบ
 *
 * ไม่ใช้ `<SettingsSection>` เพราะอันนั้นเป็นฟอร์มที่มีปุ่ม "บันทึก" ของตัวเอง
 * ส่วนนี้ไม่มีอะไรให้บันทึก มีแต่ปุ่มที่ทำงานทันที
 *
 * วางไว้ล่างสุดของหน้าตั้งค่าโดยตั้งใจ — ปุ่มออกจากระบบที่อยู่ใกล้ปุ่มที่ใช้ประจำ
 * คือปุ่มที่จะถูกกดพลาดกลางวันขายดี
 */
export function AccountSection({ email }: { email: string }) {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-md border border-outline-variant bg-surface-container-lowest shadow-card">
      <div className="border-b border-outline-variant px-4 py-3">
        <h2 className="text-title-lg text-on-surface">{t("accountSection")}</h2>
        <p className="mt-0.5 text-label-sm text-on-surface-variant">{t("accountSectionHint")}</p>
      </div>

      <div className="space-y-3 p-4">
        <p className="flex items-center gap-2 text-body-md text-on-surface">
          <Icon name="account_circle" size={20} className="text-on-surface-variant" />
          <span className="min-w-0 truncate">{email}</span>
        </p>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending}
          aria-busy={pending}
          onClick={() => startTransition(() => signOut())}
        >
          <Icon name="lock" size={20} />
          {pending ? t("signingOut") : tAuth("signOut")}
        </Button>
      </div>
    </section>
  );
}
