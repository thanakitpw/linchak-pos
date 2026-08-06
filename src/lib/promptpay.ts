import generatePayload from "promptpay-qr";
import { toBaht, type Satang } from "./money";

/**
 * PromptPay — FR-1.2 / FR-4.2
 *
 * QR สร้างในเครื่องจากเลข PromptPay ของร้าน + ยอดเงิน ตามมาตรฐาน EMVCo
 * ไม่ต้องเชื่อม payment gateway เลย (นี่คือเหตุผลที่ margin ~90% ในแผนธุรกิจ)
 */

export type PromptPayType = "phone" | "nid" | "ewallet";

/** เก็บแต่ตัวเลข — ผู้ใช้พิมพ์ 081-234-5678 หรือ 081 234 5678 ก็ได้ */
export function normalizePromptPayId(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * ความยาวที่ถูกต้องของแต่ละชนิด
 * ตัวเลขพวกนี้มาจากสเปคของ promptpay-qr เอง (phone 10 / nid 13 / e-wallet 15)
 */
const LENGTH: Record<PromptPayType, number> = {
  phone: 10,
  nid: 13,
  ewallet: 15,
};

export type PromptPayValidation =
  | { ok: true; value: string }
  | { ok: false; reason: "empty" | "not_digits" | "wrong_length" | "bad_phone_prefix" };

/**
 * ตรวจก่อนบันทึก — เลขที่ผิดจะได้ QR ที่สแกนแล้วเงินไปผิดที่หรือสแกนไม่ขึ้น
 * ซึ่งแม่ค้าจะไม่รู้ตัวจนกว่าลูกค้าจะบ่น
 */
export function validatePromptPayId(raw: string, type: PromptPayType): PromptPayValidation {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: false, reason: "empty" };
  if (/[^\d\s-]/.test(trimmed)) return { ok: false, reason: "not_digits" };

  const digits = normalizePromptPayId(trimmed);
  if (digits.length !== LENGTH[type]) return { ok: false, reason: "wrong_length" };

  // เบอร์มือถือไทยขึ้นต้น 06 / 08 / 09 เท่านั้น
  // ถ้าไม่เช็ค คนจะกรอกเบอร์บ้านแล้ว QR สแกนไม่ขึ้น
  if (type === "phone" && !/^0[689]/.test(digits)) {
    return { ok: false, reason: "bad_phone_prefix" };
  }

  return { ok: true, value: digits };
}

/**
 * สร้าง payload EMVCo (ยังไม่ใช่รูป — ต้องเอาไป render เป็น QR อีกที)
 *
 * amount เป็นสตางค์ตามกฎเงินของโปรเจค แปลงเป็นบาทตรงนี้เพราะ lib รับเป็นบาท
 * ไม่ส่ง amount = QR แบบให้ลูกค้ากรอกยอดเอง
 */
export function promptPayPayload(id: string, amount?: Satang): string {
  const target = normalizePromptPayId(id);
  return generatePayload(target, amount === undefined ? {} : { amount: toBaht(amount) });
}

/** แสดงให้อ่านง่าย: 0812345678 → 081-234-5678 */
export function formatPromptPayId(id: string, type: PromptPayType): string {
  const d = normalizePromptPayId(id);
  if (type === "phone" && d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (type === "nid" && d.length === 13) {
    return `${d.slice(0, 1)}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d.slice(12)}`;
  }
  return d;
}
