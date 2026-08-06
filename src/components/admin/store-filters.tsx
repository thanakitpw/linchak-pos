"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";

const STATUSES = ["trialing", "active", "past_due", "expired", "suspended"] as const;

/** ค้นหา + กรองสถานะ — เก็บใน URL เพื่อให้ส่งลิงก์บอกกันได้และกดย้อนกลับได้ */
export function StoreFilters({
  defaultQuery,
  defaultStatus,
}: {
  defaultQuery: string;
  defaultStatus: string;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/admin?${next.toString()}`);
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setParam("q", new FormData(e.currentTarget).get("q") as string);
      }}
    >
      <Input
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder={t("search")}
        leading={<Icon name="search" size={20} />}
        className="w-64"
      />
      <Select
        defaultValue={defaultStatus}
        onChange={(e) => setParam("status", e.target.value)}
        className="w-44"
        aria-label={t("status")}
      >
        <option value="">{t("allStatuses")}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(s)}
          </option>
        ))}
      </Select>
    </form>
  );
}
