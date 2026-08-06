import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * placeholder ระหว่าง foundation phase
 * หน้า / จริงคือแท็บ "ขาย" (FR-3) ซึ่งจะมาแทนที่ไฟล์นี้ใน P2
 */
export default function Home() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="max-w-content mx-auto space-y-6 p-8">
      <h1 className="text-headline-md text-primary">POS — foundation</h1>
      <p className="text-body-md text-on-surface-variant">
        ยังไม่มีหน้าแอปจริง ดูหน้าพิสูจน์ design system ได้ที่:
      </p>
      <ul className="space-y-2">
        <li>
          <Link
            href="/dev/tokens"
            className="text-body-lg text-primary underline underline-offset-4"
          >
            /dev/tokens — สี ตัวอักษร มุมโค้ง เงา ไอคอน
          </Link>
        </li>
        <li>
          <Link
            href="/dev/receipt"
            className="text-body-lg text-primary underline underline-offset-4"
          >
            /dev/receipt — พิสูจน์ใบเสร็จ → รูป
          </Link>
        </li>
      </ul>
    </main>
  );
}
