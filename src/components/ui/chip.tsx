import { cn } from "@/lib/utils";

/**
 * Chip กรอง — ใช้ทั้งหน้าขายและหน้าสินค้า
 *
 * ตอนเลือก: `#2bb14f` (primary-container) คู่กับตัวหนังสือเขียวเข้มเท่านั้น
 * ตัวขาวบนพื้นนี้ได้ 2.80:1 ตก WCAG AA — mockup ทำแบบนั้น 9 ไฟล์ ซึ่งเป็นบั๊ก (กฎ 5)
 */
export function Chip({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "min-h-touch shrink-0 rounded-full border px-4 text-label-lg whitespace-nowrap transition-colors active:scale-95",
        active
          ? "border-primary-container bg-primary-container text-on-primary-container"
          : "border-outline-variant bg-surface-container-lowest text-on-surface",
        className
      )}
      {...props}
    />
  );
}
