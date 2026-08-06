import { describe, expect, it } from "vitest";
import {
  computeBillTotals,
  computeChange,
  computeProfit,
  fromDbNumeric,
  multiplyQty,
  parseMoneyInput,
  satang,
  toBaht,
  toDbNumeric,
  toSatang,
} from "./money";
import { formatBillNo, formatDate, formatDateTime, formatTHB } from "./format";

describe("satang round-trip", () => {
  it("แปลงบาท↔สตางค์ได้ตรง", () => {
    expect(toSatang(45)).toBe(4500);
    expect(toSatang(45.5)).toBe(4550);
    expect(toSatang(0.01)).toBe(1);
    expect(toBaht(satang(4500))).toBe(45);
  });

  it("ปัดครึ่งขึ้นที่สตางค์", () => {
    expect(toSatang(0.005)).toBe(1);
    expect(toSatang(0.004)).toBe(0);
    expect(toSatang(-0.005)).toBe(-1);
  });

  it("แก้ปัญหา float ที่ทำให้บิลคลาด", () => {
    // 0.1 + 0.2 === 0.30000000000000004 ในโลก float
    const sum = toSatang(0.1) + toSatang(0.2);
    expect(sum).toBe(30);
    expect(toBaht(satang(sum))).toBe(0.3);
  });

  it("ผ่านคอลัมน์ numeric(12,2) กลับมาแล้วยังตรง", () => {
    expect(fromDbNumeric("1250.00")).toBe(125000);
    expect(fromDbNumeric("0.07")).toBe(7);
    expect(toDbNumeric(satang(125000))).toBe("1250.00");
  });

  it("ปฏิเสธค่าที่ไม่ใช่จำนวนเต็ม", () => {
    expect(() => satang(1.5)).toThrow(RangeError);
  });

  it("parse ค่าที่ผู้ใช้พิมพ์", () => {
    expect(parseMoneyInput("1,250.50")).toBe(125050);
    expect(parseMoneyInput("฿45")).toBe(4500);
    expect(parseMoneyInput("  ")).toBeNull();
    expect(parseMoneyInput("abc")).toBeNull();
  });
});

describe("BR-1 · VAT ปิด (default)", () => {
  it("total = subtotal − discount", () => {
    const r = computeBillTotals({
      lineTotals: [toSatang(45), toSatang(60), toSatang(120)],
      discount: toSatang(25),
    });
    expect(r.subtotal).toBe(22500);
    expect(r.discount).toBe(2500);
    expect(r.taxAmount).toBe(0);
    expect(r.total).toBe(20000);
  });

  it("ส่วนลดเกินยอดรวมถูก cap ไม่ให้บิลติดลบ", () => {
    const r = computeBillTotals({ lineTotals: [toSatang(45)], discount: toSatang(100) });
    expect(r.discount).toBe(4500);
    expect(r.total).toBe(0);
  });

  it("บิลว่าง = 0", () => {
    expect(computeBillTotals({ lineTotals: [] }).total).toBe(0);
  });
});

describe("BR-2 · VAT เปิด", () => {
  it("โหมดบวกเพิ่ม: tax = (subtotal−discount) × rate/100", () => {
    const r = computeBillTotals({
      lineTotals: [toSatang(100)],
      taxMode: "exclusive",
      taxRate: 7,
    });
    expect(r.subtotal).toBe(10000);
    expect(r.taxAmount).toBe(700);
    expect(r.total).toBe(10700);
  });

  it("โหมดรวมแล้ว: tax = total − total/(1+rate/100) และ total ไม่เปลี่ยน", () => {
    const r = computeBillTotals({
      lineTotals: [toSatang(107)],
      taxMode: "inclusive",
      taxRate: 7,
    });
    expect(r.total).toBe(10700);
    expect(r.taxAmount).toBe(700); // 10700 − 10000
  });

  it("สองโหมดสอดคล้องกัน: exclusive(100) แล้วป้อน total กลับเข้า inclusive ได้ tax เท่ากัน", () => {
    const ex = computeBillTotals({ lineTotals: [toSatang(100)], taxMode: "exclusive", taxRate: 7 });
    const inc = computeBillTotals({ lineTotals: [ex.total], taxMode: "inclusive", taxRate: 7 });
    expect(inc.taxAmount).toBe(ex.taxAmount);
  });

  it("คิดภาษีทีเดียวที่ระดับบิล ไม่สะสมเศษจากรายบรรทัด", () => {
    // 3 บรรทัด ๆ ละ 33.33 — คิดรายบรรทัดจะได้ 3×2.33=6.99 แต่คิดทีเดียวได้ 7.00
    const lines = [toSatang(33.33), toSatang(33.33), toSatang(33.34)];
    const perLine = lines.reduce((a, l) => a + Math.round((l * 7) / 100), 0);
    const atBill = computeBillTotals({ lineTotals: lines, taxMode: "exclusive", taxRate: 7 });
    expect(perLine).toBe(699);
    expect(atBill.taxAmount).toBe(700);
  });

  it("ส่วนลดหักก่อนคิดภาษี", () => {
    const r = computeBillTotals({
      lineTotals: [toSatang(200)],
      discount: toSatang(100),
      taxMode: "exclusive",
      taxRate: 7,
    });
    expect(r.taxAmount).toBe(700);
    expect(r.total).toBe(10700);
  });
});

describe("BR-6 · เงินทอน", () => {
  it("แสดงเฉพาะเมื่อ received ≥ total", () => {
    expect(computeChange(toSatang(50), toSatang(45))).toBe(500);
    expect(computeChange(toSatang(45), toSatang(45))).toBe(0);
    expect(computeChange(toSatang(40), toSatang(45))).toBeNull();
  });
});

describe("BR-5 · กำไรรายเดือน", () => {
  it("ยอดขายรวม − ต้นทุนรวม", () => {
    expect(computeProfit(toSatang(42300), toSatang(30250))).toBe(1205000);
  });

  it("ติดลบได้เมื่อต้นทุนมากกว่ายอดขาย", () => {
    expect(computeProfit(toSatang(100), toSatang(250))).toBe(-15000);
  });
});

describe("line total", () => {
  it("ราคา/หน่วย × จำนวน", () => {
    expect(multiplyQty(toSatang(60), 2)).toBe(12000);
  });

  it("ปฏิเสธ qty ที่ไม่ใช่จำนวนเต็ม", () => {
    expect(() => multiplyQty(toSatang(60), 1.5)).toThrow(RangeError);
    expect(() => multiplyQty(toSatang(60), -1)).toThrow(RangeError);
  });
});

describe("BR-3 · เลขบิล", () => {
  it("รูปแบบ DDMMYYYY-NNNNNNNN, running 8 หลัก", () => {
    // 2026-08-05 15:56 เวลาไทย
    const d = new Date("2026-08-05T08:56:00Z");
    expect(formatBillNo(d, 1)).toBe("05082026-00000001");
    expect(formatBillNo(d, 123)).toBe("05082026-00000123");
  });

  it("ใช้วันตามเวลาไทย ไม่ใช่ UTC", () => {
    // 2026-08-05 18:00Z = 2026-08-06 01:00 เวลาไทย → ต้องเป็นวันที่ 06
    const d = new Date("2026-08-05T18:00:00Z");
    expect(formatBillNo(d, 1)).toBe("06082026-00000001");
  });
});

describe("NFR-2 · การจัดรูปแบบ", () => {
  const d = new Date("2026-08-05T08:56:00Z"); // 15:56 เวลาไทย

  it("วันที่ไทยใช้ปี ค.ศ. ไม่ใช่ พ.ศ. (ตรงกับ mockup)", () => {
    // ⚠️ ถ้าใช้ locale "th-TH" เฉยๆ จะได้ 2569 เพราะ default เป็นปฏิทินพุทธ
    expect(formatDate(d, "th")).toBe("05 ส.ค. 2026");
    expect(formatDate(d, "th")).not.toContain("2569");
  });

  it("วันที่+เวลาแบบ 24 ชม. ตามเวลาไทย", () => {
    expect(formatDateTime(d, "th")).toContain("15:56");
  });

  it("เงินเป็น THB 2 ตำแหน่งเสมอ", () => {
    expect(formatTHB(toSatang(1250), "th")).toBe("฿1,250.00");
    expect(formatTHB(toSatang(45), "th")).toBe("฿45.00");
    expect(formatTHB(satang(0), "th")).toBe("฿0.00");
  });
});
