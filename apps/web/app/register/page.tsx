import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="KaraQueue"
      title="Create your account"
      subtitle="Your songs. Your queue. Your stage."
    >
      <RegisterForm />
    </AuthShell>
  );
}
