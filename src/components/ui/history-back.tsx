"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

/** history.length ไม่เปลี่ยนระหว่างที่อยู่บนหน้านี้ จึงไม่มี event ให้ subscribe */
const noSubscribe = () => () => {};
const clientSnapshot = () => window.history.length > 1;
/** ฝั่ง server ยังไม่รู้ — ตอบว่าไม่มี ดีกว่าโชว์ปุ่มแล้วกดไม่ได้ */
const serverSnapshot = () => false;

/**
 * ปุ่มย้อนกลับที่โผล่เฉพาะเมื่อ "มีที่ให้กลับไปจริง"
 *
 * ใช้กับหน้าที่คนสองกลุ่มเปิด แล้วต้องการคนละอย่าง — เช่นบิลออนไลน์ (FR-4.6):
 *   ลูกค้าเปิดจากลิงก์ใน LINE  → เป็นหน้าแรกของแท็บ ไม่ควรมีปุ่มพากลับไปไหน
 *   แม่ค้ากดจากหน้าใบเสร็จ    → ต้องมีทางกลับ **โดยเฉพาะตอนติดตั้งเป็นแอปแล้ว**
 *                              เพราะโหมด standalone ไม่มีปุ่ม back ของเบราว์เซอร์เลย
 *
 * ⚠️ ใช้ `useSyncExternalStore` ไม่ใช่ `useEffect` + `setState`
 *    กฎ purity ของ react-hooks ห้าม setState ตรงๆ ใน effect (เจอมาแล้ว 4 ครั้ง
 *    ดู docs/progress.md) และ hook นี้คือเครื่องมือที่มีไว้อ่านค่าจากนอก React
 *    โดยมี snapshot ฝั่ง server แยก จึงไม่มีปัญหา hydration mismatch
 */
export function HistoryBack({ label }: { label: string }) {
  const router = useRouter();
  const canGoBack = useSyncExternalStore(noSubscribe, clientSnapshot, serverSnapshot);

  if (!canGoBack) return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
    >
      <Icon name="arrow_back" label={label} />
    </button>
  );
}
