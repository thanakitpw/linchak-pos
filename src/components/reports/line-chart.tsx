"use client";

import { useId, useRef, useState } from "react";
import { formatCompactBaht, formatTHB } from "@/lib/format";
import { toSatang } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/locales";

export type Point = { label: string; value: number };

/**
 * กราฟเส้น + พื้นที่ใต้เส้น พร้อมแกน Y และเส้นตาราง
 *
 * **ไม่มี chart library** — recharts/chart.js ~50–100 KB สำหรับเส้นเดียว
 * คือค่าที่ผู้ใช้บนเน็ตมือถือเป็นคนจ่าย · ทั้งไฟล์นี้เล็กกว่านั้นหลายเท่า
 *
 * เส้นวาดด้วย SVG ที่ยืดเต็มกล่อง (`preserveAspectRatio="none"`) เพื่อไม่ต้อง
 * คำนวณพิกัดจริงเป็นพิกเซล · `vector-effect="non-scaling-stroke"` กันเส้นหนาบาง
 * ไม่เท่ากันตอนถูกยืด · ส่วน **จุดเป็น element ธรรมดาวางด้วย %** ไม่ใช่ `<circle>`
 * ไม่งั้นวงกลมจะกลายเป็นวงรีตามอัตราส่วนที่ถูกยืด
 *
 * ค่าที่เลือกแสดง **เหนือกราฟแบบค้างไว้** ไม่ใช่ tooltip ลอยตามนิ้ว —
 * บนมือถือนิ้วบังจุดที่เพิ่งแตะพอดี tooltip ตรงนั้นจึงอ่านไม่ได้อยู่ดี
 *
 * การเลือกจุดเป็น **แถบลากนิ้ว** (`role="slider"`) ไม่ใช่ปุ่มรายจุด:
 * 30 วันแปลว่าคอลัมน์กว้างประมาณ 10px ซึ่งต่ำกว่า 44px ที่ NFR-1 ต้องการมาก
 * ลากนิ้วผ่านกราฟจึงแม่นกว่าและเป็นท่าที่คนคุ้นอยู่แล้ว · คีย์บอร์ดใช้ลูกศรซ้าย/ขวา
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
  const plotRef = useRef<HTMLDivElement>(null);
  const gradientId = useId();

  if (points.length === 0 || points.every((p) => p.value === 0)) {
    return <p className="py-10 text-center text-body-md text-on-surface-variant">{emptyLabel}</p>;
  }

  const values = points.map((p) => p.value);
  // กำไรติดลบได้ กราฟจึงต้องมีที่ให้เส้นลงต่ำกว่าศูนย์ · ยอดขายเริ่มที่ 0 เสมอ
  const { bottom, top, ticks } = axisScale(Math.min(0, ...values), Math.max(...values));
  const span = top - bottom || 1;

  const x = (i: number) => (points.length === 1 ? 50 : (i / (points.length - 1)) * 100);
  const y = (v: number) => 100 - ((v - bottom) / span) * 100;

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `0,${y(bottom)} ${line} 100,${y(bottom)}`;
  const current = points[selected] ?? points[points.length - 1];

  /** ป้ายวันที่ — โชว์ไม่เกิน ~6 อัน ไม่งั้น 30 วันจะทับกันจนอ่านไม่ออก */
  const stride = Math.max(1, Math.ceil(points.length / 6));
  const showLabel = (i: number) => i % stride === 0 || i === points.length - 1;

  /** แปลงตำแหน่งนิ้ว/เมาส์ → index ที่ใกล้ที่สุด */
  function pick(clientX: number) {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const ratio = (clientX - box.left) / box.width;
    const i = Math.round(ratio * (points.length - 1));
    setSelected(Math.min(points.length - 1, Math.max(0, i)));
  }

  return (
    <div>
      {/* ค่าที่เลือก — อ่านได้เสมอ ไม่ต้องเล็งนิ้วให้ตรงจุด */}
      <p className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-label-lg text-on-surface-variant">{current.label}</span>
        <span className="text-title-lg text-on-surface tnum">
          {formatTHB(toSatang(current.value), locale)}
        </span>
      </p>

      <div className="flex gap-2">
        {/* แกน Y — ป้ายเรียงจากบนลงล่าง จึงกลับลำดับ ticks */}
        <ul className="flex h-44 shrink-0 flex-col justify-between text-right text-label-sm text-on-surface-variant tnum">
          {[...ticks].reverse().map((v) => (
            <li key={v} className="-translate-y-1/2 first:translate-y-0 last:-translate-y-full">
              {formatCompactBaht(v, locale)}
            </li>
          ))}
        </ul>

        <div
          ref={plotRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={points.length - 1}
          aria-valuenow={selected}
          aria-valuetext={`${current.label} ${formatTHB(toSatang(current.value), locale)}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pick(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e.clientX);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setSelected((s) => Math.max(0, s - 1));
            else if (e.key === "ArrowRight") setSelected((s) => Math.min(points.length - 1, s + 1));
            else return;
            e.preventDefault();
          }}
          // touch-none: ไม่งั้น browser ตีความการลากแนวนอนเป็นการ scroll หน้า
          className="relative h-44 flex-1 touch-none rounded-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full overflow-visible text-primary"
          >
            <defs>
              {/* ไล่สีจากใต้เส้นจางลงจนหาย — ทำให้พื้นที่ใต้เส้นไม่ไปแย่งสายตากับตัวเส้น
                  ใช้ stop-opacity ของ SVG ไม่ใช่ opacity modifier ของ Tailwind
                  (ตัวหลัง compile เป็น color-mix() ซึ่งกฎ 31 ห้ามในใบเสร็จ — กราฟไม่โดนกฎนั้น
                  แต่ใช้ของ SVG ตรงๆ ก็ชัดเจนกว่าและไม่ต้องพึ่ง class) */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* เส้นตาราง — ประที่ทุกขั้นของแกน Y ให้กะระดับได้โดยไม่ต้องลากสายตาไปซ้าย */}
            {ticks.map((v) => (
              <line
                key={v}
                x1="0"
                x2="100"
                y1={y(v)}
                y2={y(v)}
                className={v === 0 ? "text-outline" : "text-outline-variant"}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray={v === 0 ? undefined : "3 4"}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <polygon points={area} fill={`url(#${gradientId})`} />
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

          {/* เส้นชี้ตำแหน่งที่เลือก */}
          <span
            aria-hidden="true"
            style={{ left: `${x(selected)}%` }}
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-outline-variant"
          />

          {/* จุด — วางด้วย % จึงยังกลมเสมอไม่ว่ากล่องจะกว้างเท่าไร
              ข้อมูลแน่นๆ โชว์เฉพาะจุดที่เลือก ไม่งั้น 30 จุดบังเส้นจนดูไม่ออกว่าขึ้นหรือลง */}
          {points.map((p, i) =>
            i === selected || points.length <= 10 ? (
              <span
                key={i}
                aria-hidden="true"
                style={{ left: `${x(i)}%`, top: `${y(p.value)}%` }}
                className={cn(
                  "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-container-lowest bg-primary",
                  i === selected ? "size-4" : "size-2.5"
                )}
              />
            ) : null
          )}
        </div>
      </div>

      {/* ป้ายแกน X — เว้นซ้ายเท่ากับความกว้างแกน Y ให้ตรงคอลัมน์
          ตัวที่ไม่ได้โชว์ยังกินที่เท่ากัน ป้ายจึงตรงกับจุดของมันเสมอ */}
      <ul className="mt-2 flex" aria-hidden="true">
        {points.map((p, i) => (
          <li
            key={i}
            className={cn(
              "min-w-0 flex-1 text-center text-label-sm whitespace-nowrap tnum",
              i === selected ? "text-primary" : "text-on-surface-variant"
            )}
          >
            {showLabel(i) || i === selected ? p.label : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * เลือกขอบแกนกับขั้นให้เป็นตัวเลขกลมๆ
 *
 * ไม่เอา max ของข้อมูลมาเป็นขอบบนตรงๆ เพราะจะได้ป้ายแบบ "281.2 / 562.4 / 843.6"
 * ซึ่งอ่านแล้วไม่ช่วยอะไร · ปัดขั้นขึ้นเป็น 1/2/2.5/5 × 10^n แทน
 * จะได้ "0 / 500 / 1พัน / 1.5พัน / 2พัน" ที่กะระดับได้ทันที
 */
function axisScale(dataMin: number, dataMax: number) {
  const STEPS = 4;
  const raw = (dataMax - dataMin) / STEPS || 1;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  // ขั้นต่ำ 1 บาท — ร้านที่ขายได้วันละไม่กี่บาทจะได้ขั้น 0.25 แล้วป้ายซ้ำกันเป็น "0 0 1 1 1"
  // เพราะแกนปัดเป็นจำนวนเต็ม (ระดับสตางค์ไม่มีประโยชน์บนแกนกราฟ)
  const step = Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp);

  const bottom = Math.floor(dataMin / step) * step;
  const top = bottom + step * STEPS >= dataMax ? bottom + step * STEPS : Math.ceil(dataMax / step) * step; // prettier-ignore

  const ticks: number[] = [];
  for (let v = bottom; v <= top + step / 2; v += step) {
    // ปัดเศษทศนิยมที่เกิดจากการบวกทีละ step (0.1+0.2 ปัญหาเดิม)
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return { bottom, top, ticks };
}
