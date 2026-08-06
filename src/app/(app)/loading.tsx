import { Skeleton } from "@/components/ui/skeleton";

/**
 * โครงหน้าระหว่างรอข้อมูล — ใช้กับทุกหน้าในกลุ่ม (app) ที่ไม่มี loading ของตัวเอง
 * แถบบนกับแท็บล่างขึ้นทันทีอยู่แล้ว (อยู่ใน layout) ตรงนี้จึงเป็นแค่ส่วนเนื้อหา
 */
export default function AppLoading() {
  return (
    <div className="min-h-dvh pb-nav">
      <div className="flex h-app-bar items-center border-b border-outline-variant px-4">
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
