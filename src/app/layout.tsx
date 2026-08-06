import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

/** metadata ก็อยู่ใต้ NFR-2 เหมือนกัน — title/description ต้องเปลี่ยนตามภาษาของร้าน */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return { title: t("name"), description: t("tagline") };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ต้องมี ไม่งั้น env(safe-area-inset-*) เป็น 0 บน iPhone → utility pb-safe ไม่ทำงาน
  viewportFit: "cover",
  themeColor: "#f8f9ff", // = --color-surface
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
