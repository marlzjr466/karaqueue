import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="KaraQueue"
      title="Reset your password"
      subtitle="We'll email you a link to get back in."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
