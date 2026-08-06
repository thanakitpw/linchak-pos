import { cn } from "@/lib/utils";

/**
 * กล่องเทาเต้นๆ ระหว่างรอข้อมูล
 *
 * ใช้กับ `loading.tsx` ของแต่ละ route — Next.js เอาไป wrap ด้วย Suspense ให้เอง
 * เปลือกของหน้า (แถบบน แท็บล่าง) จึงขึ้นทันทีที่กด ไม่ต้องรอ query เสร็จก่อน
 *
 * ⚠️ ต้องมีรูปร่างใกล้เคียงของจริง ไม่ใช่แค่กล่องสี่เหลี่ยมสุ่มๆ
 *    skeleton ที่ layout ไม่ตรงกับของจริงทำให้หน้ากระตุกตอนข้อมูลมาถึง
 *    ซึ่งแย่กว่าหน้าว่างเปล่าเฉยๆ
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-surface-container-high", className)}
    />
  );
}
