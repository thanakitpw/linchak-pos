"use client";

import { useState } from "react";
import { formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/locales";

export type Point = { label: string; value: number };

/**
 * กราฟเส้นที่แตะดูยอดของแต่ละจุดได้
 *
 * **ไม่มี chart library** — ข้อมูลคือตัวเลข 6–7 ตัว การลาก recharts (~50–100 KB)
 * มาลากเส้นเดียวคือค่าที่ผู้ใช้บนเน็ตมือถือเป็นคนจ่าย
 *
 * เส้นวาดด้วย SVG ที่ยืดเต็มกล่อง (`preserveAspectRatio="none"`) เพื่อไม่ต้อง
 * คำนวณพิกัดจริงเป็นพิกเซล · `vector-effect="non-scaling-stroke"` กันเส้นหนาบาง
 * ไม่เท่ากันตอนถูกยืด · ส่วน **จุดเป็น element ธรรมดาวางด้วย %** ไม่ใช่ `<circle>`
 * ไม่งั้นวงกลมจะกลายเป็นวงรีตามอัตราส่วนที่ถูกยืด
 *
 * ค่าที่เลือกแสดง **เหนือกราฟแบบค้างไว้** ไม่ใช่ tooltip ลอยตามนิ้ว —
 * บนมือถือนิ้วบังจุดที่เพิ่งแตะพอดี tooltip ตรงนั้นจึงอ่านไม่ได้อยู่ดี
 */
export function LineChart({
  points,
  locale,
  emptyLabel,
}: {
  points: Point[];
  locale: Locale;
  emptyLabel: string;
}) {
  // เริ่มที่จุดล่าสุด ซึ่งเป็นตัวที่คนเปิดหน้ามาดูก่อนเสมอ
  const [selected, setSelected] = useState(points.length - 1);

  if (points.length === 0 || points.every((p) => p.value === 0)) {
    return <p className="py-10 text-center text-body-md text-on-surface-variant">{emptyLabel}</p>;
  }

  const values = points.map((p) => p.value);
  // กำไรติดลบได้ กราฟจึงต้องมีที่ให้เส้นลงต่ำกว่าศูนย์ · ยอดขายเริ่มที่ 0 เสมอ
  const min = Math.min(0, ...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) => (points.length === 1 ? 50 : (i / (points.length - 1)) * 100);
  const y = (v: number) => 100 - ((v - min) / span) * 100;

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  const zeroY = y(0);
  const current = points[selected] ?? points[points.length - 1];

  return (
    <div>
      {/* ค่าที่เลือก — อ่านได้เสมอ ไม่ต้องเล็งนิ้วให้ตรงจุด */}
      <p className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-label-lg text-on-surface-variant">{current.label}</span>
        <span className="text-title-lg text-on-surface tnum">
          {formatTHB(toSatang(current.value), locale)}
        </span>
      </p>

      <div className="relative h-40">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 size-full overflow-visible text-primary"
        >
          <polygon points={area} className="fill-secondary-container" />
          {/* เส้นศูนย์ — วาดเฉพาะตอนมีค่าติดลบ ไม่งั้นมันคือขอบล่างอยู่แล้ว */}
          {min < 0 && (
            <line
              x1="0"
              x2="100"
              y1={zeroY}
              y2={zeroY}
              className="text-outline-variant"
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <polyline
            points={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* จุด — วางด้วย % จึงยังกลมเสมอไม่ว่ากล่องจะกว้างเท่าไร */}
        {points.map((p, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{ left: `${x(i)}%`, top: `${y(p.value)}%` }}
            className={cn(
              "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-container-lowest bg-primary transition-all",
              i === selected ? "size-4" : "size-2.5"
            )}
          />
        ))}

        {/* พื้นที่กด — เต็มความสูงของคอลัมน์ ไม่ใช่แค่ตัวจุด
            จุดกว้าง 10px แตะพลาดตลอดบนมือถือ (NFR-1 ต้องการ ≥44px) */}
        <div className="absolute inset-0 flex">
          {points.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={i === selected}
              aria-label={`${p.label} ${formatTHB(toSatang(p.value), locale)}`}
              className="h-full flex-1 rounded-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {i === selected && (
                <span className="mx-auto block h-full w-px bg-outline-variant" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-2 flex">
        {points.map((p, i) => (
          <li
            key={i}
            className={cn(
              "flex-1 text-center text-label-sm tnum",
              i === selected ? "text-primary" : "text-on-surface-variant"
            )}
          >
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
