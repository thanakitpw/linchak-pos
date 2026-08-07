import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LineChart, type Point } from "./line-chart";

/**
 * กราฟไม่มี chart library แปลว่าเลขทุกตัวบนแกนเราคำนวณเอง
 * ถ้าคำนวณผิดจะไม่มีอะไรฟ้อง — กราฟยังวาดออกมาสวยแต่บอกยอดผิด
 * test ชุดนี้จึง render จริงแล้วอ่านค่าจาก markup ไม่ใช่เรียกฟังก์ชันภายใน
 */
const render = (points: Point[]) =>
  renderToStaticMarkup(<LineChart points={points} locale="th" emptyLabel="ว่าง" />);

const days = (values: number[]): Point[] =>
  values.map((v, i) => ({ label: `${String(i + 1).padStart(2, "0")}/08`, value: v }));

describe("LineChart", () => {
  it("ไม่มีบิลเลย → ขึ้นข้อความว่าง ไม่วาดกราฟ", () => {
    expect(render([])).toContain("ว่าง");
    expect(render(days([0, 0, 0]))).toContain("ว่าง");
    expect(render(days([0, 0, 0]))).not.toContain("<svg");
  });

  it("ป้ายแกน Y เป็นเลขกลม ไม่ใช่ max หารสี่", () => {
    // ยอดสูงสุด 1,406 → ต้องได้ 0/500/1พัน/1.5พัน/2พัน ไม่ใช่ 351.5/703/…
    const html = render(days([120, 1406, 300, 0, 890]));
    for (const label of ["0", "500", "1พัน", "1.5พัน", "2พัน"]) {
      expect(html).toContain(`>${label}</li>`);
    }
    expect(html).not.toContain("351.5");
  });

  it("หลักหมื่นใช้หน่วยไทย ไม่ใช่ K", () => {
    const html = render(days([12500, 3000, 8000]));
    expect(html).toContain("หมื่น");
    expect(html).toContain("พัน");
    expect(html).not.toContain("K</li>");
  });

  it("ร้านที่ขายได้วันละไม่กี่บาท ต้องไม่ได้ป้ายซ้ำ", () => {
    // เคยพัง: ขั้นเป็น 0.25 แล้วแกนปัดเป็นจำนวนเต็ม → "0 0 1 1 1"
    const html = render(days([1, 0, 1]));
    const ticks = [...html.matchAll(/<li[^>]*>(\d+)<\/li>/g)].map((m) => m[1]);
    expect(new Set(ticks).size).toBe(ticks.length);
  });

  it("กำไรติดลบ → แกนลงต่ำกว่าศูนย์ และมีเส้นศูนย์ทึบ", () => {
    const html = render(days([-2400, 5600, 1000]));
    expect(html).toContain("−");
    // เส้นตารางปกติเป็นเส้นประ เส้นศูนย์ไม่ประ (แยกด้วยการไม่มี stroke-dasharray)
    expect(html).toMatch(/<line(?![^>]*stroke-dasharray)[^>]*text-outline"/);
  });

  it("30 วัน → ป้ายแกน X ไม่เกิน 7 อัน แต่จุดยังครบ 30", () => {
    const html = render(days(Array.from({ length: 30 }, (_, i) => i * 10 + 5)));
    const xLabels = [...html.matchAll(/<li[^>]*flex-1[^>]*>([^<]*)<\/li>/g)].filter((m) => m[1]);
    expect(xLabels.length).toBeLessThanOrEqual(7);
    expect(html.match(/,/g)!.length).toBeGreaterThanOrEqual(30); // พิกัดใน polyline
  });

  it("เริ่มต้นเลือกจุดล่าสุดเสมอ — เป็นตัวที่คนเปิดมาดูก่อน", () => {
    const html = render(days([100, 200, 999]));
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain("฿999.00");
  });
});
