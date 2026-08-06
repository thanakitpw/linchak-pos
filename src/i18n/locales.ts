export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** FR-1.4: ไทยเป็นค่าเริ่มต้น */
export const DEFAULT_LOCALE: Locale = "th";

/** cookie ที่เก็บภาษาที่เลือก — seed จาก workspaces.language ตอนล็อกอิน */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
