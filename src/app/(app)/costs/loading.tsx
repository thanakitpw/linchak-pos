import { Skeleton } from "@/components/ui/skeleton";

/** โครงหน้าต้นทุน — KPI ก้อนใหญ่ + รายการการซื้อ */
export default function CostsLoading() {
  return (
    <div className="min-h-dvh pb-nav">
      <div className="flex h-app-bar items-center border-b border-outline-variant px-4">
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="space-y-4 p-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-18 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
