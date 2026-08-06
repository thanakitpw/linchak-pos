import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { TextField } from "@/components/auth/text-field";
import { Icon } from "@/components/ui/icon";
import { requestPasswordReset } from "@/app/login/actions";

/**
 * ขอลิงก์ตั้งรหัสผ่านใหม่ — FR-0.1
 * พอร์ตจาก pos_design/mobile_6 + tablet_1
 *
 * ตอบข้อความเดียวกันเสมอไม่ว่าอีเมลจะมีในระบบหรือไม่ (ดู actions.ts)
 * ถ้าตอบต่างกัน หน้านี้จะกลายเป็นเครื่องมือเช็คว่าใครสมัครไว้บ้าง
 */
export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("resetPassword")} subtitle={t("resetIntro")} backHref="/login">
      <p className="mb-4 text-body-md text-on-surface-variant md:hidden">{t("resetIntro")}</p>

      <AuthForm
        action={requestPasswordReset}
        submitLabel={t("resetPassword")}
        pendingLabel={t("sending")}
      >
        <TextField
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          leading={<Icon name="mail" size={20} />}
        />
      </AuthForm>

      <p className="mt-8 text-center text-body-md text-on-surface-variant md:mt-6">
        <Link
          href="/login"
          className="text-label-lg text-primary underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </AuthShell>
  );
}
