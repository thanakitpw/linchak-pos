"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

/**
 * พิสูจน์กฎข้อ 22: ใน subtree ใบเสร็จ ห้ามใช้ opacity modifier / oklch / color-mix
 *
 * FR-4.4 ต้อง render ใบเสร็จ+QR เป็นรูปเดียวเพื่อแชร์เข้า LINE ซึ่งแปลว่าเอา DOM
 * ไป serialise ลง canvas — Tailwind v4 compile `bg-primary/20` เป็น color-mix()
 * ซึ่ง library กลุ่มนี้อ่านไม่ออก ผลคือสีหาย/เพี้ยนแบบเงียบๆ
 *
 * กล่องซ้ายใช้สีทึบล้วน กล่องขวาใช้ opacity modifier — กดปุ่มแล้วเทียบ PNG ที่ได้
 * ถ้ากล่องขวาใน PNG ไม่เหมือนบนจอ = ยืนยันว่ากฎข้อ 22 จำเป็นจริง
 */
export function ReceiptProbe() {
  const safeRef = useRef<HTMLDivElement>(null);
  const unsafeRef = useRef<HTMLDivElement>(null);
  const [safePng, setSafePng] = useState<string | null>(null);
  const [unsafePng, setUnsafePng] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function render() {
    setError(null);
    try {
      const opts = { pixelRatio: 2, cacheBust: true } as const;
      if (safeRef.current) setSafePng(await toPng(safeRef.current, opts));
      if (unsafeRef.current) setUnsafePng(await toPng(unsafeRef.current, opts));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={render}
        className="bg-primary text-on-primary text-label-lg shadow-raised min-h-touch rounded-full px-6 transition-opacity hover:opacity-90 active:scale-[0.98]"
      >
        render เป็น PNG
      </button>

      {error && (
        <p className="bg-error-container text-on-error-container text-body-md rounded-sm p-3">
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* ── ปลอดภัย: สีทึบล้วน ─────────────────────────────────────── */}
        <div className="space-y-2">
          <h3 className="text-title-lg text-primary">ปลอดภัย — สีทึบล้วน</h3>
          <div
            ref={safeRef}
            className="bg-receipt-paper text-on-surface space-y-2 rounded-md p-4"
            style={{ width: 320 }}
          >
            <p className="text-title-lg">ร้านค้าของฉัน</p>
            <p className="text-label-sm text-on-surface-variant tnum">05082026-00000001</p>
            <div className="border-receipt-rule border-t border-dashed pt-2">
              <div className="text-body-md flex justify-between">
                <span>ชาไทยเย็น ×2</span>
                <span className="tnum">120.00</span>
              </div>
            </div>
            <div className="border-receipt-rule flex items-baseline justify-between border-t pt-2">
              <span className="text-title-lg">ยอดสุทธิ</span>
              <span className="text-headline-md text-primary tnum">฿120.00</span>
            </div>
            <div className="bg-secondary-container text-on-secondary-fixed-variant text-label-sm rounded-sm px-2 py-1">
              จ่ายแล้ว · PromptPay
            </div>
          </div>
          {safePng && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={safePng} alt="" className="border-outline-variant w-[320px] border" />
          )}
        </div>

        {/* ── เสี่ยง: opacity modifier → color-mix() ────────────────── */}
        <div className="space-y-2">
          <h3 className="text-title-lg text-error">เสี่ยง — opacity modifier</h3>
          <div
            ref={unsafeRef}
            className="bg-receipt-paper text-on-surface space-y-2 rounded-md p-4"
            style={{ width: 320 }}
          >
            <p className="text-title-lg">ร้านค้าของฉัน</p>
            <p className="text-label-sm text-on-surface-variant/70 tnum">05082026-00000001</p>
            <div className="border-outline-variant/30 border-t border-dashed pt-2">
              <div className="text-body-md flex justify-between">
                <span>ชาไทยเย็น ×2</span>
                <span className="tnum">120.00</span>
              </div>
            </div>
            <div className="border-outline-variant/30 flex items-baseline justify-between border-t pt-2">
              <span className="text-title-lg">ยอดสุทธิ</span>
              <span className="text-headline-md text-primary tnum">฿120.00</span>
            </div>
            <div className="bg-primary-container/20 text-on-primary-container text-label-sm rounded-sm px-2 py-1">
              จ่ายแล้ว · PromptPay
            </div>
          </div>
          {unsafePng && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={unsafePng} alt="" className="border-outline-variant w-[320px] border" />
          )}
        </div>
      </div>
    </div>
  );
}
