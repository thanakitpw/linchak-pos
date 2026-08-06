"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { NAV_TABS } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * แท็บล่าง — ชุดเดียวตาม PRD §4 · mockup มี 4 ชุดที่ต่างกัน อีก 3 ชุดเป็นซาก
 * (ดู docs/design-system.md §9.4)
 *
 * มือถือเท่านั้น · tablet ใช้ side nav ซึ่งจะทำตอนพอร์ตหน้า split view
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-nav border-t border-outline-variant bg-surface-container-lowest pb-safe shadow-nav md:hidden">
      <ul className="flex items-stretch justify-around">
        {NAV_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-touch flex-col items-center justify-center gap-0.5 py-1 transition-transform active:scale-90"
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full px-4 py-1 transition-colors",
                    active
                      ? "bg-secondary-container text-on-secondary-fixed-variant"
                      : "text-on-surface-variant"
                  )}
                >
                  <Icon name={tab.icon} size={24} filled={active} />
                </span>
                <span
                  className={cn(
                    "text-label-sm",
                    active ? "text-on-surface" : "text-on-surface-variant"
                  )}
                >
                  {t(tab.key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
