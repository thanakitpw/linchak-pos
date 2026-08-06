"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SettingsSection } from "./section";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateTax } from "@/app/settings/actions";

/**
 * FR-1.3 · VAT ปิดเป็นค่าเริ่มต้น
 *
 * ช่องอัตราซ่อนไปเลยเมื่อปิด ไม่ใช่แค่ disable — สอดคล้องกับกฎที่ว่า
 * "ปิด VAT แล้วต้องไม่ render element ภาษีใดๆ เลย" (CLAUDE.md ข้อ 24)
 * ถ้ายังโชว์ช่องเทาๆ ไว้ ผู้ใช้ที่ไม่ได้จด VAT จะสงสัยว่าต้องกรอกไหม
 */
export function TaxSection({
  initialEnabled,
  initialRate,
}: {
  initialEnabled: boolean;
  initialRate: number;
}) {
  const t = useTranslations("settings");
  const [enabled, setEnabled] = useState(initialEnabled);

  return (
    <SettingsSection title={t("taxSection")} hint={t("taxSectionHint")} action={updateTax}>
      <Switch
        name="tax_enabled"
        label={t("taxEnabled")}
        defaultChecked={initialEnabled}
        onChange={setEnabled}
      />

      {enabled && (
        <Field label={t("taxRate")} htmlFor="tax_rate">
          <Input
            id="tax_rate"
            name="tax_rate"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={0.01}
            defaultValue={initialRate}
            className="tnum"
          />
        </Field>
      )}
    </SettingsSection>
  );
}
