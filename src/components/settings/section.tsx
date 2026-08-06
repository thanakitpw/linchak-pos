"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { SettingsState } from "@/app/settings/actions";

type Action = (prev: SettingsState, formData: FormData) => Promise<SettingsState>;

/**
 * การ์ดหนึ่งหัวข้อในหน้าตั้งค่า พร้อมปุ่มบันทึกของตัวเอง
 *
 * แยกฟอร์มต่อหัวข้อแทนที่จะทำฟอร์มเดียวทั้งหน้า เพราะแม่ค้ามักเข้ามาแก้เรื่องเดียว
 * (เช่นเปลี่ยนเบอร์) การกดบันทึกแล้วส่งทุกอย่างขึ้นไปใหม่ทำให้ผิดพลาดโดยไม่ตั้งใจได้
 */
export function SettingsSection({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action: Action;
  children: React.ReactNode;
}) {
  const t = useTranslations("settings");
  const [state, formAction] = useActionState<SettingsState, FormData>(action, {});

  return (
    <section className="rounded-md border border-outline-variant bg-surface-container-lowest shadow-card">
      <div className="border-b border-outline-variant px-4 py-3">
        <h2 className="text-title-lg text-on-surface">{title}</h2>
        {hint && <p className="mt-0.5 text-label-sm text-on-surface-variant">{hint}</p>}
      </div>

      <form action={formAction} className="space-y-4 p-4">
        {children}

        {state.error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-sm bg-error-container px-3 py-2 text-body-md text-on-error-container"
          >
            <Icon name="error" size={20} className="mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </p>
        )}
        {state.ok && (
          <p role="status" className="flex items-center gap-2 text-body-md text-primary">
            <Icon name="check_circle" size={20} />
            <span>{state.ok}</span>
          </p>
        )}

        <div className="flex justify-end">
          <SaveButton label={t("save")} pendingLabel={t("saving")} />
        </div>
      </form>
    </section>
  );
}

function SaveButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
