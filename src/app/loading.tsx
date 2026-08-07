import Image from "next/image";
import wordmark from "@/assets/brand/logo-wordmark.png";

/**
 * หน้ารอตอนเปิดแอป
 *
 * `/` เป็นแค่ `redirect("/sell")` — ระหว่างที่ proxy ตรวจ session แล้วเด้งต่อ
 * ผู้ใช้เห็นจอขาวเปล่าๆ ซึ่งบนแอปที่ติดตั้งแล้ว (standalone ไม่มีแถบ URL
 * ไม่มีแถบโหลดของเบราว์เซอร์) แยกไม่ออกเลยว่า "กำลังโหลด" หรือ "แอปค้าง"
 *
 * ตัวนี้ครอบ segment ราก จึงขึ้นทั้งตอนเปิดแอปครั้งแรกและตอนเข้าหน้าที่อยู่นอก
 * กลุ่ม (app) เช่นหน้าตั้งค่า · หน้าในกลุ่ม (app) มี skeleton ของตัวเองที่ใกล้
 * ของจริงกว่า จึงไม่โดนตัวนี้แทน
 *
 * ⚠️ ห้ามใส่ข้อความ — ที่นี่เรียก next-intl ไม่ได้ (loading.tsx ต้อง render ได้ทันที
 * ไม่รอ async) และโลโก้สื่อความหมายได้ครบอยู่แล้ว
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface">
      <Image src={wordmark} alt="" priority unoptimized className="h-12 w-auto" />
      <span
        aria-hidden
        className="size-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"
      />
    </div>
  );
}
