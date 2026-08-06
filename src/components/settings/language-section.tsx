"use client";

import { useTranslations } from "next-intl";
import { SettingsSection } from "./section";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateLanguage } from "@/app/settings/actions";
import { LOCALES } from "@/i18n/locales";

/**
 * FR-1.4 · ภาษาเป็น setting ของร้าน ไม่ใช่ของเครื่อง
 * นี่คือเหตุผลที่ URL ไม่มี locale — เปลี่ยนที่นี่แล้วมีผลกับทุกคนในร้าน
 */
export function LanguageSection({ current }: { current: string }) {
  const t = useTranslations("settings");

  return (
    <SettingsSection title={t("langSection")} hint={t("langSectionHint")} action={updateLanguage}>
      <Field label={t("langSection")} htmlFor="language">
        <Select id="language" name="language" defaultValue={current}>
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {t(l)}
            </option>
          ))}
        </Select>
      </Field>
    </SettingsSection>
  );
}
