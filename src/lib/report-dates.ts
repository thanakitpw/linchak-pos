import type { Locale } from "@/i18n/locales";

/**
 * ขอบวันของรายงานเป็น **เวลาไทย** เสมอ ไม่ใช่ UTC และไม่ใช่ timezone ของเครื่อง
 *
 * เซิร์ฟเวอร์ที่ Vercel รันเป็น UTC — ถ้าใช้ `new Date().toISOString().slice(0,10)`
 * ตอนตี 5 ครึ่งที่ไทย (= 22:30 UTC ของเมื่อวาน) "ยอดขายวันนี้" จะไปดึงของเมื่อวาน
 * ฝั่ง DB ก็ตัดวันด้วย `at time zone 'Asia/Bangkok'` เหมือนกัน สองฝั่งต้องตรงกัน
 */
const TZ = "Asia/Bangkok";

/** วันที่วันนี้ตามเวลาไทย รูปแบบ YYYY-MM-DD (รูปแบบที่ Postgres รับเป็น date) */
export function bangkokToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** วันแรกของเดือนปัจจุบันตามเวลาไทย */
export function bangkokMonthStart(): string {
  return `${bangkokToday().slice(0, 7)}-01`;
}

/** "จ." "อ." … — ป้ายใต้แท่งกราฟรายวัน */
export function weekdayLabel(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
    weekday: "narrow",
    timeZone: TZ,
  }).format(new Date(`${isoDate}T00:00:00+07:00`));
}

/** "ส.ค." — ป้ายใต้แท่งกราฟรายเดือน และหัวข้อหน้ากำไร */
export function monthLabel(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
    month: "short",
    timeZone: TZ,
  }).format(new Date(`${isoDate}T00:00:00+07:00`));
}

/** "ส.ค. 2026" — ตัวเลือกเดือนบนหน้ากำไร */
export function monthYearLabel(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(`${isoDate}T00:00:00+07:00`));
}

/** รายชื่อเดือนย้อนหลัง N เดือน (ล่าสุดก่อน) สำหรับ dropdown เลือกเดือน */
export function recentMonths(count: number): string[] {
  const [y, m] = bangkokToday().split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
  });
}

/**
 * "08/07" — ป้ายแกน X ตอนดูช่วงยาว
 *
 * ช่วง 7 วันใช้ตัวย่อวัน (จ อ พ) ได้เพราะไม่ซ้ำ แต่ 30 วันจะวนซ้ำ 4 รอบ
 * จนบอกไม่ได้ว่าจุดไหนคือวันไหน
 */
export function dayMonthLabel(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TZ,
  }).format(new Date(`${isoDate}T00:00:00+07:00`));
}

/** วันที่ย้อนหลัง N วันจากวันนี้ (เวลาไทย) รูปแบบ YYYY-MM-DD */
export function bangkokDaysAgo(days: number): string {
  const [y, m, d] = bangkokToday().split("-").map(Number);
  // ใช้ UTC ทำเลขล้วน — เลื่อนวันบน Date ที่ผูก timezone ของเครื่องจะเพี้ยนช่วงข้ามเดือน
  const shifted = new Date(Date.UTC(y, m - 1, d - days));
  return shifted.toISOString().slice(0, 10);
}
