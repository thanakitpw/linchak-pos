import { describe, expect, it } from "vitest";
import {
  formatPromptPayId,
  normalizePromptPayId,
  promptPayPayload,
  validatePromptPayId,
} from "./promptpay";
import { toSatang } from "./money";

describe("normalize", () => {
  it("เก็บแต่ตัวเลข ผู้ใช้พิมพ์ขีดหรือเว้นวรรคก็ได้", () => {
    expect(normalizePromptPayId("081-234-5678")).toBe("0812345678");
    expect(normalizePromptPayId("081 234 5678")).toBe("0812345678");
    expect(normalizePromptPayId(" 0812345678 ")).toBe("0812345678");
  });
});

describe("validate", () => {
  it("เบอร์มือถือ 10 หลักขึ้นต้น 06/08/09", () => {
    expect(validatePromptPayId("0812345678", "phone")).toEqual({ ok: true, value: "0812345678" });
    expect(validatePromptPayId("0612345678", "phone").ok).toBe(true);
    expect(validatePromptPayId("0912345678", "phone").ok).toBe(true);
  });

  it("ปฏิเสธเบอร์บ้าน — QR จะสแกนไม่ขึ้นและแม่ค้าไม่รู้ตัว", () => {
    expect(validatePromptPayId("0212345678", "phone")).toEqual({
      ok: false,
      reason: "bad_phone_prefix",
    });
  });

  it("ปฏิเสธความยาวผิด", () => {
    expect(validatePromptPayId("081234567", "phone").ok).toBe(false);
    expect(validatePromptPayId("08123456789", "phone").ok).toBe(false);
  });

  it("เลขบัตรประชาชน 13 หลัก", () => {
    expect(validatePromptPayId("1234567890123", "nid")).toEqual({
      ok: true,
      value: "1234567890123",
    });
    expect(validatePromptPayId("0812345678", "nid").ok).toBe(false);
  });

  it("e-wallet 15 หลัก", () => {
    expect(validatePromptPayId("123456789012345", "ewallet").ok).toBe(true);
  });

  it("ปฏิเสธค่าว่างและตัวอักษร", () => {
    expect(validatePromptPayId("", "phone")).toEqual({ ok: false, reason: "empty" });
    expect(validatePromptPayId("08a2345678", "phone")).toEqual({ ok: false, reason: "not_digits" });
  });
});

describe("payload EMVCo", () => {
  it("ขึ้นต้นด้วย payload format indicator ของ EMVCo", () => {
    const p = promptPayPayload("0812345678");
    expect(p.startsWith("00020101")).toBe(true);
  });

  it("ระบุยอดเงินแล้ว payload ต้องเปลี่ยน และมียอดอยู่ในนั้น", () => {
    const noAmount = promptPayPayload("0812345678");
    const withAmount = promptPayPayload("0812345678", toSatang(120));
    expect(withAmount).not.toBe(noAmount);
    // tag 54 = transaction amount · "5406120.00"
    expect(withAmount).toContain("5406120.00");
  });

  it("ยอดที่มีเศษสตางค์ลงไปใน payload ถูกต้อง", () => {
    expect(promptPayPayload("0812345678", toSatang(45.5))).toContain("540545.50");
  });

  it("รับเลขที่มีขีดได้ ให้ผลเท่ากับเลขล้วน", () => {
    expect(promptPayPayload("081-234-5678")).toBe(promptPayPayload("0812345678"));
  });

  it("payload ลงท้ายด้วย checksum CRC 4 หลัก (tag 6304)", () => {
    const p = promptPayPayload("0812345678");
    expect(p.slice(-8, -4)).toBe("6304");
    expect(p.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe("format ให้อ่านง่าย", () => {
  it("เบอร์มือถือ", () => {
    expect(formatPromptPayId("0812345678", "phone")).toBe("081-234-5678");
  });
  it("เลขบัตรประชาชน", () => {
    expect(formatPromptPayId("1234567890123", "nid")).toBe("1-2345-67890-12-3");
  });
});
