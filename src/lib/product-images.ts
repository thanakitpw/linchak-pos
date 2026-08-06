import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL = 3600;

type WithPath = { image_path: string | null };

/**
 * bucket `products` เป็น **private** ต่างจาก `logos` ที่ public
 * รูปสินค้าคือข้อมูลของร้าน ไม่ใช่ของที่ต้องแชร์ให้ใครก็ได้ดู จึงต้องขอ signed URL
 *
 * `createSignedUrls` (พหูพจน์) ยิงครั้งเดียวสำหรับทุกรูป — ตอนแรกเขียนเป็น
 * `Promise.all` ของ `createSignedUrl` ทีละรูป ซึ่งร้านที่มีสินค้า 80 ชิ้น
 * = 80 request ต่อการเปิดหน้าหนึ่งครั้ง
 */
export async function signProductImages<T extends WithPath>(
  rows: T[]
): Promise<(Omit<T, "image_path"> & { image_url: string | null })[]> {
  const paths = rows.map((r) => r.image_path).filter((p): p is string => Boolean(p));

  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("products")
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    }
  }

  return rows.map(({ image_path, ...rest }) => ({
    ...rest,
    image_url: image_path ? (signed.get(image_path) ?? null) : null,
  }));
}
