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
      <div className="fixed right-4 bottom-4 z-toast flex items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3 shadow-overlay">
        <select
          className="rounded-sm border border-outline-variant px-2 py-1 text-label-lg"
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
        <span className="w-10 text-label-sm text-on-surface-variant tnum">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {id && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/dev/mockup/${id}`}
          alt=""
          className="pointer-events-none fixed top-0 left-0 z-scrim w-full"
          style={{ opacity }}
        />
      )}
    </>
  );
}
