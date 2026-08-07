"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SettingsSection } from "./section";
import { BankBadge } from "./bank-badge";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { updateBank } from "@/app/settings/actions";
import { BANKS, findBank, formatAccountNo, isValidAccountNo, normaliseAccountNo } from "@/lib/banks";

/**
 * บัญชีรับโอนเงิน — คู่กับวิธีชำระ "โอนเงิน" ในหน้าขาย
 *
 * เดิมกดเลือก "โอนเงิน" ได้ แต่ไม่มีที่ให้กรอกว่าโอนไปไหน
 * ลูกค้าที่ได้บิลจึงโอนไม่ได้จริง ต้องถามเลขบัญชีในแชทอีกรอบ
 *
 * โชว์ตัวอย่างสดแบบเดียวกับ QR PromptPay ด้วยเหตุผลเดียวกัน:
 * เลขบัญชีผิดแล้วรู้ตอนลูกค้าโอนเงินหาย = รู้ช้าไปแล้ว
 */
export function BankSection({
  initialCode,
  initialAccountNo,
  initialAccountName,
}: {
  initialCode: string | null;
  initialAccountNo: string | null;
  initialAccountName: string | null;
}) {
  const t = useTranslations("settings");
  const tReceipt = useTranslations("receipt");
  const [code, setCode] = useState(initialCode ?? "");
  const [accountNo, setAccountNo] = useState(initialAccountNo ?? "");
  const [accountName, setAccountName] = useState(initialAccountName ?? "");

  const bank = findBank(code);
  const digits = normaliseAccountNo(accountNo);
  const ready = bank !== null && isValidAccountNo(digits);

  return (
    <SettingsSection title={t("bankSection")} hint={t("bankSectionHint")} action={updateBank}>
      <Field label={t("bank")} htmlFor="bank_code">
        <Select
          id="bank_code"
          name="bank_code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        >
          <option value="">{t("bankNone")}</option>
          {BANKS.map((b) => (
            <option key={b.code} value={b.code}>
              {b.nameTh}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("bankAccountNo")} htmlFor="bank_account_no">
        <Input
          id="bank_account_no"
          name="bank_account_no"
          type="text"
          inputMode="numeric"
          value={accountNo}
          onChange={(e) => setAccountNo(e.target.value)}
          placeholder="123-4-56789-0"
          leading={<Icon name="account_balance" size={20} />}
          className="tnum"
        />
      </Field>

      <Field label={t("bankAccountName")} htmlFor="bank_account_name">
        <Input
          id="bank_account_name"
          name="bank_account_name"
          type="text"
          maxLength={120}
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder={t("bankAccountNamePlaceholder")}
        />
      </Field>

      {ready ? (
        <div className="space-y-2 rounded-sm bg-surface-container-low p-4">
          <span className="block text-label-lg text-on-surface">{t("bankPreview")}</span>
          <div className="flex items-center gap-3">
            <BankBadge bank={bank} />
            <span className="min-w-0">
              <span className="block text-label-sm text-on-surface-variant">
                {tReceipt("transferTo")} · {bank.nameTh}
              </span>
              <span className="block text-body-md text-on-surface tnum">
                {formatAccountNo(digits)}
              </span>
              {accountName.trim() && (
                <span className="block truncate text-label-sm text-on-surface-variant">
                  {accountName.trim()}
                </span>
              )}
            </span>
          </div>
        </div>
      ) : (
        code === "" &&
        accountNo.trim() === "" && (
          <p className="flex items-start gap-2 rounded-sm bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
            <Icon name="info" size={20} className="mt-0.5 shrink-0" />
            <span>{t("bankNotSet")}</span>
          </p>
        )
      )}
    </SettingsSection>
  );
}
