import { describe, expect, it } from "vitest";
import {
  addLine,
  cartTotals,
  EMPTY_CART,
  itemCount,
  lineTotal,
  removeLine,
  setQty,
  toOrderItems,
} from "./cart";
import { toSatang } from "./money";

const tea = { productId: "p1", name: "ชาไทยเย็น", price: toSatang(45) };
const mango = { productId: "p2", name: "มะม่วง", price: toSatang(60) };

describe("เพิ่มสินค้าเข้าบิล", () => {
  it("แตะสินค้าซ้ำ = เพิ่มจำนวน ไม่ใช่เพิ่มบรรทัดใหม่", () => {
    const c = addLine(addLine(EMPTY_CART, tea), tea);
    expect(c.lines).toHaveLength(1);
    expect(c.lines[0].qty).toBe(2);
  });

  it("สินค้าคนละตัวแยกบรรทัด", () => {
    const c = addLine(addLine(EMPTY_CART, tea), mango);
    expect(c.lines).toHaveLength(2);
    expect(itemCount(c)).toBe(2);
  });

  it("instant add (ไม่มี productId) แยกตามชื่อ", () => {
    const a = { productId: null, name: "ขนมจีบ", price: toSatang(20) };
    const b = { productId: null, name: "ซาลาเปา", price: toSatang(25) };
    const c = addLine(addLine(addLine(EMPTY_CART, a), a), b);
    expect(c.lines).toHaveLength(2);
    expect(c.lines[0].qty).toBe(2);
  });
});

describe("แก้จำนวน", () => {
  it("ลดจนถึง 0 แล้วบรรทัดหายไป ไม่เหลือบรรทัดจำนวน 0", () => {
    const c = setQty(addLine(EMPTY_CART, tea), 0, 0);
    expect(c.lines).toHaveLength(0);
  });

  it("ลบบรรทัดตรงๆ", () => {
    const c = removeLine(addLine(addLine(EMPTY_CART, tea), mango), 0);
    expect(c.lines).toHaveLength(1);
    expect(c.lines[0].name).toBe("มะม่วง");
  });

  it("ยอดรายบรรทัดคูณถูก", () => {
    expect(lineTotal({ ...tea, qty: 3 })).toBe(13500);
  });
});

describe("ยอดสรุป", () => {
  it("VAT ปิด — total = subtotal − discount", () => {
    let c = addLine(EMPTY_CART, tea, 2); // 90
    c = addLine(c, mango); // 60 → 150
    c = { ...c, discount: toSatang(20) };
    const r = cartTotals(c, false, 7);
    expect(r.subtotal).toBe(15000);
    expect(r.taxAmount).toBe(0);
    expect(r.total).toBe(13000);
  });

  it("VAT เปิด — total ไม่เปลี่ยน แต่แยกภาษีที่รวมอยู่ออกมา (โหมดรวมแล้ว)", () => {
    const c = addLine(EMPTY_CART, { ...tea, price: toSatang(107) });
    const r = cartTotals(c, true, 7);
    expect(r.total).toBe(10700);
    expect(r.taxAmount).toBe(700);
  });

  it("บิลว่างได้ 0 ไม่พัง", () => {
    expect(cartTotals(EMPTY_CART, false, 7).total).toBe(0);
  });
});

describe("payload ที่ส่งให้ create_order", () => {
  it("แปลงสตางค์กลับเป็นบาทให้ตรงกับคอลัมน์ numeric(12,2)", () => {
    const c = addLine(EMPTY_CART, { ...tea, price: toSatang(45.5) }, 2);
    expect(toOrderItems(c)).toEqual([{ product_id: "p1", name: "ชาไทยเย็น", price: 45.5, qty: 2 }]);
  });
});
