"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { bangkokToday } from "@/lib/report-dates";

/**
 * ตัวกรองรายการบิล — FR-6.4
 * อยู่ใน query string เหมือนหน้ารายงานอื่น: แชร์ลิงก์แล้วได้ผลลัพธ์เดียวกัน
 */
export function OrderFilters({ date, q }: { date: string | null; q: string }) {
  const t = useTranslations("reports");
  const router = useRouter();

  function apply(next: { date?: string | null; q?: string }) {
    const params = new URLSearchParams();
    const d = next.date === undefined ? date : next.date;
    const query = next.q === undefined ? q : next.q;
    if (d) params.set("date", d);
    if (query) params.set("q", query);
    const search = params.toString();
    router.push(search ? `/reports/orders?${search}` : "/reports/orders");
  }

  return (
    <div className="space-y-2">
      <form
        action={(formData) => apply({ q: String(formData.get("q") ?? "") })}
        className="flex gap-2"
      >
        <Input
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t("searchBill")}
          leading={<Icon name="search" size={20} />}
          className="tnum"
        />
      </form>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={date ?? ""}
          max={bangkokToday()}
          onChange={(e) => apply({ date: e.target.value || null })}
          aria-label={t("date")}
          className="tnum"
        />
        {(date || q) && (
          <button
            type="button"
            onClick={() => router.push("/reports/orders")}
            className="flex min-h-touch shrink-0 items-center gap-1 rounded-full px-3 text-label-lg text-primary transition-colors hover:bg-surface-container-low"
          >
            <Icon name="close" size={20} />
            {t("clearFilter")}
          </button>
        )}
      </div>
    </div>
  );
}
