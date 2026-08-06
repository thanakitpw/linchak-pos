import { ReceiptProbe } from "@/components/dev/receipt-probe";

export default function ReceiptProbePage() {
  return (
    <main className="max-w-content mx-auto space-y-6 p-4 md:p-8">
      <header className="border-outline-variant space-y-2 border-b pb-4">
        <h1 className="text-headline-md md:text-headline-lg text-primary">
          receipt → image probe
        </h1>
        <p className="text-body-md text-on-surface-variant">
          FR-4.4 ต้อง render ใบเสร็จเป็นรูปเดียวเพื่อแชร์เข้า LINE — แปลว่าเอา DOM ไป serialise
          ลง canvas Tailwind v4 compile <code>bg-primary/20</code> เป็น <code>color-mix()</code>{" "}
          ซึ่ง library กลุ่มนี้อ่านไม่ออก
        </p>
        <p className="text-body-md text-on-surface">
          กด render แล้วเทียบ PNG กับ DOM ด้านบน ถ้าฝั่งขวาเพี้ยน = ยืนยันว่ากฎข้อ 22
          (ใน subtree ใบเสร็จใช้สีทึบล้วน) จำเป็นจริง
        </p>
      </header>
      <ReceiptProbe />
    </main>
  );
}
