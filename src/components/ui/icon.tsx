import { cn } from "@/lib/utils";
import type { IconName } from "@/lib/icons";

export type IconSize = 16 | 20 | 24 | 32 | 40 | 48;

type IconProps = {
  /** ต้องอยู่ใน ICON_NAMES — TypeScript เช็คให้ตอน compile */
  name: IconName;
  size?: IconSize;
  /** แกน FILL: true = ทึบ (แท็บ active, chip ที่เลือก) */
  filled?: boolean;
  /**
   * ใส่ก็ต่อเมื่อไอคอนเป็นเนื้อหาเดียวของ control (ปุ่มที่ไม่มีข้อความ)
   * ค่าต้องมาจาก useTranslations() เท่านั้น ห้าม literal
   * ถ้าไม่ใส่ ไอคอนจะเป็น aria-hidden ซึ่งถูกต้องเมื่อมี label ไทยอยู่ข้างๆ อยู่แล้ว
   */
  label?: string;
  className?: string;
};

export function Icon({ name, size = 24, filled = false, label, className }: IconProps) {
  return (
    <span
      className={cn("material-symbols", className)}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
      }}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      /* กัน Chrome auto-translate: หน้านี้ lang="th" ทั้งหน้า ถ้าไม่กัน มันจะ "แปล"
         ligature อย่าง payments / search แล้วไอคอนพังถาวร */
      translate="no"
    >
      {name}
    </span>
  );
}
