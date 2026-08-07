import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { fontVariables } from "@/lib/fonts";
import { BRAND } from "@/lib/brand";
import "./globals.css";

/** metadata ก็อยู่ใต้ NFR-2 เหมือนกัน — title/description ต้องเปลี่ยนตามภาษาของร้าน */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: t("name"),
    description: t("tagline"),
    /**
     * iOS อ่าน `display: standalone` จาก manifest ได้ตั้งแต่ Safari 16.4
     * แต่เครื่องเก่ากว่านั้นดูแค่ meta ตัวนี้ — ไม่ใส่แล้วกดจากหน้าจอโฮม
     * จะเปิดใน Safari พร้อมแถบ URL เหมือนเดิม ไม่ต่างจากไม่ได้ติดตั้ง
     *
     * statusBarStyle "default" = แถบสถานะพื้นขาวตัวหนังสือดำ ตรงกับพื้นแอปที่เป็นสีอ่อน
     * ("black-translucent" จะดันเนื้อหาขึ้นไปใต้แถบสถานะ ซึ่งเราไม่ได้ออกแบบมารองรับ)
     */
    appleWebApp: { capable: true, title: t("name"), statusBarStyle: "default" },
    /**
     * Next แปลง `appleWebApp.capable` เป็น `mobile-web-app-capable` (ชื่อใหม่)
     * แต่ iOS ก่อน 16.4 รู้จักแค่ชื่อเก่าที่มี `apple-` นำหน้า — ต้องใส่เองอีกตัว
     * ไม่ใส่ = เครื่องเก่ากดจากหน้าจอโฮมแล้วยังเปิดใน Safari พร้อมแถบ URL
     */
    other: { "apple-mobile-web-app-capable": "yes" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ต้องมี ไม่งั้น env(safe-area-inset-*) เป็น 0 บน iPhone → utility pb-safe ไม่ทำงาน
  viewportFit: "cover",
  themeColor: BRAND.surface,
  colorScheme: "light", // MVP ยังไม่มี dark mode
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={fontVariables}>
      <body className="bg-surface text-on-surface antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
