"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/input";
import { bangkokMonthStart, bangkokToday } from "@/lib/report-dates";

/**
 * ตัวเลือกช่วงวันที่ — FR-6.2 (daily / monthly / custom ในตัวเดียว)
 *
 * ปุ่มลัดสองอันคือ 90% ของการใช้งานจริง ส่วนช่องวันที่มีไว้เผื่อ
 * ส่งค่าผ่าน query string ไม่ใช่ state: หน้าที่แสดงตัวเลขยังเป็น server component
 * ที่ query DB ตรงๆ ได้ และแชร์ลิงก์แล้วได้ช่วงเดียวกัน
 */
export function RangeForm({ from, to }: { from: string; to: string }) {
  const t = useTranslations("reports");
  const router = useRouter();

  const today = bangkokToday();
  const monthStart = bangkokMonthStart();
  const go = (f: string, tt: string) => router.push(`/reports/sales?from=${f}&to=${tt}`);

  return (
    <div className="space-y-3 rounded-md border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex flex-wrap gap-2">
        <Chip active={from === today && to === today} onClick={() => go(today, today)}>
          {t("rangeToday")}
        </Chip>
        <Chip active={from === monthStart && to === today} onClick={() => go(monthStart, today)}>
          {t("rangeMonth")}
        </Chip>
      </div>

      <form
        className="grid grid-cols-2 gap-3"
        action={(formData) =>
          go(String(formData.get("from") ?? today), String(formData.get("to") ?? today))
        }
      >
        <Field label={t("from")} htmlFor="from">
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            max={today}
            className="tnum"
          />
        </Field>
        <Field label={t("to")} htmlFor="to">
          <Input id="to" name="to" type="date" defaultValue={to} max={today} className="tnum" />
        </Field>
        <div className="col-span-2">
          <Button type="submit" variant="outline" className="w-full">
            {t("apply")}
          </Button>
        </div>
      </form>
    </div>
  );
}
