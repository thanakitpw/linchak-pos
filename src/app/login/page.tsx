import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { PasswordField } from "@/components/auth/password-field";

/**
 * เข้าสู่ระบบ — FR-0.1
 * พอร์ตจาก pos_design/mobile_1/screen.png + pos_design/tablet_2/screen.png
 *
 * mobile  : เต็มจอ มี app bar ปุ่มย้อนกลับ + หัวข้อ
 * tablet  : การ์ดกลางจอ มีโลโก้วงกลม + ชื่อแอป + คำโปรย
 * ทั้งสองแบบใช้ markup ชุดเดียวกัน แยกด้วย breakpoint md (768px = FR-3.8)
 *
 * ⚠️ ยังไม่ต่อ Supabase — หน้านี้เป็น presentational ล้วน auth มาที่ P1
 * ⚠️ ปุ่ม Google อยู่ใน mockup แต่ FR-0.1 ระบุว่า social login เป็นเฟสหลัง
 *    P1 ต้องตัดสินว่าจะเก็บไว้หรือถอดออก
 */
export default async function LoginPage() {
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");
  const tCommon = await getTranslations("common");

  return (
    <main className="flex min-h-dvh flex-col bg-surface md:items-center md:justify-center md:p-8">
      {/* app bar — mobile เท่านั้น */}
      <header className="sticky top-0 z-appbar flex h-app-bar items-center gap-2 bg-surface px-4 md:hidden">
        <Link
          href="/"
          className="flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="arrow_back" label={tCommon("back")} />
        </Link>
        <h1 className="flex-1 pr-11 text-center text-title-lg text-on-surface">{t("signIn")}</h1>
      </header>

      <div className="w-full max-w-form self-center px-4 pb-8 md:rounded-lg md:border md:border-outline-variant md:bg-surface-container-lowest md:px-8 md:py-10 md:shadow-overlay">
        {/* โลโก้ — mobile เป็นสี่เหลี่ยมมุมมน tablet เป็นวงกลม */}
        <div className="flex flex-col items-center gap-3 py-8 md:py-0 md:pb-6">
          <div className="flex size-20 items-center justify-center rounded-lg bg-primary-container text-on-primary-container md:size-16 md:rounded-full">
            <Icon name="storefront" size={40} filled className="md:hidden" />
            <Icon name="storefront" size={32} filled className="hidden md:inline-block" />
          </div>
          <div className="hidden text-center md:block">
            <h1 className="text-headline-md text-primary">{tApp("name")}</h1>
            <p className="text-body-md text-on-surface-variant">{t("signInSubtitle")}</p>
          </div>
        </div>

        <form className="space-y-4">
          <Field label={t("email")} htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              leading={<Icon name="mail" size={20} />}
            />
          </Field>

          <PasswordField
            action={
              <Link
                href="/reset-password"
                className="text-label-lg text-primary underline-offset-4 hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            }
          />

          <Button type="submit" size="lg" className="mt-2">
            {t("signIn")}
          </Button>
        </form>

        {/* คั่นด้วยคำว่า "หรือ" */}
        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-outline-variant" />
          <span className="text-label-sm text-on-surface-variant">{t("or")}</span>
          <span className="h-px flex-1 bg-outline-variant" />
        </div>

        <Button variant="outline" size="lg" type="button">
          <GoogleMark />
          {t("signInWithGoogle")}
        </Button>

        <p className="mt-8 text-center text-body-md text-on-surface-variant md:mt-6">
          {t("noAccount")}{" "}
          <Link
            href="/signup"
            className="text-label-lg text-primary underline-offset-4 hover:underline"
          >
            {t("signUpFree")}
          </Link>
        </p>
      </div>
    </main>
  );
}

/** โลโก้ Google — สีแบรนด์ ไม่ใช่ token ของเรา (ห้ามแปลงเป็น cat-*) */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}
