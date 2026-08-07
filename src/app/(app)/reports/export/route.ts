import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { bangkokDaysAgo, bangkokToday } from "@/lib/report-dates";

/**
 * ดาวน์โหลดยอดขายเป็นไฟล์ CSV — FR-6 (ส่วนขยาย)
 *
 * เป็น route handler ไม่ใช่ server action เพราะเบราว์เซอร์ต้องได้ไฟล์จริง
 * ผ่าน `Content-Disposition` · server action คืนได้แต่ข้อมูล แล้วต้องไปประกอบ
 * Blob กับ `<a download>` เองในเครื่อง ซึ่งเป็นงานเพิ่มโดยไม่ได้อะไร
 *
 * ⚠️ ไม่ต้องกรอง workspace_id เอง — RLS ทำให้แล้ว (กฎ 26)
 *    และ proxy บังคับล็อกอินก่อนถึงที่นี่อยู่แล้ว
 *
 * ⚠️ **staff จะได้ไฟล์เปล่า** ไม่ใช่ error — policy `orders_select` ให้ staff
 *    เห็นเฉพาะบิลที่ตัวเองออก (กฎ 32) ซึ่งเป็นพฤติกรรมที่ถูกต้อง
 */
const RANGES = [7, 30, 90] as const;

export async function GET(request: Request) {
  // getTranslations อ่านภาษาจาก cookie ของร้านเอง หัวคอลัมน์จึงตามภาษาที่ตั้งไว้
  const t = await getTranslations("reports");
  const supabase = await createClient();

  const param = new URL(request.url).searchParams.get("days");
  const days = RANGES.find((r) => String(r) === param) ?? 7;
  const from = bangkokDaysAgo(days - 1);
  const to = bangkokToday();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "bill_no, ordered_at, subtotal, discount, tax_amount, total, payment_method, order_items(name_snapshot, qty, sort_order)"
    )
    .gte("ordered_at", `${from}T00:00:00+07:00`)
    .lt("ordered_at", `${to}T24:00:00+07:00`)
    .order("ordered_at", { ascending: true });

  if (error) return new Response(error.message, { status: 500 });

  const paymentLabel: Record<string, string> = {
    cash: t("payCash"),
    promptpay: t("payPromptpay"),
    transfer: t("payTransfer"),
  };

  const header = [
    t("csvBillNo"),
    t("csvDate"),
    t("csvTime"),
    t("csvSubtotal"),
    t("csvDiscount"),
    t("csvTax"),
    t("csvTotal"),
    t("csvPayment"),
    t("csvItems"),
  ];

  const rows = (orders ?? []).map((o) => {
    const at = new Date(o.ordered_at);
    return [
      o.bill_no,
      bangkokPart(at, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA"),
      bangkokPart(at, { hour: "2-digit", minute: "2-digit", hour12: false }, "en-GB"),
      // ตัวเลขเงินเขียนดิบ ไม่มี ฿ ไม่มีคั่นหลักพัน — ไม่งั้น Excel อ่านเป็นข้อความแล้วบวกไม่ได้
      money(o.subtotal),
      money(o.discount),
      money(o.tax_amount),
      money(o.total),
      paymentLabel[o.payment_method] ?? o.payment_method,
      [...o.order_items]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => `${i.name_snapshot} x${i.qty}`)
        .join(", "),
    ];
  });

  const csv = [header, ...rows].map((cells) => cells.map(escapeCell).join(",")).join("\r\n");

  return new Response(
    // BOM: ไม่มีตัวนี้ Excel บน Windows เปิดไฟล์แล้วภาษาไทยกลายเป็นตัวยึกยือ
    // (มันเดา encoding เป็น cp874 ถ้าไม่มีอะไรบอกว่าเป็น UTF-8)
    `﻿${csv}`,
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        // ชื่อไฟล์เป็น ASCII ล้วน — ชื่อไทยต้อง encode แบบ RFC 5987 ซึ่งบางโปรแกรมอ่านไม่ออก
        "Content-Disposition": `attachment; filename="linchak-sales-${from}_${to}.csv"`,
        "Cache-Control": "no-store",
      },
    }
  );

  function bangkokPart(d: Date, opts: Intl.DateTimeFormatOptions, fmtLocale: string) {
    return new Intl.DateTimeFormat(fmtLocale, { ...opts, timeZone: "Asia/Bangkok" }).format(d);
  }
  // locale ไม่มีผลกับตัวเลขในไฟล์ — ต้องเป็นจุดทศนิยมเสมอเพื่อให้ spreadsheet คำนวณได้
  function money(v: number) {
    return Number(v).toFixed(2);
  }
}

/** RFC 4180 — ครอบด้วย " เมื่อมี , " หรือขึ้นบรรทัดใหม่ และ escape " ด้วย "" */
function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
