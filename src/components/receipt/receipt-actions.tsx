"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toBlob } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * ปุ่มของใบเสร็จ — FR-4.5
 *
 * ⚠️ ปุ่มต้องอยู่ **นอก** การ์ดใบเสร็จเสมอ ไม่งั้นจะติดไปในรูปที่แชร์
 *
 * FR-4.4 · render การ์ด (DOM) เป็นรูปเดียวโดยมี QR ฝังอยู่ในรูปแล้ว
 * เพื่อให้แชร์เข้า LINE แล้วลูกค้าเห็น QR ได้เลย ไม่ต้องกดลิงก์ต่อ
 */
export function ReceiptActions({
  targetId,
  billNo,
  publicUrl,
}: {
  targetId: string;
  billNo: string;
  publicUrl: string;
}) {
  const t = useTranslations("receipt");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function renderPng(): Promise<Blob | null> {
    const node = document.getElementById(targetId);
    if (!node) return null;
    // pixelRatio 2 เพื่อให้อ่านออกบนจอมือถือความละเอียดสูงและสแกน QR ได้
    return toBlob(node, { pixelRatio: 2, cacheBust: true });
  }

  async function handleShare() {
    setBusy(true);
    setError(null);
    try {
      const blob = await renderPng();
      if (!blob) return;
      const file = new File([blob], `${billNo}.png`, { type: "image/png" });

      // Web Share API แชร์รูปได้บนมือถือ (LINE/Facebook) — บน desktop มักไม่รองรับ
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: billNo });
      } else {
        downloadBlob(blob, `${billNo}.png`);
      }
    } catch (e) {
      // ผู้ใช้กดยกเลิกการแชร์ก็เข้ามาที่นี่ — ไม่ใช่ error ที่ต้องบอก
      if ((e as Error)?.name !== "AbortError") setError(t("shareFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const blob = await renderPng();
      if (blob) downloadBlob(blob, `${billNo}.png`);
    } catch {
      setError(t("shareFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <Button type="button" size="lg" onClick={handleShare} disabled={busy} aria-busy={busy}>
        <Icon name="share" size={20} />
        {busy ? t("preparing") : t("share")}
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={handleSave} disabled={busy}>
          <Icon name="download" size={20} />
          {t("saveImage")}
        </Button>
        <Button type="button" variant="outline" onClick={handleCopy}>
          <Icon name={copied ? "check" : "content_copy"} size={20} />
          {copied ? t("copied") : t("copyLink")}
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm bg-error-container px-3 py-2 text-body-md text-on-error-container"
        >
          <Icon name="error" size={20} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* FR-4.6 · เปิดหน้าเดียวกับที่ลูกค้าจะเห็น
          ใช้ <a> ไม่ใช่ <Link> ตั้งใจ: นี่คือ URL เต็มข้ามได้ทั้ง origin
          และเป็นการ "ดูของจริง" ไม่ใช่ navigation ภายในแอป

          ⚠️ ไม่ใช้ target="_blank" แล้ว — พอติดตั้งเป็นแอป โหมด standalone
          ไม่มีปุ่ม back ของเบราว์เซอร์ แท็บใหม่จึงกลายเป็นทางตัน
          อยู่แท็บเดิมแล้วให้ <HistoryBack/> ในหน้านั้นพากลับมาแทน */}
      <p className="text-center">
        <a
          href={publicUrl}
          className="inline-flex min-h-touch items-center gap-1 text-label-lg text-primary underline underline-offset-4"
        >
          <Icon name="qr_code_scanner" size={20} />
          {t("viewOnline")}
        </a>
      </p>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
