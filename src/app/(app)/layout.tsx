import { BottomNav } from "@/components/app/bottom-nav";
import { SideNav } from "@/components/app/side-nav";

/**
 * เปลือกของแอปฝั่งแม่ค้า — ทุกหน้าใต้กลุ่มนี้มีเมนู
 * (/admin และหน้า auth อยู่นอกกลุ่มนี้ จึงไม่มี)
 *
 * เมนูมีสองแบบตามความกว้าง และ **มีอันเดียวทำงานเสมอ**:
 *   < md  แท็บล่าง (fixed) — หน้าเนื้อหาเว้นที่ให้ด้วย pb-nav / pb-bottom-nav-safe
 *   ≥ md  rail ซ้าย (อยู่ใน flow) — ไม่ต้องเว้นที่ ตัว flex กันให้เอง
 *
 * `min-w-0` สำคัญ: flex item ปกติย่อไม่ต่ำกว่าเนื้อหาข้างใน
 * ถ้าไม่ใส่ ตารางหรือแถบ chip ที่ scroll แนวนอนจะดันทั้งหน้าให้กว้างเกินจอ
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="min-w-0 flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
