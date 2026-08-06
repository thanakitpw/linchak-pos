import { BottomNav } from "@/components/app/bottom-nav";

/**
 * เปลือกของแอปฝั่งแม่ค้า — ทุกหน้าใต้กลุ่มนี้มีแท็บล่าง
 * (/admin และหน้า auth อยู่นอกกลุ่มนี้ จึงไม่มีแท็บ)
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
