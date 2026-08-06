"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { setSuspended, type AdminState } from "@/app/admin/stores/[id]/actions";

/**
 * ระงับ / ปลดระงับร้าน
 *
 * **บังคับกรอกเหตุผล** ทั้งฝั่งนี้และฝั่ง DB
 * เหตุผลถูกเขียนลง audit_logs ถาวร และเป็นสิ่งที่เราจะอ่านตอบ
 * เวลาลูกค้าโทรมาถามว่า "ทำไมร้านผมใช้ไม่ได้"
 */
export function SuspendForm({
  workspaceId,
  isSuspended,
}: {
  workspaceId: string;
  isSuspended: boolean;
}) {
  const t = useTranslations("admin");
  const [state, formAction] = useActionState<AdminState, FormData>(setSuspended, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="suspended" value={String(!isSuspended)} />

      <Field label={t("suspendReason")} htmlFor="reason">
        <Input id="reason" name="reason" type="text" required maxLength={500} />
      </Field>
      <p className="text-label-sm text-on-surface-variant">{t("suspendReasonHint")}</p>

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

      <Submit
        label={isSuspended ? t("unsuspendConfirm") : t("suspendConfirm")}
        destructive={!isSuspended}
      />
    </form>
  );
}

function Submit({ label, destructive }: { label: string; destructive: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={destructive ? "destructive" : "outline"}
      disabled={pending}
      aria-busy={pending}
    >
      {label}
    </Button>
  );
}
