import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { MOCKUP_IDS, type MockupId } from "@/lib/design-tokens";

/**
 * stream pos_design/<id>/screen.png ให้หน้า /dev/tokens ใช้ overlay เทียบ pixel
 * ไฟล์อยู่นอก public/ โดยตั้งใจ — เป็น reference material ไม่ใช่ asset ของแอป
 *
 * ⚠️ id ต้อง match กับ whitelist แบบ exact เท่านั้น ห้าม path.join ค่าที่รับมาตรงๆ
 * แม้จะเป็น route dev — path traversal เป็นนิสัยที่ติดตัวไปหน้าอื่น
 */
export async function GET(_req: Request, ctx: RouteContext<"/dev/mockup/[id]">) {
  if (process.env.NODE_ENV === "production") notFound();

  const { id } = await ctx.params;
  if (!(MOCKUP_IDS as readonly string[]).includes(id)) {
    return new Response("unknown mockup id", { status: 404 });
  }

  const safeId = id as MockupId;
  try {
    const png = await readFile(join(process.cwd(), "pos_design", safeId, "screen.png"));
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("screenshot not found", { status: 404 });
  }
}
