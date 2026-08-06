import { computeBillTotals, multiplyQty, satang, ZERO, type Satang, type TaxMode } from "./money";

/**
 * บิลที่กำลังทำอยู่ — เก็บฝั่ง client จนกว่าจะกด checkout
 *
 * ราคาเก็บเป็นสตางค์ตั้งแต่หยิบสินค้าเข้าบิล ไม่แปลงไปกลับระหว่างทาง
 * (กฎข้อ 22 — แปลงที่ขอบ input → คำนวณเป็นสตางค์ → format ที่ขอบ render)
 */
export type CartLine = {
  /** null เมื่อเป็นสินค้าที่เพิ่มแบบ instant add แล้วยังไม่ได้บันทึกลงคลัง */
  productId: string | null;
  name: string;
  price: Satang;
  qty: number;
};

export type Cart = {
  lines: CartLine[];
  discount: Satang;
};

export const EMPTY_CART: Cart = { lines: [], discount: ZERO };

/** แตะสินค้าซ้ำ = เพิ่มจำนวน ไม่ใช่เพิ่มบรรทัดใหม่ */
export function addLine(cart: Cart, line: Omit<CartLine, "qty">, qty = 1): Cart {
  const key = (l: CartLine) => l.productId ?? l.name;
  const idx = cart.lines.findIndex(
    (l) => key(l) === key({ ...line, qty }) && l.price === line.price
  );

  if (idx >= 0) {
    const lines = [...cart.lines];
    lines[idx] = { ...lines[idx], qty: lines[idx].qty + qty };
    return { ...cart, lines };
  }
  return { ...cart, lines: [...cart.lines, { ...line, qty }] };
}

/** ลดจนถึง 0 = ลบบรรทัดทิ้ง — ไม่ปล่อยให้มีบรรทัดจำนวน 0 ค้างในบิล */
export function setQty(cart: Cart, index: number, qty: number): Cart {
  if (qty <= 0) return removeLine(cart, index);
  const lines = [...cart.lines];
  lines[index] = { ...lines[index], qty };
  return { ...cart, lines };
}

export function removeLine(cart: Cart, index: number): Cart {
  return { ...cart, lines: cart.lines.filter((_, i) => i !== index) };
}

export function lineTotal(line: CartLine): Satang {
  return multiplyQty(line.price, line.qty);
}

export function itemCount(cart: Cart): number {
  return cart.lines.reduce((n, l) => n + l.qty, 0);
}

/**
 * ยอดสรุปของบิล — ใช้ตรรกะเดียวกับที่ DB คำนวณตอน checkout (BR-1/BR-2)
 * ตัวเลขบนจอกับตัวเลขที่บันทึกจึงต้องตรงกันเสมอ
 */
export function cartTotals(cart: Cart, taxEnabled: boolean, taxRate: number) {
  return computeBillTotals({
    lineTotals: cart.lines.map(lineTotal),
    discount: cart.discount,
    taxMode: (taxEnabled ? "inclusive" : "off") satisfies TaxMode,
    taxRate,
  });
}

/** payload ที่ส่งให้ create_order — ราคาเป็นบาทเพราะ DB เก็บ numeric(12,2) */
export function toOrderItems(cart: Cart) {
  return cart.lines.map((l) => ({
    product_id: l.productId,
    name: l.name,
    price: l.price / 100,
    qty: l.qty,
  }));
}

/* ── เก็บบิลไว้กันรีเฟรชหาย ────────────────────────────────────────────────
   ที่หน้าร้านการเผลอรีเฟรชแล้วบิล 10 รายการหายไปคือความเสียหายจริง
   ใช้ sessionStorage: อยู่แค่แท็บนั้น ปิดแท็บแล้วหาย ซึ่งถูกต้องสำหรับบิลที่ยังไม่จบ
   -------------------------------------------------------------------------- */
const KEY = "pos.cart";

export function loadCart(): Cart {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw) as Cart;
    // ค่าที่อ่านกลับมาต้องผ่าน satang() เพื่อกันไฟล์ที่ถูกแก้มือหรือ format เก่า
    return {
      discount: satang(Math.trunc(Number(parsed.discount) || 0)),
      lines: (parsed.lines ?? []).map((l) => ({
        productId: l.productId ?? null,
        name: String(l.name),
        price: satang(Math.trunc(Number(l.price) || 0)),
        qty: Math.max(1, Math.trunc(Number(l.qty) || 1)),
      })),
    };
  } catch {
    return EMPTY_CART;
  }
}

export function saveCart(cart: Cart) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    // โควตาเต็มหรือโหมดส่วนตัว — ไม่ใช่เรื่องคอขาดบาดตาย ปล่อยผ่าน
  }
}

export function clearStoredCart() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* เหมือนข้างบน */
  }
}
