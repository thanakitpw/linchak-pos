"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { recordPayment, type AdminState } from "@/app/admin/stores/[id]/actions";
import { formatTHB } from "@/lib/format";
import { satang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

type Plan = { code: string; name_th: string; name_en: string; price_satang: number };

/**
 * บันทึกการชำระเงิน — หัวใจของหลังบ้านใน MVP
 *
 * business plan §6 บอกว่าขายผ่าน LINE แบบรับโอนเอง
 * ⇒ ฟอร์มนี้คือขั้นตอนที่เปลี่ยน "ลูกค้าโอนเงินมาแล้ว" เป็น "ใช้งานต่อได้"
 * ถ้าไม่มี ต่อให้แอปเสร็จก็รับเงินลูกค้าคนแรกไม่ได้
 *
 * กดแล้วต่ออายุให้อัตโนมัติในทรานแซกชันเดียวกับที่บันทึก + เขียน audit
 */
export function PaymentForm({ workspaceId, plans }: { workspaceId: string; plans: Plan[] }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [state, formAction] = useActionState<AdminState, FormData>(recordPayment, {});
  const defaultPlan = plans[0];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspaceId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("plan")} htmlFor="plan_code">
          <Select id="plan_code" name="plan_code" defaultValue={defaultPlan?.code}>
            {plans.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name_th} · {formatTHB(satang(p.price_satang), locale)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("amount")} htmlFor="amount">
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            required
            defaultValue={defaultPlan ? defaultPlan.price_satang / 100 : ""}
            className="tnum"
          />
        </Field>

        <Field label={t("method")} htmlFor="method">
          <Select id="method" name="method" defaultValue="bank_transfer">
            <option value="bank_transfer">{t("bank_transfer")}</option>
            <option value="promptpay">{t("promptpay")}</option>
            <option value="other">{t("other")}</option>
          </Select>
        </Field>

        <Field label={t("reference")} htmlFor="reference">
          <Input id="reference" name="reference" type="text" />
        </Field>
      </div>

      <Field label={t("note")} htmlFor="note">
        <Input id="note" name="note" type="text" />
      </Field>

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
        <Submit label={t("recordAndExtend")} pendingLabel={t("recording")} />
      </div>
    </form>
  );
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
