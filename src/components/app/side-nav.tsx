"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { NAV_TABS } from "@/lib/icons";
import { cn } from "@/lib/utils";
import wordmark from "@/assets/brand/logo-wordmark.png";

/**
 * เมนูด้านข้าง — จอ md ขึ้นไป (768px = FR-3.8)
 *
 * 🚨 ก่อนหน้านี้ **จอกว้างไม่มีเมนูเลย** — `<BottomNav/>` เป็น `md:hidden`
 * แต่ไม่เคยมีอะไรมาแทน คนใช้ iPad หรือคอมจึงเปลี่ยนหน้าไม่ได้เลย
 * นอกจากพิมพ์ URL เอง (ยกเว้นหน้าขายที่บังเอิญมีปุ่มตั้งค่าอยู่ใน app bar)
 *
 * เป็น rail แคบ ไม่ใช่ drawer เต็ม: หน้าขายบน tablet เป็น split view
 * (ตะแกรงสินค้า + บิลสด) ซึ่งกินความกว้างหมดอยู่แล้ว
 *
 * ⚙️ ตั้งค่าอยู่ท้าย rail ไม่ใช่แท็บ ตามกฎ 13 ใน CLAUDE.md
 */
export function SideNav() {
  const t = useTranslations("nav");
  const tSettings = useTranslations("settings");
  const pathname = usePathname();

  return (
    /* sticky + self-start + h-dvh: ค้างอยู่กับที่เวลาเลื่อนหน้า
       ต้องมี self-start ด้วย — flex item ปกติถูกยืดเต็มความสูงของแถว (align stretch)
       พอสูงเท่ากล่องแม่แล้ว sticky ไม่มีระยะให้เลื่อน มันเลยดูเหมือนไม่ทำงาน */
  <nav className="sticky top-0 hidden h-dvh w-side-nav shrink-0 flex-col self-start border-r border-outline-variant bg-surface-container-lowest md:flex">
      <div className="flex h-app-bar items-center justify-center border-b border-outline-variant px-2">
        <Link href="/sell" className="flex items-center">
          <Image src={wordmark} alt="" unoptimized className="h-5 w-auto" />
        </Link>
      </div>

      <ul className="flex flex-1 flex-col gap-1 p-2">
        {NAV_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-touch flex-col items-center justify-center gap-0.5 rounded-md py-2 transition-colors",
                  active
                    ? "bg-secondary-container text-on-secondary-fixed-variant"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                )}
              >
                <Icon name={tab.icon} size={24} filled={active} />
                <span className="text-label-sm">{t(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-outline-variant p-2">
        <Link
          href="/settings"
          className="flex min-h-touch flex-col items-center justify-center gap-0.5 rounded-md py-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Icon name="settings" size={24} />
          <span className="text-label-sm">{tSettings("title")}</span>
        </Link>
      </div>
    </nav>
  );
}
