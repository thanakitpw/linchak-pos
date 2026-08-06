import { formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

export type Bar = { label: string; value: number; highlight?: boolean };

/**
 * กราฟแท่งแบบ CSS ล้วน — ไม่มี chart library
 *
 * ข้อมูลคือตัวเลข 6–7 ตัว การลาก recharts/chart.js (~50–100 KB) เข้ามา
 * เพื่อวาดสี่เหลี่ยม 7 อันคือค่าใช้จ่ายที่ผู้ใช้บนเน็ตมือถือเป็นคนจ่าย
 * มุมบนแท่งใช้ `rounded-xs` ตามที่ design system กำหนดไว้ (กฎ 13)
 *
 * เป็น server component: ไม่มี interaction ไม่ต้องส่ง JS ไปฝั่ง client เลย
 */
export function BarChart({
  bars,
  locale,
  emptyLabel,
}: {
  bars: Bar[];
  locale: Locale;
  emptyLabel: string;
}) {
  const max = Math.max(...bars.map((b) => Math.abs(b.value)), 0);

  if (max === 0) {
    return <p className="py-10 text-center text-body-md text-on-surface-variant">{emptyLabel}</p>;
  }

  return (
    <div>
      <ul className="flex h-40 items-end gap-1.5">
        {bars.map((b, i) => (
          <li key={i} className="flex h-full flex-1 flex-col justify-end gap-1">
            {/* ตัวเลขบนแท่งอ่านไม่ออกที่ 360px ถ้ามี 7 แท่ง — ใส่ไว้ใน title แทน
                และให้ตารางด้านล่างเป็นตัวบอกค่าที่แน่นอน */}
            <div
              title={formatTHB(toSatang(b.value), locale)}
              style={{ height: `${Math.max((Math.abs(b.value) / max) * 100, 2)}%` }}
              className={
                b.highlight
                  ? "rounded-xs bg-primary"
                  : b.value < 0
                    ? "rounded-xs bg-error"
                    : "rounded-xs bg-primary-container"
              }
            />
          </li>
        ))}
      </ul>
      <ul className="mt-2 flex gap-1.5">
        {bars.map((b, i) => (
          <li
            key={i}
            className={`flex-1 text-center text-label-sm tnum ${
              b.highlight ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            {b.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
