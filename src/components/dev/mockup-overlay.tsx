"use client";

import { useState } from "react";
import { MOCKUP_IDS } from "@/lib/design-tokens";

/**
 * ซ้อนภาพ pos_design/<id>/screen.png ทับหน้าจอปัจจุบันเพื่อเทียบ pixel
 * ใช้ตอนพอร์ต mockup: เปิดหน้าที่พอร์ตแล้ว เลือก id ให้ตรง แล้วเลื่อน opacity
 */
export function MockupOverlay() {
  const [id, setId] = useState("");
  const [opacity, setOpacity] = useState(0.5);

  return (
    <>
      <div className="border-outline-variant bg-surface-container-lowest z-toast fixed right-4 bottom-4 flex items-center gap-3 rounded-md border p-3 shadow-overlay">
        <select
          className="border-outline-variant text-label-lg rounded-sm border px-2 py-1"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          <option value="">ไม่ซ้อนภาพ</option>
          {MOCKUP_IDS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-32"
          aria-label="ความทึบของภาพซ้อน"
          disabled={!id}
        />
        <span className="text-label-sm text-on-surface-variant tnum w-10">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {id && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/dev/mockup/${id}`}
          alt=""
          className="z-scrim pointer-events-none fixed top-0 left-0 w-full"
          style={{ opacity }}
        />
      )}
    </>
  );
}
