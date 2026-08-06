import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS",
  description: "ออกบิล ดูกำไร ง่ายในแอปเดียว",
};

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
