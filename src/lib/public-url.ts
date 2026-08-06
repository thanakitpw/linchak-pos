import { headers } from "next/headers";

/**
 * URL เต็มของหน้าใดหน้าหนึ่ง — ใช้กับสิ่งที่ออกไปนอกเบราว์เซอร์
 * (QR บนใบเสร็จ, ลิงก์ที่คัดลอกไปวางใน LINE, ลิงก์ในอีเมลของ Supabase)
 * ทั้งหมดไม่มี origin ให้อ้างอิง path เดี่ยวๆ จึงใช้ไม่ได้
 *
 * อ่านจาก header ของ request ไม่ใช่ env var: โปรเจคนี้ต้องใช้งานได้ทั้ง
 * localhost, preview ของ Vercel (โดเมนเปลี่ยนทุก deploy) และโดเมนจริง
 * โดยไม่ต้องตั้งค่าอะไรเพิ่ม
 */
export async function absoluteUrl(path: string): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  // proxy ของ Vercel ส่ง x-forwarded-proto มาให้ · localhost ไม่มี TLS
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}

/** ลิงก์บิล public (FR-4.6) */
export function publicReceiptUrl(token: string): Promise<string> {
  return absoluteUrl(`/r/${token}`);
}
