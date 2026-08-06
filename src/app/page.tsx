import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

/**
 * placeholder ระหว่าง foundation phase
 * หน้า / จริงคือแท็บ "ขาย" (FR-3) ซึ่งจะมาแทนที่ไฟล์นี้ใน P2
 */
export default async function Home() {
  if (process.env.NODE_ENV === "production") notFound();
  const t = await getTranslations("dev");

  return (
    <main className="mx-auto max-w-content space-y-6 p-8">
      <h1 className="text-headline-md text-primary">{t("foundationTitle")}</h1>
      <p className="text-body-md text-on-surface-variant">{t("foundationIntro")}</p>
      <ul className="space-y-2">
        <li>
          <Link
            href="/dev/tokens"
            className="text-body-lg text-primary underline underline-offset-4"
          >
            /dev/tokens — {t("tokensLinkHint")}
          </Link>
        </li>
        <li>
          <Link
            href="/dev/receipt"
            className="text-body-lg text-primary underline underline-offset-4"
          >
            /dev/receipt — {t("receiptLinkHint")}
          </Link>
        </li>
      </ul>
    </main>
  );
}
