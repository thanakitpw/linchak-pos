import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * placeholder สำหรับหน้าจอที่อยู่ในตาราง T3 แต่ยังไม่ถูกพอร์ต
 *
 * มีอยู่เพราะ `typedRoutes: true` ทำให้ <Link> ชี้ไปยัง route ที่ยังไม่มีไม่ได้
 * ซึ่งเป็นพฤติกรรมที่ดี: มันเปลี่ยน "ลิงก์เสีย" ให้กลายเป็น build error
 * แต่ก็แปลว่าการพอร์ตหน้าที่มีลิงก์ออกต้องสร้าง route ปลายทางไปด้วย
 *
 * แทนที่ไฟล์นี้ด้วยหน้าจริงตอนพอร์ตหน้านั้น
 */
export function NotPortedYet({ mockup }: { mockup: string }) {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex min-h-dvh max-w-form flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-title-lg text-on-surface">ยังไม่ได้พอร์ตหน้านี้</p>
      <code className="text-label-lg text-on-surface-variant">pos_design/{mockup}/screen.png</code>
      <Link href="/sell" className="text-body-md text-primary underline underline-offset-4">
        กลับไปหน้าขาย
      </Link>
    </main>
  );
}
