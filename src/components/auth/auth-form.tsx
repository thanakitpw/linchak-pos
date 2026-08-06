"use client";

import { createContext, use, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { AuthState } from "@/app/login/actions";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

/**
 * ค่าที่กรอกไว้ตอน submit ไม่ผ่าน
 * server action คืนกลับมา ฟิลด์อ่านผ่าน context นี้ไปเติมใน defaultValue
 * ไม่งั้นผู้ใช้ต้องพิมพ์ชื่อร้านกับอีเมลใหม่ทุกครั้งที่พลาด
 */
const SubmittedValues = createContext<AuthState["values"]>(undefined);
export const useSubmittedValues = () => use(SubmittedValues);

/**
 * เปลือกฟอร์ม auth ที่ใช้ร่วมกันทั้ง login / signup / reset
 * จัดการ pending state + แสดง error/success ที่ action ส่งกลับมา
 */
export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  children,
}: {
  action: Action;
  submitLabel: string;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <SubmittedValues value={state.values}>{children}</SubmittedValues>

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
        <p
          role="status"
          className="flex items-start gap-2 rounded-sm bg-secondary-container px-3 py-2 text-body-md text-on-secondary-fixed-variant"
        >
          <Icon name="check_circle" size={20} className="mt-0.5 shrink-0" />
          <span>{state.ok}</span>
        </p>
      )}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

/** แยกออกมาเพราะ useFormStatus อ่านสถานะได้จาก component ที่อยู่ "ใน" form เท่านั้น */
function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="mt-2" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
