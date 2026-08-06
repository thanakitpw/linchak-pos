import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";

/**
 * หลังบ้าน — ของเรา ไม่ใช่ของลูกค้า
 *
 * ⚠️ ทุกหน้าใต้ /admin เป็น server component ทั้งหมด ห้ามมี "use client" ที่ระดับหน้า
 *    (ฟอร์มย่อยเป็น client ได้ แต่การดึงข้อมูลต้องอยู่ฝั่ง server เสมอ)
 *
 * ด่านนี้เป็นแค่ชั้นแรกเพื่อไม่ให้คนอื่นเห็นหน้า — **การอนุญาตจริงอยู่ใน DB**
 * ทุกฟังก์ชัน admin_* ตรวจ is_platform_admin() ซ้ำอีกรอบเสมอ
 * ถ้าด่านนี้พลาด ฐานข้อมูลยังปฏิเสธอยู่ดี
 *
 * ใช้ notFound() ไม่ใช่ redirect เพราะไม่อยากบอกคนที่ไม่ใช่แอดมินว่ามีหน้านี้อยู่
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("current_user_is_platform_admin");
  if (!isAdmin) notFound();

  const t = await getTranslations("admin");

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-appbar border-b border-outline-variant bg-inverse-surface">
        <div className="mx-auto flex h-app-bar max-w-content items-center gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-2 text-inverse-on-surface">
            <Icon name="leaderboard" size={24} />
            <span className="text-title-lg">{t("title")}</span>
          </Link>

          <nav className="flex flex-1 items-center gap-1">
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 text-label-lg text-inverse-on-surface transition-colors hover:bg-on-surface"
            >
              {t("dashboard")}
            </Link>
          </nav>

          <Link
            href="/"
            className="flex items-center gap-1 text-label-lg text-inverse-on-surface underline-offset-4 hover:underline"
          >
            <Icon name="arrow_back" size={20} />
            {t("backToApp")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-content p-4">{children}</main>
    </div>
  );
}
