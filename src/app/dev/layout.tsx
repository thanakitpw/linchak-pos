import { notFound } from "next/navigation";

/**
 * /dev/* เป็นหน้าพิสูจน์สำหรับตอนพัฒนาเท่านั้น
 * ห้ามหลุดขึ้น production — ทั้งเพราะไม่มีประโยชน์กับผู้ใช้ และเพราะ /dev/mockup
 * อ่านไฟล์จาก pos_design/ ซึ่งไม่มีอยู่ใน build artifact
 */
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
