import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { TextField } from "@/components/auth/text-field";
import { Icon } from "@/components/ui/icon";
import { signIn } from "./actions";

/**
 * เข้าสู่ระบบ — FR-0.1
 * พอร์ตจาก pos_design/mobile_1/screen.png + pos_design/tablet_2/screen.png
 *
 * ปุ่ม Google ใน mockup ยังไม่ทำ — FR-0.1 ระบุว่า social login เป็นเฟสหลัง
 * ถอดออกไปก่อนดีกว่าโชว์ปุ่มที่กดแล้วไม่เกิดอะไร (ดู docs/progress.md)
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getTranslations("auth");
  const { next } = await searchParams;

  return (
    <AuthShell title={t("signIn")} subtitle={t("signInSubtitle")} backHref="/">
      <AuthForm action={signIn} submitLabel={t("signIn")} pendingLabel={t("signingIn")}>
        <input type="hidden" name="next" value={typeof next === "string" ? next : ""} />

        <TextField
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          leading={<Icon name="mail" size={20} />}
        />

        <PasswordField
          autoComplete="current-password"
          action={
            <Link
              href="/reset-password"
              className="text-label-lg text-primary underline-offset-4 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          }
        />
      </AuthForm>

      <p className="mt-8 text-center text-body-md text-on-surface-variant md:mt-6">
        {t("noAccount")}{" "}
        <Link
          href="/signup"
          className="text-label-lg text-primary underline-offset-4 hover:underline"
        >
          {t("signUpFree")}
        </Link>
      </p>
    </AuthShell>
  );
}
