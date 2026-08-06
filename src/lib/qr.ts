import QRCode from "qrcode";

/**
 * QR ที่จะถูก render ลงใบเสร็จ
 *
 * สีทึบล้วน ไม่ผ่าน token — กฎ 31 ห้าม oklch/color-mix ใน subtree ใบเสร็จ
 * เพราะ FR-4.4 เอา DOM ไปเป็นรูป และ canvas serialisation อ่านสองอย่างนั้นไม่ได้
 * ค่าที่ใช้คือ on-surface กับ receipt-paper ในรูป hex ตรงๆ
 *
 * contrast ของคู่นี้คือ 15.9:1 — เกินที่แอปธนาคารต้องการมาก
 * (ถ้าจะเปลี่ยนสี ต้องเช็คว่าสแกนติดจริงก่อน QR ที่ contrast ต่ำจะสแกนไม่ขึ้นในที่แสงน้อย)
 */
const COLOR = { dark: "#121c28", light: "#f7f7f2" }; // lint-tokens-ok: option ของ qrcode ไม่ใช่ Tailwind

export function receiptQr(text: string, width = 360): Promise<string> {
  return QRCode.toDataURL(text, { width, margin: 1, color: COLOR });
}
