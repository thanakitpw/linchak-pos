import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";

/**
 * ลิงก์บิลที่เปิดไม่ได้ — FR-4.6
 *
 * คนที่มาถึงหน้านี้คือลูกค้า ไม่ใช่แม่ค้า จึงไม่มีปุ่มกลับเข้าแอปและ
 * ไม่บอกว่าทำไมถึงเปิดไม่ได้ (ไม่มีบิล / token ผิดรูป / บิลถูกลบ)
 * การแยกเคสให้คนนอกฟังคือการยืนยันว่า token ไหน "มีอยู่จริง"
 *
 * ภาษาใช้ตาม cookie ของคนเปิด — ต่างจากหน้าบิลที่ใช้ภาษาของร้าน
 * เพราะตรงนี้ไม่รู้ว่าเป็นบิลของร้านไหน จึงไม่มีภาษาของร้านให้ใช้
 */
export default async function PublicReceiptNotFound() {
  const t = await getTranslations("receipt");

  return (
    <main className="mx-auto flex min-h-dvh max-w-form flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon name="receipt_long" size={48} className="text-tertiary-fixed-dim" />
      <h1 className="text-title-lg text-on-surface">{t("notFoundTitle")}</h1>
      <p className="text-body-md text-on-surface-variant">{t("notFoundBody")}</p>
    </main>
  );
}
