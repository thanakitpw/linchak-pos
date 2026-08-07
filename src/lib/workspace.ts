import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * ร้านของผู้ใช้ที่ล็อกอินอยู่
 *
 * 🚨 **ห้ามเขียน `from("workspaces").select(…).limit(1)` แทนเด็ดขาด**
 *
 * เคยเขียนแบบนั้นทั้ง 14 จุด แล้วเจอของจริงบน production: บัญชีที่เป็นทั้ง
 * เจ้าของร้านและ platform admin กดออกบิลไม่ได้ เพราะ query นั้นคืน
 * **ร้านของลูกค้าอีกคน** — สอง `select` ที่เขียนเหมือนกันเป๊ะให้ผลคนละร้านได้
 * เมื่อไม่มี `order by` และ policy ตอนนั้นให้ admin เห็นทุกร้าน
 *
 * ตอนนี้แก้ที่ policy แล้ว (admin เห็นเฉพาะร้านตัวเอง เหมือนคนอื่น) แต่ตัว
 * `limit 1` ที่ไม่มี `order by` ก็ยังไม่รับประกันลำดับอยู่ดี ถ้าวันหนึ่งคนหนึ่ง
 * มีหลายร้าน มันจะสลับร้านให้แบบเงียบๆ · RPC ฝั่ง DB กรอง `user_id` ตรงๆ
 * และมี `order by` จึงได้ผลเดิมทุกครั้งไม่ว่า policy จะกว้างแค่ไหน
 *
 * `cache()` ทำให้หลาย component ใน request เดียวกันยิงแค่ครั้งเดียว
 */
export const currentWorkspaceId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("current_workspace_id");
  return data ?? null;
});
