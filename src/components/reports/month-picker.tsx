"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/select";

/**
 * เลือกเดือนแล้วเปลี่ยน query string — ไม่ใช่ state ใน component
 *
 * ผลคือแชร์ลิงก์แล้วได้เดือนเดียวกัน, ปุ่มย้อนกลับของเบราว์เซอร์ทำงานตามที่คนคาด
 * และหน้ายังเป็น server component ที่ดึงตัวเลขจาก DB ตรงๆ ได้
 */
export function MonthPicker({
  months,
  selected,
}: {
  months: { value: string; label: string }[];
  selected: string;
}) {
  const t = useTranslations("reports");
  const router = useRouter();

  return (
    <Select
      aria-label={t("monthlyProfit")}
      value={selected}
      onChange={(e) => router.push(`/reports/profit?month=${e.target.value}`)}
      className="w-auto min-w-36 py-2 text-label-lg"
    >
      {months.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </Select>
  );
}
