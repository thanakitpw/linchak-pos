import type { MetadataRoute } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BRAND } from "@/lib/brand";

/**
 * Web App Manifest — NFR-5 ขั้นที่ 1 (ติดตั้งลงหน้าจอโฮมได้)
 *
 * Next เสิร์ฟไฟล์นี้ที่ `/manifest.webmanifest` และใส่ `<link rel="manifest">` ให้เอง
 * `src/proxy.ts` เว้น path นี้ไว้ใน matcher แล้ว — ถ้าไม่เว้น Android จะโดน 307
 * ไปหน้า login แล้วมองไม่เห็น manifest เลย (ไม่มีปุ่ม "ติดตั้งแอป")
 *
 * ⚠️ ยังไม่มี service worker — ขั้นนี้ได้แค่ "เปิดแบบเต็มจอ + ไอคอนถูก"
 * ยังใช้ตอนเน็ตหลุดไม่ได้ (ดู docs/progress.md)
 *
 * async เพราะข้อความต้องมาจาก next-intl ตามกฎ 18 — ทำให้ route เป็น dynamic
 * ซึ่งไม่เป็นไร เบราว์เซอร์ขอไฟล์นี้ครั้งเดียวตอนติดตั้ง
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("app");
  const locale = await getLocale();

  return {
    id: "/",
    name: t("name"),
    short_name: t("name"),
    description: t("tagline"),
    lang: locale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BRAND.surface,
    theme_color: BRAND.surface,
    // ไม่ล็อก orientation — tablet ใช้ split view แนวนอน (FR-3.8)
    icons: [
      {
        // Chrome ใช้ตัวนี้ตัดสินว่าเว็บนี้ "ติดตั้งได้" — ต้องมีอย่างน้อย 192px
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Android ครอบไอคอนเป็นวงกลม/สี่เหลี่ยมมนตามธีมของเครื่อง
        // ตัว any ด้านบนมีมุมโปร่งใส ถ้าเอาไปครอบจะเห็นขอบขาดเป็นแถบ
        // ตัวนี้จึงเป็นน้ำเงินเต็มสี่เหลี่ยม และย่อโลโก้ไว้ในวงปลอดภัย 80%
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
