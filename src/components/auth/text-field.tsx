"use client";

import { Field, Input } from "@/components/ui/input";
import { useSubmittedValues } from "./auth-form";

/**
 * ช่องกรอกในฟอร์ม auth ที่จำค่าเดิมไว้เมื่อ submit ไม่ผ่าน
 *
 * server action คืนค่าที่กรอกกลับมาใน state — ถ้าไม่เติมกลับให้ ผู้ใช้ต้องพิมพ์
 * ชื่อร้านกับอีเมลใหม่ทุกครั้งที่พลาด ซึ่งเจ็บมากบนมือถือ
 * (รหัสผ่านไม่ส่งกลับโดยตั้งใจ)
 */
export function TextField({
  name,
  label,
  ...inputProps
}: {
  name: "email" | "store_name";
  label: string;
} & Omit<React.ComponentProps<typeof Input>, "name" | "id" | "defaultValue">) {
  const values = useSubmittedValues();

  return (
    <Field label={label} htmlFor={name}>
      <Input id={name} name={name} defaultValue={values?.[name] ?? ""} {...inputProps} />
    </Field>
  );
}
