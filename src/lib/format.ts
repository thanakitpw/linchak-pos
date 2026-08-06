import type { Locale } from "@/i18n/locales";
import { toBaht, type Satang } from "./money";

/**
 * NFR-2: เงินเป็น THB 2 ตำแหน่งทศนิยมเสมอ · วันที่รูปแบบไทย
 * ทุกจุดที่แสดงเงินต้องผ่านฟังก์ชันนี้ และต้องมี class `tnum` เพื่อให้ตัวเลขไม่เต้น
 */

/**
 * ⚠️ ต้องเป็น `th-TH-u-ca-gregory` ไม่ใช่ `th-TH` เฉยๆ
 * locale th-TH ใช้ปฏิทินพุทธเป็น default → ปี 2026 จะกลายเป็น 2569
 * mockup ทุกใบ (mobile_9, mobile_3, tablet_10) แสดงปี ค.ศ. → pin ปฏิทิน gregory
 * เดือนยังเป็นชื่อไทยย่อ ("ส.ค.") ตามที่ mockup แสดง
 */
const INTL_LOCALE = { th: "th-TH-u-ca-gregory", en: "en-GB" } as const satisfies Record<
  Locale,
  string
>;

const currencyCache = new Map<string, Intl.NumberFormat>();

function currencyFormatter(locale: Locale, withSymbol: boolean) {
  const key = `${locale}:${withSymbol}`;
  let fmt = currencyCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
      // ตัวเลขไม่กระทบเรื่องปฏิทิน จึงใช้ th-TH ตรงๆ ได้
      style: withSymbol ? "currency" : "decimal",
      currency: "THB",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyCache.set(key, fmt);
  }
  return fmt;
}

/** "฿1,250.00" */
export function formatTHB(amount: Satang, locale: Locale = "th"): string {
  return currencyFormatter(locale, true).format(toBaht(amount));
}

/** "1,250.00" — สำหรับคอลัมน์ที่มีสัญลักษณ์ ฿ อยู่หัวตารางแล้ว */
export function formatAmount(amount: Satang, locale: Locale = "th"): string {
  return currencyFormatter(locale, false).format(toBaht(amount));
}

/** "05 ส.ค. 2026" */
export function formatDate(date: Date, locale: Locale = "th"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

/** "05 ส.ค. 2026 15:56" */
export function formatDateTime(date: Date, locale: Locale = "th"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(date);
}

/**
 * BR-3: เลขบิล `DDMMYYYY-NNNNNNNN`
 * prefix = วันที่ของบิล · suffix = running 8 หลัก zero-pad ต่อ workspace (ไม่ reset รายวัน)
 *
 * ⚠️ ฟังก์ชันนี้ format เฉยๆ การ "จัดสรร" เลข seq ต้องทำใน Postgres function
 * ภายใต้ row lock ของ workspace ใน transaction เดียวกับที่ insert order
 * ห้าม MAX(bill_no)+1 ห้าม count() ห้ามคำนวณฝั่ง client — เช็คเอาต์พร้อมกันสองเครื่องจะชนกัน
 */
export function formatBillNo(orderedAt: Date, seq: number): string {
  // en-GB = ปฏิทิน gregory + เลขอารบิก เสมอ ไม่ขึ้นกับภาษาที่ผู้ใช้เลือก
  // เลขบิลเป็น identifier ห้ามเปลี่ยนตาม locale
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).formatToParts(orderedAt);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)!.value;
  return `${get("day")}${get("month")}${get("year")}-${String(seq).padStart(8, "0")}`;
}

/** "18%" — สำหรับตัวเลขเทียบเดือนก่อน (FR-6.3) */
export function formatPercent(ratio: number, locale: Locale = "th"): string {
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(ratio);
}
