/**
 * รูปร่างของสินค้าและหมวดหมู่ที่ส่งจาก server component ไปให้ client
 *
 * อยู่ที่นี่ไม่ใช่ในไฟล์ component เพราะทั้งหน้าขายและหน้าสินค้าใช้ร่วมกัน
 * ถ้าให้หน้าสินค้า import type จาก `components/sell/product-grid` จะกลายเป็น
 * การผูกฟีเจอร์สองอันเข้าด้วยกันโดยไม่มีเหตุผล
 */
export type Product = {
  id: string;
  name: string;
  /** บาท — คอลัมน์ใน DB เป็น numeric(12,2) แปลงเป็นสตางค์ที่ขอบ render */
  price: number;
  category_id: string | null;
  /** signed URL (bucket `products` เป็น private) หรือ null เมื่อไม่มีรูป */
  image_url: string | null;
};

export type Category = {
  id: string;
  name: string;
  /** 1–8 · แปลงเป็น class ด้วย `categoryBg()` */
  color_index: number;
};
