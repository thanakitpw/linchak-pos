import { cn } from "@/lib/utils";

/**
 * ใช้ <select> ของเบราว์เซอร์จริง ไม่ใช่ dropdown ที่ทำเอง
 *
 * บนมือถือ native select เปิด picker ของ OS ซึ่งกดง่ายกว่าและอ่านง่ายกว่า
 * dropdown ที่วาดเอง — สำคัญกับกลุ่มผู้ใช้ที่ยืนขายของอยู่หน้าร้าน
 * แลกกับการปรับแต่งหน้าตาได้น้อย ซึ่งคุ้ม
 */
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "min-h-touch w-full appearance-none rounded-sm border border-outline-variant bg-surface-container-lowest py-3 pr-10 pl-4 text-body-md text-on-surface transition-colors",
          "focus:border-2 focus:border-primary focus:outline-none",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {/* ลูกศรของเราเอง เพราะ appearance-none ซ่อนของเบราว์เซอร์ไป */}
      <span
        aria-hidden="true"
        className="material-symbols pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant"
        style={{ fontSize: 24 }}
        translate="no"
      >
        expand_more
      </span>
    </div>
  );
}
