"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

/**
 * ช่องรหัสผ่านพร้อมปุ่มสลับแสดง/ซ่อน
 * ปุ่มมีแต่ไอคอน จึงต้องส่ง label ให้ <Icon> (มาจาก next-intl ไม่ใช่ literal)
 */
export function PasswordField({
  action,
  autoComplete = "current-password",
  minLength,
}: {
  action?: React.ReactNode;
  autoComplete?: "current-password" | "new-password";
  minLength?: number;
}) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <Field label={t("password")} htmlFor={id} action={action}>
      <Input
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        placeholder={t("passwordPlaceholder")}
        leading={<Icon name="lock" size={20} />}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <Icon
              name={visible ? "visibility_off" : "visibility"}
              size={20}
              label={visible ? t("hidePassword") : t("showPassword")}
            />
          </button>
        }
      />
    </Field>
  );
}
