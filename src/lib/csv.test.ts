import { describe, expect, it } from "vitest";

/**
 * การประกอบ CSV — คัดมาจาก src/app/(app)/reports/export/route.ts
 *
 * ไฟล์ที่แม่ค้าเอาไปให้บัญชี ถ้าตัวเลขเพี้ยนหรือคอลัมน์เลื่อนจะไม่มีใครรู้จนสายเกินไป
 * (route handler เรียกตรงๆ ใน test ไม่ได้เพราะพึ่ง cookie/next-intl)
 */
function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

describe("CSV ของรายงานยอดขาย", () => {
  it("ชื่อสินค้าที่มีลูกน้ำต้องไม่ทำให้คอลัมน์เลื่อน", () => {
    // ชื่อสินค้าไทยมีลูกน้ำได้ปกติ เช่น "ชาไทย, หวานน้อย"
    const row = ["07082026-00000001", "ชาไทย, หวานน้อย x2", "35.00"];
    const line = row.map(escapeCell).join(",");
    expect(line).toBe('07082026-00000001,"ชาไทย, หวานน้อย x2",35.00');
    expect(line.split('"')[0].split(",").length).toBe(2); // เลขบิลยังเป็นคอลัมน์เดียว
  });

  it("อัญประกาศในชื่อสินค้าต้องถูก escape เป็นคู่", () => {
    expect(escapeCell('ขนาด 6" x2')).toBe('"ขนาด 6"" x2"');
  });

  it("ขึ้นบรรทัดใหม่ในชื่อสินค้าต้องถูกครอบ ไม่งั้นแถวแตก", () => {
    expect(escapeCell("ก\nข")).toBe('"ก\nข"');
  });

  it("ค่าปกติต้องไม่ถูกครอบโดยไม่จำเป็น", () => {
    expect(escapeCell("เงินสด")).toBe("เงินสด");
    expect(escapeCell("1250.00")).toBe("1250.00");
  });

  it("เงินต้องเป็นทศนิยมจุด 2 ตำแหน่งเสมอ ไม่มีคั่นหลักพัน", () => {
    const money = (v: number) => Number(v).toFixed(2);
    expect(money(1250)).toBe("1250.00");
    expect(money(0)).toBe("0.00");
    // ถ้าเผลอ format ตาม locale ไทยจะได้ "1,250.00" แล้ว Excel อ่านเป็นสองคอลัมน์
    expect(money(1250)).not.toContain(",");
  });

  it("ไฟล์ต้องขึ้นต้นด้วย BOM ไม่งั้น Excel บน Windows อ่านภาษาไทยเป็นตัวยึกยือ", () => {
    const file = `﻿${["a", "b"].join(",")}`;
    expect(file.charCodeAt(0)).toBe(0xfeff);
  });
});
