/**
 * WCAG 2.1 relative luminance + contrast ratio
 * ใช้ในหน้า /dev/tokens เพื่อคำนวณ contrast จากค่าที่ browser resolve จริง
 * (getComputedStyle) ไม่ใช่จาก literal ในซอร์ส — จับกรณี var ชี้ผิดได้ด้วย
 */

export type Rgb = [number, number, number];

/** รับได้ทั้ง "#2bb14f", "#fff", "rgb(43, 177, 79)", "rgba(43,177,79,1)" */
export function parseColor(input: string): Rgb | null {
  const s = input.trim();

  const hex = s.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const full =
      hex.length === 3 || hex.length === 4
        ? hex
            .slice(0, 3)
            .split("")
            .map((c) => c + c)
            .join("")
        : hex.slice(0, 6);
    if (full.length !== 6) return null;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }

  const nums = s.match(/^rgba?\(([^)]+)\)$/i)?.[1];
  if (nums) {
    const parts = nums.split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return [parts[0], parts[1], parts[2]];
    }
  }

  return null;
}

function channelLuminance(c8: number): number {
  const c = c8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return (
    0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
  );
}

export function contrastRatio(fg: string, bg: string): number | null {
  const a = parseColor(fg);
  const b = parseColor(bg);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastVerdict = "AAA" | "AA" | "AA-large" | "FAIL";

/** เกณฑ์ WCAG 2.1: ปกติ 4.5 / ใหญ่ (≥18.66px bold หรือ ≥24px) 3.0 / AAA 7.0 */
export function verdict(ratio: number): ContrastVerdict {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-large";
  return "FAIL";
}
