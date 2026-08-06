import { cn } from "@/lib/utils";

/**
 * ช่องกรอกข้อมูล canonical — แทน class string **40 แบบใน 50 ช่อง** ของ mockup
 * ซึ่งมี focus treatment 4 แบบที่ไม่เข้ากันและ placeholder 5 แบบ (ดู T2)
 *
 * ตัดสินตาม DESIGN.md:
 *  - เส้นขอบ 1px หนาเป็น 2px สีเขียวตอน focus
 *  - label อยู่เหนือช่องเสมอ ไม่ลอย (ชัดเจนกว่าเมื่อใช้กลางตลาด)
 *  - placeholder ใช้ token `placeholder` ไม่ใช่ outline-variant (1.71:1 ตก AA)
 */

type FieldProps = {
  label: string;
  htmlFor: string;
  /** element ที่ลอยอยู่ขวาของ label เช่นลิงก์ "ลืมรหัสผ่าน?" */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, action, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-label-lg text-on-surface">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

type InputProps = React.ComponentProps<"input"> & {
  /** ไอคอนนำหน้า (tablet ใช้ mobile ไม่ใช้) */
  leading?: React.ReactNode;
  /** ปุ่มท้ายช่อง เช่นสลับแสดงรหัสผ่าน */
  trailing?: React.ReactNode;
};

export function Input({ className, leading, trailing, ...props }: InputProps) {
  return (
    <div className="relative flex items-center">
      {leading && (
        <span className="pointer-events-none absolute left-3 flex text-on-surface-variant">
          {leading}
        </span>
      )}
      <input
        className={cn(
          "min-h-touch w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface transition-colors",
          "placeholder:text-placeholder",
          "focus:border-2 focus:border-primary focus:outline-none",
          leading && "pl-11",
          trailing && "pr-12",
          className
        )}
        {...props}
      />
      {trailing && <span className="absolute right-2 flex">{trailing}</span>}
    </div>
  );
}
