import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { TextField } from "@/components/auth/text-field";
import { Icon } from "@/components/ui/icon";
import { signUp } from "@/app/login/actions";

/**
 * สมัครใช้งาน — FR-0.1 / FR-0.2
 * พอร์ตจาก pos_design/mobile_4 + tablet_7
 *
 * ชื่อร้านส่งไปกับ user metadata → trigger app.handle_new_user() เอาไปสร้าง
 * workspace + membership role=owner ให้อัตโนมัติในทรานแซกชันเดียวกับการสร้าง user
 */
export default async function SignupPage() {
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("signUp")} subtitle={t("signUpSubtitle")} backHref="/login">
      <AuthForm action={signUp} submitLabel={t("startFreeTrial")} pendingLabel={t("signingUp")}>
        <TextField
          name="store_name"
          label={t("storeName")}
          type="text"
          required
          maxLength={120}
          placeholder={t("storeNamePlaceholder")}
          leading={<Icon name="storefront" size={20} />}
        />

        <TextField
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          leading={<Icon name="mail" size={20} />}
        />

        <PasswordField autoComplete="new-password" minLength={8} />

        <p className="flex items-center gap-2 text-label-lg text-on-surface-variant">
          <Icon name="check_circle" size={20} className="text-primary" />
          {t("trialNote")}
        </p>
      </AuthForm>

      <p className="mt-8 text-center text-body-md text-on-surface-variant md:mt-6">
        {t("hasAccount")}{" "}
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
