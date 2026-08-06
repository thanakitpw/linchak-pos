import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * ปุ่ม canonical — แทน class string 13 แบบใน mockup (ดู T2 ใน docs/design-system.md)
 *
 * ⚠️ variant "primary" ใช้ bg-primary (#006e29) ไม่ใช่ #2bb14f ที่ mockup ใช้
 * เพราะ #2bb14f + ตัวหนังสือขาว = 2.80:1 ตก WCAG AA
 * #2bb14f ยังใช้อยู่ในฐานะสี selected/accent (chip, แท็บ active) คู่กับตัวหนังสือเขียวเข้ม
 *
 * ทุก variant สูงอย่างน้อย 44px ตาม NFR-1
 */
const button = cva(
  "inline-flex min-h-touch items-center justify-center gap-2 text-label-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "rounded-full bg-primary text-on-primary shadow-primary hover:opacity-90",
        outline:
          "rounded-full border border-primary bg-surface-container-lowest text-primary hover:bg-surface-container-low",
        ghost: "rounded-sm text-primary hover:bg-surface-container-low",
        destructive: "rounded-full bg-error text-on-error hover:opacity-90",
      },
      size: {
        md: "px-6 py-3",
        lg: "w-full px-6 py-4 text-title-lg",
        icon: "size-11 rounded-full p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof button>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
