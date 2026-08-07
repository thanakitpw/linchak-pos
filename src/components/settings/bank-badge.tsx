import type { Bank } from "@/lib/banks";

/**
 * ป้ายสีประจำธนาคาร — ใช้แทนโลโก้จริง
 *
 * ⚠️ สีมาจาก inline style ไม่ใช่ Tailwind class โดยตั้งใจ:
 *    15 สีนี้เป็นสีแบรนด์ของคนอื่น ไม่ใช่ token ของเรา จึงไม่ควรอยู่ใน theme.css
 *    (และกฎ 4 ห้าม `bg-[#…]` อยู่แล้ว)
 *
 * ⚠️ ใช้ได้ใน subtree ใบเสร็จ เพราะเป็น hex ทึบล้วน ไม่มี opacity/color-mix
 *    ซึ่งเป็นสิ่งที่กฎ 31 ห้าม (html-to-image อ่าน color-mix ไม่ได้)
 */
export function BankBadge({ bank, size = 40 }: { bank: Bank; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-sm text-label-sm font-bold"
      style={{
        backgroundColor: bank.color,
        color: bank.onColor,
        width: size,
        height: size,
        // อักษรย่อบางอันยาว 5 ตัว (KBANK, TISCO) — ย่อให้พอดีกล่องแทนที่จะล้น
        fontSize: bank.short.length > 4 ? size * 0.22 : size * 0.28,
      }}
      aria-hidden
    >
      {bank.short}
    </span>
  );
}
