"use client";

import { useTranslations } from "next-intl";
import { SettingsSection } from "./section";
import { LogoSection } from "./logo-section";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { updateStoreInfo } from "@/app/settings/actions";

/** FR-1.1 · ชื่อร้าน / สาขา / เบอร์ / โลโก้ — ทั้งหมดนี้ขึ้นบนหัวใบเสร็จ */
export function StoreSection({
  name,
  branch,
  phone,
  logoUrl,
}: {
  name: string;
  branch: string | null;
  phone: string | null;
  logoUrl: string | null;
}) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-4">
      <SettingsSection
        title={t("storeSection")}
        hint={t("storeSectionHint")}
        action={updateStoreInfo}
      >
        <Field label={t("storeName")} htmlFor="name">
          <Input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={name}
            leading={<Icon name="storefront" size={20} />}
          />
        </Field>

        <Field label={t("branch")} htmlFor="branch">
          <Input
            id="branch"
            name="branch"
            type="text"
            defaultValue={branch ?? ""}
            placeholder={t("branchPlaceholder")}
          />
        </Field>

        <Field label={t("phone")} htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={phone ?? ""}
            placeholder={t("phonePlaceholder")}
            className="tnum"
          />
        </Field>

        {/* โลโก้อัปโหลดแยก มีฟอร์มของตัวเอง จึงวางไว้นอกฟอร์มหลักไม่ได้ —
            แต่ <form> ซ้อนกันไม่ได้ จึงต้องอยู่นอก SettingsSection */}
      </SettingsSection>

      <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
        <LogoSection logoUrl={logoUrl} />
      </div>
    </div>
  );
}
