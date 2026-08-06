import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import type { Route } from "next";

/**
 * โครงหน้า auth ที่ใช้ร่วมกันทั้ง 3 หน้า (login / signup / reset)
 * พอร์ตจาก mobile_1 + tablet_2
 *
 * mobile : เต็มจอ มี app bar ปุ่มย้อนกลับ + หัวข้อ
 * tablet : การ์ดกลางจอ มีโลโก้วงกลม + ชื่อแอป + คำโปรย
 * markup ชุดเดียว แยกด้วย breakpoint md (768px = FR-3.8)
 */
export async function AuthShell({
  title,
  subtitle,
  backHref = "/login",
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  backHref?: Route;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const tApp = await getTranslations("app");
  const tCommon = await getTranslations("common");

  return (
    <main className="flex min-h-dvh flex-col bg-surface md:items-center md:justify-center md:p-8">
      <header className="sticky top-0 z-appbar flex h-app-bar items-center gap-2 bg-surface px-4 md:hidden">
        <Link
          href={backHref}
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="arrow_back" label={tCommon("back")} />
        </Link>
        <h1 className="flex-1 pr-11 text-center text-title-lg text-on-surface">{title}</h1>
      </header>

      <div className="w-full max-w-form self-center px-4 pb-8 md:rounded-lg md:border md:border-outline-variant md:bg-surface-container-lowest md:px-8 md:py-10 md:shadow-overlay">
        <div className="flex flex-col items-center gap-3 py-8 md:py-0 md:pb-6">
          <div className="flex size-20 items-center justify-center rounded-lg bg-primary-container text-on-primary-container md:size-16 md:rounded-full">
            <Icon name="storefront" size={40} filled className="md:hidden" />
            <Icon name="storefront" size={32} filled className="hidden md:inline-block" />
          </div>
          <div className="hidden text-center md:block">
            <h1 className="text-headline-md text-primary">{tApp("name")}</h1>
            <p className="text-body-md text-on-surface-variant">{subtitle}</p>
          </div>
        </div>

        {children}

        {footer && <div className="mt-8 text-center md:mt-6">{footer}</div>}
      </div>
    </main>
  );
}
