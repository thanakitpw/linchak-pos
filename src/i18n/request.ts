import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./locales";

/**
 * i18n แบบไม่มี locale ใน URL
 *
 * ภาษาเป็น setting ของร้าน (FR-1.4) ไม่ใช่ property ของ URL:
 *  - `/th/...` vs `/en/...` ผิดกับแอปที่ผู้ใช้หนึ่งคนอยู่ร้านเดียว
 *  - ลิงก์บิล public (FR-4.6) ต้องเป็น URL เดียวสำหรับแชร์เข้า LINE
 *  - PWA (NFR-5): locale ใน path ทำให้ start_url และ scope ของ service worker
 *    ผูกกับภาษา ซึ่งเป็นบั๊กชุดที่น่ารำคาญมาก
 *  - ไม่มี next-intl middleware = ไม่ชนกับ middleware ของ Supabase ตอน P1
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // ปกติเป็น undefined (ไม่มี locale ใน URL ก็ไม่มีอะไรมาบอก) แล้วตกไปใช้ cookie
  // ที่ต้องมีเพราะ `getTranslations({ locale })` ส่งค่ามาทางนี้ —
  // หน้าบิล public (FR-4.6) ต้อง render ด้วยภาษาของ **ร้าน** ไม่ใช่ของคนเปิดลิงก์
  const requested = await requestLocale;
  const cookieStore = await cookies();
  const raw = requested ?? cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // NFR-2: เงินเป็น THB 2 ตำแหน่งทศนิยม, วันที่รูปแบบไทย
    timeZone: "Asia/Bangkok",
    formats: {
      number: {
        thb: { style: "currency", currency: "THB", minimumFractionDigits: 2 },
      },
      dateTime: {
        short: { day: "2-digit", month: "short", year: "numeric" },
        full: {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      },
    },
  };
});
