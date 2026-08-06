"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

/**
 * ช่องยืนยันรหัสผ่าน — ไม่มีปุ่มสลับแสดง/ซ่อนโดยตั้งใจ
 *
 * ถ้าเปิดให้เห็นทั้งสองช่อง การพิมพ์ซ้ำก็ไม่ได้ยืนยันอะไร เพราะคนจะ copy มาวาง
 * ค่าเทียบกันฝั่ง server (ไม่ใช่แค่ฝั่ง client) — ดู updatePassword ใน login/actions.ts
 */
export function ConfirmPasswordField() {
  const t = useTranslations("auth");
  const id = useId();

  return (
    <Field label={t("confirmPassword")} htmlFor={id}>
      <Input
        id={id}
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder={t("passwordPlaceholder")}
        leading={<Icon name="lock" size={20} />}
      />
    </Field>
  );
}
