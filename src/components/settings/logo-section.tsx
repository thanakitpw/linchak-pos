"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { removeLogo, uploadLogo, type SettingsState } from "@/app/settings/actions";

/**
 * FR-1.1 · โลโก้ร้าน — ขึ้นบนหัวใบเสร็จและบนหน้าบิล public
 *
 * อัปโหลดทันทีที่เลือกไฟล์ ไม่ต้องกดบันทึกอีกที เพราะการเลือกไฟล์คือเจตนาชัดอยู่แล้ว
 * และการมีปุ่มบันทึกแยกทำให้คนลืมกดบ่อย
 */
export function LogoSection({ logoUrl }: { logoUrl: string | null }) {
  const t = useTranslations("settings");
  const [state, formAction] = useActionState<SettingsState, FormData>(uploadLogo, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <span className="block text-label-lg text-on-surface">{t("logo")}</span>

      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-outline-variant bg-surface-container-low">
          {preview || logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview ?? logoUrl!} alt={t("logo")} className="size-full object-contain" />
          ) : (
            <Icon name="storefront" size={32} className="text-tertiary-fixed-dim" />
          )}
        </div>

        <form ref={formRef} action={formAction} className="flex-1 space-y-2">
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
              formRef.current?.requestSubmit();
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <UploadButton label={t("uploadLogo")} pendingLabel={t("saving")} />
            {logoUrl && (
              <Button type="button" variant="ghost" onClick={() => removeLogo()}>
                {t("removeLogo")}
              </Button>
            )}
          </div>
          <p className="text-label-sm text-on-surface-variant">{t("logoHint")}</p>
        </form>
      </div>

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm bg-error-container px-3 py-2 text-body-md text-on-error-container"
        >
          <Icon name="error" size={20} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </p>
      )}
    </div>
  );
}

function UploadButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      aria-busy={pending}
      onClick={() => document.getElementById("logo")?.click()}
    >
      <Icon name="add_a_photo" size={20} />
      {pending ? pendingLabel : label}
    </Button>
  );
}
