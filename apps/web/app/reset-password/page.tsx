import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="KaraQueue"
      title="Choose a new password"
      subtitle="Make it something you'll remember."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
