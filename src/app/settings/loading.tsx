import { Skeleton } from "@/components/ui/skeleton";

/** โครงหน้าตั้งค่า — 5 การ์ดหัวข้อ */
export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-form pb-12">
      <div className="flex h-app-bar items-center gap-2 border-b border-outline-variant px-4">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
