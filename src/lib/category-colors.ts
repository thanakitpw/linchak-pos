/**
 * สีหมวดหมู่ — FR-2.1
 *
 * เก็บใน DB เป็น `color_index` 1–8 ไม่ใช่ hex อิสระ (`categories_color_index_check`)
 * เพราะสีที่ผู้ใช้เลือกเองได้จะหลุดออกนอกพาเลตต์ แล้วจุดสีบนการ์ดสินค้า
 * จะกลืนกับพื้นหลังหรือชนกับสีเขียวของระบบ
 *
 * ⚠️ ต้องเขียน class เต็มในตาราง ห้าม `bg-cat-${i}` —
 *    Tailwind สแกนหาสตริงตรงๆ ชื่อ class ที่ประกอบตอน runtime จะไม่ถูก generate
 *    (กับดักที่เจอมาแล้วกับ `text-${step}`)
 */
export const CATEGORY_COLORS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type CategoryColorIndex = (typeof CATEGORY_COLORS)[number];

const BG: Record<CategoryColorIndex, string> = {
  1: "bg-cat-1",
  2: "bg-cat-2",
  3: "bg-cat-3",
  4: "bg-cat-4",
  5: "bg-cat-5",
  6: "bg-cat-6",
  7: "bg-cat-7",
  8: "bg-cat-8",
};

export function isCategoryColor(value: unknown): value is CategoryColorIndex {
  return CATEGORY_COLORS.includes(value as CategoryColorIndex);
}

/** สีของจุดบนการ์ดสินค้าและวงกลมในตัวเลือกสี · ค่านอกช่วงตกมาที่สีแรก */
export function categoryBg(colorIndex: number): string {
  return isCategoryColor(colorIndex) ? BG[colorIndex] : BG[1];
}
