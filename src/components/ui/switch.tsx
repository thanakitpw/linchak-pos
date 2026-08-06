"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * สวิตช์เปิด/ปิด — เขียนบน <input type="checkbox"> จริง
 *
 * ทำไมไม่ใช้ <div role="switch">: checkbox จริงส่งค่าไปกับ <form> ได้เอง
 * ทำงานกับ server action โดยไม่ต้องมี state ฝั่ง client และ screen reader/
 * การกดด้วยคีย์บอร์ดได้ฟรีตามมาตรฐาน
 */
export function Switch({
  name,
  label,
  description,
  defaultChecked,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4">
      <span className="flex-1">
        <span className="block text-body-md text-on-surface">{label}</span>
        {description && (
          <span className="block text-label-sm text-on-surface-variant">{description}</span>
        )}
      </span>

      <span className="relative inline-flex shrink-0 items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        {/* ราง */}
        <span
          aria-hidden="true"
          className={cn(
            "block h-8 w-14 rounded-full border border-outline-variant bg-surface-container-highest transition-colors",
            "peer-checked:border-primary peer-checked:bg-primary",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"
          )}
        />
        {/* ปุ่มกลม */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1 left-1 size-6 rounded-full bg-surface-container-lowest shadow-card transition-transform",
            "peer-checked:translate-x-6"
          )}
        />
      </span>
    </label>
  );
}
