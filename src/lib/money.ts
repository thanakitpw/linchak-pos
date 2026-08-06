/**
 * money.ts — เลขเงินทั้งหมดในแอปนี้เป็นจำนวนเต็ม "สตางค์"
 *
 * 1 บาท = 100 สตางค์  ·  DB เก็บ numeric(12,2)  ·  TS คำนวณเป็น integer เสมอ
 *
 * ทำไม: 0.1 + 0.2 !== 0.3 ใน IEEE-754 บิลที่คลาดไป 1 สตางค์คือบิลที่ผิด
 * แปลงเป็นสตางค์ที่ขอบ input → คำนวณเป็นสตางค์ → format ที่ขอบ render
 *
 * `Satang` เป็น branded type: ตัวเลขราคาข้าม module boundary แบบดิบไม่ได้
 * คอมไพเลอร์จะบังคับให้ผ่าน toSatang()/fromDbNumeric() เสมอ
 */

declare const satangBrand: unique symbol;
export type Satang = number & { readonly [satangBrand]: true };

const SATANG_PER_BAHT = 100;

/** ปัดครึ่งขึ้น (half-up) — ไม่ใช่ Math.round ที่ปัดครึ่งไปทาง +∞ กับเลขติดลบ */
function roundHalfUp(n: number): number {
  return n < 0 ? -Math.round(-n) : Math.round(n);
}

/** สร้าง Satang จากจำนวนเต็ม — โยนทิ้งถ้าไม่ใช่ integer */
export function satang(n: number): Satang {
  if (!Number.isInteger(n)) throw new RangeError(`satang must be an integer, got ${n}`);
  if (!Number.isSafeInteger(n)) throw new RangeError(`satang out of safe integer range: ${n}`);
  return n as Satang;
}

export const ZERO = satang(0);

/** บาท (ทศนิยม) → สตางค์ ใช้ที่ขอบ input เท่านั้น */
export function toSatang(baht: number): Satang {
  if (!Number.isFinite(baht)) throw new RangeError(`invalid baht amount: ${baht}`);
  return satang(roundHalfUp(baht * SATANG_PER_BAHT));
}

/** สตางค์ → บาท (ทศนิยม) ใช้ตอนเขียนลง DB / ส่งให้ formatter เท่านั้น */
export function toBaht(s: Satang): number {
  return s / SATANG_PER_BAHT;
}

/** แปลงค่าจากคอลัมน์ numeric(12,2) ของ Postgres (มาเป็น string ผ่าน driver) */
export function fromDbNumeric(value: string | number): Satang {
  return toSatang(typeof value === "string" ? Number.parseFloat(value) : value);
}

/** แปลงกลับเป็นรูปแบบที่เขียนลงคอลัมน์ numeric(12,2) ได้ตรงๆ */
export function toDbNumeric(s: Satang): string {
  return toBaht(s).toFixed(2);
}

/** parse ค่าที่ผู้ใช้พิมพ์ในช่องกรอกเงิน — คืน null ถ้าว่าง/ไม่ใช่ตัวเลข */
export function parseMoneyInput(raw: string): Satang | null {
  const cleaned = raw.replace(/[,\s฿]/g, "").trim(); // lint-tokens-ok: ฿ คือ input ที่ต้อง strip ไม่ใช่ข้อความ UI
  if (cleaned === "") return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return null;
  return toSatang(n);
}

/* ── เลขคณิต ─────────────────────────────────────────────────────────────── */

export function add(...values: Satang[]): Satang {
  return satang(values.reduce<number>((a, b) => a + b, 0));
}

export function sub(a: Satang, b: Satang): Satang {
  return satang(a - b);
}

/** ราคา/หน่วย × จำนวน — qty ต้องเป็นจำนวนเต็มบวก */
export function multiplyQty(unitPrice: Satang, qty: number): Satang {
  if (!Number.isInteger(qty) || qty < 0)
    throw new RangeError(`qty must be an integer >= 0, got ${qty}`);
  return satang(unitPrice * qty);
}

export const max = (a: Satang, b: Satang): Satang => (a > b ? a : b);
export const clampAtZero = (s: Satang): Satang => (s < 0 ? ZERO : s);

/* ── กฎธุรกิจการคิดบิล (BR-1, BR-2, BR-6) ──────────────────────────────────
   ⚠️ ภาษีคิดที่ระดับบิลครั้งเดียว ไม่ใช่รายบรรทัด
      คิดรายบรรทัดแล้วรวมจะได้ค่าที่ต่างจากคิดทีเดียวเพราะการปัดเศษสะสม
      และเลขที่ได้จะไม่ตรงกับที่ลูกค้าคำนวณเองจากยอดรวมบนใบเสร็จ
   -------------------------------------------------------------------------- */

export type TaxMode = "off" | "exclusive" | "inclusive";

export type BillTotals = {
  subtotal: Satang;
  discount: Satang;
  taxAmount: Satang;
  total: Satang;
};

/**
 * BR-1 (VAT ปิด — default): total = subtotal − discount
 * BR-2 บวกเพิ่ม (ราคายังไม่รวมภาษี): taxable = subtotal − discount
 *                                    tax = taxable × rate/100
 *                                    total = taxable + tax
 * BR-2 รวมแล้ว (price_includes_tax): total = subtotal − discount
 *                                    tax = total − total/(1 + rate/100)  (ภาษีที่รวมอยู่แล้ว)
 */
export function computeBillTotals(params: {
  lineTotals: readonly Satang[];
  discount?: Satang;
  taxMode?: TaxMode;
  /** อัตราภาษีเป็นเปอร์เซ็นต์ เช่น 7 */
  taxRate?: number;
}): BillTotals {
  const { lineTotals, discount = ZERO, taxMode = "off", taxRate = 0 } = params;

  const subtotal = add(...lineTotals);
  // ส่วนลดเกินยอดรวมไม่ได้ — ไม่งั้นบิลติดลบ
  const cappedDiscount = discount > subtotal ? subtotal : discount;
  const afterDiscount = sub(subtotal, cappedDiscount);

  if (taxMode === "off" || taxRate <= 0) {
    return { subtotal, discount: cappedDiscount, taxAmount: ZERO, total: afterDiscount };
  }

  if (taxMode === "exclusive") {
    const taxAmount = satang(roundHalfUp((afterDiscount * taxRate) / 100));
    return { subtotal, discount: cappedDiscount, taxAmount, total: add(afterDiscount, taxAmount) };
  }

  // inclusive
  const base = satang(roundHalfUp(afterDiscount / (1 + taxRate / 100)));
  return {
    subtotal,
    discount: cappedDiscount,
    taxAmount: sub(afterDiscount, base),
    total: afterDiscount,
  };
}

/** BR-6: แสดงเงินทอนเฉพาะเมื่อ received ≥ total */
export function computeChange(received: Satang, total: Satang): Satang | null {
  return received >= total ? sub(received, total) : null;
}

/** BR-5: กำไรรายเดือน = Σ orders.total − Σ purchases.total (กำไรเงินสด ไม่ใช่ COGS ต่อชิ้น) */
export function computeProfit(salesTotal: Satang, costTotal: Satang): Satang {
  return sub(salesTotal, costTotal);
}
