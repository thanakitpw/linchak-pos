import { Skeleton } from "@/components/ui/skeleton";

/** โครงหน้าสรุป — KPI 2 ใบ + การ์ดกำไร + กราฟ + เมนู (ครอบหน้าลูกทุกหน้าด้วย) */
export default function ReportsLoading() {
  return (
    <div className="min-h-dvh pb-nav">
      <div className="flex h-app-bar items-center border-b border-outline-variant px-4">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mx-auto max-w-content space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
        <Skeleton className="h-28 w-full rounded-lg" />
        <div className="space-y-3 rounded-md border border-outline-variant p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-40 w-full rounded-md" />
      </div>
    </div>
  );
}
