/**
 * สีที่ต้องเขียนเป็น hex ดิบ เพราะถูกอ่านนอก CSS
 *
 * `<meta name="theme-color">` และ manifest เป็นค่าที่ระบบปฏิบัติการอ่าน
 * ไม่ใช่ CSS ที่เบราว์เซอร์ compute — จึงใช้ `var(--color-…)` ไม่ได้
 * เก็บไว้ที่เดียวเพื่อไม่ให้ layout.tsx กับ manifest.ts เพี้ยนกันเงียบๆ
 *
 * ⚠️ แก้ที่นี่แล้วต้องแก้ `theme.css` ให้ตรงด้วย (และกลับกัน)
 */
export const BRAND = {
  /** = `--color-surface` · พื้นแอป · แถบสถานะบนมือถือ + พื้น splash ตอนเปิดแอป */
  surface: "#f8f9ff",
  /**
   * = พื้นน้ำเงินของโลโก้ (sample จาก `brand/app-icon-master.png`)
   * ใช้เฉพาะกับตัวไอคอน ไม่ใช่สีของ design system — อย่าเอาไปทำ token
   * `scripts/build-brand.mjs` ถือค่าเดียวกันนี้ไว้อีกชุด
   */
  navy: "#012555",
} as const;
