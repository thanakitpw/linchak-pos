"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { SettingsSection } from "./section";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { updatePromptPay } from "@/app/settings/actions";
import { promptPayPayload, validatePromptPayId, type PromptPayType } from "@/lib/promptpay";

/**
 * FR-1.2 · ตั้งเลข PromptPay
 *
 * แสดง QR ตัวอย่างสดขณะพิมพ์ — เป็นวิธีเดียวที่แม่ค้าจะรู้ว่าเลขถูกก่อนออกบิลจริง
 * ถ้าเลขผิดแล้วรู้ตอนลูกค้าสแกนไม่ขึ้น คือรู้ช้าไปแล้ว
 *
 * QR สร้างในเบราว์เซอร์ล้วน ไม่มีการส่งเลขไปไหน
 */
export function PromptPaySection({
  initialId,
  initialType,
}: {
  initialId: string | null;
  initialType: PromptPayType | null;
}) {
  const t = useTranslations("settings");
  const [type, setType] = useState<PromptPayType>(initialType ?? "phone");
  const [id, setId] = useState(initialId ?? "");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // payload คำนวณสดจากค่าที่พิมพ์ — บริสุทธิ์ ไม่ต้องเก็บใน state
  const payload = useMemo(
    () => (validatePromptPayId(id, type).ok ? promptPayPayload(id) : null),
    [id, type]
  );

  /**
   * วาด QR ลง canvas โดยตรง ไม่เก็บ data URL ไว้ใน state
   * effect ที่ "ซิงก์กับระบบภายนอก" (canvas) คือสิ่งที่ effect มีไว้ทำจริงๆ
   * ส่วนการ setState ใน effect จะทำให้ render ซ้อนโดยไม่จำเป็น
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    QRCode.toCanvas(canvas, payload, {
      width: 200,
      margin: 1,
      // สีทึบล้วน — QR ตัวจริงจะไปอยู่บนใบเสร็จที่ถูก render เป็นรูป (กฎ 31)
      color: { dark: "#121c28", light: "#ffffff" }, // lint-tokens-ok: object key ของ qrcode ไม่ใช่ Tailwind variant
    }).catch(() => {});
  }, [payload]);

  const placeholder =
    type === "phone" ? "081-234-5678" : type === "nid" ? "1-2345-67890-12-3" : "123456789012345";

  return (
    <SettingsSection
      title={t("promptpaySection")}
      hint={t("promptpaySectionHint")}
      action={updatePromptPay}
    >
      <Field label={t("promptpayType")} htmlFor="promptpay_type">
        <Select
          id="promptpay_type"
          name="promptpay_type"
          value={type}
          onChange={(e) => setType(e.target.value as PromptPayType)}
        >
          <option value="phone">{t("typePhone")}</option>
          <option value="nid">{t("typeNid")}</option>
          <option value="ewallet">{t("typeEwallet")}</option>
        </Select>
      </Field>

      <Field label={t("promptpayId")} htmlFor="promptpay_id">
        <Input
          id="promptpay_id"
          name="promptpay_id"
          type="text"
          inputMode="numeric"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder={placeholder}
          leading={<Icon name="qr_code_scanner" size={20} />}
          className="tnum"
        />
      </Field>

      {payload ? (
        <div className="flex flex-col items-center gap-2 rounded-sm bg-surface-container-low p-4">
          <span className="text-label-lg text-on-surface">{t("promptpayPreview")}</span>
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className="rounded-xs"
            role="img"
            aria-label={t("promptpayPreview")}
          />
          <p className="text-center text-label-sm text-on-surface-variant">
            {t("promptpayPreviewHint")}
          </p>
        </div>
      ) : (
        id.trim() === "" && (
          <p className="flex items-start gap-2 rounded-sm bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
            <Icon name="info" size={20} className="mt-0.5 shrink-0" />
            <span>{t("promptpayNotSet")}</span>
          </p>
        )
      )}
    </SettingsSection>
  );
}
