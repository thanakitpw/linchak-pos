import { describe, expect, it } from "vitest";
import { cn } from "./utils";

/**
 * บั๊กที่ test ชุดนี้กันไม่ให้กลับมา:
 *
 * tailwind-merge ตัว default มองว่า `text-<อะไรก็ได้>` คือ "สีตัวอักษร"
 * เพราะ validator ของกลุ่ม text-color เป็น isAny — ขั้น type ของเรา
 * (`text-title-lg`, `text-body-md`, …) จึงถูกจัดกลุ่มเดียวกับสี
 * แล้วโดนลบทิ้งข้างหนึ่งแบบเงียบๆ ไม่มี error ไม่มี warning
 *
 * ผลจริงที่เจอบน production: ปุ่ม CTA `bg-primary text-on-primary` + size lg
 * (ที่เติม `text-title-lg`) เหลือแต่ขนาด สีหาย ตัวหนังสือเลย inherit สีเข้ม
 * มาอยู่บนพื้นเขียว — เป็น contrast bug ที่กฎข้อ 5-6 ใน CLAUDE.md ห้ามไว้พอดี
 * และ input/แท็บล่างเสียขนาดฟอนต์เพราะเคสกลับด้าน (สีมาทีหลัง ขนาดหาย)
 */
describe("cn — ขนาดกับสีต้องอยู่ร่วมกันได้", () => {
  it("เก็บทั้งสีและขนาดไว้ ไม่ว่าจะเขียนลำดับไหน", () => {
    expect(cn("text-on-primary", "text-title-lg")).toBe("text-on-primary text-title-lg");
    expect(cn("text-body-md", "text-on-surface")).toBe("text-body-md text-on-surface");
  });

  it("ปุ่ม CTA ต้องยังมี text-on-primary หลัง merge", () => {
    const cls = cn(
      "bg-primary text-on-primary shadow-primary hover:opacity-90",
      "w-full px-6 py-4 text-title-lg"
    );
    expect(cls).toContain("text-on-primary");
    expect(cls).toContain("text-title-lg");
  });

  it("ยังทับกันเองได้ตามปกติเมื่อเป็นชนิดเดียวกัน", () => {
    expect(cn("text-title-lg", "text-headline-md")).toBe("text-headline-md");
    expect(cn("text-primary", "text-on-error")).toBe("text-on-error");
    expect(cn("shadow-card", "shadow-raised")).toBe("shadow-raised");
  });

  it("เงาเป็น box-shadow ไม่ใช่สีเงา จึงอยู่คู่กับสีพื้นได้", () => {
    expect(cn("bg-primary shadow-primary")).toBe("bg-primary shadow-primary");
  });
});
