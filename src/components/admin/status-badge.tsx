import { getTranslations } from "next-intl/server";

/**
 * ป้ายสถานะร้าน
 *
 * สีเลือกตามความหมาย ไม่ใช่ตามความสวย:
 *   จ่ายแล้ว = เขียวเข้ม (ปกติ) · ทดลอง = เขียวอ่อน (ยังไม่จ่าย แต่ยังใช้ได้)
 *   เลยกำหนด/ถูกระงับ = แดง (ต้องลงมือ) · หมดอายุ = เทา (จบแล้ว)
 *
 * ทุกคู่สีผ่าน WCAG AA — ดู docs/design-system.md §3.2
 */
const STYLE: Record<string, string> = {
  active: "bg-primary text-on-primary",
  trialing: "bg-secondary-container text-on-secondary-fixed-variant",
  past_due: "bg-error-container text-on-error-container",
  suspended: "bg-error text-on-error",
  expired: "bg-tertiary-container text-on-tertiary-container",
};

export async function StatusBadge({ status, suspended }: { status: string; suspended?: boolean }) {
  const t = await getTranslations("admin");
  const key = suspended ? "suspended" : status;
  return (
    <span
      className={`rounded-full px-3 py-1 text-label-sm whitespace-nowrap ${STYLE[key] ?? STYLE.expired}`}
    >
      {t(key)}
    </span>
  );
}
