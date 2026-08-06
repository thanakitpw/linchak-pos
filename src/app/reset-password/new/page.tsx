import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { ConfirmPasswordField } from "@/components/auth/confirm-password-field";
import { updatePassword } from "@/app/login/actions";

/**
 * ตั้งรหัสผ่านใหม่ — FR-0.1 · **ไม่มีใน mockup** (mockup มีแค่หน้า "ขอลิงก์")
 *
 * ปลายทางของลิงก์ในอีเมล: `/auth/confirm?...&next=/reset-password/new`
 * ตอนมาถึงหน้านี้ session ถูกสร้างแล้วโดย /auth/confirm — ฟอร์มจึงแค่ updateUser
 * ไม่ต้องส่ง token ต่ออีกทอด (token ใน URL ที่ถูกส่งต่อคือสิ่งที่หลุดใน referrer/history ได้)
 */
export default async function NewPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("newPassword")} subtitle={t("newPasswordIntro")} backHref="/login">
      <p className="mb-4 text-body-md text-on-surface-variant md:hidden">{t("newPasswordIntro")}</p>

      <AuthForm action={updatePassword} submitLabel={t("newPassword")} pendingLabel={t("saving")}>
        <PasswordField autoComplete="new-password" minLength={8} />
        <ConfirmPasswordField />
      </AuthForm>

      <p className="mt-8 text-center text-body-md text-on-surface-variant md:mt-6">
        <Link
          href="/reset-password"
          className="text-label-lg text-primary underline-offset-4 hover:underline"
        >
          {t("resetPassword")}
        </Link>
      </p>
    </AuthShell>
  );
}
