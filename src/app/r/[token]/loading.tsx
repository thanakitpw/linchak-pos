import { Skeleton } from "@/components/ui/skeleton";

/**
 * โครงบิลออนไลน์ — หน้านี้สำคัญกว่าหน้าอื่นเพราะลูกค้าเปิดจากลิงก์ใน LINE
 * บนเน็ตมือถือที่ช้าที่สุด และเป็นความประทับใจแรกที่มีต่อร้าน
 */
export default function PublicReceiptLoading() {
  return (
    <div className="mx-auto max-w-form space-y-4 p-4">
      <div className="mx-auto w-full max-w-[360px] space-y-4 rounded-md bg-receipt-paper p-5">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
