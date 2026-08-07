import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import wordmark from "@/assets/brand/logo-wordmark.png";
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
  /**
   * ไม่ส่งมา = ไม่มีปุ่มย้อนกลับ
   * หน้า login เป็นแบบนั้น — เป็นหน้าแรกสุด ไม่มี "หน้าเดิม" ให้กลับไป
   * (ของเดิมชี้ไป `/` ซึ่งเด้งกลับมา login อยู่ดี = ปุ่มที่กดแล้วไม่เกิดอะไร)
   */
  backHref,
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
        {backHref ? (
          <Link
            href={backHref}
            className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <Icon name="arrow_back" label={tCommon("back")} />
          </Link>
        ) : (
          <span className="size-11" aria-hidden />
        )}
        <h1 className="flex-1 pr-11 text-center text-title-lg text-on-surface">{title}</h1>
      </header>

      <div className="w-full max-w-form self-center px-4 pb-8 md:rounded-lg md:border md:border-outline-variant md:bg-surface-container-lowest md:px-8 md:py-10 md:shadow-overlay">
        {/* โลโก้แบบมีชื่อแบรนด์อยู่ในรูปแล้ว จึงไม่ต้องมีบรรทัดชื่อแอปซ้ำเหมือนเดิม
            alt เป็นชื่อแบรนด์ ไม่ใช่คำว่า "โลโก้" — คนใช้ screen reader ต้องได้ยินชื่อร้านค้า
            เรนเดอร์สองที่เพราะ h1 บนมือถืออยู่ใน app bar แล้ว (ตัวนี้จึงเป็น h1 เฉพาะ md ขึ้นไป)
            src เดียวกัน เบราว์เซอร์ดาวน์โหลดครั้งเดียว */}
        {/* unoptimized: ไฟล์ 3.4 KB สีแบน 3 สี ผ่าน optimizer แล้วไม่ได้เล็กลง
            แถมเสียค่า image transformation ของ Vercel ต่อขนาด · เสิร์ฟไฟล์ตรงจาก CDN คุ้มกว่า */}
        <div className="flex flex-col items-center gap-3 py-8 md:py-0 md:pb-6">
          <Image
            src={wordmark}
            alt={tApp("name")}
            priority
            unoptimized
            className="h-12 w-auto md:hidden"
          />
          <div className="hidden text-center md:block">
            <h1>
              <Image
                src={wordmark}
                alt={tApp("name")}
                priority
                unoptimized
                className="mx-auto h-10 w-auto"
              />
            </h1>
            <p className="mt-3 text-body-md text-on-surface-variant">{subtitle}</p>
          </div>
        </div>

        {children}

        {footer && <div className="mt-8 text-center md:mt-6">{footer}</div>}
      </div>
    </main>
  );
}
